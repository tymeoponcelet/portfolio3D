// src/components/OS/OS.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useDragControls, useMotionValue } from 'framer-motion'
import { PortfolioApp } from './PortfolioApp'
import '../../styles/win95.css'

const BOOT_STEPS = [
  { pct: 15,  label: 'Chargement des pilotes…'     },
  { pct: 35,  label: 'Initialisation du registre…' },
  { pct: 55,  label: 'Démarrage des services…'      },
  { pct: 75,  label: "Chargement de l'interface…"  },
  { pct: 95,  label: 'Préparation du bureau…'       },
  { pct: 100, label: 'Bienvenue !'                  },
]

function BootScreen({ onComplete }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= BOOT_STEPS.length) {
      const t = setTimeout(onComplete, 500)
      return () => clearTimeout(t)
    }
    const delay = step === 0 ? 600 : 400 + Math.random() * 200
    const t = setTimeout(() => setStep((s) => s + 1), delay)
    return () => clearTimeout(t)
  }, [step, onComplete])

  const current = BOOT_STEPS[Math.min(step, BOOT_STEPS.length - 1)]

  return (
    <div className="win95-boot">
      <div className="win95-boot-logo">
        <div className="win95-boot-flag">
          <div className="win95-boot-flag-r" />
          <div className="win95-boot-flag-g" />
          <div className="win95-boot-flag-b" />
          <div className="win95-boot-flag-y" />
        </div>
        <div className="win95-boot-win">Microsoft Windows</div>
        <div className="win95-boot-95">95</div>
        <div className="win95-boot-tagline">Copyright © Microsoft Corp. 1981–1995</div>
      </div>
      <div className="win95-boot-bar-track">
        <div className="win95-boot-bar-fill" style={{ width: `${current.pct}%` }} />
      </div>
      <div className="win95-boot-status">{current.label}</div>
    </div>
  )
}

/* ── Taskbar ─────────────────────────────────────────────────── */

function Win95Taskbar({ windowTitle, windowActive, onWindowClick }) {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 10000)
    return () => clearInterval(t)
  }, [])

  const timeStr = time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="win95-taskbar" style={{ zIndex: 10000 }}>
      <button className="win95-start-btn">
        <span style={{ fontSize: 12, lineHeight: 1 }}>⊞</span>
        Démarrer
      </button>
      <div className="win95-sep" />
      {windowTitle && (
        <button
          className={`win95-task-btn${windowActive ? ' active' : ''}`}
          onClick={onWindowClick}
        >
          <span>💻</span>
          {windowTitle}
        </button>
      )}
      <div className="win95-tray">
        <span className="win95-clock">{timeStr}</span>
      </div>
    </div>
  )
}

/* ── Fenêtre portfolio ───────────────────────────────────────── */

