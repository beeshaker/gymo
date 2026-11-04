import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { activeSession } from './db';
import Diet from './screens/Diet';
import History from './screens/History';
import Runner from './screens/Runner';
import Settings from './screens/Settings';
import Today from './screens/Today';

type Tab = 'today' | 'diet' | 'history' | 'settings';

const LABELS: Record<Tab, string> = { today: 'Workout', diet: 'Diet', history: 'Progress', settings: 'Settings' };

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [running, setRunning] = useState(false);
  const session = useLiveQuery(activeSession, [], null);

  if (running && session) {
    return <Runner session={session} onExit={() => setRunning(false)} />;
  }

  return (
    <div className="app">
      <main className="screen">
        {tab === 'today' && <Today session={session ?? undefined} onRun={() => setRunning(true)} />}
        {tab === 'diet' && <Diet />}
        {tab === 'history' && <History />}
        {tab === 'settings' && <Settings />}
      </main>
      <nav className="tabs">
        {(Object.keys(LABELS) as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {LABELS[t]}
          </button>
        ))}
      </nav>
    </div>
  );
}
