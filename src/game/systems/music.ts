import type { AudioSystem } from './audio';

/**
 * A tiny step sequencer. Tracks are written as space-separated tokens, one per eighth note:
 * a note like `E5`, `-` to hold the previous note, or `.` for a rest. `|` marks bars for
 * readability and is ignored. Drums use `k` kick, `s` snare, `h` hat.
 */
export interface Track {
  id: string;
  /** Shown in the "Now playing" chip and the browser's media controls. */
  title: string;
  bpm: number;
  /** Lead voice; square by default, triangle for softer tracks. */
  leadWave?: OscillatorType;
  lead: string;
  bass: string;
  drums: string;
}

/** Original loop for the meadow level: C | Em | Am | C | F | Dm | G | C. */
export const MEADOW_TRACK: Track = {
  id: 'meadow',
  title: 'Meadow Hop',
  bpm: 140,
  lead: `
    E5 - G5 - C6 - B5 A5 | G5 - - - E5 - D5 - | C5 - E5 - A5 - G5 F5 | E5 - - - . . D5 E5 |
    F5 - A5 - D6 - C6 B5 | A5 - - - F5 - E5 - | D5 - G5 - B5 - A5 B5 | C6 - - - . . . .`,
  bass: `
    C3 . G3 . C4 . G3 . | E3 . B3 . E4 . B3 . | A2 . E3 . A3 . E3 . | C3 . G3 . C4 . G3 . |
    F2 . C3 . F3 . C3 . | D3 . A3 . D4 . A3 . | G2 . D3 . G3 . B3 . | C3 . G3 . C4 . . .`,
  drums: `
    k . h . s . h h | k . h . s . h h | k . h . s . h h | k . h . s . h h |
    k . h . s . h h | k . h . s . h h | k . h . s . h h | k . h . s s s s`,
};

/** Warm, laid-back loop for the cliffs: Am | F | C | G | Am | F | G | E. */
export const SUNSET_TRACK: Track = {
  id: 'sunset',
  title: 'Sunset Steps',
  bpm: 120,
  lead: `
    A4 - C5 - E5 - D5 C5 | C5 - - - A4 - G4 - | E4 - G4 - C5 - E5 D5 | D5 - - - B4 - G4 - |
    A4 - C5 - E5 - A5 G5 | F5 - E5 - C5 - A4 - | B4 - D5 - G5 - F5 D5 | E5 - - - G#4 - B4 -`,
  bass: `
    A2 . E3 . A3 . E3 . | F2 . C3 . F3 . C3 . | C3 . G3 . C4 . G3 . | G2 . D3 . G3 . D3 . |
    A2 . E3 . A3 . E3 . | F2 . C3 . F3 . C3 . | G2 . D3 . G3 . D3 . | E2 . B2 . E3 . G#3 .`,
  drums: `
    k . h . s . h . | k . h k s . h . | k . h . s . h . | k . h k s . h h |
    k . h . s . h . | k . h k s . h . | k . h . s . h . | k . s . s s s s`,
};

/** Bright, quick loop for the windy heights: G | D | Em | C | G | D | C | D. */
export const PEAKS_TRACK: Track = {
  id: 'peaks',
  title: 'Breezy Heights',
  bpm: 152,
  lead: `
    G5 - D5 - B4 - D5 G5 | F#5 - - - A5 - F#5 - | E5 - G5 - B5 - G5 E5 | C5 - E5 - G5 - E5 C5 |
    B4 - D5 - G5 - A5 B5 | A5 - - - F#5 - D5 - | E5 - G5 - C6 - B5 A5 | A5 - - - . . D5 .`,
  bass: `
    G2 . D3 . G3 . D3 . | D3 . A3 . D4 . A3 . | E2 . B2 . E3 . B2 . | C3 . G3 . C4 . G3 . |
    G2 . D3 . G3 . D3 . | D3 . A3 . D4 . A3 . | C3 . G3 . C4 . G3 . | D3 . A3 . D3 . F#3 .`,
  drums: `
    k h s h k h s h | k h s h k h s h | k h s h k h s h | k h s h k k s h |
    k h s h k h s h | k h s h k h s h | k h s h k h s h | k k s s k s s s`,
};

