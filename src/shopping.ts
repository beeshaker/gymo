import type { Recipe } from './diet';
import { DAYS, type Day, type Slot } from './types';

export type WeekPlan = Record<Day, Partial<Record<Slot, string>>>;

/** Default week. Editable on the Diet → Week screen; the shopping list follows it. */
export const DEFAULT_WEEK: WeekPlan = {
  Mon: { breakfast: 'protein-oats', lunch: 'soya-pulao', snack: 'whey-shake', dinner: 'tofu-potato', sweet: 'shrikhand' },
  Tue: { breakfast: 'egg-bhurji', lunch: 'paneer-bhurji', snack: 'whey-shake', dinner: 'tofu-potato', sweet: 'dark-choc' },
  Wed: { breakfast: 'protein-oats', lunch: 'dal-tofu', snack: 'whey-shake', dinner: 'moong-chilla', sweet: 'kalakand' },
  Thu: { breakfast: 'overnight-oats', lunch: 'rajma-chawal', snack: 'whey-shake', dinner: 'tofu-potato', sweet: 'banana-ice-cream' },
  Fri: { breakfast: 'egg-bhurji', lunch: 'soya-pulao', snack: 'whey-shake', dinner: 'soya-keema', sweet: 'dark-choc' },
  Sat: { breakfast: 'protein-oats', lunch: 'tofu-rice-bowl', snack: 'yogurt-bowl', dinner: 'tofu-potato' },
  Sun: { breakfast: 'egg-bhurji', lunch: 'paneer-bhurji', snack: 'whey-shake', dinner: 'tikka', sweet: 'shrikhand' },
};

type Unit = 'g' | 'ml' | 'pc' | 'slice';
type Cat = 'Protein & dairy' | 'Grains & dals' | 'Fruit & veg' | 'Other';

/** Everything that gets bought. `each` = grams per piece, to show "≈ 3 avocados". */
export const ITEMS: Record<string, { cat: Cat; unit: Unit; each?: number; plural?: string }> = {
  'Tofu (firm)': { cat: 'Protein & dairy', unit: 'g' },
  Paneer: { cat: 'Protein & dairy', unit: 'g' },
  Eggs: { cat: 'Protein & dairy', unit: 'pc' },
  'Milk (toned)': { cat: 'Protein & dairy', unit: 'ml' },
  Curd: { cat: 'Protein & dairy', unit: 'g' },
  'Greek yogurt / hung curd': { cat: 'Protein & dairy', unit: 'g' },
  'Whey protein': { cat: 'Protein & dairy', unit: 'g', each: 30, plural: 'scoops' },
  'Soya chunks': { cat: 'Protein & dairy', unit: 'g' },
  'Soya granules': { cat: 'Protein & dairy', unit: 'g' },

  'Rolled oats': { cat: 'Grains & dals', unit: 'g' },
  'Basmati / white rice': { cat: 'Grains & dals', unit: 'g' },
  'Atta (whole wheat)': { cat: 'Grains & dals', unit: 'g', each: 30, plural: 'rotis' },
  'Whole-wheat bread': { cat: 'Grains & dals', unit: 'slice' },
  Sourdough: { cat: 'Grains & dals', unit: 'g' },
  'Moong dal': { cat: 'Grains & dals', unit: 'g' },
  'Rajma or chole': { cat: 'Grains & dals', unit: 'g' },
  'Roasted chana': { cat: 'Grains & dals', unit: 'g' },
  'Chia seeds': { cat: 'Grains & dals', unit: 'g' },

  Banana: { cat: 'Fruit & veg', unit: 'pc' },
  Apple: { cat: 'Fruit & veg', unit: 'pc' },
  Avocado: { cat: 'Fruit & veg', unit: 'g', each: 150, plural: 'avocados' },
  Pineapple: { cat: 'Fruit & veg', unit: 'g' },
  Blueberries: { cat: 'Fruit & veg', unit: 'g' },
  Lemon: { cat: 'Fruit & veg', unit: 'pc' },
  Onion: { cat: 'Fruit & veg', unit: 'pc' },
  Tomato: { cat: 'Fruit & veg', unit: 'pc' },
  'Green chilli': { cat: 'Fruit & veg', unit: 'pc' },
  Capsicum: { cat: 'Fruit & veg', unit: 'pc' },
  Cucumber: { cat: 'Fruit & veg', unit: 'pc' },
  Potato: { cat: 'Fruit & veg', unit: 'g' },
  'Peas (frozen ok)': { cat: 'Fruit & veg', unit: 'g' },
  Carrot: { cat: 'Fruit & veg', unit: 'g' },
  'Mixed non-starchy veg': { cat: 'Fruit & veg', unit: 'g' },
  'Moong sprouts': { cat: 'Fruit & veg', unit: 'g' },
  'Coriander / mint': { cat: 'Fruit & veg', unit: 'pc', plural: 'bunches' },

  'Peanut butter': { cat: 'Other', unit: 'g' },
  'Almond butter': { cat: 'Other', unit: 'g' },
  Pistachios: { cat: 'Other', unit: 'g' },
  'Dark chocolate 70%': { cat: 'Other', unit: 'g' },
};

