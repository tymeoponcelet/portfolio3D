// src/components/Window/Window.jsx
//
// Design System : Heffernan-accurate (audit Puppeteer 2026-04-12)
//
// ─── Bordures 3D ─────────────────────────────────────────────────────────────
//   4 couches inset box-shadow issues de style-tokens.json :
//   highlight (#fff) · face (#747474) · frame (#2b2b2b) · shadow (#808080)
//   Source : --border-raised dans win95.css, technique exacte Heffernan.
//
// ─── Grain plastique ─────────────────────────────────────────────────────────
//   .win95-grain → SVG feTurbulence noise (200×200, tuilé) en ::after
//   Opacity 0.055, mix-blend-mode overlay : visible sur silver, invisible
//   sur blanc (.win95-body couvre naturellement le pseudo-élément).
//
// ─── Icônes ──────────────────────────────────────────────────────────────────
//   Lucide-react (Minus / Square / X) taille 7px strokeWidth 3.
//   CSS filter contrast+brightness → look bitmap Win95.
//
// ─── Motion ──────────────────────────────────────────────────────────────────
//   Spring stiffness=380 damping=26 mass=0.9 → rebond "plastique lourd".
//   Exit scale 0.88 + fade 80ms → fermeture claquante authentique.
//   dragMomentum=false + dragElastic=0 → arrêt net Win95.
//
// ─── Perf ────────────────────────────────────────────────────────────────────
//   WindowBody : React.memo strict (children ref stable = zéro re-render drag).
//   setPointerCapture : isole le drag du canvas WebGL Three.js.
//   will-change:transform activé SEULEMENT pendant drag/resize.
//   rAF throttling sur pointermove → 1 updateSize() max par frame.

import { useRef, useState, useCallback, useEffect, memo } from 'react'
import { motion, useMotionValue, useDragControls }       from 'framer-motion'
import { getIcon }                                      from '../../assets/icons/index.js'
import { DragIndicator }                                from './DragIndicator.jsx'
import { ResizeIndicator }                              from './ResizeIndicator.jsx'
import { useOSStore }                                   from '../../stores/osStore'
import { cn }                                           from '../../utils/cn'

/* ── Variants Framer Motion ─────────────────────────────────────── */

const SPRING = { type: 'spring', stiffness: 380, damping: 26, mass: 0.9 }
const SNAP   = { duration: 0.08, ease: 'easeIn' }

const VARIANTS = {
  hidden:  { scale: 0.88, opacity: 0, y: 10, transition: SNAP  },
  visible: { scale: 1,    opacity: 1, y: 0,  transition: SPRING },
  exit:    { scale: 0.88, opacity: 0, y: 10, transition: SNAP  },
}

