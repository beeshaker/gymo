import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Card } from '../components';
import { dinnerSuggestions, PHASES, RECIPES, SLOTS, TIPS, totals, type Phase, type Recipe } from '../diet';
import {
  clearShopTicks, dayOf, dietDay, getDietPhase, getShopTicks, getWeekPlan, resetWeekPlan, setMeal, setWater, setWeekMeal, todayISO, toggleShopTick,
} from '../db';
import { CATS, PANTRY, recipeText, shareOnWhatsApp, shoppingList, shoppingText } from '../shopping';
import { DAYS, type DietDay, type Slot } from '../types';

type View = 'today' | 'week' | 'shop';
const VIEWS: Record<View, string> = { today: 'Today', week: 'Week plan', shop: 'Shopping' };

export default function Diet() {
  const [view, setView] = useState<View>(() => {
    try {
      return (sessionStorage.getItem('dietView') as View) || 'today';
    } catch {
      return 'today';
    }
  });
  const pick = (v: View) => {
    setView(v);
    try {
      sessionStorage.setItem('dietView', v);
    } catch {
      /* ignore */
    }
  };
  const phase = PHASES[useLiveQuery(getDietPhase, [], 'arms')];

  return (
    <>
      <header className="head">
        <div className="kicker">{phase.label} · {phase.kcal} kcal · {phase.protein} g protein</div>
        <h1>Diet</h1>
      </header>
      <div className="days">
        {(Object.keys(VIEWS) as View[]).map((v) => (
          <button key={v} className={`day ${view === v ? 'on' : ''}`} onClick={() => pick(v)}>{VIEWS[v]}</button>
        ))}
      </div>
      {view === 'today' && <Today phase={phase} />}
      {view === 'week' && <Week phase={phase} />}
      {view === 'shop' && <Shopping />}
    </>
  );
}

function Today({ phase }: { phase: Phase }) {
  const date = todayISO();
  const day = useLiveQuery(() => dietDay(date), [date]);
  const planned = useLiveQuery(async () => (await getWeekPlan())[dayOf(date)], [date]);
  const { kcal, protein } = totals(day);
  const water = day?.water ?? 0;
  const done = SLOTS.filter((s) => day?.meals[s.slot]).length;

  return (
    <>
      <Card>
        <div className="muted">{new Date(date + 'T12:00').toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })}</div>
        <Bar label="Calories" value={kcal} target={phase.kcal} unit="kcal" />
        <Bar label="Protein" value={protein} target={phase.protein} unit="g" />
        <Bar label="Water" value={water * 0.25} target={phase.waterGlasses * 0.25} unit="L" />
        <div className="muted">
          {done}/{SLOTS.length} meals ticked
          {done >= 4 && kcal < phase.kcal - 150 && <> · {phase.kcal - kcal} kcal short: add a fruit, a glass of milk or 1 more roti</>}
        </div>
      </Card>

      <Card>
        <div className="row">
          <h2>Water</h2>
          <span className="muted">{water} × 250 ml</span>
        </div>
        <div className="glasses">
          {Array.from({ length: Math.max(phase.waterGlasses, water) }, (_, i) => (
            <button
              key={i}
              className={`glass ${i < water ? 'on' : ''}`}
              aria-label={`${i + 1} glasses`}
              onClick={() => setWater(date, i + 1 === water ? i : i + 1)}
            />
          ))}
        </div>
        <div className="row">
          <button className="btn ghost" disabled={!water} onClick={() => setWater(date, water - 1)}>− 1</button>
          <button className="btn primary" onClick={() => setWater(date, water + 1)}>+ 1 glass</button>
        </div>
      </Card>

      {SLOTS.map(({ slot, label, hint }) => (
        <Card key={slot}>
          <div className="row">
            <h2>{label}</h2>
            {day?.meals[slot] ? <span className="tag tag-increase">done</span> : hint && <span className="muted">{hint}</span>}
          </div>
          {slot === 'dinner' && day?.meals.breakfast && day.meals.lunch && !day.meals.dinner && (
            <DinnerPicks day={day} phase={phase} onPick={(id) => setMeal(date, 'dinner', id)} />
          )}
          {RECIPES.filter((r) => r.slot === slot).map((r) => (
            <Option key={r.id} r={r} planned={planned?.[slot] === r.id} checked={day?.meals[slot] === r.id} onToggle={(on) => setMeal(date, slot as Slot, on ? r.id : null)} />
          ))}
        </Card>
      ))}

      <Card>
        <h2>Tips</h2>
        <ul className="tips">
          {TIPS.map((t) => <li key={t}>{t}</li>)}
        </ul>
        <p className="muted">{phase.note}</p>
        <p className="muted">
          Targets: {phase.kcal} kcal · {phase.protein} g protein · {(phase.waterGlasses * 0.25).toFixed(1)} L water. Switch phase in Settings.
        </p>
      </Card>
    </>
  );
}

