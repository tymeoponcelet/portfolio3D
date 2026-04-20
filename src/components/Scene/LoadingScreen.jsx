import { useState, useEffect } from 'react'
import { useProgress } from '@react-three/drei'

const FONT   = '"Courier New", Courier, monospace'
const GREEN  = '#33ff88'
const DIM    = 'rgba(51,255,136,0.45)'
const DIMMER = 'rgba(51,255,136,0.22)'

const BOOT_LINES = [
  { at:  0, text: 'BIOS v2.40  —  Portfolio System' },
  { at:  5, text: 'Detecting hardware...' },
  { at: 15, text: 'Initializing WebGL renderer... OK' },
  { at: 30, text: 'Loading 3D assets...' },
  { at: 55, text: 'Compiling shaders... OK' },
  { at: 75, text: 'Mapping scene geometry... OK' },
  { at: 90, text: 'Preparing CSS3D layer... OK' },
  { at: 99, text: 'All systems nominal.' },
]

export function LoadingScreen({ onStart }) {
  const { progress, active } = useProgress()
  const [visible,  setVisible]  = useState(true)
  const [fadeOut,  setFadeOut]  = useState(false)
  const [blink,    setBlink]    = useState(true)
  const isReady = !active && progress >= 99

  useEffect(() => {
    const id = setInterval(() => setBlink(b => !b), 520)
    return () => clearInterval(id)
  }, [])

  const handleClick = () => {
    onStart?.()
    setFadeOut(true)
    setTimeout(() => setVisible(false), 700)
  }

  if (!visible) return null

  const pct      = Math.round(progress)
  const filled   = Math.round(pct / 5)
  const barFill  = '█'.repeat(filled)
  const barEmpty = '░'.repeat(20 - filled)
  const visLines = BOOT_LINES.filter(l => pct >= l.at)

  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      zIndex:         9999,
      background:     '#000',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'flex-start',
      justifyContent: 'center',
      padding:        '0 min(12vw, 160px)',
      transition:     'opacity 0.7s ease',
      opacity:        fadeOut ? 0 : 1,
      pointerEvents:  fadeOut ? 'none' : 'auto',
      fontFamily:     FONT,
      fontSize:       13,
      lineHeight:     1.7,
    }}>

      {/* Boot log */}
      <div style={{ marginBottom: 28, color: DIM }}>
        {visLines.map((l, i) => (
          <div key={i} style={{ color: i === visLines.length - 1 ? GREEN : DIM }}>
            {i === visLines.length - 1 && '> '}{l.text}
          </div>
        ))}
      </div>

      {/* Barre de progression */}
      <div style={{ color: GREEN, marginBottom: 6 }}>
        [{barFill}{barEmpty}]&nbsp;&nbsp;{pct}&nbsp;%
      </div>

      {/* Statut / bouton */}
      {isReady ? (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={handleClick}
            autoFocus
            style={{
              background:    'transparent',
              border:        `1px solid ${GREEN}`,
              color:         GREEN,
              fontFamily:    FONT,
              fontSize:      13,
              padding:       '5px 20px',
              cursor:        'pointer',
              letterSpacing: '0.18em',
              outline:       'none',
              boxShadow:     `0 0 8px rgba(51,255,136,0.25)`,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(51,255,136,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            [ OK ]{blink ? '_' : '\u00a0'}
          </button>
        </div>
      ) : (
        <div style={{ color: DIMMER, marginTop: 4, fontSize: 12 }}>
          {blink ? '▌' : '\u00a0'}
        </div>
      )}

    </div>
  )
}