/** Gentle, moonlit loop for the lake: Dm | Bb | F | C | Dm | Bb | Gm | A. */
export const NIGHT_TRACK: Track = {
  id: 'night',
  title: 'Moonlit Ripples',
  bpm: 96,
  leadWave: 'triangle',
  lead: `
    D5 - - - F5 - A5 - | G5 - F5 - D5 - - - | C5 - - - F5 - A5 - | G5 - - - E5 - - - |
    F5 - - - A5 - D6 - | C6 - A5 - F5 - D5 - | Bb4 - D5 - G5 - - - | A4 - - - C#5 - E5 -`,
  bass: `
    D3 . A3 . D3 . A3 . | Bb2 . F3 . Bb2 . F3 . | F2 . C3 . F2 . C3 . | C3 . G3 . C3 . G3 . |
    D3 . A3 . D3 . A3 . | Bb2 . F3 . Bb2 . F3 . | G2 . D3 . G2 . D3 . | A2 . E3 . A2 . C#3 .`,
  drums: `
    k . h . . . h . | k . h . s . h . | k . h . . . h . | k . h . s . h . |
    k . h . . . h . | k . h . s . h . | k . h . . . h . | k . h . s . s .`,
};

/** Driving sky-battle loop: Am | G | F | E (x2), with a busier second half. */
export const SKIRMISH_TRACK: Track = {
  id: 'skirmish',
  title: 'Murkling Skies',
  bpm: 164,
  lead: `
    A5 - E5 - A5 C6 B5 A5 | G5 - D5 - G5 B5 A5 G5 | F5 - C5 - F5 A5 G5 F5 | E5 - B4 - E5 G#5 B5 - |
    A5 C6 E6 C6 A5 E5 A5 - | G5 B5 D6 B5 G5 D5 G5 - | F5 A5 C6 A5 F5 C5 F5 - | E5 G#5 B5 E6 B5 G#5 E5 -`,
  bass: `
    A2 A3 A2 A3 A2 A3 A2 A3 | G2 G3 G2 G3 G2 G3 G2 G3 | F2 F3 F2 F3 F2 F3 F2 F3 | E2 E3 E2 E3 E2 E3 E2 E3 |
    A2 A3 A2 A3 A2 A3 A2 A3 | G2 G3 G2 G3 G2 G3 G2 G3 | F2 F3 F2 F3 F2 F3 F2 F3 | E2 E3 E2 E3 E2 E3 G#2 B2`,
  drums: `
    k h s h k h s h | k h s h k k s h | k h s h k h s h | k h s h k k s s |
    k h s h k h s h | k h s h k k s h | k h s h k h s h | k s s s k s s s`,
};

/** Baron Murk's theme: heavy, chromatic, menacing: Dm | Bb | Gm | A (with a creeping top line). */
export const BOSS_TRACK: Track = {
  id: 'boss',
  title: 'Murk Showdown',
  bpm: 172,
  lead: `
    D5 - F5 - A5 - G#5 A5 | Bb5 - A5 - F5 - D5 - | G5 - Bb5 - D6 - C#6 D6 | E6 - C#6 - A5 - E5 - |
    D6 C6 A5 F5 D5 F5 A5 D6 | Bb5 A5 F5 D5 Bb4 D5 F5 Bb5 | G5 F5 D5 Bb4 G4 Bb4 D5 G5 | A5 G5 F5 E5 C#5 E5 A5 -`,
  bass: `
    D2 D2 D3 D2 D2 D3 D2 C#3 | Bb1 Bb1 Bb2 Bb1 Bb1 Bb2 Bb1 A2 | G1 G1 G2 G1 G1 G2 G1 F#2 | A1 A1 A2 A1 A1 A2 C#2 E2 |
    D2 D2 D3 D2 D2 D3 D2 C#3 | Bb1 Bb1 Bb2 Bb1 Bb1 Bb2 Bb1 A2 | G1 G1 G2 G1 G1 G2 G1 F#2 | A1 A1 A2 A1 C#2 E2 G2 A2`,
  drums: `
    k k s h k k s h | k k s h k k s s | k k s h k k s h | k k s h k s s s |
    k k s h k k s h | k k s h k k s s | k k s h k k s h | k s k s k s s s`,
};

