import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';
import { SEED } from './seed';
import type { Day, Exercise } from './types';

const ex = (day: Day, name: string, order: number, extra: Partial<Exercise> = {}): Exercise => ({
  day, name, order, sets: 3, minReps: 8, maxReps: 12, restSec: 90, unit: 'kg', increment: 2.5, note: '', active: true, superset: false, ...extra,
});

describe('leg block (v7)', () => {
  it('fresh installs get it at the end of Wed and Sun, paired correctly', () => {
    const day = (d: Day) => SEED.filter((e) => e.day === d).sort((a, b) => a.order - b.order);
    expect(day('Wed').slice(-2).map((e) => [e.name, e.superset])).toEqual([['Seated leg curl', true], ['Seated leg extension', false]]);
    expect(day('Sun').slice(-3).map((e) => [e.name, e.superset])).toEqual([
      ['Seated leg extension', true],
      ['Seated leg curl', false],
      ['Hip adduction machine', false],
    ]);
    expect(day('Wed').at(-3)!.superset).toBe(false);
    expect(day('Sun').at(-4)!.superset).toBe(false);
  });

  it('upgrading an existing phone appends it without touching the rest', async () => {
    const old = new Dexie('gymo');
    old.version(6).stores({ exercises: '++id, day, order', sessions: '++id, date, day, finished', logs: '++id, sessionId, exerciseId, date', checkins: 'week', meta: 'key', diet: 'date' });
    await old.open();
    await old.table('exercises').bulkAdd([
      ex('Wed', 'Pull-up', 0),
      ex('Wed', 'Old pulldown', 1, { active: false }),
      ex('Wed', 'Seated hammer curl', 2, { superset: true }), // dangling superset at the end
      ex('Sun', 'Chest-supported triceps kickback', 0),
      ex('Sun', 'seated leg curl', 1, { active: false, sets: 4 }), // older same-named row, with history
      ex('Thu', 'Seated dumbbell shrug', 0),
    ]);
    old.close();

    const { db, dayExercises } = await import('./db');
    await db.open();
    const names = async (d: Day) => (await dayExercises(d)).map((e) => e.name);

    // v8 then rebuilds Wednesday's back block ahead of the legs.
    expect((await names('Wed')).slice(-2)).toEqual(['Seated leg curl', 'Seated leg extension']);
    expect((await dayExercises('Wed')).at(-3)!.superset).toBe(false);
    expect(await names('Sun')).toEqual(['Chest-supported triceps kickback', 'Seated leg extension', 'Seated leg curl', 'Hip adduction machine']);
    // The old Sunday leg curl was reused (same id), not duplicated.
    const sunCurls = (await db.exercises.where('day').equals('Sun').toArray()).filter((e) => /leg curl/i.test(e.name));
    expect(sunCurls).toHaveLength(1);
    expect(sunCurls[0].sets).toBe(2);
    expect(await names('Thu')).toEqual(['Seated dumbbell shrug']);
    db.close();
  });
});
