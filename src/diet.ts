import type { DietDay, DietPhase, Slot } from './types';

// Vegetarian (eggs, dairy, whey, soya OK) Indian home-style plan for a 32 y/o
// male, 71 kg, 169 cm. Mifflin-St Jeor BMR ≈ 1,610 kcal; maintenance ≈ 2,340
// at ×1.45. Values are approximate, toned milk throughout.

export interface Recipe {
  id: string;
  slot: Slot;
  name: string;
  kcal: number;
  protein: number;
  ingredients: string[];
  steps: string[];
  note?: string;
}

export interface Phase {
  label: string;
  kcal: number;
  protein: number;
  waterGlasses: number;
  note: string;
}

export const PHASES: Record<DietPhase, Phase> = {
  arms: {
    label: 'Arms phase',
    kcal: 2300,
    protein: 140,
    waterGlasses: 12,
    note: 'Maintenance (recomp): at ~21% body fat, eat at maintenance with high protein. Arms grow while fat slowly drops, which makes the cut shorter. Weight should hold roughly steady; waist steady or down, arm up.',
  },
  cut: {
    label: 'Six-pack cut',
    kcal: 1850,
    protein: 145,
    waterGlasses: 13,
    note: 'Long-term goal: 70 kg at 11% (≈62 kg lean, so ~6 kg more muscle than now). This cut: ~21% → 12–13%, about 71 → 64–65 kg, at ~0.5 kg/week, so ~14–16 weeks. After it, lean bulk (+200 kcal, ~0.25–0.5 kg/month) to ~72–73 kg, then a 6–8 week mini-cut to 70 kg at 11%. Walk 8–10k steps a day. Drop 1 roti or half the rice at lunch and dinner; sweets ≤ 100 kcal; protein stays high to keep the arm muscle. If the weekly average weight stalls 2 weeks in a row, cut another 100–150 kcal or add 2k steps. Take a diet break at maintenance for a week every 8–10 weeks.',
  },
};

export const SLOTS: { slot: Slot; label: string; hint: string }[] = [
  { slot: 'breakfast', label: 'Breakfast', hint: 'Oats or eggs' },
  { slot: 'lunch', label: 'Lunch', hint: '' },
  { slot: 'snack', label: 'Post-workout / evening', hint: 'The shake, daily, rest days too' },
  { slot: 'dinner', label: 'Dinner', hint: '' },
  { slot: 'sweet', label: 'Sweet tooth', hint: 'One, after dinner, ≤ 200 kcal' },
];

