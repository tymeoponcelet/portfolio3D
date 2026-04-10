import { useRef, useEffect } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWindowStore } from '../../stores/windowStore'
import { OS } from '../OS/OS'
import {
  SCREEN_WORLD_W,
  SCREEN_WORLD_H,
  SCREEN_MESH_NAME,
  PC_MODEL_SCALE,
  DEBUG_HIGHLIGHT_SCREEN,
  DOM_W,
  DOM_H,
  SCALE_FACTOR,
} from '../../constants/screen'

// ── Détection du mesh-écran ───────────────────────────────────────
const _wb = new THREE.Box3()
const _ws = new THREE.Vector3()

function detectScreenMesh(scene) {
  if (SCREEN_MESH_NAME) {
    let found = null
    scene.traverse((obj) => { if (obj.isMesh && obj.name === SCREEN_MESH_NAME) found = obj })
    if (found) return found
    console.warn(`[VintagePC] SCREEN_MESH_NAME="${SCREEN_MESH_NAME}" introuvable`)
  }
  const candidates = []
  scene.traverse((obj) => {
    if (!obj.isMesh) return
    _wb.setFromObject(obj); _wb.getSize(_ws)
    const [d1, d2, d3] = [_ws.x, _ws.y, _ws.z].sort((a, b) => b - a)
    if (Math.max(d1, d2, d3) < 0.01) return
    const flat = d3 / d1
    if (flat >= 0.20) return
    const aspect     = d1 / d2
    const flatScore  = 1 - flat / 0.20
    const aspectDiff = Math.min(Math.abs(aspect - 1.333), Math.abs(aspect - 1.778), Math.abs(aspect - 1.0))
    const aspectScore = Math.max(0, 1 - aspectDiff / 0.5)
    const sizeScore  = Math.min(1, d1 / 0.3)
    candidates.push({ mesh: obj, score: flatScore * 0.55 + aspectScore * 0.30 + sizeScore * 0.15 })
  })
  candidates.sort((a, b) => b.score - a.score)
  return candidates[0]?.mesh ?? null
}

// ── Vecteurs réutilisables (zéro allocation par frame) ───────────
const _p      = new THREE.Vector3()
const _q      = new THREE.Quaternion()
const _wScale = new THREE.Vector3()

