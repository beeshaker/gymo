import { useSyncExternalStore } from 'react';

export interface RestState {
  endAt: number;
  total: number;
  label: string;
}

const KEY = 'gymo.rest';
const listeners = new Set<() => void>();
let state: RestState | null = load();
let tick: number | undefined;
let warned = false;
let rang = false;
let audio: AudioContext | null = null;
let wakeLock: WakeLockSentinel | null = null;
let wantAwake = false;

function load(): RestState | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as RestState | null;
    return s && s.endAt > Date.now() ? s : null;
  } catch {
    return null;
  }
}

function set(next: RestState | null) {
  state = next;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: timer still works in memory */
  }
  listeners.forEach((l) => l());
  if (next) ensureTicking();
}

function beep(freq: number, ms: number, delay = 0) {
  if (!audio) return;
  const t = audio.currentTime + delay / 1000;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.4, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + ms / 1000 + 0.05);
}

async function notifyDone(label: string) {
  if (!document.hidden || !('Notification' in window) || Notification.permission !== 'granted') return;
  const reg = await navigator.serviceWorker?.getRegistration();
  const opts = { body: `Next: ${label}`, tag: 'gymo-rest', renotify: true, vibrate: [400, 150, 400] };
  if (reg) reg.showNotification('Rest over — go!', opts as NotificationOptions);
  else new Notification('Rest over — go!', opts as NotificationOptions);
}

function ensureTicking() {
  if (tick !== undefined) return;
  warned = rang = false;
  tick = window.setInterval(() => {
    if (!state) {
      clearInterval(tick);
      tick = undefined;
      return;
    }
    const left = state.endAt - Date.now();
    if (!warned && left <= 10_000 && left > 0) {
      warned = true;
      beep(660, 120);
      navigator.vibrate?.(120);
    }
    if (!rang && left <= 0) {
      rang = true;
      beep(880, 180);
      beep(880, 180, 250);
      beep(1175, 350, 500);
      navigator.vibrate?.([400, 150, 400]);
      void notifyDone(state.label);
    }
    // Keep "Go" on screen briefly, then clear.
    if (left <= -4000) set(null);
    listeners.forEach((l) => l());
  }, 250);
}

/** Call from a user gesture so audio is allowed to play later. */
export function unlockAudio() {
  try {
    audio ??= new AudioContext();
    void audio.resume();
  } catch {
    /* no Web Audio */
  }
}

export function startRest(seconds: number, label: string) {
  unlockAudio();
  warned = rang = false;
  set({ endAt: Date.now() + seconds * 1000, total: seconds, label });
}

export function addRest(seconds: number) {
  if (!state) return;
  const endAt = Math.max(Date.now(), state.endAt) + seconds * 1000;
  if (endAt - Date.now() > 10_000) warned = false;
  rang = false;
  set({ ...state, endAt, total: state.total + seconds });
}

export function skipRest() {
  set(null);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

let snap: { state: RestState | null; left: number } = { state: null, left: 0 };
function getSnapshot() {
  const left = state ? Math.ceil((state.endAt - Date.now()) / 1000) : 0;
  if (snap.state !== state || snap.left !== left) snap = { state, left };
  return snap;
}

export function useRest() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

if (state) ensureTicking();

// ---- Screen wake lock (keeps the timer visible and running while training) ----

async function acquire() {
  if (!wantAwake || wakeLock || !('wakeLock' in navigator) || document.hidden) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => (wakeLock = null));
  } catch {
    /* denied (battery saver etc.) */
  }
}

export function keepAwake(on: boolean) {
  wantAwake = on;
  if (on) void acquire();
  else {
    void wakeLock?.release();
    wakeLock = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    void acquire();
    listeners.forEach((l) => l());
  }
});

export async function requestNotifications() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}