/* ── CtrlButton ─────────────────────────────────────────────────── */
// Bouton titlebar réutilisable — PNG pixel-art icon
// filtre CSS dans win95.css (.win95-ctrl-btn img)

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
// Comparaison de référence stricte : tant que Desktop.jsx passe la
// même instance JSX (créée à la racine du module), WindowBody ne
// se re-rend JAMAIS pendant un drag ou un resize.

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
}) {
  const {
    closeWindow, minimizeWindow, maximizeWindow,
    focusWindow, updatePosition, updateSize,
  } = useOSStore()

  /* ── Motion values hors React : zéro re-render pendant le drag ── */
  const dragControls = useDragControls()
  const x = useMotionValue(position.x)
  const y = useMotionValue(position.y)

  /* Sync si la position change externellement (reopen après close) */
  useEffect(() => {
    x.set(position.x)
    y.set(position.y)
  }, [position.x, position.y]) // eslint-disable-line react-hooks/exhaustive-deps

  const [isActive,   setIsActive]   = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const windowRef    = useRef(null)
  const rafRef       = useRef(null)
  const resizeOrigin = useRef(null)

  /* ── will-change : activé SEULEMENT pendant drag/resize ────────── */
  const setWillChange = useCallback((val) => {
    if (windowRef.current) windowRef.current.style.willChange = val
  }, [])

  /* ── Titlebar — pointerdown ──────────────────────────────────────
     setPointerCapture : tous les pointermove suivants vont à la
     titlebar → le canvas Three.js / PresentationControls ne reçoit rien. */
  const handleTitlebarDown = useCallback((e) => {
    if (isMaximized || isResizing) return
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch (_) {}
    e.stopPropagation()
    setWillChange('transform')
    dragControls.start(e)
  }, [isMaximized, isResizing, dragControls, setWillChange])

  const handleTitlebarUp = useCallback((e) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch (_) {}
    setWillChange('auto')
  }, [setWillChange])

  /* ── Resize handle — pointerdown ─────────────────────────────────
     rAF throttling : max 1 updateSize() par frame → pas de layout thrash. */
  const handleResizeDown = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch (_) {}
    setIsResizing(true)
    setWillChange('transform')
    resizeOrigin.current = {
      mx: e.clientX, my: e.clientY,
      w: size.width, h: size.height,
    }

    const onMove = (ev) => {
      if (!resizeOrigin.current) return
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        if (!resizeOrigin.current) return
        updateSize(id, {
          width:  Math.max(200, resizeOrigin.current.w + ev.clientX - resizeOrigin.current.mx),
          height: Math.max(120, resizeOrigin.current.h + ev.clientY - resizeOrigin.current.my),
        })
      })
    }

    const onUp = () => {
      setIsResizing(false)
      setWillChange('auto')
      resizeOrigin.current = null
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup',   onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup',   onUp)
  }, [id, size.width, size.height, updateSize, setWillChange])

  /* ── Focus ──────────────────────────────────────────────────────── */
  const handleWindowDown = useCallback(() => {
    setIsActive(true)
    focusWindow(id)
  }, [id, focusWindow])

  /* Blur global : perte de focus quand une autre fenêtre est cliquée */
  useEffect(() => {
    if (!isActive) return
    const onGlobal = (e) => {
      if (windowRef.current && !windowRef.current.contains(e.target))
        setIsActive(false)
    }
    document.addEventListener('pointerdown', onGlobal, { capture: true })
    return () => document.removeEventListener('pointerdown', onGlobal, { capture: true })
  }, [isActive])

  /* Cleanup RAF sur unmount */
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  if (isMinimized) return null

  return (
    <motion.div
      ref={windowRef}
      className={cn(
        'win95-window win95-grain',
        /* Tailwind utilities pour la position absolue */
        'absolute',
      )}
      data-active={String(isActive)}
      style={{
        zIndex,
        width:  isMaximized ? '100%'              : size.width,
        height: isMaximized ? 'calc(100% - 28px)' : size.height,
        x: isMaximized ? 0 : x,
        y: isMaximized ? 0 : y,
      }}
      drag={!isMaximized && !isResizing}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => { setIsDragging(true); setWillChange('transform') }}
      onDragEnd={() => {
        setIsDragging(false)
        setWillChange('auto')
        updatePosition(id, { x: x.get(), y: y.get() })
      }}
      onPointerDown={handleWindowDown}
      variants={VARIANTS}
      initial="hidden"
      animate="visible"
      exit="exit"
    >

      {/* ── Titlebar ──────────────────────────────────────────────── */}
      <div
        className="win95-titlebar"
        style={{ cursor: isMaximized ? 'default' : 'move', flexShrink: 0 }}
        onPointerDown={handleTitlebarDown}
        onPointerUp={handleTitlebarUp}
        onDoubleClick={() => !isResizing && maximizeWindow(id)}
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
            onClick={(e) => { e.stopPropagation(); minimizeWindow(id) }}
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
            onClick={(e) => { e.stopPropagation(); closeWindow(id) }}
          />
        </div>
      </div>

      {/* ── Contenu — mémoïsé, jamais re-rendu pendant move/resize ── */}
      <WindowBody>{children}</WindowBody>

      {/* ── Poignée resize bas-droite ── */}
      {!isMaximized && (
        <div className="win95-resize-handle" onPointerDown={handleResizeDown} />
      )}

      <DragIndicator visible={isDragging} />
      <ResizeIndicator visible={isResizing} />

    </motion.div>
  )
}
