import { useEffect, useState } from 'react';
import { useGame } from '../state/store';
import { endingsFound, loadCheckpoint } from '../engine/save';
import { clockFull, formatDuration } from '../engine/time';
import { ENDINGS, SECRET_ENDING, TOTAL_ENDINGS } from '../content/endings';
import { EVIDENCE_TOTAL } from '../content/evidence';
import { track } from '../analytics';

export function Ending({ onRetry, onTitle }: { onRetry: () => void; onTitle: () => void }) {
  const id = useGame((s) => s.ending);
  const stats = useGame((s) => s.endingStats);
  const hardcore = useGame((s) => s.settings.hardcore);
  const [stinger, setStinger] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [1, 2, 3, 4].map((n) => setTimeout(() => setStage(n), 900 * n));
    return () => timers.forEach(clearTimeout);
  }, []);

  const secret = !!stats && stats.leaked >= 2 && id !== 'too_late';
  useEffect(() => {
    if (!secret) return;
    const t = setTimeout(() => setStinger(true), 6500);
    return () => clearTimeout(t);
  }, [secret]);

  if (!id || !stats) return null;
  const e = ENDINGS[id];
  const found = endingsFound().length;
  const canRetry = !hardcore && !!loadCheckpoint();

  const shareText = [
    '🔋 DEAD BATTERY',
    `Ending ${e.number}/${TOTAL_ENDINGS}: "${e.title}"${secret ? ' + ???' : ''}`,
    `Battery left: ${stats.battery}%  ⏱ ${formatDuration(stats.timeMs)}`,
    `Evidence: ${stats.evidence}/${EVIDENCE_TOTAL}`,
    window.location.origin,
  ].join('\n');

  const share = async () => {
    track('share_clicked', { ending: id });
    try {
      if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
        await navigator.share({ text: shareText });
        return;
      }
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user cancelled */
    }
  };

  if (stinger) {
    return (
      <div className="ending stinger" onClick={() => setStinger(false)}>
        <div className="stinger-time">{clockFull()}</div>
        <div className="notif stinger-notif">
          <div className="notif-head">
            <span className="notif-app">💬 MESSAGES</span>
            <span className="notif-time">now</span>
          </div>
          <div className="notif-title">Unknown</div>
          <div className="notif-body">You shared your location with him.</div>
        </div>
        <div className="notif stinger-notif late">
          <div className="notif-head">
            <span className="notif-app">💬 MESSAGES</span>
            <span className="notif-time">now</span>
          </div>
          <div className="notif-title">Unknown</div>
          <div className="notif-body">Don't open the door.</div>
        </div>
        <p className="secret-label">
          Secret ending {SECRET_ENDING.number}/{TOTAL_ENDINGS}: “{SECRET_ENDING.title}”
        </p>
        <p className="muted small">tap to continue</p>
      </div>
    );
  }

  return (
    <div className={`ending tone-${e.tone}`}>
      <div className="ending-inner">
        <div className="ending-num">
          ENDING {e.number}/{TOTAL_ENDINGS}
        </div>
        <h1>{e.title}</h1>
        {stage >= 1 && <div className="headline">{e.headline}</div>}
        {e.epilogue.map((p, i) => stage >= i + 2 && <p key={i} className="epi">{p}</p>)}
        <div className="stats">
          <div>
            <b>{stats.battery}%</b>
            <span>battery left</span>
          </div>
          <div>
            <b>{formatDuration(stats.timeMs)}</b>
            <span>time</span>
          </div>
          <div>
            <b>
              {stats.evidence}/{EVIDENCE_TOTAL}
            </b>
            <span>evidence</span>
          </div>
        </div>
        <p className="muted small">
          Endings found: {found}/{TOTAL_ENDINGS}
        </p>
        <div className="ending-actions">
          <button className="btn primary" onClick={share}>
            {copied ? 'Copied! ✓' : 'Share result'}
          </button>
          {canRetry && (
            <button className="btn ghost" onClick={onRetry}>
              Try another path (last checkpoint)
            </button>
          )}
          <button className="btn ghost" onClick={onTitle}>
            Title screen
          </button>
        </div>
      </div>
    </div>
  );
}
