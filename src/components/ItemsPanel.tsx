import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { useStore } from '../state/useStore';
import type { Item } from '../packing/types';

function ItemRow({ item }: { item: Item }) {
  const unit = useStore((s) => s.unit);
  const editingId = useStore((s) => s.editingItemId);
  const setEditingId = useStore((s) => s.setEditingItemId);
  const commitItem = useStore((s) => s.commitItem);
  const deleteItem = useStore((s) => s.deleteItem);

  const [draft, setDraft] = useState<Item>(item);
  useEffect(() => { setDraft(item); }, [item]);

  const editing = editingId === item.id;

  if (editing) {
    return (
      <div className="row editing" onClick={(e) => e.stopPropagation()}>
        <div className="row-swatch" style={{ background: item.color }} />
        <div className="row-edit-form" style={{ gridColumn: '2 / -1' }}>
          <div className="field text">
            <label>Item name</label>
            <input
              autoFocus
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') commitItem(draft); if (e.key === 'Escape') setEditingId(null); }}
            />
          </div>
          <div className="dim-row">
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
            <div className="field">
              <label>Qty</label>
              <input
                type="number" min="1" step="1"
                value={draft.qty}
                onChange={(e) => setDraft({ ...draft, qty: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <div className="edit-actions">
            <button className="btn btn-primary btn-sm" onClick={() => commitItem(draft)}>
              <Check size={11} /> Save
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
            <div style={{ flex: 1 }} />
            <button className="icon-btn danger" onClick={() => deleteItem(item.id)} title="Delete">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row" onClick={() => setEditingId(item.id)}>
      <div className="row-swatch" style={{ background: item.color }} />
      <div className="row-name">
        <div className="name-line">
          <span>{item.name}</span>
          <span className="qty-pill">×{item.qty}</span>
        </div>
        <div className="row-meta">
          {item.w}<span style={{ margin: '0 2px', opacity: 0.5 }}>×</span>
          {item.d}<span style={{ margin: '0 2px', opacity: 0.5 }}>×</span>
          {item.h} {unit}
        </div>
      </div>
      <div className="row-actions">
        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setEditingId(item.id); }} title="Edit">
          <Edit2 size={13} />
        </button>
        <button
          className="icon-btn danger"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete "${item.name}"?`)) deleteItem(item.id);
          }}
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export function ItemsPanel() {
  const items = useStore((s) => s.items);
  const addItem = useStore((s) => s.addItem);
  const totalQty = items.reduce((s, it) => s + (it.qty || 1), 0);

  return (
    <div className="panel panel-left">
      <div className="panel-header">
        <div className="panel-title">
          Items <span className="count">{totalQty} total</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={addItem}>
          <Plus size={12} /> Add
        </button>
      </div>
      <div className="panel-body">
        {items.length === 0 && (
          <div className="empty">
            <div className="empty-icon">▢</div>
            No items yet.<br />Click "Add" to enter merchandise dimensions.
          </div>
        )}
        {items.map((it) => <ItemRow key={it.id} item={it} />)}
        <button className="add-row" onClick={addItem}>
          <Plus size={12} /> Add item
        </button>
      </div>
    </div>
  );
}
