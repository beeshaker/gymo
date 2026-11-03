import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Card, DecisionTag } from '../components';
import { dayExercises, dayOf, db, getStartDate, history, startSession, todayISO, weekOf } from '../db';
import { decide } from '../progression';
import { requestNotifications, unlockAudio } from '../timer';
import { TRAINING_DAYS, type Day, type Session } from '../types';

export default function Today({ session, onRun }: { session?: Session; onRun: () => void }) {
  const today = dayOf(todayISO());
  const [day, setDay] = useState<Day>(TRAINING_DAYS.includes(today) ? today : 'Tue');
  const [deload, setDeload] = useState(false);

  const week = useLiveQuery(async () => weekOf(todayISO(), await getStartDate()), [], 1);
  const plan = useLiveQuery(async () => {
    const exs = await dayExercises(day);
    return Promise.all(
      exs.map(async (ex) => {
        const h = await history(ex.id!);
        return { ex, last: h.at(-1), decision: decide(ex, h) };
      }),
    );
  }, [day]);

  const begin = async () => {
    unlockAudio();
    void requestNotifications();
    await startSession(day, deload);
    onRun();
  };

  const discard = async () => {
    if (!session || !confirm('Discard the unfinished session and its sets?')) return;
    await db.transaction('rw', db.sessions, db.logs, async () => {
      await db.logs.where('sessionId').equals(session.id!).delete();
      await db.sessions.delete(session.id!);
    });
  };

  return (
    <>
      <header className="head">
        <div className="kicker">Week {week} of 8 · {today === 'Mon' || today === 'Fri' ? 'rest day today' : today}</div>
        <h1>Workout</h1>
      </header>

      {session && (
        <Card className="resume">
          <div>
            <strong>{session.day} session in progress</strong>
            <div className="muted">Started {new Date(session.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
          </div>
          <div className="row">
            <button className="btn ghost" onClick={discard}>Discard</button>
            <button className="btn primary" onClick={onRun}>Resume</button>
          </div>
        </Card>
      )}

      <div className="days">
        {TRAINING_DAYS.map((d) => (
          <button key={d} className={`day ${d === day ? 'on' : ''} ${d === today ? 'today' : ''}`} onClick={() => setDay(d)}>
            {d}
          </button>
        ))}
      </div>

      <ul className="plan">
        {plan?.map(({ ex, last, decision }) => (
          <li key={ex.id}>
            <div className="plan-top">
              <span className="plan-name">{ex.name}</span>
              <DecisionTag d={decision} />
            </div>
            <div className="muted">
              {deload ? Math.ceil(ex.sets / 2) : ex.sets} × {ex.minReps}–{ex.maxReps} · rest {Math.floor(ex.restSec / 60)}:{String(ex.restSec % 60).padStart(2, '0')}
              {last && <> · last {last.load} {last.unit} × {last.reps.join('/')}</>}
            </div>
            {decision.load !== null && (
              <div className="target">
                Target {decision.load} {ex.unit} × {decision.reps.join('/')}
              </div>
            )}
          </li>
        ))}
        {plan?.length === 0 && <li className="muted">No exercises for {day}. Add some in Settings.</li>}
      </ul>

      <label className="toggle">
        <input type="checkbox" checked={deload} onChange={(e) => setDeload(e.target.checked)} />
        <span>
          Lighter week <span className="muted">— half the sets, same loads, not counted for progression</span>
        </span>
      </label>

      <button className="btn primary big" disabled={!!session || !plan?.length} onClick={begin}>
        Start {day} workout
      </button>
      <p className="hint">Warm up 5 min, then 2–3 lighter practice sets before the first lift. Only log work sets.</p>
    </>
  );
}
