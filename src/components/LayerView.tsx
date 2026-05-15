import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useStore } from '../state/useStore';
import type { PackedBox } from '../packing/types';

interface Props {
  box: PackedBox;
}

function fmtDim(v: number, unit: string) {
  return `${Math.round(v * 100) / 100}${unit}`;
}

export function LayerView({ box }: Props) {
  const unit = useStore((s) => s.unit);
  const layerIdx = useStore((s) => s.layerIdx);
  const setLayerIdx = useStore((s) => s.setLayerIdx);

  const layers = box.zLevels.length ? box.zLevels : [0];
  const idx = Math.min(Math.max(0, layerIdx), layers.length - 1);
  const layerZ = layers[idx];

  const layerItems = box.items.filter((it) => Math.abs(it.z - layerZ) < 0.001);
  const layerHeight = layerItems.reduce((m, it) => Math.max(m, it.h), 0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [vpSize, setVpSize] = useState({ w: 500, h: 400 });
  const [vp, setVp] = useState({ zoom: 1, panX: 0, panY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!viewportRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setVpSize({ w: r.width, h: r.height });
    });
    ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setVp({ zoom: 1, panX: 0, panY: 0 });
  }, [box.boxId]);

  const pad = 32;
  const baseScale = Math.max(
    0.1,
    Math.min(
      Math.max(1, vpSize.w - pad * 2) / box.dims.w,
      Math.max(1, vpSize.h - pad * 2) / box.dims.d,
    ),
  );
  const W = box.dims.w * baseScale;
  const H = box.dims.d * baseScale;

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setVp((v) => {
      const newZoom = Math.min(8, Math.max(0.15, v.zoom * factor));
      const s = newZoom / v.zoom;
      return { zoom: newZoom, panX: mx + (v.panX - mx) * s, panY: my + (v.panY - my) * s };
    });
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    setIsDragging(true);
    lastMouse.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setVp((v) => ({ ...v, panX: v.panX + dx, panY: v.panY + dy }));
  };

  const stopDrag = () => { dragging.current = false; setIsDragging(false); };

  const resetView = () => setVp({ zoom: 1, panX: 0, panY: 0 });

  return (
    <div className="layer-view">
      <div className="layer-controls">
        <button className="btn btn-sm btn-ghost" onClick={() => setLayerIdx(Math.max(0, idx - 1))} disabled={idx === 0}>
          <ChevronLeft size={14} /> prev
        </button>
        <div>
          <div className="layer-label">step</div>
          <div className="layer-num">{idx + 1} / {layers.length}</div>
        </div>
        <input
          type="range" className="layer-slider"
          min={0} max={layers.length - 1} step={1} value={idx}
          onChange={(e) => setLayerIdx(parseInt(e.target.value))}
        />
        <div>
          <div className="layer-label">floor z</div>
          <div className="layer-z">{fmtDim(layerZ, unit)} → {fmtDim(layerZ + layerHeight, unit)}</div>
        </div>
        <button className="btn btn-sm btn-ghost" onClick={() => setLayerIdx(Math.min(layers.length - 1, idx + 1))} disabled={idx === layers.length - 1}>
          next <ChevronRight size={14} />
        </button>
        <div className="layer-controls-sep" />
        <button className="btn btn-sm btn-ghost" title="Zoom in" onClick={() => setVp((v) => ({ ...v, zoom: Math.min(8, v.zoom * 1.25) }))}>
          <ZoomIn size={14} />
        </button>
        <span className="layer-zoom-pct">{Math.round(vp.zoom * 100)}%</span>
        <button className="btn btn-sm btn-ghost" title="Zoom out" onClick={() => setVp((v) => ({ ...v, zoom: Math.max(0.15, v.zoom * 0.8) }))}>
          <ZoomOut size={14} />
        </button>
        <button className="btn btn-sm btn-ghost" title="Reset view" onClick={resetView}>
          <Maximize2 size={14} />
        </button>
      </div>

      <div
        className="layer-viewport"
        ref={viewportRef}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        <div
          className="layer-transform"
          style={{ transform: `translate(${vp.panX}px, ${vp.panY}px) scale(${vp.zoom})` }}
        >
          <div className="scene-2d" style={{ width: W, height: H }}>
            <div className="scene-2d-grid" />
            {layerItems.map((it, i) => (
              <div
                key={`${it.itemId}-${it.instanceIdx}-${i}`}
                className="item-2d"
                style={{
                  left: it.x * baseScale,
                  top: (box.dims.d - it.y - it.d) * baseScale,
                  width: it.w * baseScale,
                  height: it.d * baseScale,
                  background: it.color,
                }}
                title={`${it.name} · ${fmtDim(it.origW, unit)}×${fmtDim(it.origD, unit)}×${fmtDim(it.origH, unit)}`}
              >
                {it.w * baseScale > 50 && it.d * baseScale > 30 && (
                  <>
                    <div>{it.name}</div>
                    <div className="dim2d">{fmtDim(it.w, unit)}×{fmtDim(it.d, unit)}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="layer-caption">
        {layerItems.length} item{layerItems.length === 1 ? '' : 's'} · scroll to zoom · drag to pan
      </div>
    </div>
  );
}
