import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle, Suspense } from 'react'
import * as THREE from 'three'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import { VintagePC } from './VintagePC'
import { Moon } from './Moon'
import { BakedModel, Props } from './BakedModel'
import { preloadBaked } from './bakedAssets'
import { LoadingScreen } from './LoadingScreen'
import { useWindowStore } from '../../stores/windowStore'
import { useNightAudio } from '../../hooks/useNightAudio'
import { useDevicePixelRatio } from '../../hooks/useDevicePixelRatio'
import { AdaptiveRenderer } from './AdaptiveRenderer'
import { IS_LOW_END } from '../../utils/perf'

// ── Positions caméra ──────────────────────────────────────────────
const CAMERA = {
  // Position de départ — loin, légèrement en hauteur (intro zoom)
  intro: {
    position: [0.0, 1.1,  4.2],
    target:   [0.0, 0.15, 0.05],
  },
  overview: {
    position: [0.0, 0.35,  1.50],
    target:   [0.0, 0.15,  0.05],
  },
  hover: {
    position: [0.0, 0.27,  0.55],
    target:   [0.0, 0.22, -0.04],
  },
  focused: {
    position: [0.0, 0.226, 0.465],
    target:   [0.0, 0.226, -0.035],
  },
}


// Durée de la transition hover (ms → secondes pour CameraControls)
const HOVER_SMOOTH = 1.8   // secondes

// Distance caméra → écran (world units) — très proche pour remplir le viewport.
const FOCUS_DISTANCE      = 0.32
const TRANSITION_DURATION = 1.4   // secondes
const ARCH_HEIGHT         = 0.4   // assez haut pour franchir le clavier (top y≈0.115)

const _screenPos = new THREE.Vector3()

function smoothstep(t) { return t * t * (3 - 2 * t) }

// Easing intro : lent pendant 4 s (25 % du chemin), puis fort sur 1 s (75 % restants)
// Spline cubique de Hermite — C1 continu, strictement croissant, sans rollback.
// 3 segments sur 6.5 s, raccordés avec des dérivées matchées :
//   [0, 0.54]  (3.5 s) : glissé lent, vitesse 0→1.0
//   [0.54,0.69](1.0 s) : poussée rapide, vitesse 1.0→0.8
//   [0.69,1.0] (2.0 s) : amortissement, vitesse 0.8→0.15
function easeIntro(t) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  if (t < 0.54) {
    const s = t / 0.54
    // H01*0.20 + H11*0.54  (d0=0, d1_s=0.54)
    return 0.14 * s*s*s + 0.06 * s*s
  }
  if (t < 0.69) {
    const s = (t - 0.54) / 0.15
    // Hermite v0=0.20 d0_s=0.15  v1=0.87 d1_s=0.12
    return -1.07*s*s*s + 1.59*s*s + 0.15*s + 0.20
  }
  const s = (t - 0.69) / 0.31
  // Hermite v0=0.87 d0_s=0.248  v1=1.0 d1_s=0.0465
  return 0.0345*s*s*s - 0.1525*s*s + 0.248*s + 0.87
}

// ── IntroCam ──────────────────────────────────────────────────────
// Pilote CameraControls directement chaque frame pendant l'intro.
// Contrairement à CameraRig, CameraControls conserve son état interne
// synchronisé → le scroll à la molette fonctionne dès la fin de l'intro.
function IntroCam({ active, ccRef, onComplete }) {
  const tRef     = useRef(0)
  const startRef = useRef(null)
  const doneRef  = useRef(false)

  useFrame(({ camera }, delta) => {
    if (!active || doneRef.current) return
    const cc = ccRef.current
    if (!cc) return

    if (!startRef.current) startRef.current = camera.position.clone()

    tRef.current = Math.min(tRef.current + delta / 7.0, 1)
    const { position: p, target: tgt } = CAMERA.overview
    const pos = new THREE.Vector3().lerpVectors(
      startRef.current,
      new THREE.Vector3(p[0], p[1], p[2]),
      easeIntro(tRef.current),
    )
    cc.setLookAt(pos.x, pos.y, pos.z, tgt[0], tgt[1], tgt[2], false)

    if (tRef.current >= 1) {
      doneRef.current = true
      onComplete?.()
    }
  })

  return null
}

