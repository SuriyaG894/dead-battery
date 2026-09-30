import { useState } from 'react';
import { useGame } from '../state/store';
import { decide, setBoard, togglePin } from '../engine/director';
import { EVIDENCE, EVIDENCE_TOTAL } from '../content/evidence';
import { AppHeader, HintButton } from '../phone/common';
import type { EvidenceCategory, Recipient } from '../types';

const SLOTS: { key: EvidenceCategory; label: string; q: string }[] = [
  { key: 'who', label: 'WHO', q: 'Who is after her?' },
  { key: 'where', label: 'WHERE', q: 'Where is she?' },
  { key: 'why', label: 'WHY', q: 'Why did she run?' },
];

const RECIPIENTS: { id: Recipient; label: string; icon: string }[] = [
  { id: 'police', label: 'Text 911', icon: '🚓' },
  { id: 'unknown', label: 'Reply to Unknown', icon: '❓' },
  { id: 'mom', label: 'Mom', icon: '💗' },
  { id: 'sam', label: 'Sam – Lumen', icon: '👔' },
];

export function Evidence() {
  const pinned = useGame((s) => s.evidence);
  const board = useGame((s) => s.board);
  const finalUnlocked = useGame((s) => !!s.flags.finalUnlocked);
  const revealed = useGame((s) => !!s.flags.mayaRevealed);
  const [confirm, setConfirm] = useState<Recipient | null>(null);
  const complete = !!(board.who && board.where && board.why);

  return (
    <div className="app evidence">
      <AppHeader title="Case Board" sub={`Evidence found: ${pinned.length}/${EVIDENCE_TOTAL}`} />
      <div className="evidence-scroll">
        <section className="board">
          {SLOTS.map((slot) => {
            const options = pinned.filter((id) => EVIDENCE[id]?.category === slot.key);
            const current = board[slot.key];
            return (
              <div key={slot.key} className={`slot ${current ? 'filled' : ''}`}>
                <div className="slot-head">
                  <b>{slot.label}</b>
                  <span className="muted small">{slot.q}</span>
                  {slot.key === 'who' && <HintButton puzzle="who" />}
                  {slot.key === 'where' && <HintButton puzzle="where" />}
                </div>
                {options.length === 0 ? (
                  <div className="muted small">Pin a clue about {slot.label.toLowerCase()} first.</div>
                ) : (
                  <div className="slot-options">
                    {options.map((id) => (
                      <button
                        key={id}
                        className={`opt ${current === id ? 'on' : ''}`}
                        onClick={() => setBoard(slot.key, current === id ? undefined : id)}
                      >
                        {EVIDENCE[id].icon} {EVIDENCE[id].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {finalUnlocked ? (
          <section className="final">
            <h4>Send her location to…</h4>
            {!complete && <p className="muted small">Fill in WHO, WHERE and WHY to build your case first.</p>}
            {!revealed && complete && (
              <p className="muted small">Are you sure you know who to trust?</p>
            )}
            <div className="recipients">
              {RECIPIENTS.map((r) => (
                <button key={r.id} className="recipient" disabled={!complete} onClick={() => setConfirm(r.id)}>
                  <span>{r.icon}</span>
                  {r.id === 'unknown' && revealed ? 'Maya (burner)' : r.label}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <p className="muted small pad">
            Pin clues from messages, photos, maps and notes with 📌. Once you know where she is, you can send her location from here.
          </p>
        )}

        <section>
          <h4 className="list-head">Pinned clues</h4>
          {pinned.length === 0 && <p className="muted small pad">Nothing pinned yet. Look for the 📌 button.</p>}
          <ul className="clue-list">
            {pinned.map((id) => {
              const e = EVIDENCE[id];
              return (
                <li key={id} className="clue">
                  <span className="clue-icon">{e.icon}</span>
                  <div>
                    <b>{e.label}</b>
                    <div className="small muted">{e.detail}</div>
                  </div>
                  <button className="link small" onClick={() => togglePin(id)}>
                    Unpin
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {confirm && (
        <div className="alert-backdrop">
          <div className="alert" role="alertdialog">
            <h4>Send her location?</h4>
            <p>
              To: <b>{RECIPIENTS.find((r) => r.id === confirm)?.label}</b>
              <br />
              You can't take this back.
            </p>
            <div className="alert-actions">
              <button
                onClick={() => {
                  const r = confirm;
                  setConfirm(null);
                  decide(r);
                }}
              >
                Send
              </button>
              <button onClick={() => setConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
