// src/components/Window/Window.jsx
import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useMotionValue, useDragControls } from 'framer-motion'
import { useOSStore } from '../../stores/osStore'

export function Window({
  id, title, icon, children,
  position, size, zIndex, isMinimized, isMaximized,
}) {
  const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, updatePosition, updateSize } =
    useOSStore()

  const dragControls  = useDragControls()
  const x             = useMotionValue(position.x)
  const y             = useMotionValue(position.y)

  useEffect(() => {
    x.set(position.x)
    y.set(position.y)
  }, [position.x, position.y]) // eslint-disable-line react-hooks/exhaustive-deps

  const resizeOrigin  = useRef(null)
  const [isResizing, setIsResizing] = useState(false)

  const handleResizeDown = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    resizeOrigin.current = { mx: e.clientX, my: e.clientY, w: size.width, h: size.height }

    const onMove = (ev) => {
      if (!resizeOrigin.current) return
      updateSize(id, {
        width:  Math.max(200, resizeOrigin.current.w + ev.clientX - resizeOrigin.current.mx),
        height: Math.max(120, resizeOrigin.current.h + ev.clientY - resizeOrigin.current.my),
      })
    }
    const onUp = () => {
      setIsResizing(false)
      resizeOrigin.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',  onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',  onUp)
  }, [id, size.width, size.height, updateSize])

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
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={() => updatePosition(id, { x: x.get(), y: y.get() })}
      onMouseDown={() => focusWindow(id)}
      initial={{ scale: 0.88, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.88, opacity: 0 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
    >
      {/* ── Titlebar — drag exclusif à cette zone ── */}
      <div
        className="win95-titlebar"
        onPointerDown={(e) => {
          if (!isMaximized && !isResizing) dragControls.start(e)
        }}
        onDoubleClick={() => !isResizing && maximizeWindow(id)}
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
          >─</button>
          <button
            className="win95-ctrl-btn"
            title="Agrandir"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); maximizeWindow(id) }}
          >□</button>
          <button
            className="win95-ctrl-btn win95-ctrl-btn--close"
            title="Fermer"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); closeWindow(id) }}
          >✕</button>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="win95-body">{children}</div>

      {/* ── Poignée resize ── */}
      {!isMaximized && (
        <div className="win95-resize-handle" onMouseDown={handleResizeDown} />
      )}
    </motion.div>
  )
}