export const RECIPES: Recipe[] = [
  // Breakfast
  {
    id: 'protein-oats',
    slot: 'breakfast',
    name: 'Protein oats',
    kcal: 640,
    protein: 43,
    ingredients: ['60 g rolled oats', '250 ml milk', '1 scoop whey (30 g)', '1 banana, sliced', '10 g peanut butter (2 tsp)', 'Pinch of cinnamon'],
    steps: [
      'Simmer oats in milk 4–5 min, stirring.',
      'Off the heat, cool 1 min, then stir in the whey (boiling makes it clump).',
      'Top with banana, peanut butter and cinnamon.',
    ],
  },
  {
    id: 'egg-bhurji',
    slot: 'breakfast',
    name: 'Egg bhurji + toast',
    kcal: 550,
    protein: 37,
    ingredients: ['3 whole eggs + 2 egg whites', '1 tsp oil', '½ onion, ½ tomato, 1 green chilli, chopped', 'Salt, turmeric, pepper', '2 slices whole-wheat bread', '200 ml milk'],
    steps: [
      'Heat oil, sauté onion, tomato and chilli 2 min.',
      'Add eggs with salt, turmeric and pepper; scramble on low until just set.',
      'Serve with toast and a glass of milk.',
    ],
  },
  {
    id: 'overnight-oats',
    slot: 'breakfast',
    name: 'Overnight oats (no-cook)',
    kcal: 520,
    protein: 42,
    ingredients: ['50 g rolled oats', '150 g curd', '100 ml milk', '1 scoop whey (30 g)', '1 tsp chia seeds', 'Chopped apple or berries'],
    steps: ['Mix everything in a jar at night.', 'Refrigerate; eat cold in the morning.'],
  },

  {
    id: 'sourdough-avo',
    slot: 'breakfast',
    name: 'Sourdough avocado toast + whey-banana shake',
    kcal: 556,
    protein: 38,
    ingredients: [
      '175 g sourdough (theirs: 125 g)',
      '60 g avocado (theirs: 75 g)',
      '100 g non-starchy veg: tomato, cucumber, spinach (same)',
      '40 g whey, 1⅓ scoop (theirs: 25 g)',
      '100 g banana (theirs: 75 g)',
    ],
    steps: [
      'Toast the bread, mash the avocado on top with salt, pepper and chilli flakes.',
      'Veg on the side or on the toast.',
      'Blend the whey and banana with 250 ml water.',
    ],
    note: 'Their Meal 1, scaled for you: theirs is 455 kcal, 25 g protein.',
  },
  // Lunch
  {
    id: 'soya-pulao',
    slot: 'lunch',
    name: 'Soya chunk pulao + raita',
    kcal: 600,
    protein: 40,
    ingredients: ['50 g soya chunks (dry)', '60 g basmati rice (dry)', '100 g peas + carrot', '1 tsp ghee', '1 onion, 1 tsp ginger-garlic paste, 1 tsp cumin', '½ tsp garam masala, salt', 'Raita: 200 g curd, ½ cucumber grated, roasted jeera'],
    steps: [
      'Soak soya in hot salted water 10 min, squeeze dry.',
      'Heat ghee in a cooker, crackle cumin, fry onion till golden, add ginger-garlic.',
      'Add soya, veg, garam masala, rinsed rice and 120 ml water (2×). Salt.',
      'Pressure cook 2 whistles. Mix the raita while it cools.',
    ],
  },
  {
    id: 'paneer-bhurji',
    slot: 'lunch',
    name: 'Paneer bhurji + 2 rotis + curd',
    kcal: 665,
    protein: 34,
    ingredients: ['120 g paneer, crumbled', '1 onion, 1 tomato, ½ capsicum, chopped', '1 tsp oil', 'Turmeric, red chilli, ½ tsp garam masala, salt', '2 rotis (60 g atta)', '150 g curd'],
    steps: [
      'Sauté onion in oil 2 min, add capsicum and tomato, cook soft.',
      'Add spices, then paneer; toss 2–3 min (don’t overcook or it turns rubbery).',
      'Serve with rotis and curd.',
    ],
  },
  {
    id: 'rajma-chawal',
    slot: 'lunch',
    name: 'Rajma / chole chawal + curd',
    kcal: 620,
    protein: 27,
    ingredients: ['70 g dry rajma or chole, soaked overnight', '1 onion, 2 tomatoes (puréed), 1 tsp ginger-garlic', '1 tsp oil, rajma/chole masala, salt', '60 g rice (dry)', '200 g curd'],
    steps: [
      'Pressure cook soaked beans with salt, 6–7 whistles.',
      'Fry onion, ginger-garlic, then tomato purée and masala till oil separates.',
      'Add beans with their water, simmer 10 min, mash a few for thickness.',
      'Serve with rice and curd.',
    ],
    note: 'Lower protein; make sure you have the shake today.',
  },
  {
    id: 'dal-tofu',
    slot: 'lunch',
    name: 'Dal + tofu matar + 2 rotis',
    kcal: 620,
    protein: 38,
    ingredients: ['40 g moong or masoor dal (dry)', '150 g firm tofu, cubed', '50 g peas', '1 onion, 1 tomato, ginger-garlic', '1 tsp oil, turmeric, cumin, garam masala', '2 rotis (60 g atta)'],
    steps: [
      'Pressure cook dal with turmeric and salt, 3 whistles.',
      'For the sabzi: fry onion, ginger-garlic, tomato and spices; add peas and tofu with a splash of water, simmer 5 min.',
      'Serve both with rotis.',
    ],
  },

  {
    id: 'tofu-rice-bowl',
    slot: 'lunch',
    name: 'Tofu rice bowl + pineapple',
    kcal: 672,
    protein: 41,
    ingredients: [
      '200 g tofu, cubed (theirs: 130 g)',
      '70 g white rice, dry (same)',
      '150 g non-starchy veg: capsicum, broccoli, beans, carrot (theirs: 100 g)',
      '40 g avocado (theirs: 50 g)',
      '100 g pineapple (same)',
      '20 g whey, ⅔ scoop (theirs: 10 g)',
      'Soy sauce or masala, ginger-garlic, chilli',
    ],
    steps: [
      'Cook the rice (1 : 2 water, or 1 whistle).',
      'Pan-fry the tofu on a hot non-stick pan till golden; add ginger-garlic, chilli and a splash of soy sauce (or a pinch of masala).',
      'Stir-fry the veg 3–4 min, keep it crunchy.',
      'Bowl it up: rice, tofu, veg, sliced avocado. Pineapple and the whey (shaken in water) on the side.',
    ],
    note: 'Their Meal 2, scaled for you: theirs is 573 kcal, 27 g protein.',
  },
  // Snack
  {
    id: 'whey-shake',
    slot: 'snack',
    name: 'Whey shake',
    kcal: 295,
    protein: 34,
    ingredients: ['1 scoop whey (30 g)', '300 ml milk', 'Optional: 1 tsp cocoa'],
    steps: ['Shake or blend. Within ~2 h after training, or evening on rest days.'],
  },
  {
    id: 'sprouts-chaat',
    slot: 'snack',
    name: 'Sprouts chaat + paneer',
    kcal: 250,
    protein: 20,
    ingredients: ['100 g moong sprouts (steamed 3 min)', '50 g paneer cubes', '½ onion, ½ tomato, coriander', 'Lemon, chaat masala, salt'],
    steps: ['Toss everything together.'],
  },
  {
    id: 'chana-fruit',
    slot: 'snack',
    name: 'Roasted chana + fruit',
    kcal: 230,
    protein: 9,
    ingredients: ['40 g roasted chana', '1 apple, orange or guava'],
    steps: ['Ready to eat. Lowest protein option, so use it only when you can’t have the shake.'],
  },

  {
    id: 'yogurt-bowl',
    slot: 'snack',
    name: 'Greek yogurt berry bowl',
    kcal: 512,
    protein: 36,
    ingredients: [
      '250 g Greek yogurt (same)',
      '20 g whey, ⅔ scoop (theirs: 5 g)',
      '100 g blueberries (theirs: 125 g)',
      '15 g almond butter, 1 tbsp (same)',
      '10 g honey, 1½ tsp (theirs: 15 g)',
    ],
    steps: ['Whisk the whey into the yogurt till smooth.', 'Top with the berries, almond butter and honey.'],
    note: 'Their Meal 4, scaled for you: theirs is 489 kcal, 25 g protein. It counts as the day’s sweet, so skip the sweet slot when you have it.',
  },
  // Dinner
  {
    id: 'tofu-potato',
    slot: 'dinner',
    name: 'Masala tofu + roast potatoes',
    kcal: 667,
    protein: 41,
    ingredients: [
      '200 g tofu, cubed (theirs: 120 g)',
      '300 g potato, cubed (same)',
      '150 g non-starchy veg: beans, capsicum, spinach, cauliflower (theirs: 100 g)',
      '5 g olive oil, 1 tsp (theirs: 2 g)',
      '100 g banana (same)',
      '20 g whey, ⅔ scoop (theirs: 10 g)',
      'Salt, chilli, turmeric, jeera, chaat masala',
    ],
    steps: [
      'Par-boil the potatoes 6–7 min (or microwave 5 min), drain.',
      'Toss in half the oil and the spices; air-fry 200 °C ~15 min or pan-roast till crisp.',
      'Pan-fry the tofu in the rest of the oil with the same spices till golden; sauté the veg alongside.',
      'Banana and the whey (shaken in water) after.',
    ],
    note: 'Same dinner as theirs, scaled for you: theirs is 517 kcal, 26 g protein.',
  },
  {
    id: 'moong-chilla',
    slot: 'dinner',
    name: 'Paneer-stuffed moong dal chilla (3)',
    kcal: 545,
    protein: 34,
    ingredients: ['80 g moong dal (dry), soaked 4 h', '1 inch ginger, 1 green chilli, salt', '60 g paneer, crumbled, with onion & coriander', '1 tsp oil', 'Mint chutney, 100 g curd'],
    steps: [
      'Grind dal with ginger, chilli, salt and a little water to a pourable batter.',
      'Spread a ladle thin on a hot non-stick pan, drizzle a few drops of oil.',
      'When the edges lift, add paneer filling, fold, cook 1 min. Makes 3.',
      'Serve with chutney and curd.',
    ],
  },
  {
    id: 'soya-keema',
    slot: 'dinner',
    name: 'Soya keema + 2 rotis',
    kcal: 500,
    protein: 35,
    ingredients: ['50 g soya granules (dry)', '1 onion, 1 tomato, ginger-garlic', '50 g peas', '1 tsp oil, cumin, red chilli, garam masala', '2 rotis (60 g atta)'],
    steps: [
      'Soak granules in hot water 10 min, squeeze dry.',
      'Fry cumin and onion, then ginger-garlic, tomato and spices.',
      'Add soya and peas, cook 5–6 min till dry-ish. Serve with rotis.',
    ],
  },
  {
    id: 'tikka',
    slot: 'dinner',
    name: 'Tofu / paneer tikka + 1 roti + salad',
    kcal: 450,
    protein: 30,
    ingredients: ['150 g firm tofu or 100 g paneer, cubed', '50 g hung curd', '1 tsp tikka masala, ½ tsp ginger-garlic, lemon, salt', '1 roti', 'Cucumber, onion, tomato salad'],
    steps: [
      'Mix curd with masala, ginger-garlic, lemon and salt; coat the cubes, rest 15 min.',
      'Pan-sear on a hot greased pan or air-fry 180 °C ~10 min, turning once.',
      'Serve with roti and salad.',
    ],
  },
  {
    id: 'egg-curry',
    slot: 'dinner',
    name: 'Egg curry + 2 rotis',
    kcal: 520,
    protein: 25,
    ingredients: ['3 eggs, hard-boiled', '1 onion, 2 tomatoes, ginger-garlic', '1 tsp oil, turmeric, chilli, coriander powder, garam masala', '2 rotis (60 g atta)'],
    steps: [
      'Make an onion-tomato masala with the spices till oil separates.',
      'Add ½ cup water, simmer, then add halved eggs for 3–4 min.',
      'Serve with rotis.',
    ],
  },

  // Sweet
  {
    id: 'shrikhand',
    slot: 'sweet',
    name: 'Protein shrikhand',
    kcal: 200,
    protein: 18,
    ingredients: ['200 g hung curd (or Greek yogurt)', '1 tsp honey or jaggery powder', 'Pinch elaichi, few strands saffron', '5 pistachios, chopped'],
    steps: ['Hang curd in a cloth 2–3 h in the fridge (or overnight).', 'Whisk with honey, elaichi and saffron; top with pistachios.'],
  },
  {
    id: 'choc-mousse',
    slot: 'sweet',
    name: 'Chocolate whey mousse',
    kcal: 230,
    protein: 34,
    ingredients: ['1 scoop chocolate whey', '150 g hung curd'],
    steps: ['Whisk smooth, chill 20 min.'],
    note: 'Counts as the shake if you skip it.',
  },
  {
    id: 'kalakand',
    slot: 'sweet',
    name: 'Quick kalakand',
    kcal: 200,
    protein: 15,
    ingredients: ['100 g paneer, crumbled', '50 ml milk', '1 tbsp jaggery powder', 'Pinch elaichi'],
    steps: ['Mix in a bowl, microwave 3–4 min, stirring every minute, until thick.', 'Press into a small dish and chill to set.'],
  },
  {
    id: 'banana-ice-cream',
    slot: 'sweet',
    name: 'Banana-cocoa “ice cream”',
    kcal: 130,
    protein: 2,
    ingredients: ['1 ripe banana, sliced and frozen', '1 tsp cocoa', 'Splash of milk'],
    steps: ['Blend until creamy like soft-serve. Eat right away.'],
  },
  {
    id: 'dark-choc',
    slot: 'sweet',
    name: 'Dark chocolate (2 squares)',
    kcal: 120,
    protein: 2,
    ingredients: ['20 g, 70% or darker'],
    steps: ['Eat slowly.'],
  },
];

