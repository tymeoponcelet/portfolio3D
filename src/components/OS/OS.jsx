// src/components/OS/OS.jsx
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

/* ── Fenêtre portfolio plein-écran ─────────────────────────── */

function PortfolioWindow() {
  return (
    <motion.div
      className="win95-window"
      style={{
        position: 'absolute',
        inset: 6,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      {/* Titlebar */}
      <div className="win95-titlebar" style={{ cursor: 'default', flexShrink: 0 }}>
        <div className="win95-title-left">
          <span className="win95-title-icon">💻</span>
          <span>Tyméo Poncelet — Portfolio</span>
        </div>
        <div className="win95-controls">
          <button className="win95-ctrl-btn" title="Réduire"   onPointerDown={(e) => e.stopPropagation()}>─</button>
          <button className="win95-ctrl-btn" title="Agrandir"  onPointerDown={(e) => e.stopPropagation()}>□</button>
          <button className="win95-ctrl-btn win95-ctrl-btn--close" title="Fermer" onPointerDown={(e) => e.stopPropagation()}>✕</button>
        </div>
      </div>

      {/* Corps : sidebar + contenu */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <PortfolioApp />
      </div>
    </motion.div>
  )
}

/* ── OS principal ─────────────────────────────────────────── */

export function OS() {
  const [booted, setBooted] = useState(false)
  const handleBooted = useCallback(() => setBooted(true), [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: 'var(--w-teal)' }}>
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
            <PortfolioWindow />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