function Bar({ label, value, target, unit }: { label: string; value: number; target: number; unit: string }) {
  const pct = Math.min(1, target ? value / target : 0);
  return (
    <div className="bar">
      <div className="bar-top">
        <span>{label}</span>
        <span className="muted">{unit === 'L' ? value.toFixed(2).replace(/0$/, '') : value} / {target} {unit}</span>
      </div>
      <div className="bar-track"><div className={`bar-fill ${pct >= 1 ? 'full' : ''}`} style={{ transform: `scaleX(${pct})` }} /></div>
    </div>
  );
}

function Option({ r, planned, checked, onToggle }: { r: Recipe; planned: boolean; checked: boolean; onToggle: (on: boolean) => void }) {
  return (
    <div className={`meal ${checked ? 'on' : ''}`}>
      <button className="meal-check" role="checkbox" aria-checked={checked} aria-label={`Ate ${r.name}`} onClick={() => onToggle(!checked)}>
        {checked ? '✓' : ''}
      </button>
      <details className="meal-body">
        <summary>
          <span className="meal-name">{r.name}{planned && <span className="tag tag-confirm">planned</span>}</span>
          <span className="muted">{r.kcal} kcal · {r.protein} g protein</span>
        </summary>
        <h3>Ingredients</h3>
        <ul>{r.ingredients.map((x) => <li key={x}>{x}</li>)}</ul>
        <h3>Steps</h3>
        <ol>{r.steps.map((x) => <li key={x}>{x}</li>)}</ol>
        {r.note && <p className="warn">{r.note}</p>}
        <button className="btn ghost wa" onClick={() => shareOnWhatsApp(recipeText(r))}>Share on WhatsApp</button>
      </details>
    </div>
  );
}

function DinnerPicks({ day, phase, onPick }: { day: DietDay; phase: Phase; onPick: (id: string) => void }) {
  const { kcalLeft, proteinLeft, reservedShake, reservedSweet, fits } = dinnerSuggestions(day, phase);
  const kept = [reservedShake && 'the shake', reservedSweet && 'a sweet'].filter(Boolean).join(' and ');
  return (
    <div className="suggest">
      <div className="suggest-head">
        Left for dinner: <strong>{Math.max(0, kcalLeft)} kcal · {proteinLeft} g protein</strong>
        {kept && <span className="muted"> (keeping room for {kept})</span>}
      </div>
      {fits.slice(0, 3).map(({ recipe: r, kcalDiff, proteinShort }, i) => (
        <button key={r.id} className="suggest-row" onClick={() => onPick(r.id)}>
          <span>
            {i === 0 && <span className="tag tag-increase">best fit</span>} <strong>{r.name}</strong>
            <span className="muted">
              {' '}{r.kcal} kcal · {r.protein} g
              {' · '}{Math.abs(kcalDiff) <= 50 ? 'right on calories' : kcalDiff > 0 ? `${kcalDiff} kcal over` : `${-kcalDiff} kcal under`}
              {proteinShort > 0 ? ` · ${proteinShort} g protein short` : ' · protein covered'}
            </span>
          </span>
          <span className="suggest-pick">Pick</span>
        </button>
      ))}
      {fits[0].kcalDiff < -150 && <div className="muted">Still under: add a roti, a fruit or a glass of milk.</div>}
      {fits[0].proteinShort > 0 && <div className="muted">Protein short: add 10 g whey per ~7 g, or 100 g curd (~4 g).</div>}
    </div>
  );
}

