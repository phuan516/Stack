# Stack — Packing Simulator

A 3D bin-packing simulator for expo and convention merchandise. Enter item dimensions and box sizes, and Stack computes a tight arrangement with an interactive 3D view and a step-by-step layer packing guide.

## Features

- **3D scene** with drag-to-rotate orbit (click + drag), rendered via Three.js
- **Layer view** — step through the box slice by slice for a physical packing guide
- **Live packing** — result updates instantly as you add or edit items and boxes
- **Excel I/O** — import from `.xlsx`, export results, download a blank template
- **Console dark theme**

## Stack

- React 18 + TypeScript
- Vite
- Three.js via `@react-three/fiber` + `@react-three/drei`
- Zustand
- SheetJS (`xlsx`)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The app loads with sample data so it's immediately interactive.

## Build

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  components/     UI components (TopBar, ItemsPanel, BoxesPanel, Canvas, Scene3D, LayerView, …)
  state/          Zustand store
  packing/        3D bin-packing algorithm + types
  io/             Excel import/export (SheetJS)
  styles/         CSS tokens (Console theme) + globals
```

See [SPEC.md](./SPEC.md) for the full design spec and implementation notes.

## License

MIT
