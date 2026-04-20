import { useState, useEffect, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useWindowStore } from '../../stores/windowStore'
import { CSS3DScreen } from './CSS3DScreen'
import {
  PC_MODEL_SCALE,
  DEBUG_HIGHLIGHT_SCREEN,
} from '../../constants/screen'

// ── Détection du mesh-écran (fallback uniquement) ────────────────────
// Utilisée seulement si nodes.Object_19 est absent (modèle différent).
const _b = new THREE.Box3()
const _s = new THREE.Vector3()

function detectScreenMesh(scene) {
  if (DEBUG_HIGHLIGHT_SCREEN) {
    console.group('[VintagePC] mesh dump (fallback detection)')
    scene.traverse((obj) => {
      if (!obj.isMesh) return
      _b.setFromObject(obj); _b.getSize(_s)
      const [d1, d2, d3] = [_s.x, _s.y, _s.z].sort((a, b) => b - a)
      const ctr = new THREE.Vector3(); _b.getCenter(ctr)
      console.log(
        `"${obj.name}" mat="${obj.material?.name}"` +
        ` ${d1.toFixed(3)}×${d2.toFixed(3)}×${d3.toFixed(3)}` +
        ` flat=${(d3/d1).toFixed(3)}` +
        ` ctr=(${ctr.x.toFixed(3)},${ctr.y.toFixed(3)},${ctr.z.toFixed(3)})`
      )
    })
    console.groupEnd()
  }

  const SCREEN_KW  = ['screen', 'monitor', 'crt', 'display', 'glass', 'tube']
  const EXCLUDE_KW = ['keyboard', 'vent', 'plug']
  const MAX_SIZE   = 1.5   // world units

  let best = null, bestScore = Infinity

  scene.traverse((obj) => {
    if (!obj.isMesh) return
    const mat = (obj.material?.name ?? '').toLowerCase()
    if (EXCLUDE_KW.some(kw => mat.includes(kw))) return

    const hasScreenKw = SCREEN_KW.some(kw => mat.includes(kw))
    if (!hasScreenKw) return

    _b.setFromObject(obj); _b.getSize(_s)
    const [d1, , d3] = [_s.x, _s.y, _s.z].sort((a, b) => b - a)
    if (d1 < 0.01 || d1 > MAX_SIZE) return

    const flat  = d3 / d1
    if (flat >= 0.30) return

    // Score : matériau "screen" prioritaire (×0.5), sinon flat ratio brut
    const score = mat.includes('screen') ? flat * 0.5 : flat
    if (score < bestScore) { bestScore = score; best = obj }
  })

  if (best) {
    _b.setFromObject(best)
    const ctr = new THREE.Vector3(); _b.getCenter(ctr)
    console.log(
      `[VintagePC] ✓ fallback "${best.name}" mat="${best.material?.name}"` +
      ` ctr=(${ctr.x.toFixed(3)},${ctr.y.toFixed(3)},${ctr.z.toFixed(3)})`
    )
  }
  return best
}

// ── VintagePC ─────────────────────────────────────────────────────────
// L'OS rétro est affiché via CSS3DRenderer (CSS3DScreen) :
//   • Une iframe charge /os.html (2e entry Vite) en standalone.
//   • CSS3DScreen lit la worldMatrix d'Object_19 chaque frame pour suivre
//     PresentationControls sans décalage.
//   • scale CSS = SCREEN_WORLD_W / DOM_W  (1 px CSS = 1 Three.js unit)
//   • Décalage +Z = demi-profondeur du mesh + 2 mm (anti Z-fighting).
export function VintagePC({ onMonitorEnter, onMonitorLeave, onScreenLeave, isFocused }) {
  const { scene, nodes } = useGLTF('./models/vintage_pc.glb')
  const setScreenRef    = useWindowStore((s) => s.setScreenRef)
  const setScreenCenter = useWindowStore((s) => s.setScreenCenter)
  const [screenInfo, setScreenInfo] = useState(null)
  const [screenMesh, setScreenMesh] = useState(null)
  // Debounce leave pour éviter les flickering entre les meshes enfants
  const leaveTimer  = useRef(null)
  const isOverRef   = useRef(false)

  useEffect(() => {
    // ① Matrices world à jour — DOIT précéder tout Box3.setFromObject.
    scene.updateWorldMatrix(true, true)

    // ② Mesh-écran : Object_19 = face CRT du moniteur
    const mesh = nodes.Object_19 ?? detectScreenMesh(scene)
    if (!mesh) {
      console.warn('[VintagePC] Aucun mesh-écran détecté')
      return
    }
    console.log(`[VintagePC] ✓ Mesh-écran : "${mesh.name}"`)
    setScreenRef(mesh)
    setScreenMesh(mesh)

    // ③ Force l'opacité sur tous les meshes du modèle (sauf l'écran lui-même).
    //    Certains matériaux GLTF ont alphaMode=BLEND → rendraient le cadre
    //    partiellement transparent, laissant le HTML HTML déborder visuellement.
    scene.traverse((obj) => {
      if (!obj.isMesh || obj === mesh) return
      const m = obj.material
      if (!m) return
      if (Array.isArray(m)) {
        m.forEach(mi => { mi.transparent = false; mi.alphaTest = 0; mi.needsUpdate = true })
      } else {
        m.transparent = false; m.alphaTest = 0; m.needsUpdate = true
      }
    })

    // ④ CRT phosphore bleu
    const mat = mesh.material
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

    // ④ Transformées de l'écran pour l'overlay Html
    const worldQuat   = new THREE.Quaternion()
    const worldBbox   = new THREE.Box3().setFromObject(mesh)
    const worldCenter = new THREE.Vector3()
    worldBbox.getCenter(worldCenter)
    mesh.getWorldQuaternion(worldQuat)

    // Position locale du centre écran (pour la pointLight dans le <primitive>)
    const localPos = worldCenter.clone().divideScalar(PC_MODEL_SCALE)

    console.log(
      `[VintagePC] worldCenter=(${worldCenter.x.toFixed(3)}, ${worldCenter.y.toFixed(3)}, ${worldCenter.z.toFixed(3)})`
    )

    setScreenCenter({ x: worldCenter.x, y: worldCenter.y, z: worldCenter.z })
    setScreenInfo({ localPos, worldQuat })

    return () => setScreenRef(null)
  }, [nodes, scene, setScreenRef, setScreenCenter])

  return (
    <primitive
      object={scene}
      scale={PC_MODEL_SCALE}
      dispose={null}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
        clearTimeout(leaveTimer.current)
        if (!isOverRef.current) {
          isOverRef.current = true
          onMonitorEnter?.()
        }
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'auto'
        // Délai court : évite un leave/enter rapide entre deux meshes enfants
        leaveTimer.current = setTimeout(() => {
          isOverRef.current = false
          onMonitorLeave?.()
        }, 80)
      }}
    >
      {/* ── Halo CRT : lueur bleue devant l'écran ── */}
      {screenInfo && (
        <pointLight
          position={[
            screenInfo.localPos.x,
            screenInfo.localPos.y,
            screenInfo.localPos.z + 0.12 / PC_MODEL_SCALE,
          ]}
          color="#60b8ff"
          intensity={1.0}
          distance={2.0}
          decay={2}
        />
      )}

      {/* ── Overlay HTML : OS sur l'écran CRT via iframe (technique Henry) ── */}
      {screenMesh && (
        <CSS3DScreen screenMesh={screenMesh} isFocused={isFocused} onScreenLeave={onScreenLeave} />
      )}
    </primitive>
  )
}

useGLTF.preload('./models/vintage_pc.glb')
