import type { ReactNode } from 'react';
import type { Decision } from './progression';
import { addRest, skipRest, useRest } from './timer';

export function Stepper(props: {
  label: string;
  value: number;
  step: number;
  min?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  const { label, value, step, min = 0, suffix, onChange } = props;
  const set = (v: number) => onChange(Math.max(min, Math.round(v * 100) / 100));
  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-row">
        <button className="step" onClick={() => set(value - step)} aria-label={`Decrease ${label}`}>−</button>
        <label className="stepper-value">
          <input
            type="number"
            inputMode="decimal"
            value={Number.isFinite(value) ? value : ''}
            onChange={(e) => set(parseFloat(e.target.value) || 0)}
            onFocus={(e) => e.target.select()}
          />
          {suffix && <span className="suffix">{suffix}</span>}
        </label>
        <button className="step" onClick={() => set(value + step)} aria-label={`Increase ${label}`}>+</button>
      </div>
    </div>
  );
}

export function Chips<T extends string | number>(props: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="chips">
      {props.options.map((o) => (
        <button key={o.value} className={`chip ${props.value === o.value ? 'on' : ''}`} onClick={() => props.onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function DecisionTag({ d }: { d: Decision }) {
  return <span className={`tag tag-${d.kind}`}>{d.label}</span>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

const fmt = (s: number) => {
  const a = Math.abs(s);
  return `${s < 0 ? '+' : ''}${Math.floor(a / 60)}:${String(a % 60).padStart(2, '0')}`;
};

export function RestPanel() {
  const { state, left } = useRest();
  if (!state) return null;
  const done = left <= 0;
  const pct = done ? 1 : 1 - left / state.total;
  return (
    <div className={`rest ${done ? 'rest-done' : left <= 10 ? 'rest-soon' : ''}`}>
      <div className="rest-bar" style={{ transform: `scaleX(${pct})` }} />
      <div className="rest-main">
        <div>
          <div className="rest-kicker">{done ? 'Go!' : 'Rest'}</div>
          <div className="rest-time">{done ? '0:00' : fmt(left)}</div>
          <div className="rest-next">Next: {state.label}</div>
        </div>
        <div className="rest-actions">
          <button className="btn ghost" onClick={() => addRest(30)}>+30s</button>
          <button className="btn ghost" onClick={skipRest}>{done ? 'Close' : 'Skip'}</button>
        </div>
      </div>
    </div>
  );
}