// ── MouseFollowCam ────────────────────────────────────────────────
// Technique Henry Heffernan (« desk keyframe ») : en vue d'ensemble, la
// caméra glisse doucement vers la souris ; le point visé la suit deux fois
// plus vite que la position → effet de flottement / parallaxe.
// Amplitudes à l'échelle de la scène (caméra à ~1,5 m du bureau).
const FOLLOW = {
  pos: { x: 0.30, y: 0.12 },   // déplacement max de la caméra (m)
  tgt: { x: 0.14, y: 0.06 },   // déplacement max du point visé (m)
  posRate: 1.5,                // vitesse de rattrapage (1/s) — Henry : 0.025/image
  tgtRate: 3.0,                //                                  Henry : 0.05/image
}
const _goalPos = new THREE.Vector3()
const _goalTgt = new THREE.Vector3()

function MouseFollowCam({ active, ccRef }) {
  const { camera, invalidate } = useThree()
  const mouse = useRef({ x: 0, y: 0 })     // -1..1, y vers le bas
  const cur   = useRef(null)               // { pos, tgt } lissés
  const reduceMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth)  * 2 - 1
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1
      invalidate()
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [invalidate])

  useFrame((_, delta) => {
    if (!active) { cur.current = null; return }
    const cc = ccRef.current
    if (!cc) return
    const { position: p, target: t } = CAMERA.overview
    const m = reduceMotion.current ? { x: 0, y: 0 } : mouse.current
    _goalPos.set(p[0] + m.x * FOLLOW.pos.x, p[1] - m.y * FOLLOW.pos.y, p[2])
    _goalTgt.set(t[0] + m.x * FOLLOW.tgt.x, t[1] - m.y * FOLLOW.tgt.y, t[2])
    if (!cur.current) cur.current = { pos: camera.position.clone(), tgt: new THREE.Vector3(...t) }
    const dt = Math.min(delta, 0.1)        // pas de saut après un onglet en pause
    cur.current.pos.lerp(_goalPos, 1 - Math.exp(-dt * FOLLOW.posRate))
    cur.current.tgt.lerp(_goalTgt, 1 - Math.exp(-dt * FOLLOW.tgtRate))
    const { pos, tgt } = cur.current
    cc.setLookAt(pos.x, pos.y, pos.z, tgt.x, tgt.y, tgt.z, false)
    // Tant que la caméra n'a pas rejoint la souris, on demande une image de plus
    if (pos.distanceToSquared(_goalPos) > 1e-8 || tgt.distanceToSquared(_goalTgt) > 1e-8) invalidate()
  })

  return null
}

// ── CameraRig ─────────────────────────────────────────────────────
// Anime la caméra le long d'une courbe de Bézier quadratique.
// Le point de contrôle est surélevé de ARCH_HEIGHT pour éviter
// de traverser le clavier pendant le zoom.
const CameraRig = forwardRef(function CameraRig({ ccRef }, ref) {
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
    animateTo(endPos, lookAt, onComplete, duration = TRANSITION_DURATION, easing = smoothstep, noArch = false) {
      const startPos = camera.position.clone()
      const midX = (startPos.x + endPos.x) / 2
      const midY = noArch
        ? (startPos.y + endPos.y) / 2
        : Math.max(startPos.y, endPos.y) + ARCH_HEIGHT
      const midZ = (startPos.z + endPos.z) / 2

      anim.current = {
        active:     true,
        t:          0,
        duration,
        easing,
        curve:      new THREE.QuadraticBezierCurve3(
          startPos,
          new THREE.Vector3(midX, midY, midZ),
          endPos.clone(),
        ),
        lookAt:     lookAt.clone(),
        onComplete: onComplete ?? null,
      }
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])

  useFrame((_, delta) => {
    const s = anim.current
    if (!s.active) return

    s.t = Math.min(s.t + delta / s.duration, 1)
    const pos = s.curve.getPoint(s.easing(s.t))
    const cc = ccRef?.current
    if (cc) {
      cc.setLookAt(pos.x, pos.y, pos.z, s.lookAt.x, s.lookAt.y, s.lookAt.z, false)
    } else {
      camera.position.copy(pos)
      camera.lookAt(s.lookAt)
    }

    if (s.t >= 1) {
      s.active = false
      s.onComplete?.()
    }
  })

  return null
})

