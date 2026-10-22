// Every stop in the experience, in order. The sections live in six rooms.
export const STATIONS = [
  "HOME", "BIO", "OPS", "VAULT", "CODEX", "UPLINK",
  "LOUNGE", "LIFE",
  "GALLERY", "AWARDS",
  "THEATER", "REEL",
  "MUSIC", "JAM",
  "FLORIST", "BOUQUET",
  "ATELIER", "CANVAS", "LETTER",
  "BUSK", "BOOTH",
];
export const ST = {
  HOME: 0,
  BIO: 1,
  OPS: 2,
  VAULT: 3,
  CODEX: 4,
  UPLINK: 5,
  LOUNGE: 6,
  LIFE: 7,
  GALLERY: 8,
  AWARDS: 9,
  THEATER: 10,
  REEL: 11,
  MUSIC: 12,
  JAM: 13,
  FLORIST: 14,
  BOUQUET: 15,
  ATELIER: 16,
  CANVAS: 17,
  LETTER: 18,
  BUSK: 19,
  BOOTH: 20,
} as const;

export type RoomId = "studio" | "lounge" | "gallery" | "theater" | "music" | "flowers" | "atelier";

export const ROOMS: { id: RoomId; name: string; blurb: string; sections: number[] }[] = [
  { id: "studio", name: "STUDIO", blurb: "where I work", sections: [0, 1, 2, 3, 4, 5] },
  { id: "lounge", name: "LOUNGE", blurb: "after hours", sections: [6, 7] },
  { id: "gallery", name: "GALLERY", blurb: "worth framing", sections: [8, 9, 20] },
  { id: "theater", name: "THEATER", blurb: "movie night", sections: [10, 11] },
  { id: "music", name: "MUSIC", blurb: "make some noise", sections: [12, 13, 19] },
  { id: "flowers", name: "FLOWERS", blurb: "build a bouquet", sections: [14, 15] },
  { id: "atelier", name: "ATELIER", blurb: "paint and write", sections: [16, 17, 18] },
];

// the first section of every room: its overview
export const OVERVIEWS = ROOMS.map((r) => r.sections[0]);

export const roomIndexOf = (section: number) =>
  Math.max(0, ROOMS.findIndex((r) => r.sections.includes(section)));
export const roomOf = (section: number): RoomId => ROOMS[roomIndexOf(section)].id;
