// src/components/Scene/AdaptiveRenderer.jsx
import { useEffect, useRef, useCallback } from 'react'
import { useThree } from '@react-three/fiber'

// Must be rendered inside <Canvas> to access useThree().
//
// Pilote la boucle de rendu Three.js selon `mode` :
//   'boost'  → 60 FPS en continu (intro, animations caméra)
//   'paused' → aucun rendu WebGL hors invalidation (caméra figée sur l'écran :
//              l'OS vit dans l'iframe, la scène 3D n'a rien à recalculer)
//   'auto'   → 60 FPS quand CameraControls bouge, 15 FPS au repos
// Onglet caché → rendu coupé.
export function AdaptiveRenderer({ cameraControlsRef, mode = 'auto' }) {
  const { invalidate, set } = useThree()
  const intervalRef = useRef(null)
  const restingRef  = useRef(false)
  const modeRef     = useRef(mode)

  const apply = useCallback(() => {
    // Un seul intervalle à la fois (l'ancienne version en empilait un par
    // événement 'rest' → invalidations en double, triple…)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (document.hidden) { set({ frameloop: 'never' }); return }

    const m = modeRef.current
    if (m === 'boost' || (m === 'auto' && !restingRef.current)) {
      set({ frameloop: 'always' })
      return
    }

    set({ frameloop: 'demand' })
    invalidate()
    // 15 FPS ≈ 67 ms entre deux images
    if (m === 'auto') intervalRef.current = setInterval(() => invalidate(), 67)
  }, [invalidate, set])

  useEffect(() => {
    modeRef.current = mode
    apply()
  }, [mode, apply])

  useEffect(() => {
    const controls = cameraControlsRef.current
    const onWake = () => { restingRef.current = false; apply() }
    const onRest = () => { restingRef.current = true;  apply() }

    controls?.addEventListener('wake', onWake)
    controls?.addEventListener('rest', onRest)
    document.addEventListener('visibilitychange', apply)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      controls?.removeEventListener('wake', onWake)
      controls?.removeEventListener('rest', onRest)
      document.removeEventListener('visibilitychange', apply)
    }
  }, [cameraControlsRef, apply])

  return null
}
