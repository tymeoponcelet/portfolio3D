// src/components/Window/Window.jsx
//
// Approche Henry Heffernan :
//   - Drag MANUEL via Pointer Events (setPointerCapture + pointermove)
//     → framer-motion `drag` ne suit pas le pointeur de façon fiable dans
//       une iframe sous transform matrix3d hors Firefox (Chrome/Safari) :
//       on gère donc le déplacement nous-mêmes, ce qui marche partout.
//   - Pas de resize : taille fixe définie à l'ouverture
//   - DragIndicator (overlay pointillés pendant le drag)
//   - will-change:transform activé SEULEMENT pendant le drag

import { useRef, useState, useCallback, useEffect, memo } from 'react'
import { motion, useMotionValue }                          from 'framer-motion'
import { getIcon }                                         from '../../assets/icons/index.js'
import { DragIndicator }                                   from './DragIndicator.jsx'
import { useOSStore }                                      from '../../stores/osStore'
import { cn }                                              from '../../utils/cn'
import { win95sounds } from '../../utils/win95sounds'

/* ── Variants Framer Motion ─────────────────────────────────────── */

const SPRING = { type: 'spring', stiffness: 380, damping: 26, mass: 0.9 }
const SNAP   = { duration: 0.08, ease: 'easeIn' }

const VARIANTS = {
  hidden:  { scale: 0.88, opacity: 0, y: 10, transition: SNAP  },
  visible: { scale: 1,    opacity: 1, y: 0,  transition: SPRING },
  exit:    { scale: 0.88, opacity: 0, y: 10, transition: SNAP  },
}

/* ── CtrlButton ─────────────────────────────────────────────────── */

const CtrlButton = memo(({ iconSrc, title, className, onPointerDown, onClick }) => (
  <button
    className={cn('win95-ctrl-btn', className)}
    title={title}
    onPointerDown={onPointerDown}
    onClick={onClick}
  >
    <img src={iconSrc} alt={title} />
  </button>
))
CtrlButton.displayName = 'CtrlButton'

/* ── WindowBody ─────────────────────────────────────────────────── */

const WindowBody = memo(
  ({ children }) => <div className="win95-body">{children}</div>,
  (prev, next) => prev.children === next.children,
)
WindowBody.displayName = 'WindowBody'

/* ── Window ─────────────────────────────────────────────────────── */

