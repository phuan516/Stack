import * as XLSX from 'xlsx';
import type { Item, Box, PackResult, Unit } from '../packing/types';

const ITEM_PALETTE = [
  '#ff6a13', '#2563eb', '#1f8a5b', '#b3261e',
  '#6b21a8', '#c97a0a', '#0891b2', '#be185d',
  '#15803d', '#7c3aed', '#dc2626', '#0369a1',
];

let _idCounter = 200;
function nextId(prefix: string) { return `${prefix}${_idCounter++}`; }

export interface ImportResult {
  items?: Item[];
  boxes?: Box[];
  unit?: Unit;
  error?: string;
}

export function importExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const newItems: Item[] = [];
        const newBoxes: Box[] = [];
        let importedUnit: Unit | undefined;

        const itemsSheet = wb.Sheets['Items'];
        const boxesSheet = wb.Sheets['Boxes'];

        if (itemsSheet) {
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(itemsSheet);
          rows.forEach((r, i) => {
            const name = String(r.name ?? r.Name ?? `Item ${i + 1}`);
            const w = parseFloat(String(r.width ?? r.W ?? r.w ?? 0));
            const d = parseFloat(String(r.depth ?? r.D ?? r.d ?? 0));
            const h = parseFloat(String(r.height ?? r.H ?? r.h ?? 0));
            const qty = parseInt(String(r.qty ?? r.Qty ?? r.quantity ?? 1));
            if (r.unit && !importedUnit) {
              const u = String(r.unit).toLowerCase();
              if (u === 'cm' || u === 'in') importedUnit = u;
            }
            if (isNaN(w) || isNaN(d) || isNaN(h)) return;
            newItems.push({
              id: nextId('i'),
              name,
              w, d, h,
              qty: isNaN(qty) ? 1 : qty,
              color: ITEM_PALETTE[i % ITEM_PALETTE.length],
            });
          });
        }

        if (boxesSheet) {
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(boxesSheet);
          rows.forEach((r, i) => {
            const name = String(r.name ?? r.Name ?? `Box ${i + 1}`);
            const w = parseFloat(String(r.width ?? r.W ?? r.w ?? 0));
            const d = parseFloat(String(r.depth ?? r.D ?? r.d ?? 0));
            const h = parseFloat(String(r.height ?? r.H ?? r.h ?? 0));
            if (r.unit && !importedUnit) {
              const u = String(r.unit).toLowerCase();
              if (u === 'cm' || u === 'in') importedUnit = u;
            }
            if (isNaN(w) || isNaN(d) || isNaN(h)) return;
            newBoxes.push({ id: nextId('b'), name, w, d, h });
          });
        }

        if (newItems.length === 0 && newBoxes.length === 0) {
          resolve({ error: 'No valid Items or Boxes sheets found.\n\nExpected columns: name, width, depth, height, qty.' });
          return;
        }

        resolve({ items: newItems.length ? newItems : undefined, boxes: newBoxes.length ? newBoxes : undefined, unit: importedUnit });
      } catch (err) {
        resolve({ error: `Couldn't read file: ${(err as Error).message}` });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export function exportExcel(items: Item[], boxes: Box[], packedResult: PackResult, unit: Unit): void {
  const wb = XLSX.utils.book_new();

  const itemsSheet = XLSX.utils.json_to_sheet(
    items.map((it) => ({ name: it.name, width: it.w, depth: it.d, height: it.h, qty: it.qty, unit })),
    { header: ['name', 'width', 'depth', 'height', 'qty', 'unit'] }
  );
  const boxesSheet = XLSX.utils.json_to_sheet(
    boxes.map((b) => ({ name: b.name, width: b.w, depth: b.d, height: b.h, unit })),
    { header: ['name', 'width', 'depth', 'height', 'unit'] }
  );

  const resultRows: Record<string, unknown>[] = [];
  packedResult.boxes.forEach((pb) => {
    const counts: Record<string, number> = {};
    pb.items.forEach((it) => { counts[it.name] = (counts[it.name] || 0) + 1; });
    Object.entries(counts).forEach(([nm, q]) => {
      resultRows.push({ box: pb.name, item: nm, qty: q, fill_pct: Math.round(pb.fillPct * 1000) / 10 });
    });
  });
  if (packedResult.unpacked.length > 0) {
    const ucounts: Record<string, number> = {};
    packedResult.unpacked.forEach((it) => { ucounts[it.name] = (ucounts[it.name] || 0) + 1; });
    Object.entries(ucounts).forEach(([nm, q]) => {
      resultRows.push({ box: '(unpacked)', item: nm, qty: q, fill_pct: '' });
    });
  }
  const resultsSheet = XLSX.utils.json_to_sheet(resultRows, { header: ['box', 'item', 'qty', 'fill_pct'] });

  XLSX.utils.book_append_sheet(wb, itemsSheet, 'Items');
  XLSX.utils.book_append_sheet(wb, boxesSheet, 'Boxes');
  XLSX.utils.book_append_sheet(wb, resultsSheet, 'Packing Result');
  XLSX.writeFile(wb, 'stack-packing.xlsx');
}

export function downloadTemplate(): void {
  const wb = XLSX.utils.book_new();
  const itemsSheet = XLSX.utils.json_to_sheet([
    { name: 'Figure (1/7 scale)', width: 18, depth: 14, height: 28, qty: 6, unit: 'cm' },
    { name: 'Nendoroid box', width: 10, depth: 10, height: 14, qty: 12, unit: 'cm' },
  ], { header: ['name', 'width', 'depth', 'height', 'qty', 'unit'] });
  const boxesSheet = XLSX.utils.json_to_sheet([
    { name: 'Medium carrier', width: 50, depth: 40, height: 35, unit: 'cm' },
    { name: 'Large carrier', width: 60, depth: 45, height: 45, unit: 'cm' },
  ], { header: ['name', 'width', 'depth', 'height', 'unit'] });
  XLSX.utils.book_append_sheet(wb, itemsSheet, 'Items');
  XLSX.utils.book_append_sheet(wb, boxesSheet, 'Boxes');
  XLSX.writeFile(wb, 'stack-template.xlsx');
}
