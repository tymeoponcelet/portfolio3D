// src/components/Scene/AdaptiveRenderer.jsx
import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'

// Must be rendered inside <Canvas> to access useThree().
// Switches Three.js frameloop between 'always' (60 FPS) and 'demand'+15fps interval
// based on camera-controls v3 wake/rest events and tab visibility.
export function AdaptiveRenderer({ cameraControlsRef }) {
  const { invalidate, set } = useThree()
  const intervalRef = useRef(null)

  useEffect(() => {
    const controls = cameraControlsRef.current
    if (!controls) return

    const goActive = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      set({ frameloop: 'always' })
    }

    const goIdle = () => {
      set({ frameloop: 'demand' })
      // 15 FPS ≈ 67ms between frames
      intervalRef.current = setInterval(() => invalidate(), 67)
    }

    const onVisibility = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        set({ frameloop: 'never' })
      } else {
        // Resume at 15 FPS; 'wake' will upgrade to 60 FPS if camera moves
        goIdle()
      }
    }

    controls.addEventListener('wake', goActive)
    controls.addEventListener('rest', goIdle)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      controls.removeEventListener('wake', goActive)
      controls.removeEventListener('rest', goIdle)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [cameraControlsRef, invalidate, set])

  return null
}
