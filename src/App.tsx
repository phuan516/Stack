import { useMemo, useRef } from 'react';
import { useStore } from './state/useStore';
import { pack } from './packing/packer';
import { TopBar } from './components/TopBar';
import { ItemsPanel } from './components/ItemsPanel';
import { BoxesPanel } from './components/BoxesPanel';
import { Canvas } from './components/Canvas';
import { TweaksDrawer } from './components/TweaksDrawer';
import type { SummaryStats } from './packing/types';

export default function App() {
  const items = useStore((s) => s.items);
  const boxes = useStore((s) => s.boxes);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const packedResult = useMemo(() => {
    if (boxes.length === 0 || items.length === 0) return { boxes: [], unpacked: [] };
    return pack(boxes, items);
  }, [boxes, items]);

  const summary: SummaryStats | null = useMemo(() => {
    if (!packedResult.boxes.length) return null;
    const totalUsed = packedResult.boxes.reduce((s, b) => s + b.usedVolume, 0);
    const totalCap  = packedResult.boxes.reduce((s, b) => s + b.totalVolume, 0);
    return {
      avgFill:    totalCap > 0 ? totalUsed / totalCap : 0,
      totalItems: packedResult.boxes.reduce((s, b) => s + b.items.length, 0),
      boxesUsed:  packedResult.boxes.filter((b) => b.items.length > 0).length,
      totalBoxes: packedResult.boxes.length,
      unpacked:   packedResult.unpacked.length,
    };
  }, [packedResult]);

  return (
    <div className="app">
      <TopBar fileInputRef={fileInputRef} packedResult={packedResult} />
      <div className="main">
        <ItemsPanel />
        <Canvas packedResult={packedResult} summary={summary} />
        <BoxesPanel packedResult={packedResult} />
      </div>
      <TweaksDrawer />
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            import('./io/excel').then(({ importExcel }) =>
              importExcel(f).then((result) => {
                if (result.error) { alert(result.error); return; }
                const { setItems, setBoxes, setUnit2 } = useStore.getState();
                if (result.items) setItems(result.items);
                if (result.boxes) setBoxes(result.boxes);
                if (result.unit) setUnit2(result.unit);
              })
            );
          }
          e.target.value = '';
        }}
      />
    </div>
  );
}
