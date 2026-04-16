// src/components/OS/OS.jsx
// Shell de l'OS : boot screen → bureau → ShutdownSequence → bureau.
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence }           from 'framer-motion'
import { Desktop }                           from './Desktop'
import { ShutdownSequence }                  from './ShutdownSequence'
import { useOSStore }                        from '../../stores/osStore'
import '../../styles/win95.css'

/* ── Étapes de démarrage ─────────────────────────────────────────── */

const BOOT_STEPS = [
  { pct: 15,  label: 'Chargement des pilotes…'     },
  { pct: 35,  label: 'Initialisation du registre…' },
  { pct: 55,  label: 'Démarrage des services…'      },
  { pct: 75,  label: "Chargement de l'interface…"  },
  { pct: 95,  label: 'Préparation du bureau…'       },
  { pct: 100, label: 'Bienvenue !'                  },
]

/* ── BootScreen ──────────────────────────────────────────────────── */

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

/* ── OS ──────────────────────────────────────────────────────────── */

export function OS() {
  const [booted, setBooted]   = useState(false)
  const handleBooted = useCallback(() => setBooted(true), [])

  const isShutdown      = useOSStore((s) => s.isShutdown)
  const numShutdowns    = useOSStore((s) => s.numShutdowns)
  const completeShutdown = useOSStore((s) => s.completeShutdown)

  return (
    <div
      className="win95-crt-root"
      data-theme="retro-light"
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    >
      {/* Scanlines CRT */}
      <div style={{
        position:      'absolute',
        inset:         0,
        pointerEvents: 'none',
        zIndex:        99999,
        background:    'repeating-linear-gradient(to bottom, transparent 0px, transparent 1px, rgba(0,0,0,0.06) 1px, rgba(0,0,0,0.06) 2px)',
      }} />

      <AnimatePresence mode="wait">
        {isShutdown ? (
          <motion.div
            key="shutdown"
            style={{ position: 'absolute', inset: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ShutdownSequence numShutdowns={numShutdowns} onComplete={completeShutdown} />
          </motion.div>
        ) : !booted ? (
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
            transition={{ duration: 0.25 }}
          >
            <Desktop />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
