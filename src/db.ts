import Dexie, { type EntityTable } from 'dexie';
import { SEED } from './seed';
import type { Checkin, Day, Exercise, ExerciseLog, Meta, Session, SessionItem } from './types';
import { DAYS } from './types';

class GymoDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>;
  sessions!: EntityTable<Session, 'id'>;
  logs!: EntityTable<ExerciseLog, 'id'>;
  checkins!: EntityTable<Checkin, 'week'>;
  meta!: EntityTable<Meta, 'key'>;

  constructor() {
    super('gymo');
    this.version(1).stores({
      exercises: '++id, day, order',
      sessions: '++id, date, day, finished',
      logs: '++id, sessionId, exerciseId, date',
      checkins: 'week',
      meta: 'key',
    });
    // v2: arm-priority plan. Keep ids (and history) for exercises that match by
    // day + name; hide replaced ones that have logs, delete the rest.
    this.version(2)
      .stores({})
      .upgrade(async (tx) => {
        const table = tx.table<Exercise, number>('exercises');
        const logged = new Set((await tx.table<ExerciseLog>('logs').toArray()).map((l) => l.exerciseId));
        const key = (e: Exercise) => `${e.day}|${e.name}`;
        const seeds = new Map(SEED.map((s) => [key(s), s]));
        for (const ex of await table.toArray()) {
          const s = seeds.get(key(ex));
          if (s) {
            const { sets, minReps, maxReps, restSec, note, order, superset } = s;
            await table.update(ex.id!, { sets, minReps, maxReps, restSec, note, order, superset, active: true });
            seeds.delete(key(ex));
          } else if (logged.has(ex.id!)) {
            await table.update(ex.id!, { active: false, superset: false });
          } else {
            await table.delete(ex.id!);
          }
        }
        await table.bulkAdd([...seeds.values()]);
      });
    this.on('populate', (tx) => {
      tx.table('exercises').bulkAdd(SEED);
    });
  }
}

export const db = new GymoDB();

export const todayISO = () => new Date().toLocaleDateString('en-CA');
export const dayOf = (iso: string): Day => DAYS[(new Date(iso + 'T12:00').getDay() + 6) % 7];

export async function dayExercises(day: Day): Promise<Exercise[]> {
  const list = await db.exercises.where('day').equals(day).toArray();
  return list.filter((e) => e.active).sort((a, b) => a.order - b.order);
}

/**
 * Past logs for one exercise, oldest first. Same-named exercises on different
 * days (e.g. pulldown Wed 6–10 vs Sat 10–15) are tracked separately by id.
 */
export async function history(exerciseId: number, excludeSessionId?: number): Promise<ExerciseLog[]> {
  const logs = await db.logs.where('exerciseId').equals(exerciseId).toArray();
  const open = await openSessionIds();
  return logs
    .filter((l) => l.sessionId !== excludeSessionId && !open.has(l.sessionId))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id! - b.id!);
}

/** Sessions still in progress — their partial logs are excluded from history. */
export async function openSessionIds(): Promise<Set<number>> {
  return new Set((await db.sessions.filter((s) => !s.finished).primaryKeys()) as number[]);
}

export async function getStartDate(): Promise<string | undefined> {
  return (await db.meta.get('startDate'))?.value as string | undefined;
}

/** Program week (1-based) counted from the Monday of the start date. */
export function weekOf(iso: string, start: string | undefined): number {
  if (!start) return 1;
  const s = new Date(start + 'T12:00');
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
  const days = Math.round((new Date(iso + 'T12:00').getTime() - s.getTime()) / 86400000);
  return Math.max(1, Math.floor(days / 7) + 1);
}

export const planFor = (exs: Exercise[], deload: boolean): SessionItem[] =>
  exs.map((e) => ({ exerciseId: e.id!, sets: deload ? Math.ceil(e.sets / 2) : e.sets }));

export async function startSession(day: Day, deload: boolean): Promise<number> {
  const date = todayISO();
  if (!(await getStartDate())) await db.meta.put({ key: 'startDate', value: date });
  const plan = planFor(await dayExercises(day), deload);
  return db.sessions.add({ date, day, deload, finished: false, startedAt: Date.now(), plan }) as Promise<number>;
}

/** Add an exercise to the library (hidden from the plan unless `active`). */
export async function createExercise(day: Day, name: string, active: boolean): Promise<Exercise> {
  const order = Math.max(-1, ...(await db.exercises.where('day').equals(day).toArray()).map((e) => e.order)) + 1;
  const ex: Exercise = { day, order, name, sets: 3, minReps: 8, maxReps: 12, restSec: 90, unit: 'kg', increment: 2.5, note: '', active, superset: false };
  ex.id = (await db.exercises.add(ex)) as number;
  return ex;
}

export async function activeSession(): Promise<Session | undefined> {
  const open = await db.sessions.filter((s) => !s.finished).toArray();
  return open.sort((a, b) => b.startedAt - a.startedAt)[0];
}

export async function saveLog(log: ExerciseLog): Promise<number> {
  const existing = await db.logs
    .where('sessionId')
    .equals(log.sessionId)
    .filter((l) => l.exerciseId === log.exerciseId)
    .first();
  if (existing) {
    await db.logs.put({ ...log, id: existing.id });
    return existing.id!;
  }
  return db.logs.add(log) as Promise<number>;
}

export async function finishSession(id: number) {
  await db.transaction('rw', db.sessions, db.logs, async () => {
    // Drop exercises that were opened but never logged.
    await db.logs.where('sessionId').equals(id).filter((l) => l.reps.length === 0).delete();
    const count = await db.logs.where('sessionId').equals(id).count();
    if (count === 0) await db.sessions.delete(id);
    else await db.sessions.update(id, { finished: true });
  });
}
