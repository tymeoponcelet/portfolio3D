// src/components/Scene/BakedModel.jsx — composants de la scène cuite
// (chargement et matériaux : bakedAssets.js)
import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useBakedScene } from './bakedAssets'

export function BakedModel({ name }) {
  const { scene } = useBakedScene(name)
  return <primitive object={scene} dispose={null} />
}

/** Objets de la chambre + respiration du chat endormi sur le bureau
 *  (le nœud « cat » a son origine sous lui : on le gonfle doucement). */
export function Props() {
  const { scene } = useBakedScene('props')
  const cat = useMemo(() => scene.getObjectByName('cat'), [scene])
  useFrame(({ clock }) => {
    if (!cat) return
    const b = Math.sin(clock.elapsedTime * 1.6)
    cat.scale.set(1 + b * 0.008, 1 + b * 0.035, 1 + b * 0.008)
  })
  return <primitive object={scene} dispose={null} />
}
