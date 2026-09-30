import { useState } from 'react';
import { useGame } from '../state/store';
import { markViewed, startDepotWalk } from '../engine/director';
import { BALANCE } from '../engine/balance';
import { MAP_PINS, TIMELINE, type MapPin } from '../content/media';
import { AppHeader, PinButton } from '../phone/common';

export function Maps() {
  const [sel, setSel] = useState<MapPin | null>(null);
  const [tab, setTab] = useState<'map' | 'history'>('map');
  const walkStart = useGame((s) => s.flags.depotWalkStart);
  const powerBank = useGame((s) => !!s.flags.powerBank);
  const gameTime = useGame((s) => s.gameTimeMs);
  const walking = typeof walkStart === 'number' && !powerBank;
  const walkPct = walking ? Math.min(100, ((gameTime - walkStart) / (BALANCE.powerBank.walkSec * 1000)) * 100) : 0;

  return (
    <div className="app maps">
      <AppHeader
        title="Maps"
        sub={<span className="gps">📡 GPS active · high battery use</span>}
        right={
          <button className="link" onClick={() => setTab(tab === 'map' ? 'history' : 'map')}>
            {tab === 'map' ? 'History' : 'Map'}
          </button>
        }
      />
      {tab === 'history' ? (
        <div className="timeline">
          <h4>Location History · Yesterday</h4>
          <ol>
            {TIMELINE.map((t) => (
              <li key={t.time}>
                <b>{t.time}</b>
                <span>{t.place}</span>
                <small className="muted">{t.note}</small>
              </li>
            ))}
          </ol>
          <p className="muted small">Significant Locations is on. This phone remembers places you visit often.</p>
        </div>
      ) : (
        <div className="map-wrap">
          <svg className="map" viewBox="0 0 380 520" preserveAspectRatio="xMidYMid meet">
            <rect width="380" height="520" fill="#1d3b53" />
            <path
              d="M0 0 H380 V300 Q340 320 330 360 Q300 420 330 470 L345 500 Q320 510 300 480 Q270 430 280 380 Q230 390 190 380 Q120 370 60 400 Q20 410 0 430 Z"
              fill="#2a2f36"
            />
            <path d="M40 20 Q60 120 50 240 T70 380" stroke="#3b424c" strokeWidth="10" fill="none" />
            <path d="M0 330 H290" stroke="#4a525e" strokeWidth="9" />
            <path d="M0 180 Q150 170 300 150" stroke="#3b424c" strokeWidth="7" fill="none" />
            <path d="M150 0 V330" stroke="#3b424c" strokeWidth="6" />
            <path d="M230 60 V330" stroke="#3b424c" strokeWidth="6" />
            <path d="M285 385 Q300 430 318 468" stroke="#3b424c" strokeWidth="4" strokeDasharray="4 4" fill="none" />
            <rect x="170" y="40" width="40" height="60" rx="6" fill="#2f4a36" />
            <text x="12" y="326" fill="#8a93a0" fontSize="9">
              HARBOR RD
            </text>
            <text x="240" y="505" fill="#6f8aa3" fontSize="9">
              HALDEN POINT
            </text>
            <text x="20" y="500" fill="#4f6d88" fontSize="11" fontStyle="italic">
              Atlantic
            </text>
            {MAP_PINS.map((p) => (
              <g
                key={p.id}
                className={`map-pin ${sel?.id === p.id ? 'sel' : ''} ${p.id === 'point' ? 'hot' : ''}`}
                transform={`translate(${p.x} ${p.y})`}
                onClick={() => {
                  setSel(p);
                  markViewed(`pin:map:${p.id}`);
                }}
              >
                <circle r="16" fill={p.id === 'shelter' ? '#0a84ff' : '#ff453a'} opacity="0.25" />
                <circle r="11" fill={p.id === 'shelter' ? '#0a84ff' : '#ff453a'} />
                <text y="4" textAnchor="middle" fontSize="11">
                  {p.icon}
                </text>
              </g>
            ))}
          </svg>
          {sel && (
            <div className="map-sheet">
              <div className="sheet-grab" />
              <h4>
                {sel.icon} {sel.name}
              </h4>
              <p className="small">{sel.detail}</p>
              <p className="muted small">{sel.visits}</p>
              <div className="row gap">
                {sel.evidence && <PinButton id={sel.evidence} />}
                {sel.id === 'depot' &&
                  (powerBank ? (
                    <span className="small ok">✅ Power bank collected</span>
                  ) : walking ? (
                    <div className="walk">
                      <span className="small">Walking to the depot… {Math.round(walkPct)}%</span>
                      <div className="bar">
                        <i style={{ width: `${walkPct}%` }} />
                      </div>
                    </div>
                  ) : (
                    <button className="btn small" onClick={startDepotWalk}>
                      🚶 Walk there (~{BALANCE.powerBank.walkSec}s)
                    </button>
                  ))}
              </div>
              <button className="link" onClick={() => setSel(null)}>
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
