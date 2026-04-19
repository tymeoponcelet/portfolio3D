// src/components/OS/OS.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence }                  from 'framer-motion'
import { Desktop }                                  from './Desktop'
import { ShutdownSequence }                         from './ShutdownSequence'
import { BSOD }                                     from './BSOD'
import { SafeToTurnOff }                            from './SafeToTurnOff'
import { useOSStore }                               from '../../stores/osStore'
import { win95sounds }                              from '../../utils/win95sounds'
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

export function OS() {
  const [booted,   setBooted]   = useState(false)
  const [showSafe, setShowSafe] = useState(false)

  const isShutdown       = useOSStore((s) => s.isShutdown)
  const numShutdowns     = useOSStore((s) => s.numShutdowns)
  const completeShutdown = useOSStore((s) => s.completeShutdown)
  const isBSOD           = useOSStore((s) => s.isBSOD)
  const triggerBSOD      = useOSStore((s) => s.triggerBSOD)
  const clearBSOD        = useOSStore((s) => s.clearBSOD)

  /* ── Startup sound on boot complete ─────────────────────────── */
  const handleBooted = useCallback(() => {
    setBooted(true)
    win95sounds.startup()
  }, [])

  /* ── BSOD recovery: clear flag + re-boot ────────────────────── */
  const handleBSODRecover = useCallback(() => {
    clearBSOD()
    setBooted(false)
  }, [clearBSOD])

  /* ── Shutdown → SafeToTurnOff → completeShutdown ───────────── */
  const handleShutdownComplete = useCallback(() => setShowSafe(true), [])
  const handleSafeDone = useCallback(() => {
    setShowSafe(false)
    completeShutdown()
  }, [completeShutdown])

  /* ── Random BSOD timer (2% every 30 s ≈ once per ~25 min) ──── */
  useEffect(() => {
    if (!booted || isShutdown || isBSOD) return
    const id = setInterval(() => {
      if (Math.random() < 0.02) triggerBSOD()
    }, 30000)
    return () => clearInterval(id)
  }, [booted, isShutdown, isBSOD, triggerBSOD])

  /* ── Glitch CRT aléatoire ────────────────────────────────────── */
  const crtRef = useRef(null)
  useEffect(() => {
    let tid
    const GLITCHES = [
      () => ({ transform: `translateX(${(Math.random() - 0.5) * 7}px)`, filter: 'none' }),
      () => ({ transform: 'none', filter: `hue-rotate(${Math.random() > 0.5 ? 10 : -10}deg) saturate(1.25)` }),
      () => ({ transform: `translateX(${(Math.random() - 0.5) * 4}px)`, filter: 'brightness(1.07)' }),
    ]
    const schedule = () => {
      tid = setTimeout(() => {
        const el = crtRef.current
        if (el) {
          const g = GLITCHES[Math.floor(Math.random() * GLITCHES.length)]()
          el.style.transform = g.transform
          el.style.filter    = g.filter
          setTimeout(() => { if (el) { el.style.transform = ''; el.style.filter = '' } }, 40 + Math.random() * 90)
        }
        schedule()
      }, 1800 + Math.random() * 5500)
    }
    schedule()
    return () => clearTimeout(tid)
  }, [])

  return (
    <div
      ref={crtRef}
      className="win95-crt-root"
      data-theme="retro-light"
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    >
      {/* Scanlines CRT */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 99999,
        background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 1px, rgba(0,0,0,0.06) 1px, rgba(0,0,0,0.06) 2px)',
      }} />

      {/* BSOD — overlay au-dessus de tout */}
      {isBSOD && <BSOD onRecover={handleBSODRecover} />}

      {/* SafeToTurnOff — overlay shutdown final */}
      {showSafe && <SafeToTurnOff onDone={handleSafeDone} />}

      <AnimatePresence mode="wait">
        {isShutdown && !showSafe ? (
          <motion.div key="shutdown" style={{ position: 'absolute', inset: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}>
            <ShutdownSequence numShutdowns={numShutdowns} onComplete={handleShutdownComplete} />
          </motion.div>
        ) : !booted && !isShutdown ? (
          <motion.div key="boot" style={{ position: 'absolute', inset: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <BootScreen onComplete={handleBooted} />
          </motion.div>
        ) : !isShutdown ? (
          <motion.div key="desktop" style={{ position: 'absolute', inset: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <Desktop />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
