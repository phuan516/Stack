import { useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { PackedBox, PlacedItem } from '../packing/types';

// Coordinate mapping: our (x=width, y=depth, z=height_up) → Three.js (x, y=height, z=-depth)
// Item at our (ox,oy,oz) with dims (w,d,h):
//   Three.js center: (ox+w/2,  oz+h/2,  -(oy+d/2))
//   Three.js args:   (w, h, d)

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
}

// BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
// With our mapping Three.y=height, Three.z=-depth:
//   +Y = top (+10%), -Y = bottom (-28%)
//   +X = right (-14%), -X = left (-20%)
//   +Z = front (base), -Z = back (-8%)
const FACE_FACTORS = [0.86, 0.80, 1.10, 0.72, 1.00, 0.92];

function createItemGeo(w: number, h: number, d: number, hex: string): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(w, h, d);
  const [r, g, b] = hexToRgb(hex);
  const colors = new Float32Array(24 * 3);
  for (let face = 0; face < 6; face++) {
    const f = FACE_FACTORS[face];
    for (let v = 0; v < 4; v++) {
      const i = (face * 4 + v) * 3;
      colors[i]     = Math.min(1, r * f);
      colors[i + 1] = Math.min(1, g * f);
      colors[i + 2] = Math.min(1, b * f);
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

const ITEM_MAT = new THREE.MeshBasicMaterial({ vertexColors: true });
const EDGE_MAT = new THREE.LineBasicMaterial({ color: 0x2a3447 });
const FLOOR_MAT = new THREE.MeshBasicMaterial({ color: 0x1c2434, side: THREE.DoubleSide });
const WALL_MAT = new THREE.MeshBasicMaterial({ color: 0x38e1c1, transparent: true, opacity: 0.04, side: THREE.DoubleSide });

function BoxContainer({ dims }: { dims: { w: number; d: number; h: number } }) {
  const { w, d, h } = dims;

  const edgesGeo = useMemo(() => {
    // Visible box edges: floor outline, back/left wall verticals, top edges of back+left walls
    const pts: number[] = [
      // floor outline
      0,0,0,   w,0,0,
      w,0,0,   w,0,-d,
      w,0,-d,  0,0,-d,
      0,0,-d,  0,0,0,
      // back wall (z=-d): bottom already in floor, add top + verticals
      0,0,-d,  0,h,-d,
      w,0,-d,  w,h,-d,
      0,h,-d,  w,h,-d,
      // left wall (x=0): bottom already in floor, add top + front vertical
      0,0,0,   0,h,0,
      0,h,0,   0,h,-d,
    ];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, [w, d, h]);

  return (
    <group>
      <mesh position={[w / 2, 0, -d / 2]} rotation={[-Math.PI / 2, 0, 0]} material={FLOOR_MAT}>
        <planeGeometry args={[w, d]} />
      </mesh>
      <mesh position={[w / 2, h / 2, -d]} material={WALL_MAT}>
        <planeGeometry args={[w, h]} />
      </mesh>
      <mesh position={[0, h / 2, -d / 2]} rotation={[0, Math.PI / 2, 0]} material={WALL_MAT}>
        <planeGeometry args={[d, h]} />
      </mesh>
      <lineSegments geometry={edgesGeo} material={EDGE_MAT} />
    </group>
  );
}

function ItemMesh({ item }: { item: PlacedItem }) {
  const { x, y, z, w, d, h, color } = item;
  const geo = useMemo(() => createItemGeo(w, h, d, color), [w, h, d, color]);
  return (
    <mesh
      geometry={geo}
      material={ITEM_MAT}
      position={[x + w / 2, z + h / 2, -(y + d / 2)]}
    />
  );
}

function CameraRig({ dims }: { dims: { w: number; d: number; h: number } }) {
  const { camera } = useThree();
  const set = useRef(false);

  if (!set.current) {
    const { w, d, h } = dims;
    const target = new THREE.Vector3(w / 2, h / 2, -d / 2);
    const r = Math.max(w, d, h) * 2.8;
    // yaw -32°, pitch 22°
    const phi = Math.PI / 2 - (22 * Math.PI) / 180;   // polar from top
    const theta = (-32 * Math.PI) / 180;               // azimuth
    camera.position.set(
      target.x + r * Math.sin(phi) * Math.sin(theta),
      target.y + r * Math.cos(phi),
      target.z + r * Math.sin(phi) * Math.cos(theta),
    );
    camera.lookAt(target);
    set.current = true;
  }

  return null;
}

interface Props {
  box: PackedBox;
  showLabels: boolean;
}

export function Scene3D({ box }: Props) {
  const { dims, items } = box;
  const target: [number, number, number] = [dims.w / 2, dims.h / 2, -dims.d / 2];

  return (
    <div className="scene3d-wrap">
      <Canvas camera={{ fov: 45, near: 0.1, far: 100000 }}>
        <CameraRig dims={dims} />
        <BoxContainer dims={dims} />
        {items.map((it) => (
          <ItemMesh key={`${it.itemId}-${it.instanceIdx}`} item={it} />
        ))}
        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI / 18}
          maxPolarAngle={(Math.PI * 5) / 12}
          target={target}
        />
      </Canvas>
    </div>
  );
}
