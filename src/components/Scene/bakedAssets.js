// src/components/Scene/bakedAssets.js
//
// Chargement des groupes à éclairage pré-calculé (technique Henry Heffernan) :
// glb Draco + atlas WebP où Blender a cuit toute la lumière (blender/run.ps1).
// Affichage en MeshBasicMaterial : AUCUN calcul de lumière à l'exécution.
import { useEffect } from 'react'
import * as THREE from 'three'
import { useGLTF, useTexture } from '@react-three/drei'
import { IS_LOW_END } from '../../utils/perf'

const BASE  = import.meta.env.BASE_URL
const DRACO = `${BASE}draco/`                 // décodeur auto-hébergé (pas de CDN)
const SIZE  = IS_LOW_END ? '1k' : '2k'

export const bakedModelUrl = (name) => `${BASE}models/room/${name}.glb`
export const bakedAtlasUrl = (name) => `${BASE}models/room/${name}_${SIZE}.webp`

const GLASS = new THREE.MeshBasicMaterial({
  color: '#8fa8c8', transparent: true, opacity: 0.18, depthWrite: false,
})

function setupAtlas(tex) {
  tex.flipY       = false                      // convention glTF
  tex.colorSpace  = THREE.SRGBColorSpace
  tex.anisotropy  = IS_LOW_END ? 1 : 4
  tex.needsUpdate = true
}

/** Charge un groupe cuit (room | props | computer) et lui applique son atlas. */
export function useBakedScene(name) {
  const gltf = useGLTF(bakedModelUrl(name), DRACO)
  const map  = useTexture(bakedAtlasUrl(name), setupAtlas)
  useEffect(() => {
    const mat = new THREE.MeshBasicMaterial({ map, toneMapped: false })
    gltf.scene.traverse((o) => {
      if (o.isMesh) o.material = o.name.startsWith('window_glass') ? GLASS : mat
    })
    return () => mat.dispose()
  }, [gltf.scene, map])
  return gltf
}

export function preloadBaked(...names) {
  names.forEach((n) => {
    useGLTF.preload(bakedModelUrl(n), DRACO)
    useTexture.preload(bakedAtlasUrl(n))
  })
}