/** Airy loop for the cloud world: F | C | Dm | Bb | F | C | Bb | C. */
export const SKYLAND_TRACK: Track = {
  id: 'skyland',
  title: 'Above the Clouds',
  bpm: 150,
  lead: `
    F5 - A5 - C6 - A5 F5 | E5 - G5 - C6 - G5 E5 | D5 - F5 - A5 - F5 D5 | Bb4 - D5 - F5 - D5 Bb4 |
    F5 A5 C6 A5 F5 C5 F5 A5 | G5 E5 C5 E5 G5 C6 G5 E5 | F5 D5 Bb4 D5 F5 Bb5 A5 G5 | E5 - G5 - C6 - - -`,
  bass: `
    F2 . C3 . F3 . C3 . | C3 . G3 . C4 . G3 . | D3 . A3 . D4 . A3 . | Bb2 . F3 . Bb3 . F3 . |
    F2 . C3 . F3 . C3 . | C3 . G3 . C4 . G3 . | Bb2 . F3 . Bb3 . F3 . | C3 . G3 . C4 . E3 .`,
  drums: `
    k . h . s . h . | k . h . s . h h | k . h . s . h . | k . h . s . h h |
    k . h . s . h . | k . h . s . h h | k . h . s . h . | k . h . s s s s`,
};

/** Slow, rolling underwater loop: Em | C | G | D | Em | C | Am | B. */
export const OCEAN_TRACK: Track = {
  id: 'ocean',
  title: 'Coral Lullaby',
  bpm: 88,
  leadWave: 'triangle',
  lead: `
    E5 - - - G5 - B5 - | C6 - B5 - G5 - - - | B4 - - - D5 - G5 - | F#5 - - - A5 - - - |
    E5 - G5 - B5 - E6 - | C6 - - - G5 - E5 - | A4 - C5 - E5 - A5 - | B4 - - - D#5 - F#5 -`,
  bass: `
    E2 . B2 . E3 . B2 . | C3 . G3 . C3 . G3 . | G2 . D3 . G2 . D3 . | D3 . A3 . D3 . A3 . |
    E2 . B2 . E3 . B2 . | C3 . G3 . C3 . G3 . | A2 . E3 . A2 . E3 . | B2 . F#3 . B2 . D#3 .`,
  drums: `
    k . . . h . . . | k . . . s . h . | k . . . h . . . | k . . . s . h . |
    k . . . h . . . | k . . . s . h . | k . . . h . . . | k . . . s . s .`,
};

/** Driving, fiery loop for the lava caverns: Dm | Eb | Dm | C | Dm | Eb | F | E. */
export const LAVA_TRACK: Track = {
  id: 'lava',
  title: 'Magma Rush',
  bpm: 158,
  lead: `
    D5 F5 A5 F5 D5 F5 A5 D6 | Eb5 G5 Bb5 G5 Eb5 G5 Bb5 Eb6 | D6 C6 A5 F5 D5 F5 A5 C6 | C6 Bb5 G5 E5 C5 E5 G5 Bb5 |
    D5 - A5 - D6 - A5 - | Eb5 - Bb5 - Eb6 - Bb5 - | F5 - C6 - F6 - C6 A5 | E5 - G#5 - B5 - E6 -`,
  bass: `
    D2 D3 D2 D3 D2 D3 D2 D3 | Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | D2 D3 D2 D3 D2 D3 D2 D3 | C2 C3 C2 C3 C2 C3 C2 C3 |
    D2 D3 D2 D3 D2 D3 D2 D3 | Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | F2 F3 F2 F3 F2 F3 F2 F3 | E2 E3 E2 E3 E2 E3 G#2 B2`,
  drums: `
    k h s h k k s h | k h s h k k s h | k h s h k k s h | k h s h k k s s |
    k h s h k k s h | k h s h k k s h | k h s h k k s h | k s k s k s s s`,
};

