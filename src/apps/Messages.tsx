import { useEffect, useRef } from 'react';
import { useGame } from '../state/store';
import { chooseReply, openThread, threadTitle } from '../engine/director';
import { relativeStamp, shortStamp } from '../engine/time';
import { CONTACT_NUMBERS, THREAD_ORDER } from '../content/threads';
import { PHOTOS } from '../content/media';
import { AppHeader, PinButton } from '../phone/common';
import { Scene } from '../phone/Scene';
import type { ThreadId } from '../types';

const AVATAR: Record<ThreadId, { bg: string; label: string }> = {
  priya: { bg: '#e9a23b', label: 'P' },
  jordan: { bg: '#5b7cfa', label: 'J' },
  mom: { bg: '#e0607e', label: 'M' },
  sam: { bg: '#6d4cf0', label: 'S' },
  unknown: { bg: '#3a3d44', label: '?' },
  police: { bg: '#1f4fa8', label: '911' },
};

export function Messages() {
  const openId = useGame((s) => s.openThread);
  return openId ? <Thread id={openId} /> : <ThreadList />;
}

function ThreadList() {
  const threads = useGame((s) => s.threads);
  const unread = useGame((s) => s.unread);
  const typing = useGame((s) => s.typing);
  useGame((s) => s.flags.mayaRevealed);
  const ids = THREAD_ORDER.filter((t) => threads[t].length > 0).sort((a, b) => {
    const la = threads[a][threads[a].length - 1]?.ts ?? 0;
    const lb = threads[b][threads[b].length - 1]?.ts ?? 0;
    return lb - la;
  });
  return (
    <div className="app messages">
      <AppHeader title="Messages" />
      <ul className="thread-list">
        {ids.map((id) => {
          const last = threads[id][threads[id].length - 1];
          const u = unread[id] ?? 0;
          return (
            <li key={id}>
              <button className="thread-row" onClick={() => openThread(id)}>
                <span className={`unread-dot ${u ? 'on' : ''}`} />
                <span className="avatar" style={{ background: AVATAR[id].bg }}>
                  {AVATAR[id].label}
                </span>
                <span className="thread-main">
                  <span className="thread-top">
                    <b>{threadTitle(id)}</b>
                    <span className="muted small">{shortStamp(last.ts)}</span>
                  </span>
                  <span className="thread-preview">
                    {typing[id] ? <i>typing…</i> : last.photo ? '📷 Photo' : `${last.from === 'me' ? 'You: ' : ''}${last.body}`}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Thread({ id }: { id: ThreadId }) {
  const msgs = useGame((s) => s.threads[id]);
  const typing = useGame((s) => !!s.typing[id]);
  const replies = useGame((s) => s.replies[id]);
  useGame((s) => s.flags.mayaRevealed);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [msgs.length, typing, replies]);

  let lastTs = 0;
  return (
    <div className="app messages thread">
      <AppHeader
        title={
          <span className="thread-head">
            <span className="avatar sm" style={{ background: AVATAR[id].bg }}>
              {AVATAR[id].label}
            </span>
            {threadTitle(id)}
          </span>
        }
        sub={CONTACT_NUMBERS[id]}
        onBack={() => openThread(null)}
        backLabel="Messages"
      />
      <div className="bubbles">
        {msgs.map((m) => {
          const showStamp = m.ts - lastTs > 45 * 60_000;
          lastTs = m.ts;
          const photo = m.photo ? PHOTOS.find((p) => p.id === m.photo) : undefined;
          return (
            <div key={m.id}>
              {showStamp && <div className="stamp">{relativeStamp(m.ts)}</div>}
              <div className={`bubble-row ${m.from}`}>
                <div className={`bubble ${m.from} ${id === 'unknown' && m.from === 'them' ? 'unknown' : ''}`}>
                  {photo && <Scene id={photo.scene} className="bubble-photo" />}
                  {m.body}
                </div>
                {m.evidence && <PinButton id={m.evidence} compact />}
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="bubble-row them">
            <div className="bubble them typing">
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="composer">
        {replies ? (
          <div className="reply-chips">
            {replies.map((r) => (
              <button key={r.id} className={`chip ${r.body ? '' : 'ghost'}`} onClick={() => chooseReply(id, r)}>
                {r.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="fake-input">{id === 'police' ? 'Text 911' : 'iMessage'}</div>
        )}
      </div>
    </div>
  );
}
