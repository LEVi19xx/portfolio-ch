import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The portfolio's database. It is optional: with no keys set the site still works and falls back to email.
// Both values are meant to be public (the anon key can only do what the row level security policies allow:
// see supabase/schema.sql, visitors can add letters and orders but can never read them back).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supabase calls it the "publishable key" now (older projects call it the "anon key"): either name works
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;
export const db = (): SupabaseClient | null => {
  if (!url || !key) return null;
  return (client ??= createClient(url, key, { auth: { persistSession: false } }));
};
export const dbReady = () => !!(url && key);

export type Saved = { ok: true } | { ok: false; error: string };

// one write per few seconds from this browser, so a button held down cannot flood the table
let last = 0;
async function insert(table: string, row: Record<string, unknown>): Promise<Saved> {
  const c = db();
  if (!c) return { ok: false, error: "The database is not set up yet." };
  if (Date.now() - last < 4000) return { ok: false, error: "Easy there: wait a few seconds." };
  last = Date.now();
  // no .select(): the public key is not allowed to read rows back
  const { error } = await c.from(table).insert(row);
  return error ? { ok: false, error: "Could not save: " + error.message } : { ok: true };
}

export const saveLetter = (name: string, message: string) => insert("letters", { from_name: name, message });

export const saveOrder = (summary: string, bouquet: unknown, card: unknown, delivery: unknown) =>
  insert("bouquet_orders", { summary, bouquet, card, delivery });
