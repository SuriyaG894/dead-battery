import { useEffect, useRef, useState } from 'react';
import { useGame } from '../state/store';
import {
  answerCall,
  declineCall,
  dismissAlert,
  endCall,
  isAppDisabled,
  openFromBanner,
  openScreen,
  setBrightness,
  setLowPower,
  sleep,
  tryUnlockPhone,
} from '../engine/director';
import { BALANCE } from '../engine/balance';
import { clock, clockFull, longDate, relativeStamp } from '../engine/time';
import { CALLS } from '../content/calls';
import { LOCK_HINT } from '../content/lock';
import { voice } from '../audio/voice';
import { sfx } from '../audio/sfx';
import { HintButton, Keypad, useTicker } from './common';
import { Scene } from './Scene';
import type { AppId } from '../types';

// ---------------------------------------------------------------------------
// Status bar + Control Center
// ---------------------------------------------------------------------------

export function StatusBar({ onOpenControl }: { onOpenControl: () => void }) {
  useTicker(10_000);
  const battery = useGame((s) => s.battery);
  const lowPower = useGame((s) => s.lowPower);
  const chapter = useGame((s) => s.chapter);
  const pct = Math.max(0, Math.ceil(battery));
  const level = battery < BALANCE.thresholds.red ? 'red' : lowPower ? 'yellow' : 'white';
  const bars = chapter === 3 ? 1 : chapter === 2 ? 2 : 3;
  return (
    <div className="status-bar" onClick={onOpenControl} role="button" aria-label="Open control center">
      <span className="sb-time">{clock()}</span>
      <span className="sb-right">
        <span className="sb-signal" aria-label={`${bars} bars`}>
          {[1, 2, 3, 4].map((i) => (
            <i key={i} className={i <= bars ? 'on' : ''} style={{ height: 3 + i * 2 }} />
          ))}
        </span>
        <span className={`sb-pct ${level}`}>{pct}%</span>
        <span className={`sb-battery ${level}`}>
          <i style={{ width: `${Math.min(100, battery)}%` }} />
        </span>
      </span>
    </div>
  );
}

