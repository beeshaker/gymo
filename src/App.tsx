import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { activeSession } from './db';
import History from './screens/History';
import Runner from './screens/Runner';
import Settings from './screens/Settings';
import Today from './screens/Today';

type Tab = 'today' | 'history' | 'settings';

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
        {tab === 'history' && <History />}
        {tab === 'settings' && <Settings />}
      </main>
      <nav className="tabs">
        {(['today', 'history', 'settings'] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {t === 'today' ? 'Workout' : t === 'history' ? 'Progress' : 'Settings'}
          </button>
        ))}
      </nav>
    </div>
  );
}