export const TIPS = [
  'Spread protein over 4–5 feeds of 30–40 g; that’s what the slots above do.',
  'Creatine monohydrate 3–5 g/day, any time; vegetarians tend to respond well. Helps arm size and strength.',
  'Weigh dry grains and dals once; after that a katori is enough.',
  'Sweet tooth: one planned sweet a day beats random mithai or biscuits. One free dessert on Sunday.',
  'Short of calories? Add a fruit, a glass of milk or 1 more roti.',
];

export const recipe = (id: string | undefined) => RECIPES.find((r) => r.id === id);

export function totals(day: Pick<DietDay, 'meals'> | undefined) {
  let kcal = 0;
  let protein = 0;
  for (const id of Object.values(day?.meals ?? {})) {
    const r = recipe(id);
    if (r) {
      kcal += r.kcal;
      protein += r.protein;
    }
  }
  return { kcal, protein };
}

/** Kept back for slots not ticked yet when working out what dinner should cover. */
const SHAKE = 'whey-shake';
const SWEET_RESERVE = 150;

export interface DinnerFit {
  recipe: Recipe;
  /** Positive = over the calories left. */
  kcalDiff: number;
  /** Positive = protein still missing after this dinner. */
  proteinShort: number;
}

/**
 * What's left for dinner once breakfast and lunch are ticked, keeping room for
 * the shake and a sweet if those aren't ticked yet. Dinners ranked best fit
 * first: covering protein matters most, then landing near the calories.
 */
export function dinnerSuggestions(day: Pick<DietDay, 'meals'>, phase: Phase) {
  const { dinner: _, ...rest } = day.meals;
  const eaten = totals({ meals: rest });
  const reserve = { kcal: 0, protein: 0 };
  if (!rest.snack) {
    const s = recipe(SHAKE)!;
    reserve.kcal += s.kcal;
    reserve.protein += s.protein;
  }
  if (!rest.sweet) reserve.kcal += SWEET_RESERVE;
  const kcalLeft = phase.kcal - eaten.kcal - reserve.kcal;
  const proteinLeft = Math.max(0, phase.protein - eaten.protein - reserve.protein);
  const fits: DinnerFit[] = RECIPES.filter((r) => r.slot === 'dinner')
    .map((r) => ({ recipe: r, kcalDiff: r.kcal - kcalLeft, proteinShort: Math.max(0, proteinLeft - r.protein) }))
    .sort((a, b) => a.proteinShort * 10 + Math.abs(a.kcalDiff) - (b.proteinShort * 10 + Math.abs(b.kcalDiff)));
  return { kcalLeft, proteinLeft, reservedShake: !rest.snack, reservedSweet: !rest.sweet, fits };
}
