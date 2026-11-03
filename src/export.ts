import { db, getStartDate, openSessionIds, weekOf } from './db';
import { decide } from './progression';
import type { Checkin, Exercise, ExerciseLog, Meta, Session } from './types';

interface Backup {
  app: 'gymo';
  version: 1;
  exportedAt: string;
  exercises: Exercise[];
  sessions: Session[];
  logs: ExerciseLog[];
  checkins: Checkin[];
  meta: Meta[];
}

export function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportJSON(): Promise<string> {
  const backup: Backup = {
    app: 'gymo',
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises: await db.exercises.toArray(),
    sessions: await db.sessions.toArray(),
    logs: await db.logs.toArray(),
    checkins: await db.checkins.toArray(),
    meta: await db.meta.toArray(),
  };
  return JSON.stringify(backup, null, 2);
}

export async function importJSON(text: string) {
  const b = JSON.parse(text) as Backup;
  if (b.app !== 'gymo' || !Array.isArray(b.exercises) || !Array.isArray(b.logs)) {
    throw new Error('Not a Gymo backup file');
  }
  await db.transaction('rw', [db.exercises, db.sessions, db.logs, db.checkins, db.meta], async () => {
    await Promise.all([db.exercises.clear(), db.sessions.clear(), db.logs.clear(), db.checkins.clear(), db.meta.clear()]);
    await db.exercises.bulkAdd(b.exercises);
    await db.sessions.bulkAdd(b.sessions ?? []);
    await db.logs.bulkAdd(b.logs);
    await db.checkins.bulkAdd(b.checkins ?? []);
    await db.meta.bulkAdd(b.meta ?? []);
  });
}

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Same columns as the spreadsheet's "Workout log" sheet. */
export async function exportCSV(): Promise<string> {
  const exercises = new Map((await db.exercises.toArray()).map((e) => [e.id!, e]));
  const open = await openSessionIds();
  const logs = (await db.logs.toArray())
    .filter((l) => !open.has(l.sessionId))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id! - b.id!);
  const start = await getStartDate();
  const header = ['Week', 'Date', 'Day / exercise', 'Sets', 'Min', 'Max', 'Load', 'Unit', 'Set 1', 'Set 2', 'Set 3', 'RIR', 'Toe response', 'Total reps', 'Decision', 'Notes / machine'];
  const rows = [header];
  const seen = new Map<number, ExerciseLog[]>();
  for (const l of logs) {
    const ex = exercises.get(l.exerciseId);
    const prior = seen.get(l.exerciseId) ?? [];
    prior.push(l);
    seen.set(l.exerciseId, prior);
    if (!ex) continue;
    const d = decide(ex, prior);
    rows.push([
      String(weekOf(l.date, start)),
      l.date,
      `${ex.day}: ${ex.name}`,
      String(ex.sets),
      String(ex.minReps),
      String(ex.maxReps),
      String(l.load),
      l.unit,
      ...[0, 1, 2].map((i) => (l.reps[i] ?? '').toString()),
      l.rir === null ? '' : String(l.rir),
      l.toe ?? '',
      String(l.reps.reduce((a, b) => a + b, 0)),
      l.deload ? 'Lighter week' : d.label,
      [l.notes, l.reps.length > 3 ? `extra sets: ${l.reps.slice(3).join('/')}` : ''].filter(Boolean).join('; '),
    ]);
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\n');
}