/** What one serving needs from the shop. Spices, oil, honey etc. live in PANTRY. */
export const SHOP: Record<string, [item: string, qty: number][]> = {
  'protein-oats': [['Rolled oats', 60], ['Milk (toned)', 250], ['Whey protein', 30], ['Banana', 1], ['Peanut butter', 10]],
  'egg-bhurji': [['Eggs', 5], ['Onion', 0.5], ['Tomato', 0.5], ['Green chilli', 1], ['Whole-wheat bread', 2], ['Milk (toned)', 200]],
  'overnight-oats': [['Rolled oats', 50], ['Curd', 150], ['Milk (toned)', 100], ['Whey protein', 30], ['Chia seeds', 5], ['Apple', 1]],
  'sourdough-avo': [['Sourdough', 175], ['Avocado', 60], ['Mixed non-starchy veg', 100], ['Whey protein', 40], ['Banana', 1]],

  'soya-pulao': [['Soya chunks', 50], ['Basmati / white rice', 60], ['Peas (frozen ok)', 50], ['Carrot', 50], ['Onion', 1], ['Curd', 200], ['Cucumber', 0.5]],
  'paneer-bhurji': [['Paneer', 120], ['Onion', 1], ['Tomato', 1], ['Capsicum', 0.5], ['Atta (whole wheat)', 60], ['Curd', 150]],
  'rajma-chawal': [['Rajma or chole', 70], ['Onion', 1], ['Tomato', 2], ['Basmati / white rice', 60], ['Curd', 200]],
  'dal-tofu': [['Moong dal', 40], ['Tofu (firm)', 150], ['Peas (frozen ok)', 50], ['Onion', 1], ['Tomato', 1], ['Atta (whole wheat)', 60]],
  'tofu-rice-bowl': [['Tofu (firm)', 200], ['Basmati / white rice', 70], ['Mixed non-starchy veg', 150], ['Avocado', 40], ['Pineapple', 100], ['Whey protein', 20]],

  'whey-shake': [['Whey protein', 30], ['Milk (toned)', 300]],
  'sprouts-chaat': [['Moong sprouts', 100], ['Paneer', 50], ['Onion', 0.5], ['Tomato', 0.5], ['Lemon', 0.5]],
  'chana-fruit': [['Roasted chana', 40], ['Apple', 1]],
  'yogurt-bowl': [['Greek yogurt / hung curd', 250], ['Whey protein', 20], ['Blueberries', 100], ['Almond butter', 15]],

  'tofu-potato': [['Tofu (firm)', 200], ['Potato', 300], ['Mixed non-starchy veg', 150], ['Banana', 1], ['Whey protein', 20]],
  'moong-chilla': [['Moong dal', 80], ['Paneer', 60], ['Onion', 0.5], ['Green chilli', 1], ['Curd', 100], ['Coriander / mint', 0.25]],
  'soya-keema': [['Soya granules', 50], ['Onion', 1], ['Tomato', 1], ['Peas (frozen ok)', 50], ['Atta (whole wheat)', 60]],
  tikka: [['Tofu (firm)', 150], ['Greek yogurt / hung curd', 50], ['Atta (whole wheat)', 30], ['Cucumber', 0.5], ['Onion', 0.5], ['Tomato', 0.5], ['Lemon', 0.5]],
  'egg-curry': [['Eggs', 3], ['Onion', 1], ['Tomato', 2], ['Atta (whole wheat)', 60]],

  shrikhand: [['Greek yogurt / hung curd', 200], ['Pistachios', 5]],
  'choc-mousse': [['Whey protein', 30], ['Greek yogurt / hung curd', 150]],
  kalakand: [['Paneer', 100], ['Milk (toned)', 50]],
  'banana-ice-cream': [['Banana', 1], ['Milk (toned)', 30]],
  'dark-choc': [['Dark chocolate 70%', 20]],
};

