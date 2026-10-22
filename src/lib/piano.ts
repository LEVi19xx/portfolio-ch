// The keyboard in the music room: semitone index from middle C (0..23) and the computer keys that play them.
export const noteFreq = (semitone: number) => 261.63 * Math.pow(2, semitone / 12);

// two octaves: white keys (semitones) then the black keys
export const WHITE = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23];
export const BLACK = [1, 3, 6, 8, 10, 13, 15, 18, 20, 22];

// computer key -> semitone. Bottom row Z..M plays the low octave, Q..U the high one, S D G H J / 2 3 5 6 7 are the black keys.
export const KEY_MAP: Record<string, number> = {
  z: 0, s: 1, x: 2, d: 3, c: 4, v: 5, g: 6, b: 7, h: 8, n: 9, j: 10, m: 11,
  q: 12, "2": 13, w: 14, "3": 15, e: 16, r: 17, "5": 18, t: 19, "6": 20, y: 21, "7": 22, u: 23,
};
