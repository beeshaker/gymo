export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type Unit = 'kg' | 'lb';
export type Toe = 'none' | 'worse';

export const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const TRAINING_DAYS: Day[] = ['Tue', 'Wed', 'Thu', 'Sat', 'Sun'];

export interface Exercise {
  id?: number;
  day: Day;
  order: number;
  name: string;
  sets: number;
  minReps: number;
  maxReps: number;
  restSec: number;
  unit: Unit;
  /** Smallest load jump available on this machine / implement. */
  increment: number;
  note: string;
  active: boolean;
}

export interface Session {
  id?: number;
  date: string; // YYYY-MM-DD, local
  day: Day;
  /** Lighter week: half the work sets, same loads, ignored by progression. */
  deload: boolean;
  finished: boolean;
  startedAt: number;
}

/** One row per exercise per session, mirroring the "Workout log" sheet. */
export interface ExerciseLog {
  id?: number;
  sessionId: number;
  exerciseId: number;
  date: string;
  load: number;
  unit: Unit;
  reps: number[];
  /** Lowest reps-in-reserve across the work sets. */
  rir: number | null;
  toe: Toe | null;
  notes: string;
  deload: boolean;
}

export interface Checkin {
  week: number;
  avgWeight?: number;
  sleep?: number;
  waist?: number;
  recovery?: string;
  notes?: string;
}

export interface Meta {
  key: string;
  value: unknown;
}
