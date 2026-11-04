import { describe, expect, it } from 'vitest';
import { RECIPES, SLOTS, recipe } from './diet';
import { DEFAULT_WEEK, formatQty, ITEMS, recipeText, SHOP, shoppingList, shoppingText, type WeekPlan } from './shopping';
import { DAYS } from './types';

describe('shopping', () => {
  it('every recipe has a shop list made of known items', () => {
    for (const r of RECIPES) {
      expect(SHOP[r.id], r.id).toBeDefined();
      for (const [item] of SHOP[r.id]) expect(ITEMS[item], `${r.id}: ${item}`).toBeDefined();
    }
  });

  it('default week uses real recipes in the right slots', () => {
    for (const d of DAYS) {
      for (const { slot } of SLOTS) {
        const id = DEFAULT_WEEK[d][slot];
        if (id) expect(recipe(id)?.slot, `${d} ${slot}`).toBe(slot);
      }
    }
  });

  it('adds up servings across the week', () => {
    const empty = Object.fromEntries(DAYS.map((d) => [d, {}])) as WeekPlan;
    const week: WeekPlan = { ...empty, Mon: { dinner: 'tofu-potato' }, Tue: { dinner: 'tofu-potato', lunch: 'dal-tofu' } };
    const tofu = shoppingList(week).find((l) => l.item === 'Tofu (firm)')!;
    expect(tofu.qty).toBe(550);
    expect(tofu.label).toBe('550 g');
  });

  it('changing the plan changes the list', () => {
    const swapped: WeekPlan = { ...DEFAULT_WEEK, Mon: { ...DEFAULT_WEEK.Mon, dinner: 'egg-curry' } };
    const qty = (w: WeekPlan, item: string) => shoppingList(w).find((l) => l.item === item)?.qty ?? 0;
    expect(qty(swapped, 'Tofu (firm)')).toBe(qty(DEFAULT_WEEK, 'Tofu (firm)') - 200);
    expect(qty(swapped, 'Eggs')).toBe(qty(DEFAULT_WEEK, 'Eggs') + 3);
  });

  it('formats quantities for buying', () => {
    expect(formatQty('Milk (toned)', 2130)).toBe('2.2 L');
    expect(formatQty('Onion', 6.5)).toBe('7');
    expect(formatQty('Avocado', 100)).toBe('100 g (≈ 1 avocado)');
    expect(formatQty('Whey protein', 640)).toBe('650 g (≈ 22 scoops)');
  });

  it('builds WhatsApp text', () => {
    expect(recipeText(recipe('tofu-potato')!)).toContain('*Masala tofu + roast potatoes*');
    expect(shoppingText(shoppingList(DEFAULT_WEEK))).toMatch(/\*Protein & dairy\*\n• /);
  });
});
