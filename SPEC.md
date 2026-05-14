# Stack — Packing Simulator

A 3D bin-packing simulator for expo/convention merchandise packing. Users enter item dimensions and box sizes; the app computes a tight arrangement and renders it as an interactive 3D scene with a layer-by-layer packing guide.

---

## Production Decisions

Three explicit deviations from the design prototype:

1. **Console theme only.** Warehouse and Workshop themes are removed. All CSS variables use the Console dark palette. No theme switcher.
2. **No 2D top-down view.** The view toggle is `3D | LAYERS` only. The 2D full-scene renderer is deleted. The Layer view's internal 2D slice rendering is preserved.
3. **Drag-to-rotate in 3D.** Click+drag orbits the camera. Horizontal = yaw, vertical = pitch (clamped 5°–75°). Implemented via Three.js `OrbitControls` with `enablePan: false`. The Tweaks panel's Yaw/Pitch sliders are removed.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| 3D | `three` + `@react-three/fiber` + `@react-three/drei` (OrbitControls) |
| State | Zustand |
| Excel I/O | SheetJS (`xlsx`) |
| Icons | Lucide React |

---

## File Structure

```
src/
  components/
    TopBar.tsx         — brand, unit toggle, import/export, tweaks trigger
    ItemsPanel.tsx     — left column: item CRUD
    BoxesPanel.tsx     — right column: box CRUD + fill stats
    Canvas.tsx         — center: box tabs, view toggle, stage
    Scene3D.tsx        — react-three-fiber 3D view with OrbitControls
    LayerView.tsx      — layer-by-layer 2D slice view
    SummaryBar.tsx     — floating pill stats bar
    TweaksDrawer.tsx   — settings overlay (labels, measurements, data reset)
  state/
    useStore.ts        — Zustand store (all app state + actions)
  packing/
    types.ts           — Item, Box, PlacedItem, PackedBox, PackResult
    packer.ts          — 3D extreme-point heuristic (ported from packer.js)
  io/
    excel.ts           — SheetJS import/export wrapper
  styles/
    tokens.css         — Console theme CSS custom properties + base reset
    globals.css        — all component styles
  App.tsx              — root layout, packing memo, keyboard shortcuts
  main.tsx             — ReactDOM.createRoot
```

---

## State Shape (Zustand)

```typescript
// Persisted
items:            Item[]           // { id, name, w, d, h, qty, color }
boxes:            Box[]            // { id, name, w, d, h }
activeBoxId:      string
view:             '3d' | 'layers'
unit:             'cm' | 'in'
editingItemId:    string | null
editingBoxId:     string | null
layerIdx:         number           // current layer in LayerView
showLabels:       boolean
showMeasurements: boolean
tweaksOpen:       boolean

// Derived (useMemo in App.tsx, passed as props or context)
packedResult:     PackResult       // boxes: PackedBox[], unpacked: UnpackedItem[]
summary:          SummaryStats     // avgFill, boxesUsed, totalBoxes, totalItems, unpacked
```

---

## Packing Algorithm

`src/packing/packer.ts` — direct TypeScript port of the reference `packer.js`.

**3D extreme-point heuristic with FFD:**
1. Expand items by qty into instances; sort by volume desc.
2. For each instance, try every box (first-fit).
3. For each box, try every candidate point × 6 axis-aligned rotations.
4. Valid placement: fits inside box bounds + no overlap + ≥70% base support.
5. Best placement: lowest `(z, y, x)` score.
6. On placement: add 3 new candidate points at outer corners.
7. Unplaceable instances → `unpacked`.

Post-pack: compute fill% and distinct z-levels (for LayerView) per box.

Not optimal (heuristic), but fast enough for hundreds of items.

---

## 3D Rendering (Scene3D)

**Coordinate mapping** — our system (x=width, y=depth, z=height-up) → Three.js (x, y=height, z=-depth):
- `Three.x = our x`
- `Three.y = our z`  
- `Three.z = -our y`

**Box container:**
- Floor: PlaneGeometry at y=0, color `--box-floor` (#1c2434)
- Back wall: PlaneGeometry at z=-box.d, translucent teal tint
- Left wall: PlaneGeometry at x=0, translucent teal tint
- Box edges: LineSegments along visible corners, color `--box-shell` (#2a3447)

**Items:** BoxGeometry with vertex colors (one per face):
| Face | Factor |
|------|--------|
| Top (+Y) | ×1.10 |
| Front (+Z) | ×1.00 |
| Right (+X) | ×0.86 |
| Back (-Z) | ×0.92 |
| Left (-X) | ×0.80 |
| Bottom (-Y) | ×0.72 |

**Camera:** Initial yaw -32°, pitch 22°. OrbitControls with:
- `enablePan: false`
- `minPolarAngle: Math.PI / 18` (10°)
- `maxPolarAngle: Math.PI * 5 / 12` (75°)

---

## Layer View

Renders a 2D top-down slice of the active box at a given Z level. Controlled by a range slider + prev/next buttons. Items are filtered to those whose `z` matches the current `zLevel` (±epsilon). Caption shows item count for that layer.

---

## Excel I/O

**Import** (`src/io/excel.ts`):
- Accepts `.xlsx`/`.xls`
- Reads sheets `Items` (name, width/w, depth/d, height/h, qty, unit) and `Boxes` (name, width, depth, height)
- Replaces existing data wholesale

**Export** three sheets: `Items`, `Boxes`, `Packing Result` (per-item-type per-box + unpacked rows)

**Template** downloads a stub workbook with one row of sample data each.

---

## Design Tokens (Console Theme)

```css
--bg:          #0c1018
--bg-2:        #131923
--panel:       #161d2a
--ink:         #d8e1f0
--ink-2:       #8a97b0
--ink-3:       #4a5572
--rule:        #1f2738
--rule-soft:   #1a2030
--accent:      #38e1c1
--accent-ink:  #0c1018
--good:        #38e1c1
--warn:        #f5b14a
--bad:         #ff5d5d
--grid:        rgba(216,225,240,0.05)
--box-shell:   #2a3447
--box-floor:   #1c2434
--box-tint:    rgba(56,225,193,0.04)

font-sans:    "Inter", system-ui, sans-serif
font-mono:    "JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace
font-display: "JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace

radius:     3px
radius-lg:  6px
```

**Item palette** (color cycle for new items):
`#ff6a13 #2563eb #1f8a5b #b3261e #6b21a8 #c97a0a #0891b2 #be185d #15803d #7c3aed #dc2626 #0369a1`

---

## Responsive

Breakpoint at ≤820px: panels stack vertically below the canvas. Tablet-first tool; full desktop experience at ≥1020px.

---

## Sample Data

App loads with 8 items (figures, kits, art books, plushies) and 3 boxes (Medium, Large, Tall) so it's immediately interactive.
