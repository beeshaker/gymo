import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { dayExercises, db, moveToDay, renumber, savePlanOrder } from './db';
import type { Day, Exercise } from './types';

const ex = (day: Day, name: string, order: number, extra: Partial<Exercise> = {}): Exercise => ({
  day, name, order, sets: 3, minReps: 8, maxReps: 12, restSec: 90, unit: 'kg', increment: 2.5, note: '', active: true, superset: false, ...extra,
});

const names = async (day: Day) => (await dayExercises(day)).map((e) => e.name);
const id = async (name: string) => (await db.exercises.filter((e) => e.name === name).first())!.id!;

beforeEach(async () => {
  await db.exercises.clear();
});

describe('exercise order', () => {
  it('renumber clears ties and fractions', async () => {
    await db.exercises.bulkAdd([ex('Tue', 'A', 1), ex('Tue', 'B', 1), ex('Tue', 'C', 0.5)]);
    const list = (await db.exercises.where('day').equals('Tue').toArray()).sort((a, b) => a.order - b.order || a.id! - b.id!);
    await renumber(list);
    expect((await dayExercises('Tue')).map((e) => [e.name, e.order])).toEqual([['C', 0], ['A', 1], ['B', 2]]);
  });

  it('savePlanOrder follows the session and leaves hidden and skipped exercises in their slots', async () => {
    await db.exercises.bulkAdd([
      ex('Wed', 'A', 0),
      ex('Wed', 'Hidden', 1, { active: false }),
      ex('Wed', 'B', 2),
      ex('Wed', 'Skipped today', 3),
      ex('Wed', 'C', 4),
      ex('Thu', 'Other day', 0),
    ]);
    // Today: C, Other day (today-only from Thursday), A, B — "Skipped today" was removed.
    const plan = await Promise.all(['C', 'Other day', 'A', 'B'].map(async (n) => ({ exerciseId: await id(n), sets: 3 })));
    await savePlanOrder('Wed', plan);
    const all = (await db.exercises.where('day').equals('Wed').toArray()).sort((a, b) => a.order - b.order);
    expect(all.map((e) => e.name)).toEqual(['C', 'Hidden', 'A', 'Skipped today', 'B']);
    expect(all.map((e) => e.order)).toEqual([0, 1, 2, 3, 4]);
    expect(await names('Thu')).toEqual(['Other day']);
  });

  it('moveToDay appends to the new day, keeps the id and unhooks a superset into it', async () => {
    await db.exercises.bulkAdd([
      ex('Thu', 'Curl', 0, { superset: true }),
      ex('Thu', 'Pushdown', 1, { superset: true }),
      ex('Thu', 'Shrug', 2),
      ex('Sun', 'Raise', 0),
    ]);
    const pushdown = await id('Pushdown');
    await moveToDay(pushdown, 'Sun');
    expect(await names('Thu')).toEqual(['Curl', 'Shrug']);
    expect(await names('Sun')).toEqual(['Raise', 'Pushdown']);
    const moved = (await db.exercises.get(pushdown))!;
    expect(moved.superset).toBe(false);
    expect((await db.exercises.get(await id('Curl')))!.superset).toBe(false);
  });
});
