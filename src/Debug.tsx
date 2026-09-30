import { useGame, setG, G } from './state/store';
import { advanceChapter, setFlag } from './engine/director';
import { drainRate } from './engine/battery';

/** ?debug=1 overlay for tuning and fast playtesting. */
export function Debug() {
  const s = useGame();
  const rate = drainRate({
    screen: s.screen,
    inCall: s.overlay?.kind === 'call' && s.overlay.answered,
    brightness: s.brightness,
    lowPower: s.lowPower,
    screenOff: s.screenOff,
    storyMode: s.settings.storyMode,
  });
  return (
    <div className="debug">
      <div>
        🔋 {s.battery.toFixed(2)}% · {(rate * 60).toFixed(3)}%/min · ch{s.chapter} · t={(s.gameTimeMs / 1000).toFixed(0)}s ·
        idle={((s.gameTimeMs - s.lastProgressMs) / 1000).toFixed(0)}s · x{s.timeScale}
      </div>
      <div className="debug-row">
        <button onClick={() => setG({ battery: Math.min(100, G().battery + 5) })}>+5%</button>
        <button onClick={() => setG({ battery: Math.max(0.5, G().battery - 5) })}>-5%</button>
        <button onClick={() => setG({ timeScale: G().timeScale === 1 ? 10 : 1 })}>x10</button>
        <button onClick={advanceChapter}>next ch</button>
        <button
          onClick={() => {
            setFlag('phoneUnlocked', true);
            setG({ screen: 'home' });
          }}
        >
          unlock
        </button>
        <button onClick={() => setFlag('notesUnlocked', true)}>notes</button>
      </div>
      <details>
        <summary>flags / fired</summary>
        <pre>{JSON.stringify({ flags: s.flags, fired: Object.keys(s.fired), board: s.board }, null, 1)}</pre>
      </details>
    </div>
  );
}
