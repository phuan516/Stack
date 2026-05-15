import { useRef, useState, useEffect, useMemo } from 'react';
import { useStore } from '../state/useStore';
import { Scene3D } from './Scene3D';
import { LayerView } from './LayerView';
import { SummaryBar } from './SummaryBar';
import type { PackResult, SummaryStats } from '../packing/types';

interface Props {
  packedResult: PackResult;
  summary: SummaryStats | null;
}

export function Canvas({ packedResult, summary }: Props) {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const activeBoxId = useStore((s) => s.activeBoxId);
  const setActiveBoxId = useStore((s) => s.setActiveBoxId);

  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ w: 800, h: 500 });

  useEffect(() => {
    if (!stageRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setStageSize({ w: r.width, h: r.height });
    });
    ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, []);

  const activeBox = packedResult.boxes.find((b) => b.boxId === activeBoxId) ?? packedResult.boxes[0];

  const scale = useMemo(() => {
    if (!activeBox) return 1;
    const padW = 120, padH = 120;
    const availW = Math.max(200, stageSize.w - padW);
    const availH = Math.max(200, stageSize.h - padH);
    return Math.min(availW / activeBox.dims.w, availH / activeBox.dims.d);
  }, [activeBox, stageSize]);

  return (
    <div className="panel canvas">
      <div className="canvas-toolbar">
        <div className="box-tabs">
          {packedResult.boxes.map((pb) => {
            const fillClass = pb.fillPct >= 0.85 ? 'accent' : pb.fillPct >= 0.6 ? 'good' : pb.fillPct >= 0.3 ? 'warn' : 'bad';
            return (
              <button
                key={pb.boxId}
                className={`box-tab ${activeBoxId === pb.boxId ? 'active' : ''}`}
                onClick={() => setActiveBoxId(pb.boxId)}
              >
                <span className="tab-name">{pb.name}</span>
                <span className="tab-stats">{pb.items.length} items · {Math.round(pb.fillPct * 100)}%</span>
                <span className="fill-dot" style={{ background: `var(--${fillClass})` }} />
              </button>
            );
          })}
        </div>
        <div className="view-toggle">
          <button className={view === '3d' ? 'active' : ''} onClick={() => setView('3d')}>3D</button>
          <button className={view === 'layers' ? 'active' : ''} onClick={() => setView('layers')}>LAYERS</button>
        </div>
      </div>

      <div className="canvas-stage" ref={stageRef}>
        <div className="stage-grid" />
        <div className="stage-frame">
          {!activeBox || activeBox.items.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">▣</div>
              {packedResult.boxes.length === 0
                ? 'Add a box to start packing.'
                : 'No items packed in this box yet.'}
            </div>
          ) : view === '3d' ? (
            <Scene3D box={activeBox} />
          ) : (
            <LayerView box={activeBox} scale={scale} />
          )}
        </div>

        {summary && <SummaryBar summary={summary} />}
      </div>
    </div>
  );
}
