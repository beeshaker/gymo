import type { Exercise, ExerciseLog } from './types';

export type Rx = Pick<Exercise, 'sets' | 'minReps' | 'maxReps' | 'increment' | 'unit'>;
export type Entry = Pick<ExerciseLog, 'load' | 'reps' | 'rir' | 'toe' | 'deload'>;

export type DecisionKind = 'start' | 'stop' | 'increase' | 'confirm' | 'build' | 'stalled' | 'reduce';

export interface Decision {
  kind: DecisionKind;
  label: string;
  detail: string;
  /** Suggested load for the next session; null when there is no history. */
  load: number | null;
  /** Suggested reps per work set for the next session. */
  reps: number[];
}

const round = (n: number) => Math.round(n * 100) / 100;
const total = (e: Entry) => e.reps.reduce((a, b) => a + b, 0);
const fill = (n: number, v: number) => Array<number>(n).fill(v);

/** Work-set reps padded/truncated to the prescribed number of sets. */
function workReps(rx: Rx, e: Entry): number[] {
  return Array.from({ length: rx.sets }, (_, i) => e.reps[i] ?? 0);
}

/** Every work set at the top of the range with at least 1 rep in reserve. */
export function hitTop(rx: Rx, e: Entry): boolean {
  return (
    e.reps.length >= rx.sets &&
    workReps(rx, e).every((r) => r >= rx.maxReps) &&
    e.rir !== null &&
    e.rir >= 1
  );
}

/**
 * Double progression: add reps within the range; once every set reaches the
 * top in two consecutive sessions at the same load, add the smallest increment.
 * `history` is oldest-first and should exclude the session being planned.
 */
export function decide(rx: Rx, history: Entry[]): Decision {
  const h = history.filter((e) => !e.deload && e.reps.length > 0);
  const last = h.at(-1);
  const u = rx.unit;

  if (!last) {
    return {
      kind: 'start',
      label: 'First session',
      detail: `Pick a load you can lift for ${rx.sets} × ${rx.minReps}–${rx.maxReps} with 1–2 reps left.`,
      load: null,
      reps: fill(rx.sets, rx.minReps),
    };
  }

  if (last.toe === 'worse') {
    return {
      kind: 'stop',
      label: 'Stop / review',
      detail: 'Toe got worse last time. Check with your clinician before repeating this exercise.',
      load: last.load,
      reps: workReps(rx, last),
    };
  }

  if (hitTop(rx, last)) {
    const prev = h.at(-2);
    if (prev && prev.load === last.load && hitTop(rx, prev)) {
      const next = round(last.load + rx.increment);
      return {
        kind: 'increase',
        label: `Add ${rx.increment} ${u}`,
        detail: `Top of range twice at ${last.load} ${u}. Move to ${next} ${u} and build reps again.`,
        load: next,
        reps: fill(rx.sets, rx.minReps),
      };
    }
    return {
      kind: 'confirm',
      label: 'Repeat to confirm',
      detail: `Every set hit ${rx.maxReps}. Match it again at ${last.load} ${u}, then add weight.`,
      load: last.load,
      reps: fill(rx.sets, rx.maxReps),
    };
  }

  const reps = workReps(rx, last);
  if (Math.max(...reps) < rx.minReps) {
    return {
      kind: 'reduce',
      label: 'Below range',
      detail: `No set reached ${rx.minReps}. Drop one step so every set lands in range.`,
      load: Math.max(0, round(last.load - rx.increment)),
      reps: fill(rx.sets, rx.minReps),
    };
  }

  // Beat last time by one rep on the weakest set.
  const target = reps.map((r) => Math.min(rx.maxReps, Math.max(rx.minReps, r)));
  const weakest = target.indexOf(Math.min(...target));
  if (target[weakest] < rx.maxReps && target.every((t, i) => t <= reps[i])) target[weakest]++;

  let sameLoad = 0;
  for (let i = h.length - 1; i >= 0 && h[i].load === last.load; i--) sameLoad++;
  if (sameLoad >= 3 && total(last) <= total(h[h.length - 3])) {
    return {
      kind: 'stalled',
      label: 'Stalled',
      detail: `3 sessions at ${last.load} ${u} without more reps. Check sleep, food and rest times; if tired, take a lighter week.`,
      load: last.load,
      reps: target,
    };
  }

  return {
    kind: 'build',
    label: 'Build reps',
    detail: `Same load. Aim for ${target.join(' / ')} — beat ${total(last)} total reps.`,
    load: last.load,
    reps: target,
  };
}
