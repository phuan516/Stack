import type { Item, Box, PackedBox, PlacedItem, UnpackedItem, PackResult } from './types';

type Rotation = [number, number, number, number];
type Point = { x: number; y: number; z: number };
type Candidate = Point & { w: number; d: number; h: number };

function rotations(item: { w: number; d: number; h: number }): Rotation[] {
  const { w, d, h } = item;
  const rots: Rotation[] = [
    [w, d, h, 0],
    [d, w, h, 1],
    [w, h, d, 2],
    [h, w, d, 3],
    [d, h, w, 4],
    [h, d, w, 5],
  ];
  const seen = new Set<string>();
  return rots.filter((r) => {
    const k = `${r[0]}x${r[1]}x${r[2]}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function overlaps(a: Candidate, b: Candidate, eps = 0.0001): boolean {
  return (
    a.x + a.w > b.x + eps &&
    b.x + b.w > a.x + eps &&
    a.y + a.d > b.y + eps &&
    b.y + b.d > a.y + eps &&
    a.z + a.h > b.z + eps &&
    b.z + b.h > a.z + eps
  );
}

function fitsBox(p: Candidate, box: { w: number; d: number; h: number }): boolean {
  return (
    p.x >= -0.0001 &&
    p.y >= -0.0001 &&
    p.z >= -0.0001 &&
    p.x + p.w <= box.w + 0.0001 &&
    p.y + p.d <= box.d + 0.0001 &&
    p.z + p.h <= box.h + 0.0001
  );
}

function supportFraction(p: Candidate, placed: Candidate[]): number {
  if (p.z < 0.0001) return 1;
  let supported = 0;
  const baseArea = p.w * p.d;
  for (const q of placed) {
    if (Math.abs(q.z + q.h - p.z) > 0.0001) continue;
    const ox = Math.max(0, Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x));
    const oy = Math.max(0, Math.min(p.y + p.d, q.y + q.d) - Math.max(p.y, q.y));
    supported += ox * oy;
  }
  return supported / baseArea;
}

function tryPlace(
  box: { w: number; d: number; h: number },
  placed: Candidate[],
  points: Point[],
  rot: Rotation
): (Candidate & { score: number }) | null {
  let best: (Candidate & { score: number }) | null = null;
  for (const pt of points) {
    const cand: Candidate = { x: pt.x, y: pt.y, z: pt.z, w: rot[0], d: rot[1], h: rot[2] };
    if (!fitsBox(cand, box)) continue;
    let ok = true;
    for (const q of placed) {
      if (overlaps(cand, q)) { ok = false; break; }
    }
    if (!ok) continue;
    if (supportFraction(cand, placed) < 0.7) continue;
    const score = cand.z * 1e6 + cand.y * 1e3 + cand.x;
    if (best === null || score < best.score) {
      best = { ...cand, score };
    }
  }
  return best;
}

function probeBox(
  box: { w: number; d: number; h: number },
  placed: Candidate[],
  points: Point[],
  item: { w: number; d: number; h: number }
): (Candidate & { rot: number; score: number }) | null {
  let best: (Candidate & { rot: number; score: number }) | null = null;
  for (const rot of rotations(item)) {
    const placement = tryPlace(box, placed, points, rot);
    if (placement && (best === null || placement.score < best.score)) {
      best = { ...placement, rot: rot[3] };
    }
  }
  return best;
}

function commitPlacement(
  best: Candidate & { rot: number; score: number },
  box: { w: number; d: number; h: number },
  points: Point[]
): void {
  const newPoints: Point[] = [
    { x: best.x + best.w, y: best.y,         z: best.z },
    { x: best.x,          y: best.y + best.d, z: best.z },
    { x: best.x,          y: best.y,          z: best.z + best.h },
  ];
  for (const np of newPoints) {
    if (np.x > box.w - 0.0001 || np.y > box.d - 0.0001 || np.z > box.h - 0.0001) continue;
    const exists = points.some(
      (p) => Math.abs(p.x - np.x) < 0.0001 && Math.abs(p.y - np.y) < 0.0001 && Math.abs(p.z - np.z) < 0.0001
    );
    if (!exists) points.push(np);
  }
}

export function pack(boxes: Box[], items: Item[]): PackResult {
  type Instance = {
    itemId: string;
    name: string;
    color: string;
    w: number;
    d: number;
    h: number;
    volume: number;
    instanceIdx: number;
  };

  const instances: Instance[] = [];
  for (const item of items) {
    const qty = Math.max(1, Math.floor(item.qty || 1));
    for (let i = 0; i < qty; i++) {
      instances.push({
        itemId: item.id,
        name: item.name,
        color: item.color,
        w: item.w,
        d: item.d,
        h: item.h,
        volume: item.w * item.d * item.h,
        instanceIdx: i,
      });
    }
  }
  instances.sort((a, b) => {
    if (Math.abs(b.volume - a.volume) > 0.0001) return b.volume - a.volume;
    return Math.max(b.w, b.d, b.h) - Math.max(a.w, a.d, a.h);
  });

  type PackSlot = {
    boxId: string;
    name: string;
    dims: { w: number; d: number; h: number };
    items: (Candidate & { itemId: string; name: string; color: string; instanceIdx: number; rot: number; origW: number; origD: number; origH: number })[];
    points: Point[];
    usedVolume: number;
  };

  const packed: PackSlot[] = boxes.map((b) => ({
    boxId: b.id,
    name: b.name,
    dims: { w: b.w, d: b.d, h: b.h },
    items: [],
    points: [{ x: 0, y: 0, z: 0 }],
    usedVolume: 0,
  }));

  const unpacked: UnpackedItem[] = [];

  for (const inst of instances) {
    let bestSlot: PackSlot | null = null;
    let bestPlacement: (Candidate & { rot: number; score: number }) | null = null;
    let bestBoxScore = Infinity;

    for (const slot of packed) {
      const probe = probeBox(slot.dims, slot.items as Candidate[], slot.points, inst);
      if (!probe) continue;
      const fillRatio = slot.usedVolume / (slot.dims.w * slot.dims.d * slot.dims.h);
      const boxScore = probe.score - fillRatio * 1e9;
      if (boxScore < bestBoxScore) {
        bestBoxScore = boxScore;
        bestSlot = slot;
        bestPlacement = probe;
      }
    }

    if (bestSlot && bestPlacement) {
      commitPlacement(bestPlacement, bestSlot.dims, bestSlot.points);
      bestSlot.usedVolume += inst.w * inst.d * inst.h;
      bestSlot.items.push({
        ...bestPlacement,
        itemId: inst.itemId,
        name: inst.name,
        color: inst.color,
        instanceIdx: inst.instanceIdx,
        origW: inst.w,
        origD: inst.d,
        origH: inst.h,
      });
    } else {
      unpacked.push({
        itemId: inst.itemId,
        name: inst.name,
        color: inst.color,
        w: inst.w,
        d: inst.d,
        h: inst.h,
        instanceIdx: inst.instanceIdx,
      });
    }
  }

  const resultBoxes: PackedBox[] = packed.map((slot) => {
    const used = slot.usedVolume;
    const total = slot.dims.w * slot.dims.d * slot.dims.h;
    const zSet = new Set<number>();
    slot.items.forEach((it) => zSet.add(Math.round(it.z * 1000) / 1000));
    return {
      boxId: slot.boxId,
      name: slot.name,
      dims: slot.dims,
      items: slot.items as PlacedItem[],
      usedVolume: used,
      totalVolume: total,
      fillPct: total > 0 ? used / total : 0,
      zLevels: Array.from(zSet).sort((a, b) => a - b),
    };
  });

  return { boxes: resultBoxes, unpacked };
}