preloadBaked('room', 'props', 'computer')

// ── Scene ─────────────────────────────────────────────────────────
export function Scene() {
  const cameraControlsRef = useRef(null)
  const cameraRigRef      = useRef(null)
  const [isFocused,   setIsFocused]   = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isHovering,  setIsHovering]  = useState(false)
  const [isReady,     setIsReady]     = useState(false)
  const [isIntro,      setIsIntro]      = useState(true)
  const [introStarted, setIntroStarted] = useState(false)
  const isAnimatingRef = useRef(false)
  const isHoveringRef  = useRef(false)

  const setAnimating = useCallback((v) => {
    isAnimatingRef.current = v
    setIsAnimating(v)
  }, [])

  // ── Hover : zoom complet vers l'écran (technique Henry — enterMonitor) ──
  // Sur survol, la caméra zoome directement sur l'écran via CameraRig (Bézier).
  // Durée courte (~0.7s) + easing smoothstep → sensation proche de Henry.
  const handleMonitorEnter = useCallback(() => {
    if (isHoveringRef.current || isAnimatingRef.current || isFocused || isIntro) return
    isHoveringRef.current = true
    setIsHovering(true)

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
      const { target: t } = CAMERA.focused
      cx = t[0]; cy = t[1]; cz = t[2]
    }

    const endPos = new THREE.Vector3(cx, cy, cz + FOCUS_DISTANCE)
    const lookAt = new THREE.Vector3(cx, cy, cz)

    setAnimating(true)
    rig.animateTo(endPos, lookAt, () => {
      const cc = cameraControlsRef.current
      if (cc) {
        cc.setLookAt(endPos.x, endPos.y, endPos.z, cx, cy, cz, false)
        cc.smoothTime = TRANSITION_DURATION
      }
      setAnimating(false)
      setIsFocused(true)
    }, 0.7)
  }, [isFocused, isIntro, setAnimating])

  const handleMonitorLeave = useCallback(() => {
    // Une fois focused, seul le bouton Retour / Escape permet de sortir
    if (!isHoveringRef.current || isAnimatingRef.current || isFocused) return
    isHoveringRef.current = false
    setIsHovering(false)
  }, [isFocused])

  // ── Zoom arrière ──────────────────────────────────────────────
  const zoomOut = useCallback(() => {
    const rig = cameraRigRef.current
    if (!rig || isAnimatingRef.current) return
    isHoveringRef.current = false
    setIsHovering(false)

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

  const { play: playAudio } = useNightAudio()
  const dpr = useDevicePixelRatio()

  // ── handleCreated : initialise CameraControls à la position d'intro ─
  const handleCreated = useCallback(({ gl, scene, camera }) => {
    // Accès pour le test e2e (scripts/e2e-chrome.mjs), uniquement avec ?e2e
    if (new URLSearchParams(window.location.search).has('e2e')) window.__three = { gl, scene, camera }
    gl.setClearColor('#000000', 1)
    gl.setClearAlpha(1)
    setTimeout(() => {
      const cc = cameraControlsRef.current
      if (!cc) return
      const { position: p, target: t } = CAMERA.intro
      cc.setLookAt(p[0], p[1], p[2], t[0], t[1], t[2], false)
    }, 100)
  }, [])

  // ── handleStart : OK cliqué → son + démarrage IntroCam ────────────
  const handleStart = useCallback(() => {
    playAudio()
    setIntroStarted(true)
  }, [playAudio])

  // ── handleIntroDone : appelé par IntroCam quand l'animation se termine ──
  // CameraControls est déjà synchronisé sur overview → scroll restauré
  const handleIntroDone = useCallback(() => {
    setIsIntro(false)
    setIsReady(true)
  }, [])

  return (
    <div
      style={{ width: '100vw', height: '100vh', position: 'relative' }}
      role="application"
      aria-label="Portfolio 3D Poncelet Tymeo — scene Windows 95"
    >

      <LoadingScreen onStart={handleStart} />

      {/* Pas de `shadows` : aucune lumière ne projette d'ombre, la shadow map
          ne servait à rien. Antialiasing coupé sur les machines modestes. */}
      <Canvas
        camera={{ position: [0, 1.1, 4.2], fov: 50 }}
        gl={{ antialias: !IS_LOW_END, alpha: true, powerPreference: 'high-performance' }}
        dpr={dpr}
        onCreated={handleCreated}
      >
        {/* Aucune lumière : tout l'éclairage (lune, lampe, lueur de l'écran)
            est cuit dans les atlas par Blender — voir BakedModel.jsx. */}
        <Suspense fallback={null}>
          <Moon />
          <BakedModel name="room" />
          <Props />
        </Suspense>

        <Suspense fallback={null}>
          <VintagePC
            onMonitorEnter={handleMonitorEnter}
            onMonitorLeave={handleMonitorLeave}
            onScreenLeave={zoomOut}
            isFocused={isFocused}
          />
        </Suspense>

        {/* ── IntroCam : zoom d'entrée piloté via CameraControls ── */}
        <IntroCam active={introStarted} ccRef={cameraControlsRef} onComplete={handleIntroDone} />

        {/* ── MouseFollowCam : la caméra suit la souris en vue d'ensemble ── */}
        <MouseFollowCam active={isReady && !isFocused && !isAnimating && !isIntro} ccRef={cameraControlsRef} />

        {/* ── CameraRig : animation Bézier sans collision ── */}
        <CameraRig ref={cameraRigRef} ccRef={cameraControlsRef} />

        {/* Piloté uniquement par le code (intro, zoom, suivi de la souris) :
            l'orbite au clic-glisser tirerait la caméra contre le suivi. */}
        <CameraControls
          ref={cameraControlsRef}
          enabled={false}
          makeDefault
          smoothTime={TRANSITION_DURATION}
          draggingSmoothTime={0.08}
          minDistance={0.1}
          maxDistance={5}
          maxPolarAngle={Math.PI / 2 - 0.02}
          minPolarAngle={0.05}
        />
        <AdaptiveRenderer
          cameraControlsRef={cameraControlsRef}
          // Pas de mode 'paused' en vue écran : CameraControls continue de
          // stabiliser la caméra quelques images après le zoom ; sans rendu,
          // le trou de l'écran restait figé au mauvais endroit (écran invisible).
          mode={(introStarted && isIntro) || isAnimating ? 'boost' : 'auto'}
        />
      </Canvas>

      {/* ── Hint ── */}
      {isReady && !isFocused && !isAnimating && (
        <div
          aria-live="polite"
          aria-label="Instruction : survolez le moniteur pour demarrer l'OS"
          style={{
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
          Survolez le moniteur pour démarrer
        </div>
      )}

      {/* ── Crédit du modèle 3D du chat (licence CC BY 4.0 : attribution obligatoire) ── */}
      {isReady && !isFocused && (
        <div style={{
          position:   'absolute',
          right:      12,
          bottom:     8,
          color:      'rgba(255,255,255,0.32)',
          fontFamily: 'MS Sans Serif, Arial, sans-serif',
          fontSize:   11,
        }}>
          Chat : «&nbsp;
          <a href="https://sketchfab.com/3d-models/sleepy-comfy-cat-2c2baa9563db4f20ba23f869ec3288dc"
             target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>Sleepy Comfy Cat</a>
          &nbsp;» par{' '}
          <a href="https://sketchfab.com/leoskateman" target="_blank" rel="noopener noreferrer"
             style={{ color: 'inherit' }}>Léonard Doye</a>
          {' '}—{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer"
             style={{ color: 'inherit' }}>CC BY 4.0</a>
          {' '}(simplifié et ré-éclairé)
        </div>
      )}

      {/* ── Bouton Retour ── */}
      {isFocused && !isAnimating && (
        <button
          onClick={zoomOut}
          aria-label="Retour a la vue d'ensemble 3D"
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
