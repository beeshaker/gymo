import type { Exercise } from './types';

// From the "Plan" sheet of Gym_Progress_Tracker.xlsx.
// Rest: "2–3 min" → 150s, "2 min" → 120s, "60–90 sec" → 75s.
// Units and increments are best guesses — edit them in Settings to match your gym.
type Row = Omit<Exercise, 'id' | 'order' | 'active'>;

const rows: Row[] = [
  { day: 'Tue', name: 'Bench / supported chest press', sets: 3, minReps: 6, maxReps: 8, restSec: 150, unit: 'kg', increment: 2.5, note: 'Use machine if bench setup loads toe. No leg drive.' },
  { day: 'Tue', name: 'Incline supported press', sets: 3, minReps: 8, maxReps: 12, restSec: 120, unit: 'kg', increment: 2, note: 'Pick a load allowing all 3 work sets in range.' },
  { day: 'Tue', name: 'Seated triceps pushdown', sets: 2, minReps: 10, maxReps: 15, restSec: 75, unit: 'kg', increment: 2.5, note: 'Only if seated setup is stable.' },
  { day: 'Tue', name: 'Seated overhead triceps extension', sets: 2, minReps: 10, maxReps: 15, restSec: 75, unit: 'kg', increment: 2.5, note: 'Skip if positioning creates toe pressure.' },

  { day: 'Wed', name: 'Seated lat pulldown', sets: 3, minReps: 6, maxReps: 10, restSec: 150, unit: 'lb', increment: 5, note: 'Replaces pull-ups while landing/stepping is unsafe.' },
  { day: 'Wed', name: 'Chest-supported row', sets: 3, minReps: 8, maxReps: 12, restSec: 120, unit: 'kg', increment: 2.5, note: 'Replaces bent-over and KB rows.' },
  { day: 'Wed', name: 'Seated reverse fly', sets: 2, minReps: 12, maxReps: 20, restSec: 75, unit: 'kg', increment: 1, note: 'Rear delts.' },
  { day: 'Wed', name: 'Seated dumbbell curl', sets: 2, minReps: 8, maxReps: 12, restSec: 75, unit: 'kg', increment: 1, note: 'Dumbbell weight per hand.' },

  { day: 'Thu', name: 'Seated machine shoulder press', sets: 3, minReps: 8, maxReps: 12, restSec: 120, unit: 'kg', increment: 2.5, note: 'Replaces KB circuit.' },
  { day: 'Thu', name: 'Seated lateral raise', sets: 3, minReps: 12, maxReps: 20, restSec: 75, unit: 'kg', increment: 1, note: 'Strict form. Dumbbell per hand.' },
  { day: 'Thu', name: 'Seated supported curl', sets: 2, minReps: 10, maxReps: 15, restSec: 75, unit: 'kg', increment: 1, note: 'Omit if sore or performance falls.' },
  { day: 'Thu', name: 'Seated triceps pushdown', sets: 2, minReps: 10, maxReps: 15, restSec: 75, unit: 'kg', increment: 2.5, note: 'Can alternate with curls to save time.' },

  { day: 'Sat', name: 'Supported chest press', sets: 3, minReps: 8, maxReps: 12, restSec: 120, unit: 'kg', increment: 2.5, note: 'No need to fill every minute.' },
  { day: 'Sat', name: 'Chest-supported row', sets: 3, minReps: 8, maxReps: 12, restSec: 120, unit: 'kg', increment: 2.5, note: 'May alternate press and row with adequate rest.' },
  { day: 'Sat', name: 'Seated lat pulldown', sets: 2, minReps: 10, maxReps: 15, restSec: 120, unit: 'lb', increment: 5, note: 'Use same machine each week.' },
  { day: 'Sat', name: 'Pec deck', sets: 2, minReps: 12, maxReps: 15, restSec: 75, unit: 'kg', increment: 2.5, note: 'Replaces standing cable fly combinations.' },
  { day: 'Sat', name: 'Seated reverse fly', sets: 2, minReps: 12, maxReps: 20, restSec: 75, unit: 'kg', increment: 1, note: 'Keep 1–2 RIR.' },

  { day: 'Sun', name: 'Seated lateral raise', sets: 3, minReps: 12, maxReps: 20, restSec: 75, unit: 'kg', increment: 1, note: 'Lighter session.' },
  { day: 'Sun', name: 'Seated supported curl', sets: 3, minReps: 10, maxReps: 15, restSec: 75, unit: 'kg', increment: 1, note: 'One consistent load across work sets.' },
  { day: 'Sun', name: 'Seated hammer curl', sets: 2, minReps: 10, maxReps: 15, restSec: 75, unit: 'kg', increment: 1, note: 'Optional if elbows/forearms are tired.' },
  { day: 'Sun', name: 'Seated overhead triceps extension', sets: 3, minReps: 10, maxReps: 15, restSec: 75, unit: 'kg', increment: 2.5, note: 'Alternate with curls if comfortable.' },
];

export const SEED: Exercise[] = rows.map((r) => ({
  ...r,
  order: rows.filter((x) => x.day === r.day).indexOf(r),
  active: true,
}));
