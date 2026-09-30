import { useGame, updateSettings } from '../state/store';
import { endingsFound, loadCheckpoint } from '../engine/save';
import { TOTAL_ENDINGS } from '../content/endings';

export function Title({ onNew, onContinue }: { onNew: () => void; onContinue: () => void }) {
  const settings = useGame((s) => s.settings);
  const save = loadCheckpoint();
  const found = endingsFound().length;

  return (
    <div className="title-screen">
      <div className="title-inner">
        <div className="title-phone" aria-hidden>
          <div className="tp-screen">
            <span className="tp-notif">Unknown: Put it back.</span>
            <span className="tp-batt">23%</span>
          </div>
        </div>
        <h1>
          DEAD
          <br />
          BATTERY
        </h1>
        <p className="tagline">You found a missing girl's phone. 23% battery left. Someone is still texting it.</p>
        <div className="title-actions">
          <button className="btn primary big" onClick={onNew}>
            Pick up the phone
          </button>
          {save && !settings.hardcore && (
            <button className="btn ghost" onClick={onContinue}>
              Continue · Chapter {save.chapter} ({Math.ceil(save.battery)}%)
            </button>
          )}
        </div>
        <div className="title-options">
          <label>
            <input type="checkbox" checked={settings.storyMode} onChange={(e) => updateSettings({ storyMode: e.target.checked })} />
            Story Mode <span className="muted">(slower battery drain)</span>
          </label>
          <label>
            <input type="checkbox" checked={settings.hardcore} onChange={(e) => updateSettings({ hardcore: e.target.checked })} />
            Hardcore <span className="muted">(no checkpoints)</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
            />
            Reduce motion & glitches
          </label>
        </div>
        <p className="fineprint">
          🎧 Best with headphones · ~30 min · Endings found: {found}/{TOTAL_ENDINGS}
          <br />
          Content note: suspense and implied threat. No gore. The battery drains in real time. Switching tabs turns the
          screen off.
        </p>
      </div>
    </div>
  );
}
