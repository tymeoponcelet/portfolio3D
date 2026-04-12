// src/components/Window/Window.jsx
//
// Design System : Heffernan-accurate (audit Puppeteer 2026-04-12)
//
// ─── Glassmorphism ───────────────────────────────────────────────────────────
//   L'audit Puppeteer confirme : os.henryheffernan.com utilise
//   backdrop-filter: NONE sur tous les éléments. Pas de blur, pas de verre.
//   Win95 est délibérément opaque et matte — c'est l'authenticité rétro.
//   À la place : CRT phosphor-glow (box-shadow coloré, zéro blur) sur
//   la fenêtre active. Voir CSS : .win95-window[data-active="true"].
//
// ─── Typographie anti-blur ───────────────────────────────────────────────────
//   Le composant applique data-theme sur la fenêtre pour activer les
//   variables CSS Retro-Light / Retro-Dark. L'élément racine .win95-crt-root
//   (dans OS.jsx) porte -webkit-font-smoothing: none pour le rendu CRT.
//
// ─── Événements Three.js ────────────────────────────────────────────────────
//   setPointerCapture sur la titlebar : tous les pointermove suivants
//   vont directement à la titlebar — le canvas WebGL ne reçoit rien.
//   Résout le conflit PresentationControls ↔ drag de fenêtre.

import { useRef, useState, useCallback, useEffect, memo } from 'react'
import { motion, useMotionValue, useDragControls } from 'framer-motion'
import { useOSStore } from '../../stores/osStore'

/* ──────────────────────────────────────────────────────────────────────────
   WindowBody — React.memo strict
   Ne re-rend JAMAIS pendant un drag ou resize de la fenêtre parente.
   Le contenu (JSX pré-créé dans Desktop.jsx ICONS[]) est une référence
   stable → la comparaison de props retourne toujours true.
   ────────────────────────────────────────────────────────────────────────── */

const WindowBody = memo(
  ({ children }) => <div className="win95-body">{children}</div>,
  (prev, next) => prev.children === next.children,
)
WindowBody.displayName = 'WindowBody'

/* ──────────────────────────────────────────────────────────────────────────
   Window
   ────────────────────────────────────────────────────────────────────────── */

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
  theme = 'retro-light',
}) {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updatePosition,
    updateSize,
  } = useOSStore()

  /* ── Motion values — hors React, zéro re-render pendant le drag ── */
  const dragControls = useDragControls()
  const x = useMotionValue(position.x)
  const y = useMotionValue(position.y)

  /* Sync si la position change externellement (reopen après close) */
  useEffect(() => {
    x.set(position.x)
    y.set(position.y)
  }, [position.x, position.y]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── État actif (titlebar bleue vs grise) ── */
  const [isActive, setIsActive] = useState(false)

  /* ── Resize ── */
  const resizeOrigin = useRef(null)
  const [isResizing, setIsResizing] = useState(false)
  const rafRef = useRef(null)

  /* ── will-change : activé uniquement pendant le drag/resize ──────────────
     Ne pas mettre will-change: transform en permanence — cela crée un
     layer GPU pour TOUTES les fenêtres simultanément → mémoire vidéo gaspillée.
     On l'active seulement pendant l'interaction, puis on retire. */
  const windowRef = useRef(null)
  const setWillChange = useCallback((val) => {
    if (windowRef.current) windowRef.current.style.willChange = val
  }, [])

  /* ──────────────────────────────────────────────────────────────────────
     Titlebar — pointerdown
     setPointerCapture(pointerId) : redirige TOUS les pointermove suivants
     vers cet élément, même si la souris quitte ses bounds.
     Le canvas Three.js ne reçoit plus rien → zéro conflit caméra.
     ────────────────────────────────────────────────────────────────────── */
  const handleTitlebarDown = useCallback((e) => {
    if (isMaximized || isResizing) return
    // Capture pointer → isolement complet du canvas WebGL
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch (_) {}
    e.stopPropagation() // bloque Three.js / PresentationControls
    setWillChange('transform')
    dragControls.start(e)
  }, [isMaximized, isResizing, dragControls, setWillChange])

  const handleTitlebarUp = useCallback((e) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch (_) {}
    setWillChange('auto')
  }, [setWillChange])

  /* ──────────────────────────────────────────────────────────────────────
     Resize handle — pointerdown
     Même isolation pointer que la titlebar.
     rAF throttling : max 1 updateSize() par frame → pas de layout thrash.
     ────────────────────────────────────────────────────────────────────── */
  const handleResizeDown = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch (_) {}
    setIsResizing(true)
    setWillChange('transform')
    resizeOrigin.current = {
      mx: e.clientX,
      my: e.clientY,
      w: size.width,
      h: size.height,
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

  /* ── Focus + état actif ── */
  const handleWindowDown = useCallback(() => {
    setIsActive(true)
    focusWindow(id)
  }, [id, focusWindow])

  /* Blur : quand une autre fenêtre est cliquée, cette fenêtre devient inactive.
     On écoute l'événement global "pointerdown" hors de cette fenêtre. */
  useEffect(() => {
    if (!isActive) return
    const onGlobalDown = (e) => {
      if (windowRef.current && !windowRef.current.contains(e.target)) {
        setIsActive(false)
      }
    }
    document.addEventListener('pointerdown', onGlobalDown, { capture: true })
    return () => document.removeEventListener('pointerdown', onGlobalDown, { capture: true })
  }, [isActive])

  /* ── Cleanup RAF sur unmount ── */
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  if (isMinimized) return null

  return (
    <motion.div
      ref={windowRef}
      className="win95-window"
      data-active={String(isActive)}
      data-theme={theme}
      style={{
        zIndex,
        width:  isMaximized ? '100%' : size.width,
        height: isMaximized ? 'calc(100% - 28px)' : size.height,
        x: isMaximized ? 0 : x,
        y: isMaximized ? 0 : y,
      }}
      drag={!isMaximized && !isResizing}
      dragControls={dragControls}
      dragListener={false}       // drag UNIQUEMENT via dragControls (titlebar)
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={() => {
        setWillChange('auto')
        updatePosition(id, { x: x.get(), y: y.get() })
      }}
      onPointerDown={handleWindowDown}
      initial={{ scale: 0.88, opacity: 0 }}
      animate={{ scale: 1,    opacity: 1 }}
      exit={{    scale: 0.88, opacity: 0 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
    >

      {/* ── Titlebar ──────────────────────────────────────────────── */}
      <div
        className="win95-titlebar"
        onPointerDown={handleTitlebarDown}
        onPointerUp={handleTitlebarUp}
        onDoubleClick={() => !isResizing && maximizeWindow(id)}
      >
        <div className="win95-title-left">
          {icon && <span className="win95-title-icon">{icon}</span>}
          <span className="win95-title-text">{title}</span>
        </div>

        <div className="win95-controls">
          <button
            className="win95-ctrl-btn"
            title="Réduire"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); minimizeWindow(id) }}
          >
            ─
          </button>
          <button
            className="win95-ctrl-btn"
            title="Agrandir"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); maximizeWindow(id) }}
          >
            □
          </button>
          <button
            className="win95-ctrl-btn win95-ctrl-btn--close"
            title="Fermer"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); closeWindow(id) }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Contenu — mémoïsé, ne re-rend pas pendant move/resize ── */}
      <WindowBody>{children}</WindowBody>

      {/* ── Poignée resize bas-droite ── */}
      {!isMaximized && (
        <div
          className="win95-resize-handle"
          onPointerDown={handleResizeDown}
        />
      )}

    </motion.div>
  )
}
