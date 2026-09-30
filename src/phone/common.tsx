import { useEffect, useState, type ReactNode } from 'react';
import { useGame } from '../state/store';
import { goHome, togglePin, buyHint } from '../engine/director';
import { EVIDENCE } from '../content/evidence';
import { HINTS } from '../content/hints';
import { BALANCE } from '../engine/balance';
import type { PuzzleId } from '../types';

export function AppHeader({
  title,
  onBack,
  backLabel = 'Home',
  right,
  sub,
}: {
  title: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  right?: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <header className="app-header">
      <button className="back" onClick={onBack ?? goHome} aria-label={`Back to ${backLabel}`}>
        ‹ {backLabel}
      </button>
      <div className="app-title">
        <div>{title}</div>
        {sub && <div className="app-sub">{sub}</div>}
      </div>
      <div className="app-right">{right}</div>
    </header>
  );
}

export function PinButton({ id, compact }: { id: string; compact?: boolean }) {
  const pinned = useGame((s) => s.evidence.includes(id));
  const firstPin = useGame((s) => s.evidence.length === 0);
  const def = EVIDENCE[id];
  if (!def) return null;
  return (
    <button
      className={`pin-btn ${pinned ? 'pinned' : ''} ${firstPin ? 'pulse' : ''} ${compact ? 'compact' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        togglePin(id);
      }}
      aria-pressed={pinned}
      title={pinned ? 'Unpin from Evidence' : 'Pin to Evidence'}
    >
      📌{compact ? '' : pinned ? ' Pinned' : ' Pin clue'}
    </button>
  );
}

export function HintButton({ puzzle }: { puzzle: PuzzleId }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="hint-btn" onClick={() => setOpen(true)} aria-label="Hints">
        💡
      </button>
      {open && <HintSheet puzzle={puzzle} onClose={() => setOpen(false)} />}
    </>
  );
}

function HintSheet({ puzzle, onClose }: { puzzle: PuzzleId; onClose: () => void }) {
  const used = useGame((s) => s.hintsUsed[puzzle] ?? 0);
  const hint = HINTS[puzzle];
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Hints">
        <div className="sheet-grab" />
        <h3>💡 {hint.title}</h3>
        <p className="muted small">Each hint costs {BALANCE.cost.hint}% battery.</p>
        <ol className="hint-list">
          {hint.tiers.map((t, i) => (
            <li key={i} className={i < used ? 'revealed' : 'hidden'}>
              {i < used ? t : '••••••••••••'}
            </li>
          ))}
        </ol>
        {used < 3 ? (
          <button className="btn danger" onClick={() => buyHint(puzzle)}>
            Reveal hint {used + 1} · −{BALANCE.cost.hint}% 🔋
          </button>
        ) : (
          <p className="muted small">No more hints.</p>
        )}
        <button className="btn ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export function Keypad({
  title,
  subtitle,
  onSubmit,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  onSubmit: (code: string) => boolean;
  footer?: ReactNode;
}) {
  const [code, setCode] = useState('');
  const [wrong, setWrong] = useState(false);
  const [fails, setFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [, force] = useState(0);
  const locked = lockedUntil > Date.now();

  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => force((n) => n + 1), 500);
    return () => clearInterval(t);
  }, [locked]);

  const press = (d: string) => {
    if (locked || code.length >= 4) return;
    const next = code + d;
    setCode(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (!onSubmit(next)) {
          setWrong(true);
          const f = fails + 1;
          setFails(f);
          if (f % 5 === 0) setLockedUntil(Date.now() + 30_000);
          setTimeout(() => {
            setWrong(false);
            setCode('');
          }, 450);
        }
      }, 120);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      if (e.key === 'Backspace') setCode((c) => c.slice(0, -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="keypad-wrap">
      <div className="keypad-title">{locked ? 'Too many attempts' : title}</div>
      {subtitle && <div className="keypad-sub">{subtitle}</div>}
      <div className={`dots ${wrong ? 'shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < code.length ? 'on' : ''} />
        ))}
      </div>
      {locked && <div className="keypad-sub">Try again in {Math.ceil((lockedUntil - Date.now()) / 1000)}s</div>}
      <div className="keys">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              className={`key ${k === '⌫' ? 'key-del' : ''}`}
              disabled={locked}
              onClick={() => (k === '⌫' ? setCode((c) => c.slice(0, -1)) : press(k))}
            >
              {k}
            </button>
          ),
        )}
      </div>
      {footer}
    </div>
  );
}

/** Re-renders every `ms` — for clocks and progress bars. */
export function useTicker(ms: number, active = true) {
  const [, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setN((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms, active]);
}
