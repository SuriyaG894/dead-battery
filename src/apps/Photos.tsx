import { useState } from 'react';
import { useGame } from '../state/store';
import { markViewed, recoverPhoto } from '../engine/director';
import { BALANCE } from '../engine/balance';
import { PHOTOS, type PhotoDef } from '../content/media';
import { AppHeader, PinButton } from '../phone/common';
import { Scene } from '../phone/Scene';

export function Photos() {
  const [album, setAlbum] = useState<'library' | 'deleted'>('library');
  const [open, setOpen] = useState<PhotoDef | null>(null);
  const flags = useGame((s) => s.flags);

  if (open) return <Viewer photo={open} onClose={() => setOpen(null)} />;

  const list = PHOTOS.filter((p) => (album === 'deleted' ? p.deleted : !p.deleted));
  const deletedCount = PHOTOS.filter((p) => p.deleted).length;

  return (
    <div className="app photos">
      <AppHeader
        title={album === 'library' ? 'Library' : 'Recently Deleted'}
        onBack={album === 'deleted' ? () => setAlbum('library') : undefined}
        backLabel={album === 'deleted' ? 'Library' : 'Home'}
      />
      {album === 'deleted' && (
        <p className="deleted-note">Items are permanently deleted after 30 days. Recovering uses battery.</p>
      )}
      <div className="photo-grid">
        {list.map((p) => {
          const locked = p.deleted && !flags[`recovered_${p.id}`];
          return (
            <button
              key={p.id}
              className={`photo-cell ${locked ? 'locked' : ''}`}
              onClick={() => {
                if (locked) {
                  recoverPhoto(p.id);
                  return;
                }
                markViewed(`photo:${p.id}`);
                setOpen(p);
              }}
            >
              <Scene id={p.scene} />
              {locked && <span className="recover">Recover · −{BALANCE.cost.recoverDeleted}% 🔋</span>}
            </button>
          );
        })}
      </div>
      {album === 'library' && (
        <button className="album-row" onClick={() => setAlbum('deleted')}>
          🗑️ Recently Deleted <span className="muted">{deletedCount} ›</span>
        </button>
      )}
    </div>
  );
}

function Viewer({ photo, onClose }: { photo: PhotoDef; onClose: () => void }) {
  const [zoom, setZoom] = useState(false);
  return (
    <div className="app viewer">
      <AppHeader title={photo.when} onBack={onClose} backLabel="Back" />
      <div className="viewer-img">
        <Scene id={photo.scene} />
        {photo.id === 'contract' && (
          <button
            className="hotspot"
            style={{ left: '14%', top: '78%', width: '42%', height: '16%' }}
            onClick={() => {
              setZoom(true);
              markViewed('hotspot:signature');
            }}
            aria-label="Zoom into signature"
          >
            🔍
          </button>
        )}
      </div>
      {photo.caption && <p className="viewer-caption">{photo.caption}</p>}
      <div className="viewer-actions">{photo.evidence && <PinButton id={photo.evidence} />}</div>
      {zoom && (
        <div className="zoom-panel" onClick={() => setZoom(false)}>
          <div className="zoom-paper" onClick={(e) => e.stopPropagation()}>
            <div className="sig">𝓢. 𝓞𝓴𝓪𝓯𝓸𝓻</div>
            <div className="sig-line" />
            <div>S. Okafor, Partner Relations</div>
            <div className="sig-phone">(207) 555-0143</div>
            <p className="muted small">That number looks familiar…</p>
            <PinButton id="ev_sam_signature" />
            <button className="btn ghost" onClick={() => setZoom(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
