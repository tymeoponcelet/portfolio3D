import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { CameraControls, PresentationControls } from '@react-three/drei'
import { VintagePC, ScreenContent } from './VintagePC'
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
const ARCH_HEIGHT         = 0.8   // unités world — élévation du point de contrôle Bézier

const _screenPos = new THREE.Vector3()

function smoothstep(t) {
  return t * t * (3 - 2 * t)
}

// ── CameraRig ─────────────────────────────────────────────────────
// Anime la caméra le long d'une courbe de Bézier quadratique.
// Le point de contrôle est surélevé de ARCH_HEIGHT pour éviter
// de traverser le clavier pendant le zoom.
const CameraRig = forwardRef(function CameraRig(_, ref) {
  const { camera } = useThree()

  // État interne de l'animation (pas de state React — pas de re-render)
  const anim = useRef({
    active:     false,
    t:          0,
    curve:      null,
    lookAt:     null,
    onComplete: null,
  })

  useImperativeHandle(ref, () => ({
    animateTo(endPos, lookAt, onComplete) {
      const startPos = camera.position.clone()
      const ctrlX    = (startPos.x + endPos.x) / 2
      const ctrlY    = Math.max(startPos.y, endPos.y) + ARCH_HEIGHT
      const ctrlZ    = (startPos.z + endPos.z) / 2

      anim.current = {
        active:     true,
        t:          0,
        curve:      new THREE.QuadraticBezierCurve3(
          startPos,
          new THREE.Vector3(ctrlX, ctrlY, ctrlZ),
          endPos.clone(),
        ),
        lookAt:     lookAt.clone(),
        onComplete: onComplete ?? null,
      }
    },
  }))

  useFrame((_, delta) => {
    const s = anim.current
    if (!s.active) return

    s.t = Math.min(s.t + delta / TRANSITION_DURATION, 1)
    camera.position.copy(s.curve.getPoint(smoothstep(s.t)))
    camera.lookAt(s.lookAt)

    if (s.t >= 1) {
      s.active = false
      s.onComplete?.()
    }
  })

  return null
})

// ── Scene ─────────────────────────────────────────────────────────
export function Scene() {
  const cameraControlsRef = useRef(null)
  const cameraRigRef      = useRef(null)
  const [isFocused,   setIsFocused]   = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isReady,     setIsReady]     = useState(false)

  // ── Zoom vers l'écran ─────────────────────────────────────────
  // Utilise screenCenter (bbox center) — même point que le Html overlay.
  // Si screenCenter n'est pas encore calculé, fallback sur bounding box live.
  const zoomToScreen = useCallback(() => {
    const rig = cameraRigRef.current
    if (!rig) return

    const { screenRef, screenCenter: sc } = useWindowStore.getState()
    let cx, cy, cz

    if (sc) {
      cx = sc.x; cy = sc.y; cz = sc.z
    } else if (screenRef) {
      screenRef.getWorldPosition(_screenPos)
      cx = _screenPos.x; cy = _screenPos.y; cz = _screenPos.z
    } else {
      const { position: p, target: t } = CAMERA.focused
      cx = t[0]; cy = t[1]; cz = t[2]
    }

    const endPos  = new THREE.Vector3(cx, cy, cz + FOCUS_DISTANCE)
    const lookAt  = new THREE.Vector3(cx, cy, cz)

    setIsAnimating(true)
    rig.animateTo(endPos, lookAt, () => {
      // Synchroniser CameraControls sur la position finale (sans transition)
      // pour éviter un snap au relâchement
      const cc = cameraControlsRef.current
      if (cc) cc.setLookAt(endPos.x, endPos.y, endPos.z, cx, cy, cz, false)
      setIsAnimating(false)
      setIsFocused(true)
    })
  }, [])

  // ── Zoom arrière ──────────────────────────────────────────────
  const zoomOut = useCallback(() => {
    const rig = cameraRigRef.current
    if (!rig) return

    const { position: p, target: t } = CAMERA.overview
    const endPos = new THREE.Vector3(p[0], p[1], p[2])
    const lookAt = new THREE.Vector3(t[0], t[1], t[2])

    setIsAnimating(true)
    rig.animateTo(endPos, lookAt, () => {
      const cc = cameraControlsRef.current
      if (cc) cc.setLookAt(p[0], p[1], p[2], t[0], t[1], t[2], false)
      setIsAnimating(false)
      setIsFocused(false)
    })
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
          enabled={!isFocused && !isAnimating}
          snap
        >
          <VintagePC onMonitorClick={zoomToScreen} />
        </PresentationControls>

        {/* ScreenContent HORS de PresentationControls — élimine la double-transformation */}
        <ScreenContent isFocused={isFocused} />

        {/* ── CameraRig : animation Bézier sans collision ── */}
        <CameraRig ref={cameraRigRef} />

        <CameraControls
          ref={cameraControlsRef}
          enabled={!isFocused && !isAnimating}
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
