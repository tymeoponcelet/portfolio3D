import { useRef, useState, useCallback } from 'react'
import { motion, useMotionValue, useDragControls } from 'framer-motion'
import { useWindowStore } from '../../stores/windowStore'
import '../../styles/win95.css'

export function Window({
  id, title, icon, children,
  position, size, zIndex, isMinimized, isMaximized,
}) {
  const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, updatePosition, updateSize } =
    useWindowStore()

  // useDragControls : seule la titlebar déclenche le drag (pas le body entier)
  const dragControls = useDragControls()
  const x = useMotionValue(position.x)
  const y = useMotionValue(position.y)

  const resizeOrigin = useRef(null)
  const [isResizing, setIsResizing] = useState(false)

  const handleResizeDown = useCallback(
    (e) => {
      e.stopPropagation()
      e.preventDefault()
      setIsResizing(true)
      resizeOrigin.current = { mx: e.clientX, my: e.clientY, w: size.width, h: size.height }

      const onMove = (ev) => {
        if (!resizeOrigin.current) return
        const dx = ev.clientX - resizeOrigin.current.mx
        const dy = ev.clientY - resizeOrigin.current.my
        updateSize(id, {
          width:  Math.max(200, resizeOrigin.current.w + dx),
          height: Math.max(120, resizeOrigin.current.h + dy),
        })
      }
      const onUp = () => {
        setIsResizing(false)
        resizeOrigin.current = null
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [id, size, updateSize]
  )

  if (isMinimized) return null

  return (
    <motion.div
      className="win95-window"
      style={{
        zIndex,
        width:  isMaximized ? '100%' : size.width,
        height: isMaximized ? 'calc(100% - 28px)' : size.height,
        x: isMaximized ? 0 : x,
        y: isMaximized ? 0 : y,
      }}
      drag={!isMaximized && !isResizing}
      dragControls={dragControls}
      dragListener={false}   // le drag ne part QUE de la titlebar via dragControls.start()
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={() => updatePosition(id, { x: x.get(), y: y.get() })}
      onMouseDown={() => focusWindow(id)}
      initial={{ scale: 0.88, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.88, opacity: 0 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
    >
      {/* ── Barre de titre — handle de drag exclusif ── */}
      <div
        className="win95-titlebar"
        onPointerDown={(e) => {
          // Lance le drag uniquement depuis la titlebar, jamais depuis les boutons
          if (!isMaximized && !isResizing && e.target === e.currentTarget) {
            dragControls.start(e)
          }
        }}
        onDoubleClick={() => maximizeWindow(id)}
      >
        <div className="win95-title-left">
          {icon && <span className="win95-title-icon">{icon}</span>}
          <span>{title}</span>
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
            className="win95-ctrl-btn"
            title="Fermer"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); closeWindow(id) }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Menu bar ── */}
      <div className="win95-menubar">
        {['Fichier', 'Édition', 'Affichage', 'Aide'].map((m) => (
          <span key={m} className="win95-menu-entry">{m}</span>
        ))}
      </div>

      {/* ── Contenu ── */}
      <div className="win95-body">{children}</div>

      {/* ── Poignée de resize ── */}
      {!isMaximized && (
        <div className="win95-resize-handle" onMouseDown={handleResizeDown} />
      )}
    </motion.div>
  )
}
