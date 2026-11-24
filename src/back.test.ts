import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';
import { CARDIO, SEED } from './seed';
import type { Day, Exercise } from './types';

const ex = (day: Day, name: string, order: number, extra: Partial<Exercise> = {}): Exercise => ({
  day, name, order, sets: 3, minReps: 8, maxReps: 12, restSec: 90, unit: 'kg', increment: 2.5, note: '', active: true, superset: false, ...extra,
});

const BACK = ['Deadlift', 'Seated cable row', 'Pull-up', 'Incline dumbbell curl', 'Seated hammer curl', 'Seated dumbbell shrug'];
const LEGS = ['Seated leg curl', 'Seated leg extension'];

describe('back day + cardio (v8)', () => {
  it('fresh installs get the new Wednesday and cardio on Tue and Sat', () => {
    const day = (d: Day) => SEED.filter((e) => e.day === d).sort((a, b) => a.order - b.order);
    expect(day('Wed').map((e) => e.name)).toEqual([...BACK, ...LEGS]);
    expect(day('Wed').map((e) => e.superset)).toEqual([false, false, false, false, true, false, true, false]);
    for (const d of ['Tue', 'Sat'] as Day[]) expect(day(d).at(-1)!.name).toBe(CARDIO.name);
    expect(SEED.filter((e) => e.name === CARDIO.name)).toHaveLength(2);
  });

  it('upgrading reorders Wednesday, keeps ids and extras, adds cardio', async () => {
    const old = new Dexie('gymo');
    old.version(7).stores({ exercises: '++id, day, order', sessions: '++id, date, day, finished', logs: '++id, sessionId, exerciseId, date', checkins: 'week', meta: 'key', diet: 'date' });
    await old.open();
    const t = old.table('exercises');
    const pull = await t.add(ex('Wed', 'Pull-up', 0));
    const row = await t.add(ex('Wed', 'Seated cable row', 1, { unit: 'lb' }));
    await t.add(ex('Wed', 'Incline dumbbell curl', 2, { superset: true }));
    await t.add(ex('Wed', 'Seated reverse fly', 3));
    await t.add(ex('Wed', 'Seated hammer curl', 4));
    await t.add(ex('Wed', 'My face pull', 5, { superset: true })); // user-added, dangling superset
    await t.add(ex('Wed', 'Seated leg curl', 6, { superset: true }));
    await t.add(ex('Wed', 'Seated leg extension', 7));
    await t.add(ex('Tue', 'Seated overhead triceps extension', 0, { superset: true }));
    await t.add(ex('Sat', 'Seated dumbbell shrug', 0));
    old.close();

    const { db, dayExercises } = await import('./db');
    await db.open();
    const wed = await dayExercises('Wed');
    expect(wed.map((e) => e.name)).toEqual([...BACK, 'My face pull', ...LEGS]);
    expect(wed.find((e) => e.name === 'Pull-up')!.id).toBe(pull);
    expect(wed.find((e) => e.name === 'Seated cable row')!.id).toBe(row);
    expect(wed.find((e) => e.name === 'Incline dumbbell curl')!.superset).toBe(false);
    expect(wed.find((e) => e.name === 'Seated hammer curl')!.superset).toBe(true);
    expect(wed.find((e) => e.name === 'My face pull')!.superset).toBe(false);
    expect(wed.find((e) => e.name === 'Seated leg curl')!.superset).toBe(true);
    const fly = (await db.exercises.where('day').equals('Wed').toArray()).find((e) => e.name === 'Seated reverse fly')!;
    expect(fly.active).toBe(false);

    const tue = await dayExercises('Tue');
    expect(tue.map((e) => e.name)).toEqual(['Seated overhead triceps extension', CARDIO.name]);
    expect(tue[0].superset).toBe(false);
    expect((await dayExercises('Sat')).at(-1)).toMatchObject({ name: CARDIO.name, unit: 'level', sets: 1 });
    db.close();
  });
});
