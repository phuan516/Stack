export interface Item {
  id: string;
  name: string;
  w: number;
  d: number;
  h: number;
  qty: number;
  color: string;
}

export interface Box {
  id: string;
  name: string;
  w: number;
  d: number;
  h: number;
}

export interface PlacedItem {
  itemId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  rot: number;
  origW: number;
  origD: number;
  origH: number;
  instanceIdx: number;
}

export interface PackedBox {
  boxId: string;
  name: string;
  dims: { w: number; d: number; h: number };
  items: PlacedItem[];
  usedVolume: number;
  totalVolume: number;
  fillPct: number;
  zLevels: number[];
}

export interface UnpackedItem {
  itemId: string;
  name: string;
  color: string;
  w: number;
  d: number;
  h: number;
  instanceIdx: number;
}

export interface PackResult {
  boxes: PackedBox[];
  unpacked: UnpackedItem[];
}

export type ViewMode = '3d' | 'layers';
export type Unit = 'cm' | 'in';

export interface SummaryStats {
  avgFill: number;
  totalItems: number;
  boxesUsed: number;
  totalBoxes: number;
  unpacked: number;
}
