import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check } from 'lucide-react';
import { useStore } from '../state/useStore';
import type { Box, PackResult } from '../packing/types';

interface Props {
  packedResult: PackResult;
}

function BoxCard({ box, packedResult }: { box: Box; packedResult: PackResult }) {
  const unit = useStore((s) => s.unit);
  const items = useStore((s) => s.items);
  const activeBoxId = useStore((s) => s.activeBoxId);
  const editingId = useStore((s) => s.editingBoxId);
  const setEditingId = useStore((s) => s.setEditingBoxId);
  const setActiveBoxId = useStore((s) => s.setActiveBoxId);
  const commitBox = useStore((s) => s.commitBox);
  const deleteBox = useStore((s) => s.deleteBox);

  const [draft, setDraft] = useState<Box>(box);
  useEffect(() => { setDraft(box); }, [box]);

  const packed = packedResult.boxes.find((p) => p.boxId === box.id);
  const fill = packed?.fillPct ?? 0;
  const fillClass = fill >= 0.95 ? 'full' : fill >= 0.75 ? 'good' : fill >= 0.3 ? 'warn' : 'bad';
  const active = activeBoxId === box.id;
  const editing = editingId === box.id;

  const itemCounts: Record<string, { name: string; color: string; qty: number }> = {};
  if (packed) {
    for (const it of packed.items) {
      if (!itemCounts[it.itemId]) {
        const ref = items.find((x) => x.id === it.itemId);
        itemCounts[it.itemId] = { name: ref?.name ?? it.name, color: it.color, qty: 0 };
      }
      itemCounts[it.itemId].qty++;
    }
  }

  if (editing) {
    return (
      <div className="box-card active" style={{ cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
        <div className="field text" style={{ marginBottom: 8 }}>
          <label>Box name</label>
          <input
            autoFocus
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') commitBox(draft); if (e.key === 'Escape') setEditingId(null); }}
          />
        </div>
        <div className="dim-row-3">
          {(['w', 'd', 'h'] as const).map((k) => (
            <div className="field" key={k}>
              <label>{k.toUpperCase()} ({unit})</label>
              <input
                type="number" min="0" step="0.1"
                value={draft[k]}
                onChange={(e) => setDraft({ ...draft, [k]: parseFloat(e.target.value) || 0 })}
              />
            </div>
          ))}
        </div>
        <div className="edit-actions" style={{ marginTop: 10 }}>
          <button className="btn btn-primary btn-sm" onClick={() => commitBox(draft)}>
            <Check size={11} /> Save
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
          <div style={{ flex: 1 }} />
          <button className="icon-btn danger" onClick={() => { if (confirm(`Delete "${box.name}"?`)) deleteBox(box.id); }} title="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`box-card ${active ? 'active' : ''}`} onClick={() => setActiveBoxId(box.id)}>
      <div className="box-card-head">
        <div>
          <div className="box-card-name">{box.name}</div>
          <div className="box-card-dims">
            {box.w}<span style={{ margin: '0 2px', opacity: 0.5 }}>×</span>
            {box.d}<span style={{ margin: '0 2px', opacity: 0.5 }}>×</span>
            {box.h} {unit}
          </div>
        </div>
        <div className="row-actions" style={{ opacity: 1 }}>
          <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setEditingId(box.id); }} title="Edit">
            <Edit2 size={13} />
          </button>
          <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${box.name}"?`)) deleteBox(box.id); }} title="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div className="fill-bar">
        <div className={`fill-bar-fill ${fillClass}`} style={{ width: `${Math.min(100, fill * 100)}%` }} />
      </div>
      <div className="box-card-stats">
        <span>{packed ? `${packed.items.length} item${packed.items.length === 1 ? '' : 's'}` : '—'}</span>
        <span className="pct">{packed ? `${Math.round(fill * 100)}%` : '0%'}</span>
      </div>
      {Object.keys(itemCounts).length > 0 && (
        <div className="box-card-items">
          {Object.entries(itemCounts).map(([key, val]) => (
            <span key={key} className="chip">
              <span className="chip-dot" style={{ background: val.color }} />
              {val.name}
              <span className="chip-x">×{val.qty}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function BoxesPanel({ packedResult }: Props) {
  const boxes = useStore((s) => s.boxes);
  const addBox = useStore((s) => s.addBox);
  const unpacked = packedResult.unpacked;

  return (
    <div className="panel panel-right">
      <div className="panel-header">
        <div className="panel-title">
          Boxes <span className="count">{boxes.length}</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={addBox}>
          <Plus size={12} /> Add
        </button>
      </div>
      <div className="panel-body">
        {boxes.length === 0 && (
          <div className="empty">
            <div className="empty-icon">▣</div>
            No boxes yet.<br />Click "Add" to enter a shipping box size.
          </div>
        )}
        {boxes.map((b) => (
          <BoxCard key={b.id} box={b} packedResult={packedResult} />
        ))}
        <button className="add-row compact" onClick={addBox}>
          <Plus size={12} /> Add box
        </button>
        {unpacked.length > 0 && (() => {
          const groups: Record<string, { name: string; color: string; qty: number }> = {};
          for (const it of unpacked) {
            if (!groups[it.itemId]) groups[it.itemId] = { name: it.name, color: it.color, qty: 0 };
            groups[it.itemId].qty++;
          }
          return (
            <div className="unpacked-warning">
              <div className="unpacked-warning-header">
                <span style={{ fontWeight: 700 }}>⚠</span>
                <span><b>{unpacked.length}</b> item{unpacked.length === 1 ? '' : 's'} didn't fit</span>
              </div>
              <div className="box-card-items" style={{ marginTop: 8 }}>
                {Object.entries(groups).map(([key, val]) => (
                  <span key={key} className="chip chip-bad">
                    <span className="chip-dot" style={{ background: val.color }} />
                    {val.name}
                    <span className="chip-x">×{val.qty}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
