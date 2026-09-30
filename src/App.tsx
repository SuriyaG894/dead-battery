import { useEffect } from 'react';
import { freshGame, G, pickGameData, setG, useGame } from './state/store';
import { sleep, tick } from './engine/director';
import { clearCheckpoint, loadCheckpoint, saveCheckpoint } from './engine/save';
import { sfx } from './audio/sfx';
import { voice } from './audio/voice';
import { track } from './analytics';
import { PhoneFrame } from './phone/PhoneFrame';
import { Title } from './screens/Title';
import { Ending } from './screens/Ending';
import { Debug } from './Debug';

const DEBUG = typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug');

function startAudio() {
  sfx.init();
  sfx.startDrone();
}

export function App() {
  const phase = useGame((s) => s.phase);
  const textScale = useGame((s) => s.settings.textScale);
  const reducedMotion = useGame((s) => s.settings.reducedMotion);

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * textScale}px`;
    document.documentElement.classList.toggle('reduced-motion', reducedMotion);
  }, [textScale, reducedMotion]);

  // Main loop: one rAF clock drives battery, director and calls.
  useEffect(() => {
    if (phase !== 'playing') return;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      tick(now - last);
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Leaving the tab turns the screen off (slow drain, game paused) — diegetic pause.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && G().phase === 'playing' && !G().screenOff) sleep();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const newGame = () => {
    startAudio();
    clearCheckpoint();
    const data = freshGame();
    setG({ ...data, screenOff: false, banner: null });
    if (!G().settings.hardcore) setG({ storageOk: saveCheckpoint(pickGameData(G())) });
    track('chapter_start', { chapter: 1 });
  };

  const continueGame = () => {
    const save = loadCheckpoint();
    if (!save) return newGame();
    startAudio();
    setG({ ...save, screenOff: false, banner: null, overlay: null, overlayQueue: [] });
  };

  const toTitle = () => {
    voice.cancel();
    sfx.stopDrone();
    setG({ phase: 'title' });
  };

  return (
    <div className="stage">
      <div className="rain" aria-hidden />
      {phase === 'title' && <Title onNew={newGame} onContinue={continueGame} />}
      {phase === 'playing' && (
        <>
          <PhoneFrame />
          <StorageNotice />
        </>
      )}
      {phase === 'ending' && <Ending onRetry={continueGame} onTitle={toTitle} />}
      {DEBUG && phase === 'playing' && <Debug />}
    </div>
  );
}

function StorageNotice() {
  const ok = useGame((s) => s.storageOk);
  const hardcore = useGame((s) => s.settings.hardcore);
  if (ok || hardcore) return null;
  return <div className="storage-notice">Progress won't be saved in this browser mode.</div>;
}