/** Tense storm loop: Am | F | Dm | E | Am | F | G | E. */
export const STORM_TRACK: Track = {
  id: 'storm',
  title: 'Thunderline',
  bpm: 144,
  lead: `
    A4 - C5 - E5 - A5 - | F5 - E5 - C5 - A4 - | D5 - F5 - A5 - D6 - | B5 - G#5 - E5 - B4 - |
    A5 C6 A5 E5 C5 E5 A5 C6 | F5 A5 F5 C5 A4 C5 F5 A5 | G5 B5 G5 D5 B4 D5 G5 B5 | E5 G#5 B5 E6 B5 G#5 E5 -`,
  bass: `
    A2 . A3 . A2 . A3 . | F2 . F3 . F2 . F3 . | D2 . D3 . D2 . D3 . | E2 . E3 . E2 . E3 . |
    A2 A3 A2 A3 A2 A3 A2 A3 | F2 F3 F2 F3 F2 F3 F2 F3 | G2 G3 G2 G3 G2 G3 G2 G3 | E2 E3 E2 E3 E2 E3 G#2 B2`,
  drums: `
    k . h . s . h h | k h k . s . h h | k . h . s . h h | k h k . s . h h |
    k . h . s . h h | k h k . s . h h | k . h . s . h h | k h k s s s s s`,
};

/** Dreamy night-sky loop: G | Bm | C | D | G | Em | C | D. */
export const STARSKY_TRACK: Track = {
  id: 'starsky',
  title: 'Starfall',
  bpm: 120,
  leadWave: 'triangle',
  lead: `
    B5 - D6 - G5 - - - | F#5 - A5 - D5 - - - | E5 - G5 - C6 - - - | A5 - F#5 - D5 - - - |
    G5 - B5 - D6 - B5 - | E5 - G5 - B5 - - - | C6 - B5 - A5 - G5 - | A5 - - - D5 - F#5 -`,
  bass: `
    G2 . D3 . G3 . D3 . | B2 . F#3 . B3 . F#3 . | C3 . G3 . C4 . G3 . | D3 . A3 . D4 . A3 . |
    G2 . D3 . G3 . D3 . | E2 . B2 . E3 . B2 . | C3 . G3 . C4 . G3 . | D3 . A3 . D3 . F#3 .`,
  drums: `
    k . h . s . h . | k . h . s . h . | k . h . s . h . | k . h . s . h h |
    k . h . s . h . | k . h . s . h . | k . h . s . h . | k . h . s s s s`,
};

/** Dark march for the Murk Fortress: Cm | Ab | Fm | G | Cm | Ab | Bb | G. */
export const FORTRESS_TRACK: Track = {
  id: 'fortress',
  title: 'Murk Fortress',
  bpm: 132,
  lead: `
    C5 - Eb5 - G5 - C6 - | Ab5 - G5 - Eb5 - C5 - | F5 - Ab5 - C6 - F5 - | G5 - B4 - D5 - G5 - |
    C6 Bb5 G5 Eb5 C5 Eb5 G5 Bb5 | Ab5 G5 Eb5 C5 Ab4 C5 Eb5 G5 | Bb5 Ab5 F5 D5 Bb4 D5 F5 Ab5 | G5 F5 D5 B4 G4 B4 D5 G5`,
  bass: `
    C2 C2 C3 C2 C2 C3 C2 B1 | Ab1 Ab1 Ab2 Ab1 Ab1 Ab2 Ab1 G1 | F1 F1 F2 F1 F1 F2 F1 E1 | G1 G1 G2 G1 G1 G2 B1 D2 |
    C2 C2 C3 C2 C2 C3 C2 B1 | Ab1 Ab1 Ab2 Ab1 Ab1 Ab2 Ab1 G1 | Bb1 Bb1 Bb2 Bb1 Bb1 Bb2 Bb1 A1 | G1 G1 G2 G1 B1 D2 F2 G2`,
  drums: `
    k k s h k . s h | k k s h k . s h | k k s h k . s h | k k s h k s s h |
    k k s h k . s h | k k s h k . s h | k k s h k . s h | k s k s k s s s`,
};

