import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle, Suspense } from 'react'
import * as THREE from 'three'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { CameraControls, PresentationControls } from '@react-three/drei'
import { VintagePC } from './VintagePC'
import { useWindowStore } from '../../stores/windowStore'

// ── Positions caméra ──────────────────────────────────────────────
// Caméra calibrée pour PC_MODEL_SCALE=0.1, C64 Computer Full Pack
// Modèle world à scale=0.1 : ~0.48m large × 0.23m haut × 0.08m profond
// Centre approximatif : (-0.03, 0.04, 0.31)
// Caméra calibrée pour PC_MODEL_SCALE=0.1, C64 Computer Full Pack
// Écran Object_19 world : center=(0.000, 0.226, -0.035)  w=0.306m
// Clavier Object_5 world : top y≈0.115  (justifie ARCH_HEIGHT=0.4)
// Bbox totale world : x≈0.92m  y≈0.46m  z≈0.57m
const CAMERA = {
  overview: {
    // Vue légèrement plongeante : tout le poste visible
    position: [0.0, 0.35, 1.50],
    target:   [0.0, 0.15, 0.05],
  },
  focused: {   // fallback si screenCenter n'est pas encore disponible
    position: [0.0, 0.226, 0.465],
    target:   [0.0, 0.226, -0.035],
  },
}

// Distance caméra → écran (world units).
const FOCUS_DISTANCE      = 0.5
const TRANSITION_DURATION = 1.4   // secondes
const ARCH_HEIGHT         = 0.4   // assez haut pour franchir le clavier (top y≈0.115)

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // camera (useThree) et anim (useRef) sont des références stables — deps vide correct.
  }), [])

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
  const isAnimatingRef = useRef(false)

  const setAnimating = useCallback((v) => {
    isAnimatingRef.current = v
    setIsAnimating(v)
  }, [])

  // ── Zoom vers l'écran ─────────────────────────────────────────
  // Utilise screenCenter (calculé par ScreenContent depuis la bbox de Object_10).
  // Si screenCenter n'est pas encore prêt, fallback sur getWorldPosition live.
  // Note : PresentationControls.enabled=false bloque le drag mais PAS les
  // clics Three.js — le guard isAnimatingRef.current protège contre la re-entrée.
  const zoomToScreen = useCallback(() => {
    const rig = cameraRigRef.current
    if (!rig || isAnimatingRef.current) return

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

    setAnimating(true)
    rig.animateTo(endPos, lookAt, () => {
      // Synchroniser CameraControls sur la position finale (sans transition)
      // pour éviter un snap au relâchement
      const cc = cameraControlsRef.current
      if (cc) cc.setLookAt(endPos.x, endPos.y, endPos.z, cx, cy, cz, false)
      setAnimating(false)
      setIsFocused(true)
    })
  }, [setAnimating])

  // ── Zoom arrière ──────────────────────────────────────────────
  const zoomOut = useCallback(() => {
    const rig = cameraRigRef.current
    if (!rig || isAnimatingRef.current) return

    const { position: p, target: t } = CAMERA.overview
    const endPos = new THREE.Vector3(p[0], p[1], p[2])
    const lookAt = new THREE.Vector3(t[0], t[1], t[2])

    setAnimating(true)
    rig.animateTo(endPos, lookAt, () => {
      const cc = cameraControlsRef.current
      if (cc) cc.setLookAt(p[0], p[1], p[2], t[0], t[1], t[2], false)
      setAnimating(false)
      setIsFocused(false)
    })
  }, [setAnimating])

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
      setIsReady(true)   // hint visible dès le début de l'animation d'intro
    }, 300)
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>

      <Canvas
        camera={{ position: [0, 0.4, 2.0], fov: 50 }}
        shadows
        gl={{ antialias: true }}
        onCreated={handleCreated}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[0.5, 1, 0.5]} intensity={1.2} castShadow />
        {/* Lumière d'ambiance bleue devant l'écran CRT */}
        <pointLight position={[-0.03, 0.15, 0.5]} intensity={0.6} color="#44aaff" distance={1.0} />

        {/* ── PresentationControls : rotation interactive du modèle ─────── */}
        {/* Le modèle et l'overlay Html tournent ensemble dans ce groupe.     */}
        {/* polar ±0.15 rad (~9°), azimuth ±0.4 rad (~23°).                  */}
        {/* snap=true → retour au centre au relâchement (effet "ressort").    */}
        {/* Désactivé quand l'OS est actif pour éviter les conflits de drag.  */}
        <Suspense fallback={null}>
          <PresentationControls
            global
            polar={[-0.15, 0.15]}
            azimuth={[-0.4, 0.4]}
            config={{ mass: 2, tension: 500 }}
            enabled={!isFocused && !isAnimating}
            snap
          >
            <VintagePC onMonitorClick={zoomToScreen} isFocused={isFocused} />
          </PresentationControls>
        </Suspense>

        {/* ── CameraRig : animation Bézier sans collision ── */}
        <CameraRig ref={cameraRigRef} />

        <CameraControls
          ref={cameraControlsRef}
          enabled={!isFocused && !isAnimating}
          makeDefault
          smoothTime={TRANSITION_DURATION}
          draggingSmoothTime={0.08}
          minDistance={0.1}
          maxDistance={5}
          maxPolarAngle={Math.PI / 2 - 0.02}
          minPolarAngle={0.05}
        />
      </Canvas>

      {/* ── Hint ── */}
      {isReady && !isFocused && !isAnimating && (
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
      {isFocused && !isAnimating && (
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
