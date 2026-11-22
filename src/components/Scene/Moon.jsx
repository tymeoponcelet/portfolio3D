// src/components/Scene/Moon.jsx
//
// La lune, visible par la fenêtre de la chambre (mur du fond, à gauche).
// Aucune lumière : sa clarté est cuite dans les atlas de la scène (blender/
// bake.py, « moonlight »). Ici on n'affiche que l'astre et son halo pulsant.
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Placée sur l'axe caméra « vue d'ensemble » → centre de la fenêtre
// (caméra [0, 0.35, 1.5], fenêtre ≈ [-1.25, 0.93, -0.68]), prolongé à z = -7.
const MOON_POS = [-4.87, 2.61, -7]
const MOON_URL = `${import.meta.env.BASE_URL}models/moon.glb`

export function Moon() {
  const glowRef  = useRef()
  const { scene } = useGLTF(MOON_URL)

  // Texture affichée telle quelle (matériau non éclairé)
  useMemo(() => {
    scene.traverse((o) => {
      if (!o.isMesh) return
      const map = [].concat(o.material)[0]?.map ?? null
      o.material = new THREE.MeshBasicMaterial({ map, color: map ? '#ffffff' : '#dfe6ff' })
    })
  }, [scene])

  useFrame(({ clock }) => {
    if (glowRef.current)
      glowRef.current.material.opacity = 0.04 + Math.sin(clock.elapsedTime * 0.45) * 0.012
  })

  return (
    <group position={MOON_POS}>
      <primitive object={scene} scale={0.11} dispose={null} />
      {/* Halo pulsant */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.70, 20, 20]} />
        <meshBasicMaterial color="#6677bb" transparent opacity={0.04} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

useGLTF.preload(MOON_URL)
