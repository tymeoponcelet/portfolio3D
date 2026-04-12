import { useState, useEffect } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useWindowStore } from '../../stores/windowStore'
import { ScreenContent } from '../OS/ScreenContent'
import { OS } from '../OS/OS'
import {
  PC_MODEL_SCALE,
  DEBUG_HIGHLIGHT_SCREEN,
  DOM_W,
  DOM_H,
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
// Approche Henry Heffernan :
//   <primitive scene> → <group localPos+worldQuat+htmlScale> → <Html transform occlude>
// Le groupe hérite de la position/rotation/scale de l'écran en espace LOCAL de la primitive,
// donc PresentationControls entraîne l'overlay sans aucune double-transformation.
//
// Calcul des transformées :
//   scene.updateWorldMatrix(true, true)  ← OBLIGATOIRE avant tout Box3.setFromObject
//   screenNormal = Z-local du mesh → world (via worldQuat)
//   frontFace    = worldCenter + normal × (depth/2 + 2mm)  ← évite le z-fighting
//   localPos     = frontFace / PC_MODEL_SCALE              ← espace de la primitive
//   htmlScale    = worldW / (DOM_W × PC_MODEL_SCALE)       ← DOM_W px = worldW mètres
export function VintagePC({ onMonitorClick, isFocused }) {
  const { scene, nodes } = useGLTF('/models/vintage_pc.glb')
  const setScreenRef    = useWindowStore((s) => s.setScreenRef)
  const setScreenCenter = useWindowStore((s) => s.setScreenCenter)
  const [screenInfo, setScreenInfo] = useState(null)

  useEffect(() => {
    // ① Matrices world à jour — DOIT précéder tout Box3.setFromObject.
    //    Sans cela les dimensions reviennent en unités modèle (×10).
    scene.updateWorldMatrix(true, true)

    // ② Mesh-écran : Object_19 = face CRT du C64 (mat="monitor_screen", flat≈0.098)
    const screenMesh = nodes.Object_19 ?? detectScreenMesh(scene)
    if (!screenMesh) {
      console.warn('[VintagePC] Aucun mesh-écran détecté')
      return
    }
    console.log(`[VintagePC] ✓ Mesh-écran : "${screenMesh.name}"`)
    setScreenRef(screenMesh)

    // ③ CRT phosphore bleu
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

    // ④ Quaternion world de l'écran (inclinaison du moniteur CRT)
    const worldQuat = new THREE.Quaternion()
    screenMesh.getWorldQuaternion(worldQuat)

    // ⑤ Bbox world → centre + taille
    const worldBbox   = new THREE.Box3().setFromObject(screenMesh)
    const worldCenter = new THREE.Vector3()
    const worldSize   = new THREE.Vector3()
    worldBbox.getCenter(worldCenter)
    worldBbox.getSize(worldSize)

    // ⑥ Normale de l'écran (axe +Z local → world) — nécessaire pour le décalage Z
    const screenNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(worldQuat)

    // ⑦ Face avant : centre + demi-profondeur + 2 mm de sécurité (z-fighting)
    const halfDepth  = worldSize.z * 0.5
    const frontWorld = worldCenter.clone().addScaledVector(screenNormal, halfDepth + 0.002)

    // ⑧ Passage espace local de la primitive (÷ PC_MODEL_SCALE, car <primitive scale=0.1>)
    const localPos = frontWorld.clone().divideScalar(PC_MODEL_SCALE)

    // ⑨ Largeur world → scale CSS : DOM_W px doit couvrir worldW mètres
    //
    // Facteur drei : <Html transform> applique en interne
    //   getObjectCSSMatrix(matrix, 400 / (distanceFactor ?? 10))
    // → les éléments de rotation/scale de la worldMatrix sont divisés par ce
    //   facteur (40 par défaut) avant d'être passés à la CSS matrix3d.
    // → Pour compenser, htmlScale doit être ×40 afin que l'HTML couvre
    //   exactement worldW unités à toute distance caméra (grâce à la
    //   perspective CSS qui compense automatiquement la profondeur).
    const DREI_FACTOR = 400 / 10  // 400 / distanceFactor_default
    const worldW   = Math.max(worldSize.x, worldSize.y)   // exclut la profondeur
    const htmlScale = worldW > 0
      ? worldW * DREI_FACTOR / (DOM_W * PC_MODEL_SCALE)
      : 0.001 * DREI_FACTOR / PC_MODEL_SCALE

    console.log(
      `[VintagePC] worldCenter=(${worldCenter.x.toFixed(3)}, ${worldCenter.y.toFixed(3)}, ${worldCenter.z.toFixed(3)})` +
      `  worldW=${worldW.toFixed(4)}  htmlScale=${htmlScale.toFixed(6)}`
    )

    setScreenCenter({ x: worldCenter.x, y: worldCenter.y, z: worldCenter.z })
    setScreenInfo({ localPos, worldQuat, htmlScale })

    return () => setScreenRef(null)
  }, [nodes, scene, setScreenRef, setScreenCenter])

  return (
    <primitive
      object={scene}
      scale={PC_MODEL_SCALE}
      dispose={null}
      onClick={(e) => { e.stopPropagation(); onMonitorClick?.() }}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'auto' }}
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

      {/* ── Interface sur l'écran (approche Heffernan) ── */}
      {/*                                                   */}
      {/* Le groupe est positionné en espace LOCAL de la    */}
      {/* primitive (non world) grâce à localPos.           */}
      {/* quaternion = inclinaison réelle du mesh-écran.    */}
      {/* scale = htmlScale → DOM_W px couvre exactement    */}
      {/*          la largeur world de l'écran.             */}
      {/*                                                   */}
      {/* occlude : le boîtier du moniteur peut masquer     */}
      {/* l'interface si on tourne le modèle (back view).   */}
      {screenInfo && (
        <group
          position={[screenInfo.localPos.x, screenInfo.localPos.y, screenInfo.localPos.z]}
          quaternion={screenInfo.worldQuat}
          scale={screenInfo.htmlScale}
        >
          <Html
            transform
            occlude
            zIndexRange={[100, 0]}
            style={{
              width:         DOM_W,
              height:        DOM_H,
              overflow:      'hidden',
              // Événements souris : actifs seulement en mode focalisé.
              // Sinon les clics traversent jusqu'au mesh 3D (onMonitorClick).
              pointerEvents: isFocused ? 'auto' : 'none',
            }}
          >
            {isFocused ? <OS /> : <ScreenContent />}
          </Html>
        </group>
      )}
    </primitive>
  )
}

useGLTF.preload('/models/vintage_pc.glb')
