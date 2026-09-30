import { useEffect, useRef, useState } from 'react';
import { useGame, updateSettings } from '../state/store';
import { markViewed, playVoicemail, setBrightness, setLowPower, tryUnlockNotes } from '../engine/director';
import { BALANCE } from '../engine/balance';
import { drainRate } from '../engine/battery';
import { MEMOS, NOTES, RECENTS, SEARCHES, VOICEMAILS, type MemoDef, type NoteDef } from '../content/media';
import { voice } from '../audio/voice';
import { sfx } from '../audio/sfx';
import { AppHeader, HintButton, Keypad, PinButton } from '../phone/common';
import type { ScreenId } from '../types';

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export function Notes() {
  const unlocked = useGame((s) => !!s.flags.notesUnlocked);
  const [open, setOpen] = useState<NoteDef | null>(null);

  useEffect(() => {
    if (!unlocked) markViewed('notes:locked');
  }, [unlocked]);

  if (!unlocked) {
    return (
      <div className="app notes locked">
        <AppHeader title="Notes" />
        <div className="notes-lock">
          <div className="big-icon">🔒</div>
          <Keypad
            title="Notes are locked"
            subtitle="Enter the notes passcode"
            onSubmit={tryUnlockNotes}
            footer={
              <div className="keypad-footer">
                <span />
                <HintButton puzzle="notes" />
              </div>
            }
          />
        </div>
      </div>
    );
  }

  if (open) {
    return (
      <div className="app notes note-detail">
        <AppHeader title="" onBack={() => setOpen(null)} backLabel="Notes" />
        <article className="note-body">
          <h2>{open.title}</h2>
          {open.body.split('\n').map((line, i) => (
            <p key={i}>{line || ' '}</p>
          ))}
          {open.evidence && <PinButton id={open.evidence} />}
        </article>
      </div>
    );
  }

  return (
    <div className="app notes">
      <AppHeader title="Notes" />
      <ul className="list">
        {NOTES.map((n) => (
          <li key={n.id}>
            <button
              className="list-row"
              onClick={() => {
                markViewed(`note:${n.id}`);
                setOpen(n);
              }}
            >
              <b>
                {n.pinned ? '📌 ' : ''}
                {n.title}
              </b>
              <span className="muted small">{n.preview}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Voice Memos
// ---------------------------------------------------------------------------

export function Voice() {
  const [playing, setPlaying] = useState<string | null>(null);
  return (
    <div className="app voice">
      <AppHeader title="Voice Memos" />
      <ul className="list">
        {MEMOS.map((m) => (
          <li key={m.id}>
            <Memo memo={m} playing={playing === m.id} onPlay={() => setPlaying(m.id)} onDone={() => setPlaying(null)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Memo({ memo, playing, onPlay, onDone }: { memo: MemoDef; playing: boolean; onPlay: () => void; onDone: () => void }) {
  const flags = useGame((s) => s.flags);
  const played = useGame((s) => !!s.viewed[`memo:${memo.id}`]);
  const [shown, setShown] = useState(played ? memo.segments.length : 0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const play = () => {
    onPlay();
    markViewed(`memo:${memo.id}`);
    setShown(0);
    timers.current.forEach(clearTimeout);
    voice.cancel();
    let t = 300;
    memo.segments.forEach((seg, i) => {
      const available = !seg.requires || flags[seg.requires];
      timers.current.push(
        setTimeout(() => {
          setShown(i + 1);
          if (available) voice.speak(seg.text, false);
          else sfx.staticHiss(1.5);
        }, t),
      );
      t += available ? 1200 + seg.text.length * 55 : 1600;
    });
    timers.current.push(setTimeout(onDone, t));
  };

  return (
    <div className="memo">
      <div className="memo-head">
        <div>
          <b>{memo.title}</b>
          <div className="muted small">
            {memo.when} · {memo.duration}
          </div>
        </div>
        <button className="play" onClick={play} aria-label="Play">
          {playing ? '◼' : '▶'}
        </button>
      </div>
      {shown > 0 && (
        <div className="transcript">
          {memo.segments.slice(0, shown).map((seg, i) => {
            const available = !seg.requires || flags[seg.requires];
            return (
              <p key={i} className={available ? '' : 'corrupt'}>
                {available ? (
                  <>
                    <b>{seg.speaker}:</b> {seg.text}
                  </>
                ) : (
                  '▒▒▒ [audio corrupted · data missing] ▒▒▒'
                )}
              </p>
            );
          })}
          {memo.segments.some((s) => s.requires && !flags[s.requires]) && shown >= memo.segments.length && (
            <p className="muted small">Part of this recording is corrupted. Maybe the rest was backed up somewhere…</p>
          )}
          {memo.evidence && <PinButton id={memo.evidence} />}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phone
// ---------------------------------------------------------------------------

export function PhoneApp() {
  const [tab, setTab] = useState<'recents' | 'voicemail'>('recents');
  const viewed = useGame((s) => s.viewed);
  return (
    <div className="app phone">
      <AppHeader title={tab === 'recents' ? 'Recents' : 'Voicemail'} />
      <div className="seg">
        <button className={tab === 'recents' ? 'on' : ''} onClick={() => setTab('recents')}>
          Recents
        </button>
        <button className={tab === 'voicemail' ? 'on' : ''} onClick={() => setTab('voicemail')}>
          Voicemail
        </button>
      </div>
      {tab === 'recents' ? (
        <ul className="list">
          {RECENTS.map((r, i) => (
            <li key={i} className="list-row static">
              <b className={r.missed ? 'missed' : ''}>{r.name}</b>
              <span className="muted small">
                {r.detail} · {r.when}
              </span>
            </li>
          ))}
          <li className="muted small pad">You can't place calls from a phone that isn't yours.</li>
        </ul>
      ) : (
        <ul className="list">
          {VOICEMAILS.map((v) => {
            const heard = !!viewed[`voicemail:${v.id}`];
            return (
              <li key={v.id} className="list-row static">
                <div className="row between">
                  <b>{v.from}</b>
                  <span className="muted small">{v.when}</span>
                </div>
                {heard ? (
                  <p className="transcript-text">“{v.text}”</p>
                ) : (
                  <button
                    className="btn small"
                    onClick={() => {
                      playVoicemail(v.id);
                      voice.speak(v.text, false);
                    }}
                  >
                    ▶ Play · −{BALANCE.cost.playVoicemail}% 🔋
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Browser
// ---------------------------------------------------------------------------

export function Browser() {
  const [page, setPage] = useState<'history' | 'lumen'>('history');
  if (page === 'lumen') {
    return (
      <div className="app browser">
        <AppHeader title="lumen.app/about" onBack={() => setPage('history')} backLabel="History" />
        <div className="web lumen-page">
          <div className="lumen-hero">
            <h2>lumen ✨</h2>
            <p>Your wellness, your way. Trusted by 2 million people.</p>
          </div>
          <h3>Our team</h3>
          {[
            { n: 'Dana Voss', r: 'Founder & CEO', q: '"Privacy is our promise."' },
            { n: 'Sam Okafor', r: 'Partner Relations', q: '"I make problems go away."' },
            { n: 'Maya Reyes', r: 'Data Ops Intern', q: '"Excited to learn!"' },
          ].map((p) => (
            <div key={p.n} className="team">
              <span className="avatar" style={{ background: p.n === 'Sam Okafor' ? '#6d4cf0' : '#777' }}>
                {p.n[0]}
              </span>
              <div>
                <b>{p.n}</b>
                <div className="muted small">{p.r}</div>
                <div className="small">{p.q}</div>
              </div>
            </div>
          ))}
          <p className="muted small">© Lumen Wellness Inc. · Harbor Tech Park, Port Halden</p>
        </div>
      </div>
    );
  }
  return (
    <div className="app browser">
      <AppHeader title="History" />
      <button
        className="tab-card"
        onClick={() => {
          markViewed('page:lumen');
          setPage('lumen');
        }}
      >
        <b>Open tab:</b> Lumen — About Us
        <span className="muted small">lumen.app/about</span>
      </button>
      <h4 className="list-head">Searches</h4>
      <ul className="list">
        {SEARCHES.map((s) => (
          <li key={s.q} className="list-row static">
            <span>🔎 {s.q}</span>
            <span className="row between">
              <span className="muted small">{s.when}</span>
              {s.evidence && <PinButton id={s.evidence} compact />}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const USAGE: { screen: ScreenId; label: string }[] = [
  { screen: 'maps', label: 'Maps' },
  { screen: 'browser', label: 'Browser' },
  { screen: 'voice', label: 'Voice Memos' },
  { screen: 'photos', label: 'Photos' },
  { screen: 'messages', label: 'Messages' },
  { screen: 'notes', label: 'Notes' },
];

export function Settings() {
  const brightness = useGame((s) => s.brightness);
  const lowPower = useGame((s) => s.lowPower);
  const battery = useGame((s) => s.battery);
  const settings = useGame((s) => s.settings);
  const canLowPower = battery < BALANCE.lowPower.unlockAt || lowPower;
  const base = (screen: ScreenId) =>
    drainRate({ screen, inCall: false, brightness, lowPower, screenOff: false, storyMode: settings.storyMode });
  const minutesLeft = Math.floor(battery / base('home') / 60);

  return (
    <div className="app settings">
      <AppHeader title="Settings" />
      <div className="group">
        <div className="group-title">Battery</div>
        <div className="set-row">
          <span>Battery level</span>
          <b>{Math.ceil(battery)}%</b>
        </div>
        <div className="set-row">
          <span>Estimated time left (idle)</span>
          <b>~{minutesLeft} min</b>
        </div>
        <label className="set-row">
          <span>Low Power Mode{canLowPower ? '' : ` (at ${BALANCE.lowPower.unlockAt}%)`}</span>
          <input type="checkbox" checked={lowPower} disabled={!canLowPower} onChange={(e) => setLowPower(e.target.checked)} />
        </label>
        <label className="set-col">
          <span>Brightness</span>
          <input
            type="range"
            min={BALANCE.brightness.min}
            max={BALANCE.brightness.max}
            step={0.05}
            value={brightness}
            onChange={(e) => setBrightness(parseFloat(e.target.value))}
          />
        </label>
        <div className="group-title">Battery usage by app</div>
        {USAGE.map((u) => {
          const r = base(u.screen) / base('home');
          return (
            <div key={u.screen} className="usage">
              <span>{u.label}</span>
              <div className="bar">
                <i style={{ width: `${Math.min(100, r * 40)}%` }} />
              </div>
              <span className="muted small">×{r.toFixed(1)}</span>
            </div>
          );
        })}
      </div>
      <div className="group">
        <div className="group-title">Accessibility</div>
        <label className="set-row">
          <span>Story Mode (slower battery drain)</span>
          <input type="checkbox" checked={settings.storyMode} onChange={(e) => updateSettings({ storyMode: e.target.checked })} />
        </label>
        <label className="set-row">
          <span>Reduce motion & glitches</span>
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
          />
        </label>
        <div className="set-row">
          <span>Text size</span>
          <span className="seg inline">
            {([1, 1.15, 1.3] as const).map((t) => (
              <button key={t} className={settings.textScale === t ? 'on' : ''} onClick={() => updateSettings({ textScale: t })}>
                {t === 1 ? 'A' : t === 1.15 ? 'A+' : 'A++'}
              </button>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
