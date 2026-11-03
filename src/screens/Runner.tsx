import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { Chips, DecisionTag, RestPanel, Stepper } from '../components';
import { dayExercises, db, finishSession, history, saveLog } from '../db';
import { decide, type Decision } from '../progression';
import { keepAwake, skipRest, startRest } from '../timer';
import type { Exercise, ExerciseLog, Session, Toe } from '../types';

export default function Runner({ session, onExit }: { session: Session; onExit: () => void }) {
  const exercises = useLiveQuery(() => dayExercises(session.day), [session.day]);
  const logs = useLiveQuery(() => db.logs.where('sessionId').equals(session.id!).toArray(), [session.id]);
  const [idx, setIdx] = useState<number | null>(null);

  useEffect(() => {
    keepAwake(true);
    return () => keepAwake(false);
  }, []);

  const setsFor = (ex: Exercise) => (session.deload ? Math.ceil(ex.sets / 2) : ex.sets);
  const logOf = (ex: Exercise) => logs?.find((l) => l.exerciseId === ex.id);
  const isDone = (ex: Exercise) => (logOf(ex)?.reps.length ?? 0) >= setsFor(ex);

  // Resume at the first unfinished exercise, then stay put so the RIR/toe
  // questions show after the last set instead of jumping ahead.
  useEffect(() => {
    if (idx !== null || !exercises || !logs) return;
    const open = exercises.findIndex((ex) => !isDone(ex));
    setIdx(open === -1 ? Math.max(0, exercises.length - 1) : open);
  });

  if (!exercises || !logs || idx === null) return null;

  const i = Math.min(idx, exercises.length - 1);
  const ex = exercises[i];

  const finish = async () => {
    const open = exercises.filter((e) => !isDone(e)).length;
    if (open && !confirm(`${open} exercise${open > 1 ? 's' : ''} not finished. Finish anyway?`)) return;
    skipRest();
    await finishSession(session.id!);
    onExit();
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
        {exercises.map((e, j) => (
          <button
            key={e.id}
            className={`dot ${j === i ? 'on' : ''} ${isDone(e) ? 'done' : (logOf(e)?.reps.length ?? 0) > 0 ? 'part' : ''}`}
            onClick={() => setIdx(j)}
            aria-label={e.name}
          />
        ))}
      </div>

      <main className="screen">
        {ex ? (
          <ExerciseView
            key={ex.id}
            ex={ex}
            session={session}
            log={logOf(ex)}
            sets={setsFor(ex)}
            first={i === 0}
            next={exercises[i + 1]}
            onNext={() => (i + 1 < exercises.length ? setIdx(i + 1) : finish())}
            onPrev={i > 0 ? () => setIdx(i - 1) : undefined}
          />
        ) : (
          <p className="muted">No exercises for this day.</p>
        )}
      </main>
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
  next?: Exercise;
  onNext: () => void;
  onPrev?: () => void;
}

function ExerciseView(props: ViewProps) {
  const hist = useLiveQuery(() => history(props.ex.id!, props.session.id), [props.ex.id, props.session.id]);
  if (!hist) return null;
  return <SetLogger {...props} decision={decide(props.ex, hist)} last={hist.at(-1)} />;
}

function SetLogger({ ex, session, log, sets, first, next, onNext, onPrev, decision, last }: ViewProps & { decision: Decision; last?: ExerciseLog }) {
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
    const finished = r.length >= sets;
    const t = finished && toe === null ? 'none' : toe;
    setToe(t);
    setReps(decision.reps[r.length] ?? reps);
    if (!finished) startRest(ex.restSec, `${ex.name} · set ${r.length + 1}`);
    else if (next) startRest(ex.restSec, next.name);
    await persist({ reps: r, toe: t });
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
        <h1>{ex.name}</h1>
        <div className="muted">
          {sets} × {ex.minReps}–{ex.maxReps} · 1–2 reps in reserve
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
        {Array.from({ length: sets }, (_, j) => (
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
            Log set {done.length + 1} · start {Math.floor(ex.restSec / 60)}:{String(ex.restSec % 60).padStart(2, '0')} rest
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