export function ControlCenter({ onClose, muted, setMuted }: { onClose: () => void; muted: boolean; setMuted: (m: boolean) => void }) {
  const brightness = useGame((s) => s.brightness);
  const lowPower = useGame((s) => s.lowPower);
  const battery = useGame((s) => s.battery);
  const canLowPower = battery < BALANCE.lowPower.unlockAt || lowPower;
  return (
    <div className="cc-backdrop" onClick={onClose}>
      <div className="cc" onClick={(e) => e.stopPropagation()}>
        <div className="cc-row">
          <button
            className={`cc-tile ${lowPower ? 'on yellow' : ''}`}
            disabled={!canLowPower}
            onClick={() => setLowPower(!lowPower)}
          >
            <span>🔋</span>
            <small>{canLowPower ? 'Low Power' : `Low Power at ${BALANCE.lowPower.unlockAt}%`}</small>
          </button>
          <button className={`cc-tile ${muted ? 'on' : ''}`} onClick={() => setMuted(!muted)}>
            <span>{muted ? '🔕' : '🔔'}</span>
            <small>{muted ? 'Silent' : 'Sound on'}</small>
          </button>
          <button
            className="cc-tile"
            onClick={() => {
              onClose();
              sleep();
            }}
          >
            <span>⏻</span>
            <small>Screen off (pause)</small>
          </button>
        </div>
        <label className="cc-slider">
          <span>☀️ Brightness · dimmer saves battery</span>
          <input
            type="range"
            min={BALANCE.brightness.min}
            max={BALANCE.brightness.max}
            step={0.05}
            value={brightness}
            onChange={(e) => setBrightness(parseFloat(e.target.value))}
          />
        </label>
        <button className="btn ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lock screen
// ---------------------------------------------------------------------------

export function LockScreen() {
  useTicker(10_000);
  const notifs = useGame((s) => s.lockNotifs);
  const [keypad, setKeypad] = useState(false);
  return (
    <div className="lock">
      <Scene id="dog" className="lock-wall" />
      <div className="lock-dim" />
      {!keypad ? (
        <div className="lock-content" onClick={() => setKeypad(true)}>
          <div className="lock-top">
            <div className="lock-icon">🔒</div>
            <div className="lock-date">{longDate()}</div>
            <div className="lock-time">{clock()}</div>
          </div>
          <div className="lock-notifs">
            {notifs.map((n) => (
              <div key={n.id} className="notif">
                <div className="notif-head">
                  <span className="notif-app">{appEmoji(n.app)} {n.app.toUpperCase()}</span>
                  <span className="notif-time">{relativeStamp(n.ts).replace(/^Today /, '')}</span>
                </div>
                <div className="notif-title">{n.title}</div>
                <div className="notif-body">{n.body}</div>
              </div>
            ))}
          </div>
          <button className="lock-swipe">Tap to unlock</button>
        </div>
      ) : (
        <div className="lock-keypad">
          <Keypad
            title="Enter Passcode"
            subtitle={<span className="lock-hint">{LOCK_HINT}</span>}
            onSubmit={tryUnlockPhone}
            footer={
              <div className="keypad-footer">
                <button className="link" onClick={() => setKeypad(false)}>
                  Cancel
                </button>
                <HintButton puzzle="lock" />
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}

function appEmoji(app: string) {
  return (
    { Messages: '💬', Phone: '📞', Photos: '🌄', Lumen: '✨', Battery: '🔋', Settings: '⚙️', Evidence: '🗂️' } as Record<string, string>
  )[app] ?? '🔔';
}

// ---------------------------------------------------------------------------
// Home screen
// ---------------------------------------------------------------------------

const APPS: { id: AppId; name: string; icon: string; bg: string }[] = [
  { id: 'messages', name: 'Messages', icon: '💬', bg: 'linear-gradient(#5bf675,#1fc93c)' },
  { id: 'photos', name: 'Photos', icon: '🌄', bg: 'linear-gradient(#fff,#e9e9ee)' },
  { id: 'maps', name: 'Maps', icon: '🗺️', bg: 'linear-gradient(#b8e6a5,#6cc0f0)' },
  { id: 'notes', name: 'Notes', icon: '📝', bg: 'linear-gradient(#fff6b0,#ffd84a)' },
  { id: 'voice', name: 'Voice Memos', icon: '🎙️', bg: 'linear-gradient(#333,#111)' },
  { id: 'phone', name: 'Phone', icon: '📞', bg: 'linear-gradient(#5bf675,#1fc93c)' },
  { id: 'browser', name: 'Browser', icon: '🧭', bg: 'linear-gradient(#e9f3ff,#9cc7ff)' },
  { id: 'settings', name: 'Settings', icon: '⚙️', bg: 'linear-gradient(#b8bcc4,#7d828c)' },
  { id: 'evidence', name: 'Evidence', icon: '🗂️', bg: 'linear-gradient(#ff6b5a,#c0271b)' },
];

export function HomeScreen() {
  const unread = useGame((s) => Object.values(s.unread).reduce((a, b) => a + (b ?? 0), 0));
  const phoneBadge = useGame((s) => (s.viewed['app:phone'] ? 0 : 14));
  const evidence = useGame((s) => s.evidence.length);
  const finalUnlocked = useGame((s) => !!s.flags.finalUnlocked);
  useGame((s) => s.lowPower);
  const badge: Partial<Record<AppId, number | string>> = {
    messages: unread,
    phone: phoneBadge,
    evidence: finalUnlocked ? '!' : evidence,
  };
  return (
    <div className="home">
      <div className="home-wall" />
      <div className="app-grid">
        {APPS.map((a) => {
          const b = badge[a.id];
          return (
            <button
              key={a.id}
              className={`app-icon ${isAppDisabled(a.id) ? 'disabled' : ''}`}
              onClick={() => openScreen(a.id)}
            >
              <span className="icon" style={{ background: a.bg }}>
                {a.icon}
                {!!b && <span className="badge">{b}</span>}
              </span>
              <span className="app-name">{a.name}</span>
            </button>
          );
        })}
      </div>
      <div className="home-widget">
        <div className="widget-title">⚠️ MISSING</div>
        <div className="widget-body">
          Maya Reyes, 19 · last seen Harbor Rd, yesterday 9:31 PM. Call Port Halden PD with any information.
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------

export function BannerView() {
  const banner = useGame((s) => s.banner);
  const screen = useGame((s) => s.screen);
  if (!banner || screen === 'lock') return null;
  return (
    <button className="banner" key={banner.id} onClick={() => openFromBanner(banner)}>
      <span className="notif-app">
        {appEmoji(banner.app)} {banner.app.toUpperCase()} · now
      </span>
      <span className="notif-title">{banner.title}</span>
      <span className="notif-body">{banner.body}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Calls & alerts
// ---------------------------------------------------------------------------

export function OverlayView() {
  const overlay = useGame((s) => s.overlay);
  if (!overlay) return null;
  if (overlay.kind === 'alert') return <AlertView alertId={overlay.alertId} />;
  return <CallView key={overlay.callId} callId={overlay.callId} answered={overlay.answered} startedAt={overlay.startedAt} />;
}

function CallView({ callId, answered, startedAt }: { callId: string; answered: boolean; startedAt: number }) {
  const call = CALLS[callId];
  const gameTime = useGame((s) => s.gameTimeMs);
  const reducedMotion = useGame((s) => s.settings.reducedMotion);
  const elapsed = Math.max(0, (gameTime - startedAt) / 1000);
  const lineIdx = answered ? call.lines.reduce((acc, l, i) => (elapsed >= l.at ? i : acc), -1) : -1;
  const spoken = useRef(-1);
  const line = lineIdx >= 0 ? call.lines[lineIdx] : null;
  const revealed = call.revealAt !== undefined && lineIdx >= call.revealAt;

  useEffect(() => {
    if (!answered || lineIdx < 0 || spoken.current === lineIdx) return;
    spoken.current = lineIdx;
    const l = call.lines[lineIdx];
    voice.speak(l.text, l.distorted);
    if (call.revealAt === lineIdx) {
      useGame.setState({ glitchUntil: performance.now() + 700 });
      sfx.glitch(700);
    }
  }, [answered, lineIdx, call]);

  return (
    <div className={`call ${answered ? 'answered' : 'ringing'} ${reducedMotion ? '' : 'animated'}`}>
      <div className="call-top">
        <div className="call-avatar">{revealed ? '🙂' : '?'}</div>
        <div className="call-name">{revealed ? 'Maya' : call.caller}</div>
        <div className="call-status">
          {answered ? `${Math.floor(elapsed / 60)}:${String(Math.floor(elapsed % 60)).padStart(2, '0')}` : 'incoming call…'}
        </div>
      </div>
      {answered && (
        <div className="call-captions" aria-live="polite">
          {line ? (
            <p className={line.distorted ? 'distorted' : 'clear'}>
              {line.distorted ? '🔊 [distorted] ' : '🔊 '}
              {line.text}
            </p>
          ) : (
            <p className="muted">[breathing]</p>
          )}
          <div className={`wave ${line?.distorted ? 'rough' : ''}`}>
            {Array.from({ length: 24 }).map((_, i) => (
              <i key={i} style={{ animationDelay: `${(i * 67) % 500}ms` }} />
            ))}
          </div>
          <p className="muted small">🔋 Calls drain battery ×{BALANCE.callMultiplier}</p>
        </div>
      )}
      <div className="call-actions">
        {answered ? (
          <button className="call-btn red" onClick={endCall} aria-label="Hang up">
            📵
          </button>
        ) : (
          <>
            <button className="call-btn red" onClick={declineCall} aria-label="Decline">
              📵
            </button>
            <button className="call-btn green" onClick={answerCall} aria-label="Answer">
              📞
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AlertView({ alertId }: { alertId: string }) {
  if (alertId === 'lowBattery') {
    return (
      <div className="alert-backdrop">
        <div className="alert" role="alertdialog">
          <h4>Low Battery</h4>
          <p>10% of battery remaining. You can turn on Low Power Mode to make the battery last longer, but Maps and Browser will stop working.</p>
          <div className="alert-actions">
            <button onClick={() => dismissAlert('lowPower')}>Low Power Mode</button>
            <button onClick={() => dismissAlert()}>Close</button>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function ScreenOff() {
  return (
    <div className="screen-off">
      <div>
        <div className="so-time">{clockFull()}</div>
        <p>Screen off · game paused, battery drain slowed</p>
        <p className="muted small">Tap to wake</p>
      </div>
    </div>
  );
}