function PortfolioWindow({ isMaximized, onMinimize, onMaximize, onClose }) {
  const dragControls = useDragControls()
  const x            = useMotionValue(20)
  const y            = useMotionValue(20)
  const windowRef    = useRef(null)
  const rafRef       = useRef(null)
  const resizeOrigin = useRef(null)

  const [isResizing, setIsResizing] = useState(false)
  const [isActive,   setIsActive]   = useState(true)
  const [size,       setSize]       = useState({ width: 480, height: 360 })

  /* ── Drag titlebar ───────────────────────────────────────────── */
  const handleTitlebarDown = useCallback((e) => {
    if (isMaximized || isResizing) return
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch (_) {}
    e.stopPropagation()
    dragControls.start(e)
  }, [isMaximized, isResizing, dragControls])

  const handleTitlebarUp = useCallback((e) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch (_) {}
  }, [])

  /* ── Resize bas-droite ───────────────────────────────────────── */
  const handleResizeDown = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch (_) {}
    setIsResizing(true)
    resizeOrigin.current = { mx: e.clientX, my: e.clientY, w: size.width, h: size.height }

    const onMove = (ev) => {
      if (!resizeOrigin.current) return
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        if (!resizeOrigin.current) return
        setSize({
          width:  Math.max(240, resizeOrigin.current.w + ev.clientX - resizeOrigin.current.mx),
          height: Math.max(160, resizeOrigin.current.h + ev.clientY - resizeOrigin.current.my),
        })
      })
    }

    const onUp = () => {
      setIsResizing(false)
      resizeOrigin.current = null
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup',   onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup',   onUp)
  }, [size.width, size.height])

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <motion.div
      ref={windowRef}
      className="win95-window"
      data-active={String(isActive)}
      style={{
        zIndex: 100,
        ...(isMaximized
          ? { position: 'absolute', inset: '0 0 28px 0' }
          : { position: 'absolute', width: size.width, height: size.height, x, y }
        ),
      }}
      drag={!isMaximized && !isResizing}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      onPointerDown={() => setIsActive(true)}
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1,    opacity: 1 }}
      exit={{    scale: 0.92, opacity: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      {/* Titlebar */}
      <div
        className="win95-titlebar"
        style={{ cursor: isMaximized ? 'default' : 'move', flexShrink: 0 }}
        onPointerDown={handleTitlebarDown}
        onPointerUp={handleTitlebarUp}
        onDoubleClick={() => !isResizing && onMaximize()}
      >
        <div className="win95-title-left">
          <span className="win95-title-icon">💻</span>
          <span className="win95-title-text">Tyméo Poncelet — Portfolio</span>
        </div>
        <div className="win95-controls">
          <button
            className="win95-ctrl-btn"
            title="Réduire"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onMinimize() }}
          >─</button>
          <button
            className="win95-ctrl-btn"
            title={isMaximized ? 'Restaurer' : 'Agrandir'}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onMaximize() }}
          >□</button>
          <button
            className="win95-ctrl-btn win95-ctrl-btn--close"
            title="Fermer"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onClose() }}
          >✕</button>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <PortfolioApp />
      </div>

      {/* Poignée resize (uniquement en mode fenêtré) */}
      {!isMaximized && (
        <div className="win95-resize-handle" onPointerDown={handleResizeDown} />
      )}
    </motion.div>
  )
}

/* ── OS principal ─────────────────────────────────────────────── */

export function OS() {
  const [booted,   setBooted]   = useState(false)
  const [winState, setWinState] = useState('max') // 'max' | 'windowed' | 'minimized'

  const handleBooted  = useCallback(() => setBooted(true), [])
  const handleMinimize = useCallback(() => setWinState('minimized'), [])
  const handleMaximize = useCallback(() => setWinState((s) => s === 'max' ? 'windowed' : 'max'), [])
  const handleClose    = useCallback(() => setWinState('minimized'), [])
  const handleTaskbar  = useCallback(() => setWinState((s) => s === 'minimized' ? 'windowed' : 'minimized'), [])
  const handleIconOpen = useCallback(() => setWinState('max'), [])

  return (
    <div
      className="win95-crt-root"
      data-theme="retro-light"
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: 'var(--w-teal)' }}
    >
      {/* Scanlines CRT */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9999,
        background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 1px, rgba(0,0,0,0.06) 1px, rgba(0,0,0,0.06) 2px)',
      }} />

      <AnimatePresence mode="wait">
        {!booted ? (
          <motion.div
            key="boot"
            style={{ position: 'absolute', inset: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BootScreen onComplete={handleBooted} />
          </motion.div>
        ) : (
          <motion.div
            key="desktop"
            style={{ position: 'absolute', inset: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Icône bureau — visible uniquement quand la fenêtre n'est pas maximisée */}
            {winState !== 'max' && (
              <div
                className="win95-icon"
                style={{ position: 'absolute', top: 10, left: 8, zIndex: 50 }}
                onDoubleClick={handleIconOpen}
              >
                <span className="win95-icon-img">💻</span>
                <span className="win95-icon-label">Portfolio</span>
              </div>
            )}

            {/* Fenêtre portfolio */}
            <AnimatePresence>
              {winState !== 'minimized' && (
                <PortfolioWindow
                  key="portfolio-win"
                  isMaximized={winState === 'max'}
                  onMinimize={handleMinimize}
                  onMaximize={handleMaximize}
                  onClose={handleClose}
                />
              )}
            </AnimatePresence>

            {/* Barre des tâches */}
            <Win95Taskbar
              windowTitle="Portfolio"
              windowActive={winState !== 'minimized'}
              onWindowClick={handleTaskbar}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
