/**
 * Chiptune-style sound effects synthesized with the Web Audio API, so every sound is original
 * and nothing has to be downloaded. The AudioContext is only created/resumed from a user
 * gesture to respect browser autoplay rules (concept brief §9).
 *
 * Music and effects have separate on/off and volume so players can mute game music and play
 * their own (Spotify, YouTube Music, ...) alongside. Game music is routed through an <audio>
 * element, which makes the browser treat it as real media: it appears in Chrome's media
 * controls and the OS media overlay with the track name and working play/pause.
 */
import { uiStore } from '../bridge';
import { MusicPlayer, TRACKS, type Track } from './music';
import { saveSettings } from './settings';

export type SfxName =
  | 'bounce'
  | 'superBounce'
  | 'land'
  | 'collect'
  | 'checkpoint'
  | 'spring'
  | 'fail'
  | 'complete'
  | 'splash'
  | 'crack'
  | 'whoosh'
  | 'stomp'
  | 'shoot'
  | 'enemyHit'
  | 'explode'
  | 'hurt'
  | 'warning'
  | 'bossRoar'
  | 'zap'
  | 'powerup'
  | 'shieldPop'
  | 'uiMove'
  | 'uiSelect'
  | 'pause';

export interface ToneOptions {
  type: OscillatorType;
  from: number;
  to?: number;
  dur: number;
  vol: number;
  at?: number;
  attack?: number;
  bus?: AudioNode;
}

export interface NoiseOptions {
  dur: number;
  vol: number;
  at?: number;
  filter?: BiquadFilterType;
  freq?: number;
  bus?: AudioNode;
}

const MUSIC_LEVEL = 0.9;
const DUCKED = 0.33;
const ARTIST = 'Bopple Soundtrack';

let nowPlayingId = 0;

/** Square the slider value so steps feel even to the ear. */
const perceptual = (on: boolean, volume: number) => (on ? volume * volume : 0);

export class AudioSystem {
  readonly music = new MusicPlayer(this);
  private ctx: AudioContext | null = null;
  private sfxBus: GainNode | null = null;
  private musicBusNode: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private mediaEl: HTMLAudioElement | null = null;
  private ducked = false;
  private artwork: string | null = null;
  private currentTrack: Track | null = null;
  private currentAlbum = '';

  get context(): AudioContext | null {
    return this.ctx;
  }

  get musicBus(): GainNode | null {
    return this.musicBusNode;
  }

  /** Call from a click/keydown/touch handler. Safe to call repeatedly. */
  unlock(): void {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      this.ctx = ctx;
      this.sfxBus = ctx.createGain();
      this.sfxBus.connect(ctx.destination);
      this.musicBusNode = ctx.createGain();
      this.routeMusicThroughMediaElement(ctx, this.musicBusNode);
      this.noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.setupMediaSession();
      this.applyVolume();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    this.syncMediaElement();
  }

  /** Music goes bus -> MediaStream -> <audio>; direct output if media streams are unavailable. */
  private routeMusicThroughMediaElement(ctx: AudioContext, bus: GainNode): void {
    try {
      const dest = ctx.createMediaStreamDestination();
      const el = new Audio();
      el.srcObject = dest.stream;
      bus.connect(dest);
      this.mediaEl = el;
    } catch {
      bus.connect(ctx.destination);
      this.mediaEl = null;
    }
  }

  /** If the browser refuses to play the media element, send music straight to the speakers. */
  private fallbackToDirectMusic(): void {
    if (!this.ctx || !this.musicBusNode) return;
    this.musicBusNode.disconnect();
    this.musicBusNode.connect(this.ctx.destination);
    this.mediaEl = null;
  }