export function Window({
  id,
  title,
  icon,
  children,
  position,
  size,
  zIndex,
  isMinimized,
  isMaximized,
  rainbow,
}) {
  // Sélecteurs ciblés : `useOSStore()` sans sélecteur re-rendait TOUTES les
  // fenêtres à chaque changement du store (focus, horloge, fond d'écran…).
  const closeWindow    = useOSStore((s) => s.closeWindow)
  const minimizeWindow = useOSStore((s) => s.minimizeWindow)
  const maximizeWindow = useOSStore((s) => s.maximizeWindow)
  const focusWindow    = useOSStore((s) => s.focusWindow)
  const updatePosition = useOSStore((s) => s.updatePosition)

  const x = useMotionValue(position.x)
  const y = useMotionValue(position.y)

  useEffect(() => {
    x.set(position.x)
    y.set(position.y)
  }, [position.x, position.y]) // eslint-disable-line react-hooks/exhaustive-deps

  // Play open sound on mount
  useEffect(() => { win95sounds.open() }, []) // eslint-disable-line

  const [isActive,   setIsActive]   = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const windowRef = useRef(null)

  /* ── will-change : activé SEULEMENT pendant drag ────────────── */
  const setWillChange = useCallback((val) => {
    if (windowRef.current) windowRef.current.style.willChange = val
  }, [])

  /* ── Titlebar — drag manuel via events souris sur `window` ───────
     L'OS tourne dans une iframe transformée en matrix3d (CSS3DRenderer).
     Dans Chrome/Safari, setPointerCapture y est peu fiable : les
     pointermove cessent d'arriver dès que le curseur quitte la titlebar
     → la fenêtre ne bougeait que dans Firefox.
     On écoute donc mousemove/mouseup sur `window` (le window de l'iframe),
     mécanisme prouvé fiable dans TOUS les navigateurs — c'est déjà celui
     qu'utilise os-main.jsx pour transmettre la souris à la scène 3D. */
  const handleTitlebarDown = useCallback((e) => {
    if (isMaximized) return
    if (e.button !== 0) return   // clic gauche uniquement
    e.stopPropagation()

    const startX  = e.clientX
    const startY  = e.clientY
    const originX = x.get()
    const originY = y.get()

    setIsDragging(true)
    setWillChange('transform')

    // La barre de titre doit rester attrapable : on borne la position pour
    // qu'au moins 60 px de la fenêtre restent visibles (et jamais au-dessus
    // du haut de l'écran ni sous la barre des tâches).
    const winW  = windowRef.current?.offsetWidth ?? 200
    const maxX  = window.innerWidth  - 60
    const minX  = 60 - winW
    const maxY  = window.innerHeight - 28 - 24
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

    const onMove = (ev) => {
      x.set(clamp(originX + (ev.clientX - startX), minX, maxX))
      y.set(clamp(originY + (ev.clientY - startY), 0,    maxY))
    }
    let ended = false
    const onUp = () => {
      if (ended) return
      ended = true
      window.removeEventListener('mousemove',     onMove)
      window.removeEventListener('mouseup',       onUp)
      window.removeEventListener('pointerup',     onUp)
      window.removeEventListener('pointercancel', onUp)
      setIsDragging(false)
      setWillChange('auto')
      updatePosition(id, { x: x.get(), y: y.get() })
    }

    // mousemove/mouseup sur le window de l'iframe (events synthétiques
    // envoyés par CSS3DScreen) ; pointerup/pointercancel en filet de sécurité.
    window.addEventListener('mousemove',     onMove)
    window.addEventListener('mouseup',       onUp)
    window.addEventListener('pointerup',     onUp)
    window.addEventListener('pointercancel', onUp)
  }, [isMaximized, x, y, id, updatePosition, setWillChange])

  /* ── Focus ────────────────────────────────────────────────────── */
  const handleWindowDown = useCallback(() => {
    setIsActive(true)
    focusWindow(id)
  }, [id, focusWindow])

  useEffect(() => {
    if (!isActive) return
    const onGlobal = (e) => {
      if (windowRef.current && !windowRef.current.contains(e.target))
        setIsActive(false)
    }
    document.addEventListener('pointerdown', onGlobal, { capture: true })
    return () => document.removeEventListener('pointerdown', onGlobal, { capture: true })
  }, [isActive])

  if (isMinimized) return null

  return (
    <motion.div
      ref={windowRef}
      className={cn('win95-window win95-grain', 'absolute')}
      data-active={String(isActive)}
      style={{
        zIndex,
        width:  isMaximized ? '100%'              : size.width,
        height: isMaximized ? 'calc(100% - 28px)' : size.height,
        x: isMaximized ? 0 : x,
        y: isMaximized ? 0 : y,
      }}
      onPointerDown={handleWindowDown}
      variants={VARIANTS}
      initial="hidden"
      animate="visible"
      exit="exit"
    >

      {/* ── Titlebar ──────────────────────────────────────────────── */}
      <div
        className={cn('win95-titlebar', rainbow && 'rainbow')}
        style={{ cursor: isMaximized ? 'default' : 'move', flexShrink: 0, touchAction: 'none' }}
        onPointerDown={handleTitlebarDown}
        onDoubleClick={() => maximizeWindow(id)}
      >
        <div className="win95-title-left">
          {icon && <span className="win95-title-icon">{icon}</span>}
          <span className="win95-title-text">{title}</span>
        </div>

        <div className="win95-controls">
          <CtrlButton
            iconSrc={getIcon('minimize')}
            title="Réduire"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); win95sounds.minimize(); minimizeWindow(id) }}
          />
          <CtrlButton
            iconSrc={getIcon('maximize')}
            title={isMaximized ? 'Restaurer' : 'Agrandir'}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); maximizeWindow(id) }}
          />
          <CtrlButton
            iconSrc={getIcon('close')}
            title="Fermer"
            className="win95-ctrl-btn--close"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); win95sounds.close(); closeWindow(id) }}
          />
        </div>
      </div>

      {/* ── Contenu — mémoïsé, jamais re-rendu pendant le drag ── */}
      <WindowBody>{children}</WindowBody>

      <DragIndicator visible={isDragging} />

    </motion.div>
  )
}
