import { describe, expect, it } from 'vitest';
import { decide, hitTop, type Entry, type Rx } from './progression';

const rx: Rx = { sets: 3, minReps: 8, maxReps: 12, increment: 2.5, unit: 'kg' };
const e = (load: number, reps: number[], rir: number | null = 2, extra: Partial<Entry> = {}): Entry => ({
  load, reps, rir, toe: 'none', deload: false, ...extra,
});

describe('decide', () => {
  it('starts at the bottom of the range with no history', () => {
    const d = decide(rx, []);
    expect(d.kind).toBe('start');
    expect(d.load).toBeNull();
    expect(d.reps).toEqual([8, 8, 8]);
  });

  it('builds reps on the weakest set at the same load', () => {
    const d = decide(rx, [e(20, [10, 9, 8])]);
    expect(d.kind).toBe('build');
    expect(d.load).toBe(20);
    expect(d.reps).toEqual([10, 9, 9]);
  });

  it('asks to repeat after the first top-range session', () => {
    const d = decide(rx, [e(20, [11, 11, 10]), e(20, [12, 12, 12])]);
    expect(d.kind).toBe('confirm');
    expect(d.load).toBe(20);
  });

  it('increases after two top-range sessions at the same load', () => {
    const d = decide(rx, [e(20, [12, 12, 12]), e(20, [12, 12, 12])]);
    expect(d.kind).toBe('increase');
    expect(d.load).toBe(22.5);
    expect(d.reps).toEqual([8, 8, 8]);
  });

  it('does not count top-range sets taken to failure', () => {
    expect(hitTop(rx, e(20, [12, 12, 12], 0))).toBe(false);
    expect(decide(rx, [e(20, [12, 12, 12], 0), e(20, [12, 12, 12], 0)]).kind).not.toBe('increase');
  });

  it('does not count a top-range session at a different load', () => {
    const d = decide(rx, [e(17.5, [12, 12, 12]), e(20, [12, 12, 12])]);
    expect(d.kind).toBe('confirm');
  });

  it('stops when the toe got worse', () => {
    expect(decide(rx, [e(20, [12, 12, 12], 2, { toe: 'worse' })]).kind).toBe('stop');
  });

  it('flags a stall after three sessions at the same load with no rep gain', () => {
    const d = decide(rx, [e(20, [10, 9, 8]), e(20, [10, 9, 8]), e(20, [9, 9, 8])]);
    expect(d.kind).toBe('stalled');
  });

  it('suggests dropping load when every set is below range', () => {
    const d = decide(rx, [e(25, [7, 6, 5])]);
    expect(d.kind).toBe('reduce');
    expect(d.load).toBe(22.5);
  });

  it('ignores deload sessions', () => {
    const d = decide(rx, [e(20, [12, 12, 12]), e(20, [12, 12], 3, { deload: true }), e(20, [12, 12, 12])]);
    expect(d.kind).toBe('increase');
  });
});
