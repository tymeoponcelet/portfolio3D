// src/components/Scene/VintagePC.jsx
//
// Le Commodore, version à éclairage pré-calculé (models/room/computer.glb +
// atlas, voir BakedModel.jsx). Le nœud racine du glb porte déjà l'échelle
// PC_MODEL_SCALE (0.1) : le <primitive> reste à l'échelle 1, et le mesh-écran
// Object_19 est exactement là où il était (vérifié par blender/check_scene.py).
//
// L'OS rétro est affiché via CSS3DRenderer (CSS3DScreen) sur Object_19.
import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useWindowStore } from '../../stores/windowStore'
import { CSS3DScreen } from './CSS3DScreen'
import { useBakedScene } from './bakedAssets'
import { SCREEN_MESH_NAME } from '../../constants/screen'

export function VintagePC({ onMonitorEnter, onMonitorLeave, onScreenLeave, isFocused }) {
  const { scene, nodes } = useBakedScene('computer')
  const setScreenRef    = useWindowStore((s) => s.setScreenRef)
  const setScreenCenter = useWindowStore((s) => s.setScreenCenter)
  const [screenMesh, setScreenMesh] = useState(null)
  const [hitbox,     setHitbox]     = useState(null)
  // Debounce leave pour éviter les flickering
  const leaveTimer  = useRef(null)
  const isOverRef   = useRef(false)

  // En mode écran, la hitbox est démontée : son état « survolé » doit repartir
  // de zéro, sinon le prochain survol après « Retour » serait ignoré.
  useEffect(() => {
    if (!isFocused) return
    clearTimeout(leaveTimer.current)
    isOverRef.current = false
    document.body.style.cursor = 'auto'
  }, [isFocused])

  useEffect(() => {
    scene.updateWorldMatrix(true, true)

    const mesh = nodes[SCREEN_MESH_NAME]
    if (!mesh) {
      console.warn(`[VintagePC] mesh-écran « ${SCREEN_MESH_NAME} » introuvable`)
      return
    }
    setScreenRef(mesh)
    setScreenMesh(mesh)

    const worldCenter = new THREE.Vector3()
    new THREE.Box3().setFromObject(mesh).getCenter(worldCenter)
    setScreenCenter({ x: worldCenter.x, y: worldCenter.y, z: worldCenter.z })

    // Hitbox de survol : boîte englobante du modèle (12 triangles) — R3F
    // raycaste à chaque mouvement de souris les objets ayant des handlers.
    const localBox = new THREE.Box3().setFromObject(scene)
    localBox.applyMatrix4(new THREE.Matrix4().copy(scene.matrixWorld).invert())
    const hbCenter = new THREE.Vector3(); localBox.getCenter(hbCenter)
    const hbSize   = new THREE.Vector3(); localBox.getSize(hbSize)
    setHitbox({ center: hbCenter.toArray(), size: hbSize.toArray() })

    return () => setScreenRef(null)
  }, [nodes, scene, setScreenRef, setScreenCenter])

  return (
    <primitive object={scene} dispose={null}>
      {/* ── Hitbox de survol (invisible) — démontée en mode écran ── */}
      {hitbox && !isFocused && (
        <mesh
          position={hitbox.center}
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
            leaveTimer.current = setTimeout(() => {
              isOverRef.current = false
              onMonitorLeave?.()
            }, 80)
          }}
        >
          <boxGeometry args={hitbox.size} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}

      {/* ── Overlay HTML : OS sur l'écran CRT via iframe (technique Henry) ── */}
      {screenMesh && (
        <CSS3DScreen screenMesh={screenMesh} isFocused={isFocused} onScreenLeave={onScreenLeave} />
      )}
    </primitive>
  )
}
