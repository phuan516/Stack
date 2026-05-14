import { X, RotateCcw, Trash2 } from 'lucide-react';
import { useStore } from '../state/useStore';

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="tweak-toggle-row">
      <span>{label}</span>
      <button className={`tweak-switch ${value ? 'on' : ''}`} onClick={() => onChange(!value)} />
    </div>
  );
}

export function TweaksDrawer() {
  const tweaksOpen = useStore((s) => s.tweaksOpen);
  const setTweaksOpen = useStore((s) => s.setTweaksOpen);
  const showLabels = useStore((s) => s.showLabels);
  const setShowLabels = useStore((s) => s.setShowLabels);
  const showMeasurements = useStore((s) => s.showMeasurements);
  const setShowMeasurements = useStore((s) => s.setShowMeasurements);
  const resetToSample = useStore((s) => s.resetToSample);
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
            <div className="tweaks-section-label">View options</div>
            <Toggle label="Show item labels" value={showLabels} onChange={setShowLabels} />
            <Toggle label="Show measurements" value={showMeasurements} onChange={setShowMeasurements} />
          </div>
          <div className="tweaks-section">
            <div className="tweaks-section-label">Data</div>
            <div className="tweak-btn-row">
              <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => { resetToSample(); setTweaksOpen(false); }}>
                <RotateCcw size={12} /> Reset to sample data
              </button>
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