// ── ScreenContent ─────────────────────────────────────────────────
// Positionné à la RACINE du Canvas (hors de PresentationControls)
// pour éviter la double-transformation. Chaque frame, getWorldPosition()
// lit la position world résolue du mesh-écran et la copie impérativement
// sur le groupe parent du Html (pas de useState = pas de re-render).
//
// Layout dans la scène :
//   Canvas root
//     ├── PresentationControls.group
//     │     └── VintagePC (primitive GLB + mesh-écran)
//     └── ScreenContent           ← hors du group PresentationControls
//           ├── pointLight (impératif, devant l'écran)
//           └── group (impératif, position+rotation+scale = mesh-écran)
//                 └── Html transform  ← OS React
export function ScreenContent({ isFocused }) {
  const screenRef      = useWindowStore((s) => s.screenRef)
  const setScreenCenter = useWindowStore((s) => s.setScreenCenter)

  const groupRef    = useRef()   // group parent du Html (impératif)
  const lightRef    = useRef()   // PointLight impératif
  const dynScale    = useRef(SCALE_FACTOR)
  const scaleReady  = useRef(false)
  const centerSaved = useRef(false)

  // Reset si le mesh change (rechargement GLB, HMR)
  useEffect(() => {
    scaleReady.current  = false
    centerSaved.current = false
  }, [screenRef])

  // Chaque frame : coller le groupe au mesh-écran
  useFrame(() => {
    if (!screenRef || !groupRef.current) return

    // ── Position + rotation depuis le mesh réel ───────────────────
    screenRef.getWorldPosition(_p)
    screenRef.getWorldQuaternion(_q)

    groupRef.current.position.copy(_p)
    groupRef.current.quaternion.copy(_q)
    groupRef.current.scale.setScalar(dynScale.current)

    // ── Point light légèrement devant l'écran ─────────────────────
    if (lightRef.current) {
      lightRef.current.position.set(_p.x, _p.y, _p.z + 0.15)
    }

    // ── Calcul du scale dynamique (une seule fois) ────────────────
    // worldW = largeur locale du mesh × scale world → même formule que CSS3DBridge.
    if (!scaleReady.current && screenRef.geometry) {
      screenRef.geometry.computeBoundingBox()
      const box = screenRef.geometry.boundingBox
      if (box) {
        const localW = box.max.x - box.min.x
        screenRef.getWorldScale(_wScale)
        const worldW = Math.abs(localW * _wScale.x)
        if (worldW > 0) {
          dynScale.current = worldW / DOM_W
          scaleReady.current = true
          console.log(
            `[ScreenContent] ✓ worldW=${worldW.toFixed(4)}u  ` +
            `scale=${dynScale.current.toFixed(6)}  ` +
            `pos=(${_p.x.toFixed(3)}, ${_p.y.toFixed(3)}, ${_p.z.toFixed(3)})`
          )
        }
      }
    }

    // ── Stocker le centre pour le zoom (une seule fois) ───────────
    if (!centerSaved.current && scaleReady.current) {
      setScreenCenter({ x: _p.x, y: _p.y, z: _p.z })
      centerSaved.current = true
    }
  })

  return (
    <>
      {/* Halo CRT : PointLight positionné en impératif (hors du groupe scalé) */}
      <pointLight
        ref={lightRef}
        color="#80d4ff"
        intensity={1.2}
        distance={2.5}
        decay={2}
      />

      {/* Groupe impératif — position/rotation/scale = mesh-écran à chaque frame */}
      <group ref={groupRef}>
        {/*
          Html transform sans props position/rotation/scale :
          il hérite tout du groupe parent via matrixWorld.

          group.scale = worldW/DOM_W (≈0.001)
          → 640 px DOM × 0.001 = 0.64 u Three.js = largeur réelle du mesh
        */}
        <Html
          transform
          zIndexRange={[100, 0]}
          style={{
            width:         DOM_W,
            height:        DOM_H,
            overflow:      'hidden',
            pointerEvents: isFocused ? 'auto' : 'none',
            background:    '#008080',
          }}
        >
          <OS />
        </Html>
      </group>
    </>
  )
}

// ── VintagePC ────────────────────────────────────────────────────
export function VintagePC({ onMonitorClick }) {
  const { scene } = useGLTF('/models/vintage_pc.glb')
  const fallbackRef  = useRef()
  const setScreenRef = useWindowStore((s) => s.setScreenRef)

  useEffect(() => {
    const screenMesh = detectScreenMesh(scene)

    if (screenMesh) {
      console.log(`[VintagePC] ✓ Mesh-écran : "${screenMesh.name}"`)
      setScreenRef(screenMesh)

      // Allumer l'écran : phosphore CRT
      const mat = screenMesh.material
      if (mat && !mat._crtLit) {
        mat.emissive          = new THREE.Color('#003355')
        mat.emissiveIntensity = 3.0
        mat.needsUpdate       = true
        mat._crtLit           = true
      }
      if (DEBUG_HIGHLIGHT_SCREEN) {
        mat.emissive.set('#00ff44'); mat.needsUpdate = true
        setTimeout(() => { mat.emissive.set('#003355'); mat.needsUpdate = true }, 3000)
      }
    } else {
      if (fallbackRef.current) setScreenRef(fallbackRef.current)
    }

    return () => setScreenRef(null)
  }, [scene, setScreenRef])

  return (
    <>
      <primitive
        object={scene}
        scale={PC_MODEL_SCALE}
        onClick={(e) => { e.stopPropagation(); onMonitorClick?.() }}
        onPointerOver={() => { document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'auto' }}
      />

      {/* Fallback invisible si aucun mesh détecté */}
      <mesh ref={fallbackRef} position={[0, 0.80, 0.271]} visible={false}>
        <planeGeometry args={[SCREEN_WORLD_W, SCREEN_WORLD_H]} />
        <meshBasicMaterial />
      </mesh>
    </>
  )
}

useGLTF.preload('/models/vintage_pc.glb')
