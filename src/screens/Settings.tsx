import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import { Card } from '../components';
import { db, getStartDate } from '../db';
import { download, exportCSV, exportJSON, importJSON } from '../export';
import { SEED } from '../seed';
import { requestNotifications } from '../timer';
import { TRAINING_DAYS, type Day, type Exercise, type Unit } from '../types';

export default function Settings() {
  const start = useLiveQuery(getStartDate);
  const [day, setDay] = useState<Day>('Tue');
  const exercises = useLiveQuery(
    async () => (await db.exercises.where('day').equals(day).toArray()).sort((a, b) => a.order - b.order),
    [day],
  );
  const file = useRef<HTMLInputElement>(null);
  const stamp = new Date().toLocaleDateString('en-CA');

  const move = async (ex: Exercise, dir: -1 | 1) => {
    const list = exercises!;
    const j = list.indexOf(ex) + dir;
    if (j < 0 || j >= list.length) return;
    await db.transaction('rw', db.exercises, async () => {
      await db.exercises.update(ex.id!, { order: list[j].order });
      await db.exercises.update(list[j].id!, { order: ex.order });
    });
  };

  const add = async () => {
    const order = Math.max(-1, ...(exercises ?? []).map((e) => e.order)) + 1;
    await db.exercises.add({ day, order, name: 'New exercise', sets: 2, minReps: 10, maxReps: 15, restSec: 75, unit: 'kg', increment: 2.5, note: '', active: true });
  };

  const remove = async (ex: Exercise) => {
    const used = await db.logs.where('exerciseId').equals(ex.id!).count();
    if (used) {
      if (confirm(`${ex.name} has ${used} logged sessions. Hide it instead of deleting?`)) await db.exercises.update(ex.id!, { active: false });
    } else if (confirm(`Delete ${ex.name}?`)) {
      await db.exercises.delete(ex.id!);
    }
  };

  const resetPlan = async () => {
    if (!confirm('Replace all exercises with the original 8-week plan? Exercises with logs are kept but hidden.')) return;
    await db.transaction('rw', db.exercises, db.logs, async () => {
      for (const ex of await db.exercises.toArray()) {
        const used = await db.logs.where('exerciseId').equals(ex.id!).count();
        if (used) await db.exercises.update(ex.id!, { active: false });
        else await db.exercises.delete(ex.id!);
      }
      await db.exercises.bulkAdd(SEED);
    });
  };

  const onImport = async (f?: File) => {
    if (!f) return;
    if (!confirm('Importing replaces ALL data on this phone with the backup. Continue?')) return;
    try {
      await importJSON(await f.text());
      alert('Backup restored.');
    } catch (e) {
      alert(`Import failed: ${(e as Error).message}`);
    }
    if (file.current) file.current.value = '';
  };

  return (
    <>
      <header className="head">
        <h1>Settings</h1>
      </header>

      <Card>
        <h2>Program</h2>
        <label>
          Start date (week 1)
          <input type="date" value={start ?? ''} onChange={(e) => db.meta.put({ key: 'startDate', value: e.target.value })} />
        </label>
        <button className="btn ghost" onClick={() => requestNotifications().then(() => alert(`Notifications: ${Notification.permission}`))}>
          Enable rest-over notifications
        </button>
      </Card>

      <Card>
        <h2>Exercises</h2>
        <p className="muted">Keep the same machine and unit for 6–8 weeks. Increment = the smallest jump available.</p>
        <div className="days">
          {TRAINING_DAYS.map((d) => (
            <button key={d} className={`day ${d === day ? 'on' : ''}`} onClick={() => setDay(d)}>{d}</button>
          ))}
        </div>
        {exercises?.map((ex) => <ExerciseEditor key={ex.id} ex={ex} onMove={move} onRemove={remove} />)}
        <button className="btn ghost" onClick={add}>+ Add exercise to {day}</button>
      </Card>

      <Card>
        <h2>Data</h2>
        <p className="muted">Everything is stored only on this phone. Back up regularly.</p>
        <div className="stack">
          <button className="btn primary" onClick={async () => download(`gymo-backup-${stamp}.json`, await exportJSON(), 'application/json')}>
            Back up (JSON)
          </button>
          <button className="btn ghost" onClick={() => file.current?.click()}>Restore from backup</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
          <button className="btn ghost" onClick={async () => download(`gymo-log-${stamp}.csv`, await exportCSV(), 'text/csv')}>
            Export log (CSV, spreadsheet layout)
          </button>
          <button className="btn ghost danger" onClick={resetPlan}>Reset exercises to original plan</button>
        </div>
      </Card>
    </>
  );
}

function ExerciseEditor({ ex, onMove, onRemove }: { ex: Exercise; onMove: (e: Exercise, d: -1 | 1) => void; onRemove: (e: Exercise) => void }) {
  const upd = (patch: Partial<Exercise>) => db.exercises.update(ex.id!, patch);
  const num = (k: 'sets' | 'minReps' | 'maxReps' | 'restSec' | 'increment', label: string) => (
    <label>
      {label}
      <input
        type="number"
        inputMode="decimal"
        defaultValue={ex[k]}
        onBlur={(e) => {
          const v = parseFloat(e.target.value);
          if (Number.isFinite(v) && v > 0) void upd({ [k]: v });
          else e.target.value = String(ex[k]);
        }}
      />
    </label>
  );
  return (
    <details className={`editor ${ex.active ? '' : 'inactive'}`}>
      <summary>
        <span>{ex.name}{!ex.active && ' (hidden)'}</span>
        <span className="muted">{ex.sets}×{ex.minReps}–{ex.maxReps} {ex.unit}</span>
      </summary>
      <label>
        Name
        <input defaultValue={ex.name} onBlur={(e) => e.target.value.trim() && upd({ name: e.target.value.trim() })} />
      </label>
      <div className="grid3">
        {num('sets', 'Sets')}
        {num('minReps', 'Min reps')}
        {num('maxReps', 'Max reps')}
        {num('restSec', 'Rest (s)')}
        {num('increment', 'Increment')}
        <label>
          Unit
          <select value={ex.unit} onChange={(e) => upd({ unit: e.target.value as Unit })}>
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </label>
      </div>
      <label>
        Machine / notes
        <input defaultValue={ex.note} onBlur={(e) => upd({ note: e.target.value })} />
      </label>
      <div className="row">
        <button className="btn ghost" onClick={() => onMove(ex, -1)}>↑</button>
        <button className="btn ghost" onClick={() => onMove(ex, 1)}>↓</button>
        <button className="btn ghost" onClick={() => upd({ active: !ex.active })}>{ex.active ? 'Hide' : 'Show'}</button>
        <button className="btn ghost danger" onClick={() => onRemove(ex)}>Delete</button>
      </div>
    </details>
  );
}
