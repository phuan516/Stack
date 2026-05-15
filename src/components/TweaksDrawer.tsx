import { X, Trash2 } from 'lucide-react';
import { useStore } from '../state/useStore';

export function TweaksDrawer() {
  const tweaksOpen = useStore((s) => s.tweaksOpen);
  const setTweaksOpen = useStore((s) => s.setTweaksOpen);
  const clearAll = useStore((s) => s.clearAll);

  return (
    <div className={`tweaks-overlay ${tweaksOpen ? 'open' : ''}`}>
      <div className="tweaks-backdrop" onClick={() => setTweaksOpen(false)} />
      <div className="tweaks-drawer">
        <div className="tweaks-header">
          <span className="tweaks-title">Tweaks</span>
          <button className="icon-btn" onClick={() => setTweaksOpen(false)}>
            <X size={13} />
          </button>
        </div>
        <div className="tweaks-body">
          <div className="tweaks-section">
            <div className="tweaks-section-label">Data</div>
            <div className="tweak-btn-row">
              <button
                className="btn btn-ghost btn-sm"
                style={{ justifyContent: 'flex-start', color: 'var(--bad)' }}
                onClick={() => { if (confirm('Clear all items and boxes?')) { clearAll(); setTweaksOpen(false); } }}
              >
                <Trash2 size={12} /> Clear everything
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
