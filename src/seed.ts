import type { Exercise } from './types';

// Arm-priority plan (v2). Names match v1 where the exercise is unchanged so
// logged history carries over. Rest is per set; for a superset pair, the first
// exercise flows straight into the second and the rest comes after the pair.
// Units and increments are best guesses — edit them in Settings.
/** Pull-ups (v3): Wednesday's main vertical pull, replacing the 3×6–10 pulldown. */
export const PULL_UP = { name: 'Pull-up' };
export const PULL_UP_FIELDS = {
  sets: 3,
  minReps: 6,
  maxReps: 10,
  restSec: 150,
  unit: 'kg' as const,
  increment: 2.5,
  note: 'Load = added weight (0 = bodyweight). Step up from a bench and step back down onto it — never drop. No kipping.',
};

/** v5: second Thursday arm superset, restoring the sets Saturday gave up. */
export const THU_HAMMER = { name: 'Seated hammer curl', sets: 2, minReps: 10, maxReps: 15, restSec: 75, unit: 'kg' as const, increment: 1, note: 'Per hand. Straight into the pushdown.', superset: true };
export const THU_PUSHDOWN = { name: 'Seated triceps pushdown', sets: 2, minReps: 10, maxReps: 15, restSec: 75, unit: 'kg' as const, increment: 2.5, note: 'Rope.', superset: false };

/** v5: Sunday's second arm pair, replacing concentration curl + pushdown. */
export const SUN_BAYESIAN = { name: 'Seated Bayesian curl', sets: 3, minReps: 10, maxReps: 15, restSec: 75, unit: 'kg' as const, increment: 1, note: 'One arm. Incline bench facing away from a low cable, arm drifts behind the body for the stretch. Straight into the kickback.', superset: true };
export const SUN_KICKBACK = { name: 'Chest-supported triceps kickback', sets: 3, minReps: 12, maxReps: 15, restSec: 75, unit: 'kg' as const, increment: 1, note: 'Chest on an incline bench, feet unloaded. Upper arm pinned to your side, squeeze at full lockout. Dumbbell or cable, per arm.', superset: false };
export const SUN_REPLACED = ['Concentration curl', 'Seated triceps pushdown'];

type Row = Omit<Exercise, 'id' | 'order' | 'active' | 'superset'> & { superset?: boolean };

