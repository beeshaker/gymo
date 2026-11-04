import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '../components';
import { dinnerSuggestions, PHASES, RECIPES, SLOTS, TIPS, totals, type Phase, type Recipe } from '../diet';
import { dietDay, getDietPhase, setMeal, setWater, todayISO } from '../db';
import type { DietDay, Slot } from '../types';

export default function Diet() {
  const date = todayISO();
  const day = useLiveQuery(() => dietDay(date), [date]);
  const phaseKey = useLiveQuery(getDietPhase, [], 'arms');
  const phase = PHASES[phaseKey];
  const { kcal, protein } = totals(day);
  const water = day?.water ?? 0;
  const done = SLOTS.filter((s) => day?.meals[s.slot]).length;

  return (
    <>
      <header className="head">
        <div className="kicker">{phase.label} · {new Date(date + 'T12:00').toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })}</div>
        <h1>Diet</h1>
      </header>

      <Card>
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
            <Option key={r.id} r={r} checked={day?.meals[slot] === r.id} onToggle={(on) => setMeal(date, slot as Slot, on ? r.id : null)} />
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

function Option({ r, checked, onToggle }: { r: Recipe; checked: boolean; onToggle: (on: boolean) => void }) {
  return (
    <div className={`meal ${checked ? 'on' : ''}`}>
      <button className="meal-check" role="checkbox" aria-checked={checked} aria-label={`Ate ${r.name}`} onClick={() => onToggle(!checked)}>
        {checked ? '✓' : ''}
      </button>
      <details className="meal-body">
        <summary>
          <span className="meal-name">{r.name}</span>
          <span className="muted">{r.kcal} kcal · {r.protein} g protein</span>
        </summary>
        <h3>Ingredients</h3>
        <ul>{r.ingredients.map((x) => <li key={x}>{x}</li>)}</ul>
        <h3>Steps</h3>
        <ol>{r.steps.map((x) => <li key={x}>{x}</li>)}</ol>
        {r.note && <p className="warn">{r.note}</p>}
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