export const PANTRY = [
  'Oil, ghee, olive oil',
  'Salt, turmeric, red chilli, jeera, garam masala, chaat masala',
  'Rajma/chole masala, tikka masala',
  'Ginger-garlic paste',
  'Soy sauce',
  'Honey, jaggery powder',
  'Cocoa, cinnamon, elaichi, saffron',
];

export const CATS: Cat[] = ['Protein & dairy', 'Grains & dals', 'Fruit & veg', 'Other'];

export interface ShopLine {
  item: string;
  cat: Cat;
  qty: number;
  label: string;
}

const round = (n: number, to: number) => Math.ceil(n / to) * to;

export function formatQty(item: string, qty: number): string {
  const { unit, each, plural } = ITEMS[item];
  if (item === 'Coriander / mint') return `${Math.ceil(qty)} ${Math.ceil(qty) === 1 ? 'bunch' : 'bunches'}`;
  if (unit === 'pc') return `${Math.ceil(qty)}`;
  if (unit === 'slice') return `${Math.ceil(qty)} slices`;
  let main: string;
  if (unit === 'ml') {
    const v = round(qty, 50);
    main = v >= 1000 ? `${Math.ceil(v / 100) / 10} L` : `${v} ml`;
  } else {
    const v = round(qty, qty >= 200 ? 50 : 10);
    main = v >= 1000 ? `${(v / 1000).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')} kg` : `${v} g`;
  }
  if (each && plural) {
    const n = Math.ceil(qty / each);
    main += ` (≈ ${n} ${n === 1 ? plural.replace(/s$/, '') : plural})`;
  }
  return main;
}

/** Sum every planned serving in the week into one list, grouped by category. */
export function shoppingList(week: WeekPlan): ShopLine[] {
  const sums = new Map<string, number>();
  for (const day of DAYS) {
    for (const id of Object.values(week[day] ?? {})) {
      for (const [item, qty] of SHOP[id] ?? []) sums.set(item, (sums.get(item) ?? 0) + qty);
    }
  }
  return [...sums]
    .map(([item, qty]) => ({ item, cat: ITEMS[item].cat, qty, label: formatQty(item, qty) }))
    .sort((a, b) => CATS.indexOf(a.cat) - CATS.indexOf(b.cat) || a.item.localeCompare(b.item));
}

export function shoppingText(list: ShopLine[]): string {
  const out = ['*Shopping list for the week*'];
  for (const cat of CATS) {
    const lines = list.filter((l) => l.cat === cat);
    if (!lines.length) continue;
    out.push('', `*${cat}*`, ...lines.map((l) => `• ${l.item}: ${l.label}`));
  }
  out.push('', '*Check the pantry*', ...PANTRY.map((p) => `• ${p}`));
  return out.join('\n');
}

export function recipeText(r: Recipe): string {
  return [
    `*${r.name}*`,
    `${r.kcal} kcal · ${r.protein} g protein`,
    '',
    '*Ingredients*',
    ...r.ingredients.map((x) => `• ${x}`),
    '',
    '*Steps*',
    ...r.steps.map((x, i) => `${i + 1}. ${x}`),
    ...(r.note ? ['', r.note] : []),
  ].join('\n');
}

/** Opens WhatsApp (the app on a phone, WhatsApp Web on a computer) with the text ready to send. */
export function shareOnWhatsApp(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}