const rows: Row[] = [
  { day: 'Tue', name: 'Bench / supported chest press', sets: 3, minReps: 6, maxReps: 8, restSec: 150, unit: 'kg', increment: 2.5, note: 'Use machine if bench setup loads toe. No leg drive.' },
  { day: 'Tue', name: 'Incline supported press', sets: 3, minReps: 8, maxReps: 12, restSec: 120, unit: 'kg', increment: 2, note: 'Incline dumbbell or machine press.' },
  { day: 'Tue', name: 'Seated triceps pushdown', sets: 3, minReps: 10, maxReps: 15, restSec: 75, unit: 'kg', increment: 2.5, note: 'Rope. Straight into the overhead extension.', superset: true },
  { day: 'Tue', name: 'Seated overhead triceps extension', sets: 3, minReps: 10, maxReps: 15, restSec: 75, unit: 'kg', increment: 2.5, note: 'Rope, cable low, seated facing away. Deep stretch for the long head.' },

  { day: 'Wed', name: PULL_UP.name, ...PULL_UP_FIELDS },
  { day: 'Wed', name: 'Seated cable row', sets: 3, minReps: 8, maxReps: 12, restSec: 120, unit: 'lb', increment: 5, note: 'V-handle, chest tall, pause at the belly.' },
  { day: 'Wed', name: 'Incline dumbbell curl', sets: 3, minReps: 8, maxReps: 12, restSec: 75, unit: 'kg', increment: 1, note: 'Arms hang behind the body for the stretch. Per hand.', superset: true },
  { day: 'Wed', name: 'Seated reverse fly', sets: 2, minReps: 12, maxReps: 20, restSec: 75, unit: 'kg', increment: 2.5, note: 'Reverse pec deck. Rear delts.' },
  { day: 'Wed', name: 'Seated hammer curl', sets: 3, minReps: 10, maxReps: 15, restSec: 75, unit: 'kg', increment: 1, note: 'Brachialis + forearm thickness. Per hand.' },

  { day: 'Thu', name: 'Seated machine shoulder press', sets: 3, minReps: 8, maxReps: 12, restSec: 120, unit: 'kg', increment: 2.5, note: '' },
  { day: 'Thu', name: 'Seated lateral raise', sets: 3, minReps: 12, maxReps: 20, restSec: 75, unit: 'kg', increment: 1, note: 'Strict form. Per hand.' },
  { day: 'Thu', name: 'Seated supported curl', sets: 3, minReps: 8, maxReps: 12, restSec: 75, unit: 'kg', increment: 1, note: 'Preacher or seated dumbbell curl.', superset: true },
  { day: 'Thu', name: 'Lying dumbbell triceps extension', sets: 3, minReps: 8, maxReps: 12, restSec: 75, unit: 'kg', increment: 1, note: 'Lying on bench, elbows slightly back. Per hand.' },
  { day: 'Thu', ...THU_HAMMER },
  { day: 'Thu', ...THU_PUSHDOWN },
  { day: 'Thu', name: 'Seated dumbbell shrug', sets: 3, minReps: 10, maxReps: 15, restSec: 75, unit: 'kg', increment: 2, note: 'Sit on bench end. Shoulders to ears, 1 s pause. Straps OK.' },

  { day: 'Sat', name: 'Supported chest press', sets: 3, minReps: 8, maxReps: 12, restSec: 120, unit: 'kg', increment: 2.5, note: '' },
  { day: 'Sat', name: 'Incline-bench dumbbell row', sets: 3, minReps: 8, maxReps: 12, restSec: 120, unit: 'kg', increment: 2, note: 'Chest on a ~30° bench. Per hand.' },
  { day: 'Sat', name: 'Seated lat pulldown', sets: 2, minReps: 10, maxReps: 15, restSec: 120, unit: 'lb', increment: 5, note: 'Use same machine each week.' },
  { day: 'Sat', name: 'Pec deck', sets: 2, minReps: 12, maxReps: 15, restSec: 75, unit: 'kg', increment: 2.5, note: 'Same machine as the reverse fly.', superset: true },
  { day: 'Sat', name: 'Seated reverse fly', sets: 2, minReps: 12, maxReps: 20, restSec: 75, unit: 'kg', increment: 2.5, note: 'Reverse pec deck.' },
  { day: 'Sat', name: 'Seated dumbbell shrug', sets: 2, minReps: 10, maxReps: 15, restSec: 75, unit: 'kg', increment: 2, note: '1 s pause at the top.' },

  { day: 'Sun', name: 'Seated lateral raise', sets: 3, minReps: 12, maxReps: 20, restSec: 75, unit: 'kg', increment: 1, note: '' },
  { day: 'Sun', name: 'Seated supported curl', sets: 3, minReps: 8, maxReps: 12, restSec: 75, unit: 'kg', increment: 1, note: 'Preacher or seated barbell/dumbbell curl.', superset: true },
  { day: 'Sun', name: 'Seated overhead triceps extension', sets: 3, minReps: 10, maxReps: 15, restSec: 75, unit: 'kg', increment: 2.5, note: 'Rope, cable low.' },
  { day: 'Sun', ...SUN_BAYESIAN },
  { day: 'Sun', ...SUN_KICKBACK },
];

export const SEED: Exercise[] = rows.map((r) => ({
  ...r,
  superset: r.superset ?? false,
  order: rows.filter((x) => x.day === r.day).indexOf(r),
  active: true,
}));
