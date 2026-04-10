import { useRef, useState, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { CameraControls, PresentationControls } from '@react-three/drei'
import { VintagePC } from './VintagePC'
import { useWindowStore } from '../../stores/windowStore'

// ── Positions caméra ──────────────────────────────────────────────
const CAMERA = {
  overview: {
    position: [0.9, 1.2, 2.4],
    target:   [0,   0.4, 0],
  },
  focused: {   // fallback si screenRef absent
    position: [0, 0.8, 1.0],
    target:   [0, 0.8, 0],
  },
}

// Distance caméra → écran (world units).
// Le clavier est à z ≈ 0.9–1.1u. Avec écran à z ≈ 0.27u :
// caméra à z = 0.27 + 1.3 = 1.57 → devant le clavier, écran visible.
const FOCUS_DISTANCE      = 1.3
const TRANSITION_DURATION = 1.4   // secondes

const _screenPos = new THREE.Vector3()

// ── Scene ─────────────────────────────────────────────────────────
export function Scene() {
  const cameraControlsRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isReady,   setIsReady]   = useState(false)

  // ── Zoom vers l'écran ─────────────────────────────────────────
  // Utilise screenCenter (bbox center) — même point que le Html overlay.
  // Si screenCenter n'est pas encore calculé, fallback sur bounding box live.
  const zoomToScreen = useCallback(() => {
    const cc = cameraControlsRef.current
    if (!cc) return

    // screenCenter = position calculée par ScreenContent (getWorldPosition)
    // → même référence que le Html overlay, zoom parfaitement centré.
    const { screenRef, screenCenter: sc } = useWindowStore.getState()
    let cx, cy, cz

    if (sc) {
      cx = sc.x; cy = sc.y; cz = sc.z
    } else if (screenRef) {
      screenRef.getWorldPosition(_screenPos)
      cx = _screenPos.x; cy = _screenPos.y; cz = _screenPos.z
    } else {
      const { position: p, target: t } = CAMERA.focused
      cc.setLookAt(p[0], p[1], p[2], t[0], t[1], t[2], true)
      setIsFocused(true)
      return
    }

    // Caméra à FOCUS_DISTANCE devant l'écran, regardant droit dans l'axe Z.
    // Pas d'offset Y : l'écran doit être centré dans le viewport.
    cc.setLookAt(cx, cy, cz + FOCUS_DISTANCE, cx, cy, cz, true)
    setIsFocused(true)
  }, [])

  // ── Zoom arrière ──────────────────────────────────────────────
  const zoomOut = useCallback(() => {
    const cc = cameraControlsRef.current
    if (!cc) return
    const { position: p, target: t } = CAMERA.overview
    cc.setLookAt(p[0], p[1], p[2], t[0], t[1], t[2], true)
    setIsFocused(false)
  }, [])

  // ── Escape pour quitter le mode focused ───────────────────────
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && isFocused) zoomOut() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFocused, zoomOut])

  // ── Animation d'intro ─────────────────────────────────────────
  const handleCreated = useCallback(({ gl }) => {
    gl.setClearColor('#1a1a2e')
    setTimeout(() => {
      const cc = cameraControlsRef.current
      if (!cc) return
      const { position: p, target: t } = CAMERA.overview
      cc.setLookAt(p[0], p[1], p[2], t[0], t[1], t[2], true)
      setTimeout(() => setIsReady(true), TRANSITION_DURATION * 1000)
    }, 300)
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>

      <Canvas
        camera={{ position: [4, 4, 9], fov: 48 }}
        shadows
        gl={{ antialias: true }}
        onCreated={handleCreated}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 8, 4]} intensity={1.2} castShadow />
        <pointLight position={[0, 1.26, 0.4]} intensity={0.6} color="#44aaff" distance={3} />

        {/* ── PresentationControls : rotation interactive du modèle ─────── */}
        {/* Le modèle et l'overlay Html tournent ensemble dans ce groupe.     */}
        {/* polar ±0.15 rad (~9°), azimuth ±0.4 rad (~23°).                  */}
        {/* snap=true → retour au centre au relâchement (effet "ressort").    */}
        {/* Désactivé quand l'OS est actif pour éviter les conflits de drag.  */}
        <PresentationControls
          global
          polar={[-0.15, 0.15]}
          azimuth={[-0.4, 0.4]}
          config={{ mass: 2, tension: 500 }}
          enabled={!isFocused}
          snap
        >
          <VintagePC onMonitorClick={zoomToScreen} isFocused={isFocused} />
        </PresentationControls>

        <CameraControls
          ref={cameraControlsRef}
          enabled={!isFocused}
          makeDefault
          smoothTime={TRANSITION_DURATION}
          draggingSmoothTime={0.08}
          minDistance={1}
          maxDistance={15}
          maxPolarAngle={Math.PI / 2 - 0.02}
          minPolarAngle={0.05}
        />
      </Canvas>

      {/* ── Hint ── */}
      {isReady && !isFocused && (
        <div style={{
          position:      'absolute',
          bottom:        32,
          left:          '50%',
          transform:     'translateX(-50%)',
          color:         'rgba(255,255,255,0.45)',
          fontFamily:    'MS Sans Serif, Arial, sans-serif',
          fontSize:      13,
          pointerEvents: 'none',
          letterSpacing: '0.05em',
        }}>
          Cliquez sur le moniteur pour démarrer
        </div>
      )}

      {/* ── Bouton Retour ── */}
      {isFocused && (
        <button
          onClick={zoomOut}
          style={{
            position:    'absolute',
            top:         16,
            left:        16,
            zIndex:      1000,
            background:  '#c0c0c0',
            border:      '2px solid',
            borderColor: '#ffffff #404040 #404040 #ffffff',
            fontFamily:  'MS Sans Serif, Arial, sans-serif',
            fontSize:    12,
            padding:     '4px 14px',
            cursor:      'pointer',
            boxShadow:   '1px 1px 0 #000',
          }}
        >
          ← Retour
        </button>
      )}
    </div>
  )
}
