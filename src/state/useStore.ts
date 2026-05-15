import { create } from 'zustand';
import type { Item, Box, ViewMode, Unit } from '../packing/types';

export const ITEM_PALETTE = [
  '#ff6a13', '#2563eb', '#1f8a5b', '#b3261e',
  '#6b21a8', '#c97a0a', '#0891b2', '#be185d',
  '#15803d', '#7c3aed', '#dc2626', '#0369a1',
];


let _nextId = 100;
function nextId(prefix: string) { return `${prefix}${_nextId++}`; }

interface State {
  items: Item[];
  boxes: Box[];
  activeBoxId: string;
  view: ViewMode;
  unit: Unit;
  editingItemId: string | null;
  editingBoxId: string | null;
  layerIdx: number;
  tweaksOpen: boolean;

  addItem: () => void;
  updateItem: (item: Item) => void;
  deleteItem: (id: string) => void;
  commitItem: (item: Item) => void;

  addBox: () => void;
  updateBox: (box: Box) => void;
  deleteBox: (id: string) => void;
  commitBox: (box: Box) => void;

  setActiveBoxId: (id: string) => void;
  setView: (v: ViewMode) => void;
  setUnit: (u: Unit) => void;
  setEditingItemId: (id: string | null) => void;
  setEditingBoxId: (id: string | null) => void;
  setLayerIdx: (i: number) => void;
  setTweaksOpen: (v: boolean) => void;

  clearAll: () => void;
  setItems: (items: Item[]) => void;
  setBoxes: (boxes: Box[], activeId?: string) => void;
  setUnit2: (u: Unit) => void;
}

export const useStore = create<State>()((set) => ({
  items: [],
  boxes: [],
  activeBoxId: '',
  view: '3d',
  unit: 'cm',
  editingItemId: null,
  editingBoxId: null,
  layerIdx: 0,
  tweaksOpen: false,

  addItem: () => set((s) => {
    const color = ITEM_PALETTE[s.items.length % ITEM_PALETTE.length];
    const id = nextId('i');
    const item: Item = { id, name: `Item ${s.items.length + 1}`, w: 10, d: 10, h: 10, qty: 1, color };
    return { items: [...s.items, item], editingItemId: id };
  }),
  updateItem: (item) => set((s) => ({ items: s.items.map((it) => it.id === item.id ? item : it) })),
  deleteItem: (id) => set((s) => ({
    items: s.items.filter((it) => it.id !== id),
    editingItemId: s.editingItemId === id ? null : s.editingItemId,
  })),
  commitItem: (item) => set((s) => ({
    items: s.items.map((it) => it.id === item.id ? item : it),
    editingItemId: null,
  })),

  addBox: () => set((s) => {
    const id = nextId('b');
    const box: Box = { id, name: `Box ${s.boxes.length + 1}`, w: 40, d: 30, h: 25 };
    return { boxes: [...s.boxes, box], editingBoxId: id, activeBoxId: id };
  }),
  updateBox: (box) => set((s) => ({ boxes: s.boxes.map((b) => b.id === box.id ? box : b) })),
  deleteBox: (id) => set((s) => {
    const next = s.boxes.filter((b) => b.id !== id);
    return {
      boxes: next,
      activeBoxId: s.activeBoxId === id ? (next[0]?.id ?? '') : s.activeBoxId,
      editingBoxId: s.editingBoxId === id ? null : s.editingBoxId,
    };
  }),
  commitBox: (box) => set((s) => ({
    boxes: s.boxes.map((b) => b.id === box.id ? box : b),
    editingBoxId: null,
  })),

  setActiveBoxId: (id) => set({ activeBoxId: id, layerIdx: 0 }),
  setView: (v) => set({ view: v }),
  setUnit: (u) => set({ unit: u }),
  setEditingItemId: (id) => set({ editingItemId: id }),
  setEditingBoxId: (id) => set({ editingBoxId: id }),
  setLayerIdx: (i) => set({ layerIdx: i }),
  setTweaksOpen: (v) => set({ tweaksOpen: v }),

  clearAll: () => set({ items: [], boxes: [], activeBoxId: '' }),
  setItems: (items) => set({ items }),
  setBoxes: (boxes, activeId) => set({ boxes, activeBoxId: activeId ?? boxes[0]?.id ?? '' }),
  setUnit2: (u) => set({ unit: u }),
}));
