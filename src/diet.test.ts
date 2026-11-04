import { describe, expect, it } from 'vitest';
import { dinnerSuggestions, PHASES, RECIPES, SLOTS, totals } from './diet';

describe('diet', () => {
  it('has unique ids and every slot has options', () => {
    expect(new Set(RECIPES.map((r) => r.id)).size).toBe(RECIPES.length);
    for (const { slot } of SLOTS) expect(RECIPES.some((r) => r.slot === slot)).toBe(true);
    for (const r of RECIPES) {
      expect(r.ingredients.length).toBeGreaterThan(0);
      expect(r.steps.length).toBeGreaterThan(0);
    }
  });

  it('sums chosen meals and ignores unknown ids', () => {
    expect(totals(undefined)).toEqual({ kcal: 0, protein: 0 });
    expect(totals({ meals: { breakfast: 'protein-oats', snack: 'whey-shake', dinner: 'gone' } })).toEqual({ kcal: 935, protein: 77 });
  });

  it('scaled shared-plan meals give at least 38 g protein', () => {
    for (const id of ['sourdough-avo', 'tofu-rice-bowl', 'tofu-potato']) expect(totals({ meals: { lunch: id } }).protein).toBeGreaterThanOrEqual(38);
  });

  it('a typical arms day lands near target', () => {
    const t = totals({ meals: { breakfast: 'protein-oats', lunch: 'soya-pulao', snack: 'whey-shake', dinner: 'moong-chilla', sweet: 'shrikhand' } });
    expect(t.protein).toBeGreaterThanOrEqual(PHASES.arms.protein);
    expect(Math.abs(t.kcal - PHASES.arms.kcal)).toBeLessThan(200);
  });
});

describe('dinnerSuggestions', () => {
  it('keeps room for the shake and a sweet, and ranks a protein-covering dinner first', () => {
    const s = dinnerSuggestions({ meals: { breakfast: 'protein-oats', lunch: 'rajma-chawal' } }, PHASES.arms);
    // 2400 − 640 − 620 − 295 (shake) − 150 (sweet)
    expect(s.kcalLeft).toBe(695);
    // 140 − 43 − 27 − 34
    expect(s.proteinLeft).toBe(36);
    expect(s.fits[0].proteinShort).toBe(0);
    expect(s.fits[0].recipe.slot).toBe('dinner');
  });

  it('uses the ticked snack and sweet instead of reserving', () => {
    const s = dinnerSuggestions({ meals: { breakfast: 'egg-bhurji', lunch: 'tofu-rice-bowl', snack: 'yogurt-bowl', sweet: 'dark-choc', dinner: 'tikka' } }, PHASES.arms);
    expect(s.reservedShake).toBe(false);
    expect(s.kcalLeft).toBe(2400 - 550 - 672 - 512 - 120);
  });
});