function Week({ phase }: { phase: Phase }) {
  const week = useLiveQuery(getWeekPlan);
  const today = dayOf(todayISO());
  if (!week) return null;
  return (
    <>
      <p className="muted">The default week. Change any meal and the shopping list updates with it. Today’s plan shows as “planned” on the Today screen.</p>
      {DAYS.map((d) => {
        const t = totals({ meals: week[d] });
        const off = t.kcal - phase.kcal;
        return (
          <Card key={d} className={d === today ? 'today-card' : ''}>
            <div className="row">
              <h2>{d}{d === today && <span className="tag tag-increase">today</span>}</h2>
              <span className={`muted ${t.protein < phase.protein - 10 ? 'warn' : ''}`}>
                {t.kcal} kcal ({off >= 0 ? '+' : ''}{off}) · {t.protein} g
              </span>
            </div>
            {SLOTS.map(({ slot, label }) => (
              <label key={slot} className="plan-row">
                <span className="muted">{label}</span>
                <select value={week[d][slot] ?? ''} onChange={(e) => setWeekMeal(d, slot as Slot, e.target.value || null)}>
                  <option value="">—</option>
                  {RECIPES.filter((r) => r.slot === slot).map((r) => (
                    <option key={r.id} value={r.id}>{r.name} · {r.kcal} kcal · {r.protein} g</option>
                  ))}
                </select>
              </label>
            ))}
          </Card>
        );
      })}
      <button className="btn ghost danger" onClick={() => confirm('Reset the week to the default plan?') && resetWeekPlan()}>Reset to default week</button>
    </>
  );
}

function Shopping() {
  const week = useLiveQuery(getWeekPlan);
  const ticks = new Set(useLiveQuery(getShopTicks, [], []));
  if (!week) return null;
  const list = shoppingList(week);
  const left = list.filter((l) => !ticks.has(l.item)).length;
  return (
    <>
      <Card>
        <div className="row">
          <h2>This week</h2>
          <span className="muted">{left} of {list.length} left to buy</span>
        </div>
        <p className="muted">Worked out from your week plan; edit the plan and this list follows. Weights are rounded up.</p>
        <button className="btn primary wa" onClick={() => shareOnWhatsApp(shoppingText(list.filter((l) => !ticks.has(l.item))))}>
          Share on WhatsApp{ticks.size ? ' (items left)' : ''}
        </button>
        {ticks.size > 0 && <button className="btn ghost" onClick={clearShopTicks}>Untick all</button>}
      </Card>
      {CATS.map((cat) => {
        const lines = list.filter((l) => l.cat === cat);
        if (!lines.length) return null;
        return (
          <Card key={cat}>
            <h2>{cat}</h2>
            {lines.map((l) => (
              <button key={l.item} className={`shop-row ${ticks.has(l.item) ? 'on' : ''}`} onClick={() => toggleShopTick(l.item)}>
                <span className="meal-check" aria-hidden>{ticks.has(l.item) ? '✓' : ''}</span>
                <span className="shop-item">{l.item}</span>
                <span className="shop-qty">{l.label}</span>
              </button>
            ))}
          </Card>
        );
      })}
      <Card>
        <h2>Check the pantry</h2>
        <ul className="tips">{PANTRY.map((p) => <li key={p}>{p}</li>)}</ul>
      </Card>
    </>
  );
}
