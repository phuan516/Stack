import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../state/useStore';
import type { PackedBox } from '../packing/types';

interface Props {
  box: PackedBox;
  scale: number;
}

function fmtDim(v: number, unit: string) {
  return `${Math.round(v * 100) / 100}${unit}`;
}

export function LayerView({ box, scale }: Props) {
  const unit = useStore((s) => s.unit);
  const layerIdx = useStore((s) => s.layerIdx);
  const setLayerIdx = useStore((s) => s.setLayerIdx);

  const layers = box.zLevels.length ? box.zLevels : [0];
  const idx = Math.min(Math.max(0, layerIdx), layers.length - 1);
  const layerZ = layers[idx];

  const layerItems = box.items.filter((it) => Math.abs(it.z - layerZ) < 0.001);
  const layerHeight = layerItems.reduce((m, it) => Math.max(m, it.h), 0);

  const W = box.dims.w * scale;
  const D = box.dims.d * scale;

  return (
    <div className="layer-view">
      <div className="layer-controls">
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => setLayerIdx(Math.max(0, idx - 1))}
          disabled={idx === 0}
        >
          <ChevronLeft size={14} /> prev
        </button>
        <div>
          <div className="layer-label">step</div>
          <div className="layer-num">{idx + 1} / {layers.length}</div>
        </div>
        <input
          type="range"
          className="layer-slider"
          min={0} max={layers.length - 1} step={1}
          value={idx}
          onChange={(e) => setLayerIdx(parseInt(e.target.value))}
        />
        <div>
          <div className="layer-label">floor z</div>
          <div className="layer-z">{fmtDim(layerZ, unit)} → {fmtDim(layerZ + layerHeight, unit)}</div>
        </div>
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => setLayerIdx(Math.min(layers.length - 1, idx + 1))}
          disabled={idx === layers.length - 1}
        >
          next <ChevronRight size={14} />
        </button>
      </div>

      <div className="scene-2d" style={{ width: W, height: D }}>
        <div className="scene-2d-grid" />
        {layerItems.map((it, i) => (
          <div
            key={`${it.itemId}-${it.instanceIdx}-${i}`}
            className="item-2d"
            style={{
              left: it.x * scale,
              top: it.y * scale,
              width: it.w * scale,
              height: it.d * scale,
              background: it.color,
            }}
            title={`${it.name} · ${fmtDim(it.origW, unit)}×${fmtDim(it.origD, unit)}×${fmtDim(it.origH, unit)}`}
          >
            {it.w * scale > 50 && it.d * scale > 30 && (
              <>
                <div>{it.name}</div>
                <div className="dim2d">{fmtDim(it.w, unit)}×{fmtDim(it.d, unit)}</div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="layer-caption">
        Place these {layerItems.length} item{layerItems.length === 1 ? '' : 's'} as shown, then continue to the next step.
      </div>
    </div>
  );
}
