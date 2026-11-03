import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { Card, DecisionTag } from '../components';
import { db, getStartDate, history, todayISO, weekOf } from '../db';
import { decide } from '../progression';
import { TRAINING_DAYS, type Checkin, type Exercise, type ExerciseLog } from '../types';

export default function History() {
  const exercises = useLiveQuery(async () => {
    const all = await db.exercises.toArray();
    return all.sort((a, b) => TRAINING_DAYS.indexOf(a.day) - TRAINING_DAYS.indexOf(b.day) || a.order - b.order);
  });
  const [exId, setExId] = useState<number>();
  const ex = exercises?.find((e) => e.id === exId) ?? exercises?.[0];
  const logs = useLiveQuery(async () => (ex ? history(ex.id!) : []), [ex?.id]);

  return (
    <>
      <header className="head">
        <h1>Progress</h1>
      </header>

      <select className="select" value={ex?.id ?? ''} onChange={(e) => setExId(Number(e.target.value))}>
        {exercises?.map((e) => (
          <option key={e.id} value={e.id}>
            {e.day} · {e.name}
          </option>
        ))}
      </select>

      {ex && logs && (
        <Card>
          {logs.length ? <Chart ex={ex} logs={logs.filter((l) => !l.deload)} /> : <p className="muted">No sessions logged yet.</p>}
          <ul className="log-list">
            {logs
              .map((l, j) => ({ l, d: decide(ex, logs.slice(0, j + 1)) }))
              .reverse()
              .map(({ l, d }) => (
                <li key={l.id}>
                  <div>
                    <strong>
                      {l.load} {l.unit}
                    </strong>{' '}
                    × {l.reps.join('/')} <span className="muted">= {l.reps.reduce((a, b) => a + b, 0)}</span>
                    <div className="muted">
                      {l.date}
                      {l.rir !== null && ` · RIR ${l.rir}`}
                      {l.toe === 'worse' && ' · toe worse'}
                      {l.deload && ' · lighter week'}
                    </div>
                  </div>
                  <div className="log-right">
                    {!l.deload && <DecisionTag d={d} />}
                    <button
                      className="x"
                      aria-label="Delete entry"
                      onClick={() => confirm(`Delete ${l.date} entry?`) && db.logs.delete(l.id!)}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </Card>
      )}

      <Checkins />
    </>
  );
}

/** Load as a line, total reps as bars — progress shows up in either. */
function Chart({ ex, logs }: { ex: Exercise; logs: ExerciseLog[] }) {
  const W = 320, H = 140, P = 24;
  const pts = logs.slice(-16);
  if (!pts.length) return null;
  const loads = pts.map((l) => l.load);
  const totals = pts.map((l) => l.reps.reduce((a, b) => a + b, 0));
  const lMin = Math.min(...loads), lMax = Math.max(...loads);
  const tMax = Math.max(ex.maxReps * ex.sets, ...totals);
  const x = (i: number) => P + (pts.length === 1 ? (W - 2 * P) / 2 : (i * (W - 2 * P)) / (pts.length - 1));
  const yL = (v: number) => (lMax === lMin ? H / 3 : P + ((lMax - v) / (lMax - lMin)) * (H / 2 - P));
  const bw = Math.max(4, Math.min(16, (W - 2 * P) / pts.length - 4));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={`${ex.name} load and total reps`}>
      <line x1={P} x2={W - P} y1={H - P} y2={H - P} className="axis" />
      {totals.map((t, i) => {
        const h = (t / tMax) * (H / 2 - 4);
        return <rect key={i} x={x(i) - bw / 2} y={H - P - h} width={bw} height={h} rx={2} className="bar" />;
      })}
      <polyline points={loads.map((v, i) => `${x(i)},${yL(v)}`).join(' ')} className="line" />
      {loads.map((v, i) => (
        <circle key={i} cx={x(i)} cy={yL(v)} r={3} className="pt" />
      ))}
      <text x={P} y={H - 6} className="lbl">{pts[0].date.slice(5)}</text>
      <text x={W - P} y={H - 6} className="lbl" textAnchor="end">{pts.at(-1)!.date.slice(5)}</text>
      <text x={W - P} y={12} className="lbl line-lbl" textAnchor="end">load {lMin === lMax ? lMax : `${lMin}–${lMax}`} {ex.unit}</text>
      <text x={P} y={12} className="lbl bar-lbl">total reps</text>
    </svg>
  );
}

function Checkins() {
  const current = useLiveQuery(async () => weekOf(todayISO(), await getStartDate()), [], 1);
  const all = useLiveQuery(() => db.checkins.orderBy('week').reverse().toArray(), []);
  const [form, setForm] = useState<Checkin>({ week: 1 });

  useEffect(() => {
    void db.checkins.get(current).then((c) => setForm(c ?? { week: current }));
  }, [current]);

  const num = (k: keyof Checkin) => ({
    value: (form[k] as number | undefined) ?? '',
    inputMode: 'decimal' as const,
    type: 'number',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [k]: e.target.value === '' ? undefined : parseFloat(e.target.value) }),
  });

  return (
    <Card>
      <h2>Weekly check-in · week {form.week}</h2>
      <p className="muted">Average of 3 morning weigh-ins. Waist every 2 weeks, photos every 4.</p>
      <div className="grid3">
        <label>Avg weight (kg)<input {...num('avgWeight')} /></label>
        <label>Avg sleep (h)<input {...num('sleep')} /></label>
        <label>Waist (cm)<input {...num('waist')} /></label>
      </div>
      <label>
        Recovery
        <select className="select" value={form.recovery ?? ''} onChange={(e) => setForm({ ...form, recovery: e.target.value })}>
          <option value="">—</option>
          <option>Good</option>
          <option>OK</option>
          <option>Tired</option>
        </select>
      </label>
      <label>
        Notes
        <input value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </label>
      <button className="btn primary" onClick={() => db.checkins.put(form)}>Save week {form.week}</button>

      {!!all?.length && (
        <table className="table">
          <thead>
            <tr><th>Wk</th><th>Kg</th><th>Sleep</th><th>Waist</th><th>Rec.</th></tr>
          </thead>
          <tbody>
            {all.map((c) => (
              <tr key={c.week} onClick={() => setForm(c)}>
                <td>{c.week}</td><td>{c.avgWeight ?? '–'}</td><td>{c.sleep ?? '–'}</td><td>{c.waist ?? '–'}</td><td>{c.recovery || '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
