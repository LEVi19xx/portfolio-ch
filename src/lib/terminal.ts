// The keyboard in the room is real: whatever you type lands on the monitor's terminal.
// The monitor texture reads this object every frame; Experience writes to it.

export const terminal = {
  buffer: "",
  lines: ["type 'help' and press enter"] as string[],
};

export type TerminalActions = {
  go: (section: number) => void;
  setDay: (day: boolean) => void;
  toggleMusic: () => void;
};

const ROUTES: Record<string, number> = {
  home: 0,
  bio: 1,
  about: 1,
  ops: 2,
  experience: 2,
  vault: 3,
  projects: 3,
  codex: 4,
  skills: 4,
  uplink: 5,
  contact: 5,
};

function print(line: string) {
  terminal.lines.push(line);
  if (terminal.lines.length > 6) terminal.lines.shift();
}

export function typeKey(key: string, actions: TerminalActions) {
  if (key === "Backspace") {
    terminal.buffer = terminal.buffer.slice(0, -1);
    return;
  }
  if (key === "Enter") {
    const cmd = terminal.buffer.trim().toLowerCase();
    terminal.buffer = "";
    if (!cmd) return;
    print(`$ ${cmd}`);
    if (cmd in ROUTES) {
      print(`  → flying to ${cmd}`);
      actions.go(ROUTES[cmd]);
    } else if (cmd === "day" || cmd === "night") {
      print(`  → ${cmd} mode`);
      actions.setDay(cmd === "day");
    } else if (cmd === "music") {
      print("  → next track");
      actions.toggleMusic();
    } else if (cmd === "clear") {
      terminal.lines.length = 0;
    } else if (cmd === "help") {
      print("  home bio ops vault codex uplink");
      print("  day night music clear");
    } else {
      print(`  command not found: ${cmd}`);
    }
    return;
  }
  if (/^[a-z]$/i.test(key) && terminal.buffer.length < 24) terminal.buffer += key.toLowerCase();
}
