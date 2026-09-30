import { useEffect, useState } from 'react';
import { useGame } from '../state/store';
import { goHome, wake } from '../engine/director';
import { BALANCE } from '../engine/balance';
import { sfx } from '../audio/sfx';
import { BannerView, ControlCenter, HomeScreen, LockScreen, OverlayView, ScreenOff, StatusBar } from './Shell';
import { Messages } from '../apps/Messages';
import { Photos } from '../apps/Photos';
import { Maps } from '../apps/Maps';
import { Evidence } from '../apps/Evidence';
import { Browser, Notes, PhoneApp, Settings, Voice } from '../apps/Misc';

export function PhoneFrame() {
  const screen = useGame((s) => s.screen);
  const brightness = useGame((s) => s.brightness);
  const battery = useGame((s) => s.battery);
  const screenOff = useGame((s) => s.screenOff);
  const glitchUntil = useGame((s) => s.glitchUntil);
  const shakeUntil = useGame((s) => s.shakeUntil);
  const reducedMotion = useGame((s) => s.settings.reducedMotion);
  const [cc, setCc] = useState(false);
  const [muted, setMuted] = useState(false);
  const [, force] = useState(0);

  const now = performance.now();
  const glitching = glitchUntil > now;
  const shaking = shakeUntil > now;

  useEffect(() => {
    const until = Math.max(glitchUntil, shakeUntil) - performance.now();
    if (until <= 0) return;
    const t = setTimeout(() => force((n) => n + 1), until + 20);
    return () => clearTimeout(t);
  }, [glitchUntil, shakeUntil]);

  useEffect(() => {
    sfx.setMuted(muted);
  }, [muted]);

  const stress =
    battery < BALANCE.thresholds.flicker ? 'flicker' : battery < BALANCE.thresholds.stutter ? 'stutter' : '';

  return (
    <div className={`phone ${shaking ? 'shake' : ''}`}>
      <div className="phone-side-btn" aria-hidden />
      <div
        className={`screen ${reducedMotion ? '' : stress} ${glitching && !reducedMotion ? 'glitching' : ''}`}
        style={{ filter: `brightness(${0.55 + (brightness - BALANCE.brightness.min) * 0.75})` }}
      >
        <div className="notch" />
        <StatusBar onOpenControl={() => setCc(true)} />
        <div className="screen-body">
          {screen === 'lock' && <LockScreen />}
          {screen === 'home' && <HomeScreen />}
          {screen === 'messages' && <Messages />}
          {screen === 'photos' && <Photos />}
          {screen === 'maps' && <Maps />}
          {screen === 'notes' && <Notes />}
          {screen === 'voice' && <Voice />}
          {screen === 'phone' && <PhoneApp />}
          {screen === 'browser' && <Browser />}
          {screen === 'settings' && <Settings />}
          {screen === 'evidence' && <Evidence />}
        </div>
        <BannerView />
        {screen !== 'lock' && <button className="home-indicator" onClick={goHome} aria-label="Home" />}
        {cc && <ControlCenter onClose={() => setCc(false)} muted={muted} setMuted={setMuted} />}
        <OverlayView />
        {glitching && !reducedMotion && <div className="glitch-layer" />}
        {glitching && reducedMotion && <div className="glitch-soft" />}
        {screenOff && (
          <div onClick={wake}>
            <ScreenOff />
          </div>
        )}
      </div>
    </div>
  );
}
