import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useWindowStore } from '../../stores/windowStore'
import { Window } from '../Window/Window'
import { Desktop } from './Desktop'
import { Taskbar } from './Taskbar'
import '../../styles/win95.css'

// ── Écran de démarrage Windows 95 ────────────────────────────────
const BOOT_STEPS = [
  { pct: 15, label: 'Chargement des pilotes…' },
  { pct: 35, label: 'Initialisation du registre…' },
  { pct: 55, label: 'Démarrage des services…' },
  { pct: 75, label: 'Chargement de l\'interface…' },
  { pct: 95, label: 'Préparation du bureau…' },
  { pct: 100, label: 'Bienvenue !' },
]

function BootScreen({ onComplete }) {
  const [step, setStep]   = useState(0)

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
      {/* Logo Windows 95 */}
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

      {/* Barre de progression */}
      <div className="win95-boot-bar-track">
        <div
          className="win95-boot-bar-fill"
          style={{ width: `${current.pct}%` }}
        />
      </div>

      <div className="win95-boot-status">{current.label}</div>
    </div>
  )
}

// ── OS principal ──────────────────────────────────────────────────
export function OS() {
  const windows = useWindowStore((s) => s.windows)
  const [booted, setBooted] = useState(false)

  const handleBooted = useCallback(() => setBooted(true), [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {!booted ? (
        <BootScreen onComplete={handleBooted} />
      ) : (
        <>
          {/* Fenêtres (AnimatePresence pour l'animation d'ouverture/fermeture) */}
          <AnimatePresence>
            {windows.map((win) => (
              <Window key={win.id} {...win}>
                {win.content}
              </Window>
            ))}
          </AnimatePresence>

          <Desktop />
          <Taskbar />
        </>
      )}
    </div>
  )
}