/** Baron Murk, final form: frantic and huge: Fm | Db | Bbm | C. */
export const SUPER_BOSS_TRACK: Track = {
  id: 'super',
  title: 'Baron Murk: Final Storm',
  bpm: 182,
  lead: `
    F5 Ab5 C6 Ab5 F5 C6 Db6 C6 | Db6 C6 Ab5 F5 Db5 F5 Ab5 Db6 | Bb5 Db6 F6 Db6 Bb5 F5 Db5 F5 | C6 E6 G6 E6 C6 G5 E5 G5 |
    F6 Eb6 C6 Ab5 F5 Ab5 C6 Eb6 | Db6 C6 Ab5 F5 Db5 F5 Ab5 C6 | Bb5 Ab5 F5 Db5 Bb4 Db5 F5 Ab5 | C6 Bb5 G5 E5 C5 E5 G5 -`,
  bass: `
    F1 F2 F1 F2 F1 F2 F1 F2 | Db1 Db2 Db1 Db2 Db1 Db2 Db1 Db2 | Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | C2 C3 C2 C3 C2 C3 C2 C3 |
    F1 F2 F1 F2 F1 F2 F1 F2 | Db1 Db2 Db1 Db2 Db1 Db2 Db1 Db2 | Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | C2 C3 C2 C3 E2 G2 Bb2 C3`,
  drums: `
    k k s k k k s s | k k s k k k s s | k k s k k k s s | k k s k k s s s |
    k k s k k k s s | k k s k k k s s | k k s k k k s s | k s k s s s s s`,
};

/** Synthwave theme for the arcade menus: Am | F | C | G | Am | F | C | E. */
export const ARCADE_TRACK: Track = {
  id: 'arcade',
  title: 'Arcade Nights',
  bpm: 126,
  lead: `
    E5 - - - C5 - A4 - | F5 - - - A5 - C6 - | G5 - E5 - C5 - E5 - | D5 - B4 - G4 - B4 D5 |
    E5 - A5 - C6 - B5 A5 | F5 - A5 - C6 - D6 C6 | G5 - C6 - E6 - D6 C6 | B5 - G#5 - E5 - - -`,
  bass: `
    A2 A3 A2 A3 A2 A3 A2 A3 | F2 F3 F2 F3 F2 F3 F2 F3 | C3 C4 C3 C4 C3 C4 C3 C4 | G2 G3 G2 G3 G2 G3 G2 G3 |
    A2 A3 A2 A3 A2 A3 A2 A3 | F2 F3 F2 F3 F2 F3 F2 F3 | C3 C4 C3 C4 C3 C4 C3 C4 | E2 E3 E2 E3 E2 E3 G#2 B2`,
  drums: `
    k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s . h h |
    k . h . s . h . | k . h k s . h h | k . h . s . h . | k . h k s s s s`,
};

export const TRACKS: Record<string, Track> = {
  [ARCADE_TRACK.id]: ARCADE_TRACK,
  [SKYLAND_TRACK.id]: SKYLAND_TRACK,
  [OCEAN_TRACK.id]: OCEAN_TRACK,
  [LAVA_TRACK.id]: LAVA_TRACK,
  [STORM_TRACK.id]: STORM_TRACK,
  [STARSKY_TRACK.id]: STARSKY_TRACK,
  [FORTRESS_TRACK.id]: FORTRESS_TRACK,
  [SUPER_BOSS_TRACK.id]: SUPER_BOSS_TRACK,
  [SKIRMISH_TRACK.id]: SKIRMISH_TRACK,
  [BOSS_TRACK.id]: BOSS_TRACK,
  [MEADOW_TRACK.id]: MEADOW_TRACK,
  [SUNSET_TRACK.id]: SUNSET_TRACK,
  [PEAKS_TRACK.id]: PEAKS_TRACK,
  [NIGHT_TRACK.id]: NIGHT_TRACK,
};

