import * as THREE from 'three'

// ── Dimensions de la pièce ────────────────────────────────────────
const FLOOR_Y  = -0.62   // sol (sous les pieds du bureau)
const CEIL_Y   =  2.20   // plafond
const WALL_X_L = -3.4    // mur gauche
const WALL_X_R =  3.4    // mur droit
const WALL_Z_B = -2.0    // mur du fond (z négatif)
const WALL_Z_F =  2.2    // "mur" derrière caméra (optionnel, peu visible)

// ── Découpe fenêtre dans le mur du fond ──────────────────────────
// Doit correspondre à la position de la fenêtre dans Moon.jsx (MX, MY)
const WIN_CX = -0.85
const WIN_CY =  0.80
const WIN_HW =  0.52   // demi-largeur du trou
const WIN_HH =  0.62   // demi-hauteur du trou

const wallMat = {
  color:              '#0c0c1c',
  emissive:           new THREE.Color('#06060f'),
  emissiveIntensity:  1,
  roughness:          1,
  metalness:          0,
}

const deskMat = {
  color:             '#1a0d06',
  emissive:          new THREE.Color('#0a0804'),
  emissiveIntensity: 1,
  roughness:         0.85,
  metalness:         0,
}

function WallMesh({ args, position, rotation }) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow castShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial {...wallMat} />
    </mesh>
  )
}

function DeskMesh({ args, position }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial {...deskMat} />
    </mesh>
  )
}

export function Room() {
  const roomH  = CEIL_Y - FLOOR_Y   // hauteur totale
  const roomCY = (CEIL_Y + FLOOR_Y) / 2

  // Mur du fond : 4 panneaux autour du trou de fenêtre
  const holeL = WIN_CX - WIN_HW   // x gauche du trou
  const holeR = WIN_CX + WIN_HW   // x droit du trou
  const holeB = WIN_CY - WIN_HH   // y bas du trou
  const holeT = WIN_CY + WIN_HH   // y haut du trou

  const totalW = WALL_X_R - WALL_X_L   // largeur totale du mur

  // panneau gauche : de WALL_X_L à holeL
  const leftW   = holeL - WALL_X_L
  const leftCX  = WALL_X_L + leftW / 2
  // panneau droit : de holeR à WALL_X_R
  const rightW  = WALL_X_R - holeR
  const rightCX = holeR + rightW / 2
  // panneau milieu bas : de holeL à holeR, de FLOOR_Y à holeB
  const midW    = holeR - holeL
  const botH    = holeB - FLOOR_Y
  const botCY   = FLOOR_Y + botH / 2
  // panneau milieu haut : de holeL à holeR, de holeT à CEIL_Y
  const topH    = CEIL_Y - holeT
  const topCY   = holeT + topH / 2

  const T = 0.07   // épaisseur murs

  return (
    <>
      {/* ── Mur du fond (4 panneaux) ─────────────────────────── */}
      <WallMesh args={[leftW,  roomH, T]} position={[leftCX,  roomCY, WALL_Z_B]} />
      <WallMesh args={[rightW, roomH, T]} position={[rightCX, roomCY, WALL_Z_B]} />
      <WallMesh args={[midW,   botH,  T]} position={[WIN_CX,  botCY,  WALL_Z_B]} />
      {topH > 0 && (
        <WallMesh args={[midW, topH, T]} position={[WIN_CX, topCY, WALL_Z_B]} />
      )}

      {/* ── Mur gauche ───────────────────────────────────────── */}
      <WallMesh
        args={[T, roomH, WALL_Z_F - WALL_Z_B]}
        position={[WALL_X_L, roomCY, (WALL_Z_B + WALL_Z_F) / 2]}
      />

      {/* ── Mur droit ────────────────────────────────────────── */}
      <WallMesh
        args={[T, roomH, WALL_Z_F - WALL_Z_B]}
        position={[WALL_X_R, roomCY, (WALL_Z_B + WALL_Z_F) / 2]}
      />

      {/* ── Plafond ──────────────────────────────────────────── */}
      <WallMesh
        args={[totalW + T * 2, T, WALL_Z_F - WALL_Z_B]}
        position={[0, CEIL_Y, (WALL_Z_B + WALL_Z_F) / 2]}
      />

      {/* ── Bureau ───────────────────────────────────────────── */}
      {/* Plateau */}
      <DeskMesh args={[1.90, 0.04, 0.92]} position={[0, -0.02, 0.01]} />

      {/* 4 pieds */}
      {[
        [-0.88,  0.07],
        [ 0.88,  0.07],
        [-0.88, -0.43],
        [ 0.88, -0.43],
      ].map(([lx, lz], i) => (
        <DeskMesh
          key={i}
          args={[0.06, FLOOR_Y * -1 - 0.04, 0.06]}
          position={[lx, FLOOR_Y / 2 - 0.02, lz]}
        />
      ))}

      {/* Panneau de fond du bureau (ceinture arrière) */}
      <DeskMesh args={[1.78, 0.28, 0.03]} position={[0, FLOOR_Y / 2 + 0.08, -0.435]} />
    </>
  )
}
