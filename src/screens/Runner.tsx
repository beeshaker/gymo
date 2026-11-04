import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { Chips, DecisionTag, RestPanel, Stepper } from '../components';
import { createExercise, dayExercises, db, finishSession, history, planFor, saveLog } from '../db';
import { decide, type Decision } from '../progression';
import { keepAwake, skipRest, startRest } from '../timer';
import type { Exercise, ExerciseLog, Session, SessionItem, Toe } from '../types';

type Item = SessionItem & { ex: Exercise };
type Sheet = null | 'edit' | 'add' | 'swap';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function Runner({ session, onExit }: { session: Session; onExit: () => void }) {
  const all = useLiveQuery(() => db.exercises.toArray(), []);
  const logs = useLiveQuery(() => db.logs.where('sessionId').equals(session.id!).toArray(), [session.id]);
  const [idx, setIdx] = useState<number | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);

  useEffect(() => {
    keepAwake(true);
    return () => keepAwake(false);
  }, []);

  // Sessions started before per-session plans existed: snapshot the day's plan.
  useEffect(() => {
    if (!session.plan) {
      void dayExercises(session.day).then((exs) => db.sessions.update(session.id!, { plan: planFor(exs, session.deload) }));
    }
  }, [session]);

  const items: Item[] = useMemo(() => {
    const byId = new Map((all ?? []).map((e) => [e.id!, e]));
    return (session.plan ?? []).flatMap((p) => (byId.has(p.exerciseId) ? [{ ...p, ex: byId.get(p.exerciseId)! }] : []));
  }, [all, session.plan]);

  const count = (it: Item) => logs?.find((l) => l.exerciseId === it.exerciseId)?.reps.length ?? 0;
  const isDone = (it: Item) => count(it) >= it.sets;

  // Resume at the first unfinished exercise, then stay put so the RIR/toe
  // questions show after the last set instead of jumping ahead.
  useEffect(() => {
    if (idx !== null || !all || !logs || !session.plan) return;
    const open = items.findIndex((it) => !isDone(it));
    setIdx(open === -1 ? Math.max(0, items.length - 1) : open);
  });

  if (!all || !logs || !session.plan || idx === null) return null;

  const i = Math.max(0, Math.min(idx, items.length - 1));
  const item = items[i] as Item | undefined;
  const partner = (j: number) =>
    items[j]?.ex.superset && items[j + 1] ? j + 1 : j > 0 && items[j - 1].ex.superset ? j - 1 : null;
  const setPlan = (plan: SessionItem[]) => db.sessions.update(session.id!, { plan });

  /** After a set: alternate within a superset, otherwise rest on the spot. */
  const onLogged = (j: number, done: number) => {
    const it = items[j];
    const p = partner(j);
    const pOpen = p !== null && count(items[p]) < items[p].sets;
    if (done >= it.sets) {
      // Stay to answer RIR/toe; rest leads into whatever comes next.
      const next = pOpen ? items[p!] : items[Math.max(j, p ?? j) + 1];
      if (next && !(p === j + 1 && pOpen)) startRest(it.ex.restSec, next.ex.name);
      return;
    }
    if (pOpen && p === j + 1) {
      setIdx(p); // first half of a superset: straight into the partner
    } else if (pOpen) {
      setIdx(p!);
      startRest(it.ex.restSec, `${items[p!].ex.name} · set ${count(items[p!]) + 1}`);
    } else {
      startRest(it.ex.restSec, `${it.ex.name} · set ${done + 1}`);
    }
  };

  const finish = async () => {
    const open = items.filter((it) => !isDone(it)).length;
    if (open && !confirm(`${open} exercise${open > 1 ? 's' : ''} not finished. Finish anyway?`)) return;
    skipRest();
    await finishSession(session.id!);
    onExit();
  };

  const pick = async (choice: Exercise | string, permanent: boolean) => {
    let ex = typeof choice === 'string' ? await createExercise(session.day, choice, permanent) : choice;
    if (permanent && ex.day !== session.day) {
      // Plans are per day: copy it into this day (starts its own history).
      const { id: _id, ...rest } = ex;
      ex = { ...rest, day: session.day, active: true, superset: false, order: 999 };
      ex.id = (await db.exercises.add(ex)) as number;
    }
    const entry = { exerciseId: ex.id!, sets: session.deload ? Math.ceil(ex.sets / 2) : ex.sets };
    const plan = [...session.plan!];
    if (sheet === 'swap' && item) {
      plan[i] = entry;
      if (permanent) {
        await db.exercises.update(ex.id!, { active: true, order: item.ex.order, superset: item.ex.superset });
        if (ex.id !== item.ex.id) await db.exercises.update(item.ex.id!, { active: false, superset: false });
      }
      setIdx(i);
    } else {
      plan.splice(i + 1, 0, entry);
      if (permanent) await db.exercises.update(ex.id!, { active: true, order: item ? item.ex.order + 0.5 : 999 });
      setIdx(items.length ? i + 1 : 0);
    }
    await setPlan(plan);
    setSheet(null);
  };

  return (
    <div className="app runner">
      <header className="runner-head">
        <button className="btn ghost" onClick={onExit} aria-label="Back">‹ Back</button>
        <div className="runner-title">
          {session.day}
          {session.deload && <span className="tag tag-confirm">Lighter</span>}
        </div>
        <button className="btn primary" onClick={finish}>Finish</button>
      </header>

      <div className="dots">
        {items.map((it, j) => (
          <button
            key={`${j}-${it.exerciseId}`}
            className={`dot ${j === i ? 'on' : ''} ${isDone(it) ? 'done' : count(it) > 0 ? 'part' : ''} ${it.ex.superset && items[j + 1] ? 'linked' : ''}`}
            onClick={() => setIdx(j)}
            aria-label={it.ex.name}
          />
        ))}
        <button className="dot-add" onClick={() => setSheet('add')} aria-label="Add exercise">+</button>
      </div>

      <main className="screen">
        {item ? (
          <ExerciseView
            key={`${i}-${item.exerciseId}`}
            ex={item.ex}
            session={session}
            log={logs.find((l) => l.exerciseId === item.exerciseId)}
            sets={item.sets}
            first={i === 0}
            supersetWith={partner(i) !== null ? items[partner(i)!].ex.name : undefined}
            next={items[i + 1]?.ex}
            onLogged={(n) => onLogged(i, n)}
            onEdit={() => setSheet('edit')}
            onNext={() => {
              const p = partner(i);
              if (p !== null && !isDone(items[p])) setIdx(p);
              else if (i + 1 < items.length) setIdx(Math.max(i, p ?? i) + 1 < items.length ? Math.max(i, p ?? i) + 1 : i + 1);
              else void finish();
            }}
            onPrev={i > 0 ? () => setIdx(i - 1) : undefined}
          />
        ) : (
          <div className="card">
            <p>No exercises in this session.</p>
            <button className="btn primary" onClick={() => setSheet('add')}>+ Add exercise</button>
          </div>
        )}
      </main>

      {sheet === 'edit' && item && (
        <EditSheet
          item={item}
          logged={count(item)}
          onSets={(n) => setPlan(session.plan!.map((p, k) => (k === i ? { ...p, sets: n } : p)))}
          onSwap={() => setSheet('swap')}
          onRemove={async (permanent) => {
            await setPlan(session.plan!.filter((_, k) => k !== i));
            if (permanent) await db.exercises.update(item.ex.id!, { active: false, superset: false });
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {(sheet === 'add' || sheet === 'swap') && (
        <Picker
          title={sheet === 'swap' && item ? `Swap ${item.ex.name} for…` : 'Add exercise'}
          day={session.day}
          all={all}
          exclude={new Set(items.map((it) => it.exerciseId))}
          onPick={pick}
          onClose={() => setSheet(null)}
        />
      )}
      <RestPanel />
    </div>
  );
}

interface ViewProps {
  ex: Exercise;
  session: Session;
  log?: ExerciseLog;
  sets: number;
  first: boolean;
  supersetWith?: string;
  next?: Exercise;
  onLogged: (setsDone: number) => void;
  onEdit: () => void;
  onNext: () => void;
  onPrev?: () => void;
}

function ExerciseView(props: ViewProps) {
  const hist = useLiveQuery(() => history(props.ex.id!, props.session.id), [props.ex.id, props.session.id]);
  if (!hist) return null;
  return <SetLogger {...props} decision={decide({ ...props.ex, sets: props.sets }, hist)} last={hist.at(-1)} />;
}

function SetLogger(props: ViewProps & { decision: Decision; last?: ExerciseLog }) {
  const { ex, session, log, sets, first, supersetWith, next, onLogged, onEdit, onNext, onPrev, decision, last } = props;
  const done = log?.reps ?? [];
  const [load, setLoad] = useState(log?.load ?? decision.load ?? 0);
  const [reps, setReps] = useState(decision.reps[done.length] ?? decision.reps.at(-1) ?? ex.minReps);
  const [rir, setRir] = useState<number | null>(log?.rir ?? null);
  const [toe, setToe] = useState<Toe | null>(log?.toe ?? null);
  const complete = done.length >= sets;

  const persist = (patch: Partial<ExerciseLog>) =>
    saveLog({
      sessionId: session.id!,
      exerciseId: ex.id!,
      date: session.date,
      load,
      unit: ex.unit,
      reps: done,
      rir,
      toe,
      notes: log?.notes ?? '',
      deload: session.deload,
      ...patch,
    });

  const logSet = async () => {
    const r = [...done, reps];
    const t = r.length >= sets && toe === null ? 'none' : toe;
    setToe(t);
    setReps(decision.reps[r.length] ?? reps);
    await persist({ reps: r, toe: t });
    onLogged(r.length);
  };

  const undo = async () => {
    skipRest();
    setReps(done.at(-1) ?? reps);
    await persist({ reps: done.slice(0, -1) });
  };

  const editSet = async (j: number) => {
    const v = prompt(`Reps for set ${j + 1}`, String(done[j]));
    const n = v === null ? NaN : parseInt(v, 10);
    if (!Number.isFinite(n) || n < 0) return;
    await persist({ reps: done.map((r, k) => (k === j ? n : r)) });
  };

  const changeLoad = (v: number) => {
    setLoad(v);
    if (done.length) void persist({ load: v });
  };

  return (
    <>
      <div className="ex-head">
        <div className="ex-title">
          <h1>{ex.name}</h1>
          <button className="btn ghost" onClick={onEdit}>Edit</button>
        </div>
        <div className="muted">
          {sets} × {ex.minReps}–{ex.maxReps} · 1–2 reps in reserve
          {supersetWith && <> · <span className="ss">✱ superset with {supersetWith}</span></>}
        </div>
      </div>

      <div className="advice">
        <DecisionTag d={decision} />
        <p>{decision.detail}</p>
        {last && (
          <p className="muted">
            Last: {last.load} {last.unit} × {last.reps.join('/')}
            {last.rir !== null && ` · RIR ${last.rir}`} · {last.date}
          </p>
        )}
        {first && done.length === 0 && <p className="muted">Do 2–3 lighter warm-up sets first — don’t log them.</p>}
        {ex.note && <p className="muted">{ex.note}</p>}
      </div>

      <div className="sets">
        {Array.from({ length: Math.max(sets, done.length) }, (_, j) => (
          <button
            key={j}
            className={`set ${j < done.length ? 'logged' : j === done.length ? 'current' : ''} ${
              j < done.length && done[j] >= ex.maxReps ? 'top' : ''
            }`}
            onClick={() => j < done.length && editSet(j)}
          >
            <span className="set-n">Set {j + 1}</span>
            <span className="set-v">{j < done.length ? done[j] : decision.reps[j] ?? '–'}</span>
          </button>
        ))}
      </div>

      <Stepper label={`Load (${ex.unit})`} value={load} step={ex.increment} suffix={ex.unit} onChange={changeLoad} />

      {!complete ? (
        <>
          <Stepper label={`Reps — set ${done.length + 1}`} value={reps} step={1} onChange={setReps} />
          <button className="btn primary big" onClick={logSet}>
            Log set {done.length + 1}
            {supersetWith ? ' · next exercise' : ` · start ${mmss(ex.restSec)} rest`}
          </button>
        </>
      ) : (
        <div className="finish-ex">
          <div className="q">Reps left on your hardest set?</div>
          <Chips
            options={[0, 1, 2, 3, 4].map((v) => ({ value: v, label: v === 4 ? '4+' : String(v) }))}
            value={rir}
            onChange={(v) => {
              setRir(v);
              void persist({ rir: v });
            }}
          />
          <div className="q">Toe response</div>
          <Chips
            options={[
              { value: 'none' as Toe, label: 'No change' },
              { value: 'worse' as Toe, label: 'Worse' },
            ]}
            value={toe}
            onChange={(v) => {
              setToe(v);
              void persist({ toe: v });
            }}
          />
          {rir === 0 && <p className="hint warn">0 RIR = failure. Next time stop 1–2 reps earlier.</p>}
          {toe === 'worse' && <p className="hint warn">Stop this exercise and review with your clinician.</p>}
        </div>
      )}

      <div className="row nav">
        {onPrev ? <button className="btn ghost" onClick={onPrev}>‹ Prev</button> : <span />}
        {done.length > 0 && <button className="btn ghost" onClick={undo}>Undo set</button>}
        <button className={`btn ${complete ? 'primary' : 'ghost'}`} disabled={complete && rir === null} onClick={onNext}>
          {next ? (complete ? 'Next exercise ›' : 'Skip ›') : 'Finish workout'}
        </button>
      </div>
    </>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="row">
          <h2>{title}</h2>
          <button className="x" onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EditSheet(props: {
  item: Item;
  logged: number;
  onSets: (n: number) => void;
  onSwap: () => void;
  onRemove: (permanent: boolean) => void;
  onClose: () => void;
}) {
  const { item, logged, onSets, onSwap, onRemove, onClose } = props;
  const ex = item.ex;
  const [permanent, setPermanent] = useState(false);
  const upd = (patch: Partial<Exercise>) => db.exercises.update(ex.id!, patch);

  const setSets = (n: number) => {
    onSets(n);
    if (permanent) void upd({ sets: n });
  };

  return (
    <Sheet title={ex.name} onClose={onClose}>
      <label className="toggle">
        <input type="checkbox" checked={permanent} onChange={(e) => setPermanent(e.target.checked)} />
        <span>
          Save to plan <span className="muted">— otherwise sets, swaps and removals are today only</span>
        </span>
      </label>
      <Stepper label="Sets" value={item.sets} step={1} min={Math.max(1, logged)} onChange={setSets} />
      <div className="grid2">
        <Stepper label="Min reps" value={ex.minReps} step={1} min={1} onChange={(v) => upd({ minReps: Math.min(v, ex.maxReps) })} />
        <Stepper label="Max reps" value={ex.maxReps} step={1} min={1} onChange={(v) => upd({ maxReps: Math.max(v, ex.minReps) })} />
      </div>
      <div className="grid2">
        <Stepper label="Rest (s)" value={ex.restSec} step={15} min={15} onChange={(v) => upd({ restSec: v })} />
        <Stepper label={`Step (${ex.unit})`} value={ex.increment} step={0.5} min={0.5} onChange={(v) => upd({ increment: v })} />
      </div>
      <p className="muted">Rep range, rest and step always save to the exercise (they drive the add-weight rule).</p>
      <label className="toggle">
        <input type="checkbox" checked={ex.superset} onChange={(e) => upd({ superset: e.target.checked })} />
        <span>Superset with the next exercise</span>
      </label>
      <div className="stack">
        <button className="btn ghost" onClick={onSwap}>Swap for another exercise…</button>
        <button className="btn ghost danger" onClick={() => onRemove(permanent)}>
          Remove {permanent ? 'from plan' : 'from today'}
        </button>
      </div>
    </Sheet>
  );
}

function Picker(props: {
  title: string;
  day: string;
  all: Exercise[];
  exclude: Set<number>;
  onPick: (choice: Exercise | string, permanent: boolean) => void;
  onClose: () => void;
}) {
  const { title, day, all, exclude, onPick, onClose } = props;
  const [q, setQ] = useState('');
  const [permanent, setPermanent] = useState(false);
  const query = q.trim().toLowerCase();
  const list = all
    .filter((e) => !exclude.has(e.id!) && (!query || e.name.toLowerCase().includes(query)))
    .sort((a, b) => Number(b.day === day) - Number(a.day === day) || a.name.localeCompare(b.name));
  const exact = all.some((e) => e.day === day && e.name.toLowerCase() === query);

  return (
    <Sheet title={title} onClose={onClose}>
      <input className="select" placeholder="Search or type a new exercise" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <label className="toggle">
        <input type="checkbox" checked={permanent} onChange={(e) => setPermanent(e.target.checked)} />
        <span>
          Save to plan <span className="muted">— otherwise today only</span>
        </span>
      </label>
      {query && !exact && (
        <button className="btn primary" onClick={() => onPick(q.trim(), permanent)}>
          + Create “{q.trim()}”
        </button>
      )}
      <ul className="pick-list">
        {list.map((e) => (
          <li key={e.id}>
            <button onClick={() => onPick(e, permanent)}>
              <span>{e.name}</span>
              <span className="muted">
                {e.day} · {e.sets}×{e.minReps}–{e.maxReps} {e.unit}
                {!e.active && ' · alt'}
              </span>
            </button>
          </li>
        ))}
        {!list.length && !query && <li className="muted">Nothing else in the library yet — type a name above.</li>}
      </ul>
    </Sheet>
  );
}