  private setupMediaSession(): void {
    if (!('mediaSession' in navigator)) return;
    const session = navigator.mediaSession;
    const handlers: [MediaSessionAction, () => void][] = [
      ['play', () => this.setMusicOn(true)],
      ['pause', () => this.setMusicOn(false)],
      ['stop', () => this.setMusicOn(false)],
    ];
    for (const [action, handler] of handlers) {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // Unsupported action in this browser.
      }
    }
  }

  /** Keep the media element (and so the browser's media controls) in step with the Music setting. */
  private syncMediaElement(): void {
    const playing = uiStore.get().musicOn && this.music.currentTrackId !== null;
    if (this.mediaEl) {
      if (playing && this.mediaEl.paused) {
        // AbortError just means a pause interrupted play(); only a refusal needs the fallback.
        this.mediaEl.play().catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'NotAllowedError') this.fallbackToDirectMusic();
        });
      }
      else if (!playing && !this.mediaEl.paused) this.mediaEl.pause();
    }
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }

  /** Start a level's music by id, update the browser's media controls and the in-game chip. */
  playTrack(trackId: string | undefined, album: string): void {
    const track = TRACKS[trackId ?? 'meadow'] ?? TRACKS.meadow;
    const started = this.music.play(track);
    this.currentTrack = track;
    this.currentAlbum = album;
    if (started) {
      this.updateMetadata();
      if (uiStore.get().musicOn) {
        nowPlayingId += 1;
        uiStore.set({ nowPlaying: { id: nowPlayingId, title: track.title } });
      }
    }
    this.syncMediaElement();
  }

  stopMusic(): void {
    this.music.stop();
    this.syncMediaElement();
  }

  private updateMetadata(): void {
    if (!('mediaSession' in navigator) || !this.currentTrack || typeof MediaMetadata === 'undefined') return;
    this.artwork ??= drawArtwork();
    navigator.mediaSession.metadata = new MediaMetadata({
      title: this.currentTrack.title,
      artist: ARTIST,
      album: this.currentAlbum,
      artwork: this.artwork ? [{ src: this.artwork, sizes: '256x256', type: 'image/png' }] : [],
    });
  }

  setMusicOn(on: boolean): void {
    uiStore.set({ musicOn: on });
    this.persist();
    this.applyVolume();
    this.syncMediaElement();
    if (on && this.currentTrack) {
      nowPlayingId += 1;
      uiStore.set({ nowPlaying: { id: nowPlayingId, title: this.currentTrack.title } });
    }
  }

  setRumbleOn(on: boolean): void {
    uiStore.set({ rumbleOn: on });
    this.persist();
  }

  setSfxOn(on: boolean): void {
    uiStore.set({ sfxOn: on });
    this.persist();
    this.applyVolume();
  }

  /** Volume 0 switches the channel off; raising it again switches it back on. */
  setMusicVolume(volume: number): void {
    const v = Math.round(Math.min(1, Math.max(0, volume)) * 10) / 10;
    const wasOn = uiStore.get().musicOn;
    uiStore.set({ musicVolume: v, musicOn: v > 0 });
    this.persist();
    this.applyVolume();
    if (wasOn !== v > 0) this.syncMediaElement();
  }

  setSfxVolume(volume: number): void {
    const v = Math.round(Math.min(1, Math.max(0, volume)) * 10) / 10;
    uiStore.set({ sfxVolume: v, sfxOn: v > 0 });
    this.persist();
    this.applyVolume();
  }

  duckMusic(ducked: boolean): void {
    this.ducked = ducked;
    this.applyVolume();
  }

  private persist(): void {
    const { musicOn, musicVolume, sfxOn, sfxVolume, rumbleOn } = uiStore.get();
    saveSettings({ musicOn, musicVolume, sfxOn, sfxVolume, rumbleOn });
  }

  private applyVolume(): void {
    if (!this.ctx || !this.sfxBus || !this.musicBusNode) return;
    const { musicOn, musicVolume, sfxOn, sfxVolume } = uiStore.get();
    const t = this.ctx.currentTime;
    this.sfxBus.gain.setTargetAtTime(perceptual(sfxOn, sfxVolume), t, 0.02);
    const music = perceptual(musicOn, musicVolume) * MUSIC_LEVEL * (this.ducked ? DUCKED : 1);
    this.musicBusNode.gain.setTargetAtTime(music, t, 0.06);
  }

  tone(o: ToneOptions): void {
    const ctx = this.ctx;
    const bus = o.bus ?? this.sfxBus;
    if (!ctx || !bus) return;
    const t0 = ctx.currentTime + (o.at ?? 0);
    const osc = ctx.createOscillator();
    osc.type = o.type;
    osc.frequency.setValueAtTime(o.from, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + o.dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(o.vol, t0 + (o.attack ?? 0.005));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(gain).connect(bus);
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.03);
  }

  noise(o: NoiseOptions): void {
    const ctx = this.ctx;
    const bus = o.bus ?? this.sfxBus;
    if (!ctx || !bus || !this.noiseBuffer) return;
    const t0 = ctx.currentTime + (o.at ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = o.filter ?? 'lowpass';
    filter.frequency.value = o.freq ?? 1200;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(o.vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    src.connect(filter).connect(gain).connect(bus);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + o.dur + 0.02);
  }

  play(name: SfxName, opts: { intensity?: number; pitch?: number } = {}): void {
    if (!this.ctx) return;
    const pitch = opts.pitch ?? 1;
    const intensity = Math.min(1, Math.max(0, opts.intensity ?? 1));
    switch (name) {
      case 'bounce':
        this.tone({ type: 'square', from: 250 * pitch, to: 520 * pitch, dur: 0.11, vol: 0.1 });
        break;
      case 'superBounce':
        this.tone({ type: 'square', from: 300, to: 1250, dur: 0.24, vol: 0.1 });
        this.tone({ type: 'triangle', from: 600, to: 1900, dur: 0.22, vol: 0.08, at: 0.03 });
        break;
      case 'land':
        this.noise({ dur: 0.07, vol: 0.05 + 0.15 * intensity, freq: 500 });
        this.tone({ type: 'triangle', from: 140, to: 70, dur: 0.07, vol: 0.06 + 0.12 * intensity });
        break;
      case 'collect':
        this.tone({ type: 'square', from: 988 * pitch, dur: 0.07, vol: 0.08 });
        this.tone({ type: 'square', from: 1319 * pitch, dur: 0.14, vol: 0.08, at: 0.06 });
        break;
      case 'checkpoint':
        [523, 659, 784, 1047].forEach((f, i) => {
          this.tone({ type: 'square', from: f, dur: 0.12, vol: 0.07, at: i * 0.075 });
          this.tone({ type: 'triangle', from: f / 2, dur: 0.12, vol: 0.08, at: i * 0.075 });
        });
        break;
      case 'spring':
        this.tone({ type: 'sine', from: 160, to: 780, dur: 0.28, vol: 0.22 });
        this.tone({ type: 'square', from: 90, to: 400, dur: 0.22, vol: 0.05 });
        break;
      case 'fail':
        this.tone({ type: 'square', from: 640, to: 80, dur: 0.5, vol: 0.1 });
        this.noise({ dur: 0.22, vol: 0.12, freq: 900 });
        break;
      case 'complete': {
        const notes = [523, 659, 784, 1047, 784, 1047, 1319];
        const times = [0, 0.1, 0.2, 0.3, 0.45, 0.55, 0.7];
        notes.forEach((f, i) => {
          const last = i === notes.length - 1;
          this.tone({ type: 'square', from: f, dur: last ? 0.6 : 0.12, vol: 0.08, at: times[i] });
          this.tone({ type: 'triangle', from: f / 2, dur: last ? 0.6 : 0.12, vol: 0.1, at: times[i] });
        });
        break;
      }
      case 'splash':
        this.noise({ dur: 0.28, vol: 0.06 + 0.14 * intensity, filter: 'bandpass', freq: 1400 });
        this.tone({ type: 'sine', from: 520, to: 180, dur: 0.18, vol: 0.08 });
        this.tone({ type: 'sine', from: 900, to: 1500, dur: 0.08, vol: 0.04, at: 0.12 });
        break;
      case 'crack':
        this.noise({ dur: 0.08, vol: 0.14, filter: 'highpass', freq: 2500 });
        this.tone({ type: 'square', from: 180, to: 120, dur: 0.06, vol: 0.06, at: 0.03 });
        break;
      case 'whoosh':
        this.noise({ dur: 0.35, vol: 0.06, filter: 'bandpass', freq: 900 });
        this.tone({ type: 'sine', from: 300, to: 700, dur: 0.3, vol: 0.04 });
        break;
      case 'stomp':
        this.tone({ type: 'square', from: 520, to: 180, dur: 0.12, vol: 0.1 });
        this.noise({ dur: 0.1, vol: 0.12, freq: 700 });
        break;
      case 'shoot':
        this.tone({ type: 'square', from: 1400, to: 700, dur: 0.05, vol: 0.035 });
        break;
      case 'enemyHit':
        this.tone({ type: 'square', from: 300, to: 220, dur: 0.04, vol: 0.05 });
        break;
      case 'explode':
        this.noise({ dur: 0.25 + 0.25 * intensity, vol: 0.1 + 0.1 * intensity, freq: 600 + 600 * intensity });
        this.tone({ type: 'triangle', from: 160, to: 40, dur: 0.3, vol: 0.1 + 0.1 * intensity });
        break;
      case 'hurt':
        this.tone({ type: 'square', from: 420, to: 160, dur: 0.22, vol: 0.1 });
        this.tone({ type: 'square', from: 400, to: 150, dur: 0.22, vol: 0.06, at: 0.06 });
        break;
      case 'warning':
        for (let i = 0; i < 3; i++) {
          this.tone({ type: 'square', from: 880, dur: 0.18, vol: 0.07, at: i * 0.42 });
          this.tone({ type: 'square', from: 660, dur: 0.18, vol: 0.07, at: i * 0.42 + 0.2 });
        }
        break;
      case 'bossRoar':
        this.tone({ type: 'sawtooth', from: 220, to: 55, dur: 0.8, vol: 0.12 });
        this.tone({ type: 'square', from: 110, to: 40, dur: 0.8, vol: 0.06 });
        this.noise({ dur: 0.7, vol: 0.1, freq: 300 });
        break;
      case 'zap':
        this.noise({ dur: 0.3, vol: 0.16, filter: 'highpass', freq: 1800 });
        this.tone({ type: 'sawtooth', from: 1200, to: 90, dur: 0.25, vol: 0.08 });
        break;
      case 'powerup':
        [660, 880, 1100, 1320, 1760].forEach((f, i) => this.tone({ type: 'square', from: f, dur: 0.08, vol: 0.07, at: i * 0.05 }));
        break;
      case 'shieldPop':
        this.tone({ type: 'sine', from: 900, to: 300, dur: 0.25, vol: 0.12 });
        this.noise({ dur: 0.2, vol: 0.08, filter: 'bandpass', freq: 2200 });
        break;
      case 'uiMove':
        this.tone({ type: 'square', from: 660, dur: 0.04, vol: 0.04 });
        break;
      case 'uiSelect':
        this.tone({ type: 'square', from: 880, to: 1320, dur: 0.08, vol: 0.06 });
        break;
      case 'pause':
        this.tone({ type: 'triangle', from: 440, to: 220, dur: 0.14, vol: 0.12 });
        break;
    }
  }
}

/** Album art for the browser's media controls: the hero, drawn on a canvas. */
function drawArtwork(): string | null {
  try {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const g = canvas.getContext('2d');
    if (!g) return null;
    g.fillStyle = '#4fa4e8';
    g.fillRect(0, 0, size, size);
    g.fillStyle = '#6abe30';
    g.fillRect(0, 200, size, 56);
    g.fillStyle = '#7a2e12';
    g.beginPath();
    g.arc(128, 128, 84, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#ff8a3d';
    g.beginPath();
    g.arc(128, 128, 76, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#ffffff';
    g.fillRect(92, 92, 22, 34);
    g.fillRect(142, 92, 22, 34);
    g.fillStyle = '#10142a';
    g.fillRect(103, 104, 11, 22);
    g.fillRect(153, 104, 11, 22);
    g.fillStyle = '#7a2e12';
    g.fillRect(106, 160, 44, 10);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

export const audio = new AudioSystem();
