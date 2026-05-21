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
  const [visible,      setVisible]      = useState(true)
  const [fadeOut,      setFadeOut]      = useState(false)
  const [blink,        setBlink]        = useState(true)
  const [showButton,   setShowButton]   = useState(false)
  const [btnHover,     setBtnHover]     = useState(false)
  const [btnActive,    setBtnActive]    = useState(false)

  const isReady = !active && progress >= 99

  /* Clignotement curseur */
  useEffect(() => {
    const id = setInterval(() => setBlink(b => !b), 520)
    return () => clearInterval(id)
  }, [])

  /* Délai d'apparition du bouton après chargement complet */
  useEffect(() => {
    if (!isReady) return
    const id = setTimeout(() => setShowButton(true), 800)
    return () => clearTimeout(id)
  }, [isReady])

  const handleClick = () => {
    setBtnActive(true)
    setTimeout(() => {
      onStart?.()
      setFadeOut(true)
      setTimeout(() => setVisible(false), 700)
    }, 150)
  }

  if (!visible) return null

  const pct      = Math.round(progress)
  const filled   = Math.round(pct / 5)
  const barFill  = '█'.repeat(filled)
  const barEmpty = '░'.repeat(20 - filled)
  const visLines = BOOT_LINES.filter(l => pct >= l.at)

  return (
    <>
      {/* Keyframes injectées en style global */}
      <style>{`
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 6px rgba(51,255,136,0.3), 0 0 14px rgba(51,255,136,0.15); }
          50%       { box-shadow: 0 0 12px rgba(51,255,136,0.6), 0 0 28px rgba(51,255,136,0.3); }
        }
        @keyframes btn-appear {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanline {
          0%   { top: -30%; }
          100% { top: 110%; }
        }
      `}</style>

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

        {/* Bouton ou curseur */}
        {showButton ? (
          <div style={{
            marginTop:  24,
            animation:  'btn-appear 0.4s ease forwards',
          }}>
            {/* Label au-dessus */}
            <div style={{
              color:         DIM,
              fontSize:      11,
              letterSpacing: '0.2em',
              marginBottom:  8,
            }}>
              — SYSTEM READY —
            </div>

            <button
              onClick={handleClick}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              autoFocus
              style={{
                position:      'relative',
                overflow:      'hidden',
                background:    btnHover
                  ? 'rgba(51,255,136,0.07)'
                  : btnActive
                    ? 'rgba(51,255,136,0.18)'
                    : 'transparent',
                border:        `1px solid ${GREEN}`,
                color:         GREEN,
                fontFamily:    FONT,
                fontSize:      13,
                padding:       '8px 36px',
                cursor:        'pointer',
                letterSpacing: '0.3em',
                outline:       'none',
                animation:     'glow-pulse 2s ease-in-out infinite',
                transition:    'background 0.15s ease',
                textTransform: 'uppercase',
              }}
            >
              {/* Scanline animée au hover */}
              {btnHover && (
                <span style={{
                  position:   'absolute',
                  left:       0,
                  width:      '100%',
                  height:     '30%',
                  background: 'linear-gradient(transparent, rgba(51,255,136,0.07), transparent)',
                  animation:  'scanline 0.8s linear infinite',
                  pointerEvents: 'none',
                }} />
              )}
              ENTER{blink ? '_' : '\u00a0'}
            </button>
          </div>
        ) : (
          <div style={{ color: DIMMER, marginTop: 4, fontSize: 12 }}>
            {blink ? '▌' : '\u00a0'}
          </div>
        )}

      </div>
    </>
  )
}