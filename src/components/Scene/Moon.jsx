import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MX     = -0.55
const MY     =  1.65
const MZ_FAR = -7
const WIN_Z  = -1.8

export function Moon() {
  const glowRef     = useRef()
  const moonGltf    = useGLTF('/models/moon.glb')
  const fenetreGltf = useGLTF('/models/fenetre.glb')

  // Copie la map sur emissiveMap pour que la texture soit visible sans lumière externe
  useEffect(() => {
    moonGltf.scene.traverse((obj) => {
      if (!obj.isMesh) return
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach(mat => {
        if (!mat) return
        if (mat.map) {
          mat.emissiveMap       = mat.map
          mat.emissive          = new THREE.Color('#ffffff')
          mat.emissiveIntensity = 0.9
        }
        mat.needsUpdate = true
      })
    })
  }, [moonGltf.scene])

  useFrame(({ clock }) => {
    if (glowRef.current)
      glowRef.current.material.opacity =
        0.04 + Math.sin(clock.elapsedTime * 0.45) * 0.012
  })

  return (
    <>
      {/* ── Lune ──────────────────────────────────────────────── */}
      <group position={[MX, MY, MZ_FAR]}>
        <primitive object={moonGltf.scene} scale={0.11} dispose={null} />

        {/* Halo pulsant */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.70, 20, 20]} />
          <meshBasicMaterial
            color="#6677bb"
            transparent
            opacity={0.04}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>

        {/* Lumière douce directionnelle simulant le clair de lune */}
        <pointLight color="#c8d8ff" intensity={0.35} distance={40} decay={1.2} />
      </group>

      {/* ── Fenêtre ───────────────────────────────────────────── */}
      <group position={[MX, MY, WIN_Z]}>
        <primitive object={fenetreGltf.scene} scale={0.5} dispose={null} />
      </group>

      {/* ── Sol sombre ────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.62, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#05050e" roughness={1} metalness={0} />
      </mesh>
    </>
  )
}

useGLTF.preload('/models/moon.glb')
useGLTF.preload('/models/fenetre.glb')