interface NoteEvent {
  len: number;
  freq: number;
}

const SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function noteFrequency(token: string): number {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(token);
  if (!m) throw new Error(`Bad note "${token}"`);
  const semi = SEMITONES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const midi = (Number(m[3]) + 1) * 12 + semi;
  return 440 * 2 ** ((midi - 69) / 12);
}

function tokens(line: string): string[] {
  return line.split(/\s+/).filter((t) => t && t !== '|');
}

function parseMelody(line: string): { events: Map<number, NoteEvent>; steps: number } {
  const events = new Map<number, NoteEvent>();
  const list = tokens(line);
  let last: NoteEvent | null = null;
  list.forEach((t, step) => {
    if (t === '-') {
      if (last) last.len += 1;
    } else if (t === '.') {
      last = null;
    } else {
      last = { len: 1, freq: noteFrequency(t) };
      events.set(step, last);
    }
  });
  return { events, steps: list.length };
}

const LOOKAHEAD_S = 0.12;
const TICK_MS = 25;

export class MusicPlayer {
  private timer: number | null = null;
  private trackId: string | null = null;
  private lead = new Map<number, NoteEvent>();
  private bass = new Map<number, NoteEvent>();
  private drums: string[] = [];
  private steps = 0;
  private step = 0;
  private nextTime = 0;
  private stepDur = 0;
  private leadWave: OscillatorType = 'square';

  constructor(private readonly audio: AudioSystem) {}

  get currentTrackId(): string | null {
    return this.trackId;
  }

  /** Returns false if the track was already playing (no restart). */
  play(track: Track): boolean {
    if (this.trackId === track.id && this.timer !== null) return false;
    this.stop();
    const ctx = this.audio.context;
    if (!ctx) return false;
    const lead = parseMelody(track.lead);
    const bass = parseMelody(track.bass);
    this.lead = lead.events;
    this.bass = bass.events;
    this.drums = tokens(track.drums);
    this.steps = Math.max(lead.steps, bass.steps, this.drums.length);
    this.stepDur = 60 / track.bpm / 2;
    this.leadWave = track.leadWave ?? 'square';
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.08;
    this.trackId = track.id;
    this.timer = window.setInterval(this.schedule, TICK_MS);
    return true;
  }

  stop(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.trackId = null;
  }

  private schedule = (): void => {
    const ctx = this.audio.context;
    const bus = this.audio.musicBus;
    if (!ctx || !bus || ctx.state !== 'running') return;
    // After a long stall (tab in background), skip ahead instead of playing a burst of notes.
    if (this.nextTime < ctx.currentTime - 0.25) this.nextTime = ctx.currentTime + 0.05;
    while (this.nextTime < ctx.currentTime + LOOKAHEAD_S) {
      const at = this.nextTime - ctx.currentTime;
      const lead = this.lead.get(this.step);
      if (lead) this.audio.tone({ type: this.leadWave, from: lead.freq, dur: lead.len * this.stepDur * 0.92, vol: this.leadWave === 'square' ? 0.045 : 0.09, at, bus });
      const bass = this.bass.get(this.step);
      if (bass) this.audio.tone({ type: 'triangle', from: bass.freq, dur: bass.len * this.stepDur * 0.9, vol: 0.16, at, bus });
      switch (this.drums[this.step]) {
        case 'k':
          this.audio.tone({ type: 'sine', from: 150, to: 45, dur: 0.12, vol: 0.32, at, bus });
          break;
        case 's':
          this.audio.noise({ dur: 0.1, vol: 0.1, filter: 'bandpass', freq: 1800, at, bus });
          break;
        case 'h':
          this.audio.noise({ dur: 0.03, vol: 0.04, filter: 'highpass', freq: 7000, at, bus });
          break;
      }
      this.nextTime += this.stepDur;
      this.step = (this.step + 1) % this.steps;
    }
  };
}
