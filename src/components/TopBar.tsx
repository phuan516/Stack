import type { RefObject } from 'react';
import { Download, Upload, FileSpreadsheet, Settings } from 'lucide-react';
import { useStore } from '../state/useStore';
import type { PackResult } from '../packing/types';

interface Props {
  fileInputRef: RefObject<HTMLInputElement | null>;
  packedResult: PackResult;
}

export function TopBar({ fileInputRef, packedResult }: Props) {
  const unit = useStore((s) => s.unit);
  const setUnit = useStore((s) => s.setUnit);
  const setTweaksOpen = useStore((s) => s.setTweaksOpen);
  const tweaksOpen = useStore((s) => s.tweaksOpen);
  const items = useStore((s) => s.items);
  const boxes = useStore((s) => s.boxes);

  function handleExport() {
    import('../io/excel').then(({ exportExcel }) => exportExcel(items, boxes, packedResult, unit));
  }

  function handleTemplate() {
    import('../io/excel').then(({ downloadTemplate }) => downloadTemplate());
  }

  return (
    <div className="topbar">
      <div className="brand">
        <span className="brand-mark"><span /><span /><span /></span>
        stack
        <span className="brand-tag">packing simulator</span>
      </div>
      <div className="topbar-spacer" />

      <div className="unit-toggle">
        <button className={unit === 'cm' ? 'active' : ''} onClick={() => setUnit('cm')}>cm</button>
        <button className={unit === 'in' ? 'active' : ''} onClick={() => setUnit('in')}>in</button>
      </div>

      <button className="btn btn-sm" onClick={() => fileInputRef.current?.click()}>
        <Download size={12} />
        Import
      </button>
      <button className="btn btn-sm" onClick={handleExport}>
        <Upload size={12} />
        Export
      </button>
      <button className="btn btn-ghost btn-sm" onClick={handleTemplate}>
        <FileSpreadsheet size={12} />
        template
      </button>
      <button
        className={`btn btn-ghost btn-sm ${tweaksOpen ? 'active' : ''}`}
        onClick={() => setTweaksOpen(!tweaksOpen)}
        title="Tweaks"
      >
        <Settings size={12} />
      </button>
    </div>
  );
}
