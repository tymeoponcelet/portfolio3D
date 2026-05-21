import { useState, useEffect } from 'react'
import { useProgress } from '@react-three/drei'

const FONT  = '"Courier New", Courier, monospace'
const WHITE = '#ffffff'
const DIM   = 'rgba(255,255,255,0.5)'

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
  const [visible,     setVisible]     = useState(true)
  const [fadeOut,     setFadeOut]     = useState(false)
  const [showButton,  setShowButton]  = useState(false)
  const [welcomeStep, setWelcomeStep] = useState(0)
  const [btnHover,    setBtnHover]    = useState(false)

  const isReady = !active && progress >= 99

  // Séquence d'animation de bienvenue
  useEffect(() => {
    if (!isReady) return
    const t1 = setTimeout(() => { setShowButton(true); setWelcomeStep(1) }, 600)
    const t2 = setTimeout(() => setWelcomeStep(2), 1400)
    const t3 = setTimeout(() => setWelcomeStep(3), 2200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [isReady])

  const handleClick = () => {
    onStart?.()
    setFadeOut(true)
    setTimeout(() => setVisible(false), 600)
  }

  if (!visible) return null

  const pct      = Math.round(progress)
  const filled   = Math.round(pct / 5)
  const bar      = '█'.repeat(filled) + '░'.repeat(20 - filled)
  const visLines = BOOT_LINES.filter(l => pct >= l.at)

  return (
    <>
      <style>{`
        @keyframes bios-blink {
          0%, 49%  { opacity: 1; }
          50%, 100%{ opacity: 0; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .bios-cursor {
          display: inline-block;
          width: 9px; height: 15px;
          background: #fff;
          animation: bios-blink 1.06s step-end infinite;
          vertical-align: middle;
          margin-left: 2px;
        }
        .fade-in-up {
          animation: fade-in-up 0.5s ease forwards;
        }
      `}</style>

      <div style={{
        position:      'fixed',
        inset:         0,
        zIndex:        9999,
        background:    '#000',
        color:         WHITE,
        fontFamily:    FONT,
        fontSize:      15,
        lineHeight:    1.65,
        letterSpacing: '0.04em',
        boxSizing:     'border-box',
        transition:    'opacity 0.6s ease',
        opacity:       fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}>

        {/* ── BOOT LOG ── */}
        {!showButton && (
          <div style={{
            width:          '100%',
            height:         '100%',
            display:        'flex',
            flexDirection:  'column',
            justifyContent: 'space-between',
            padding:        '32px 48px',
            boxSizing:      'border-box',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${DIM}`, paddingBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 17 }}>Poncelet, Tyméo Inc.</div>
                <div style={{ color: DIM, fontSize: 13 }}>PTBIOS (C){new Date().getFullYear()}</div>
              </div>
              <div style={{ textAlign: 'right', color: DIM, fontSize: 13 }}>Portfolio System v1.0</div>
            </div>

            {/* Log + barre */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 0' }}>
              <div style={{ marginBottom: 28 }}>
                {visLines.map((l, i) => (
                  <div key={i} style={{ color: i === visLines.length - 1 ? WHITE : DIM }}>
                    {i === visLines.length - 1 ? '> ' : '\u00a0\u00a0'}{l.text}
                    {i === visLines.length - 1 && !isReady && <span className="bios-cursor" />}
                  </div>
                ))}
              </div>
              <div style={{ color: WHITE }}>
                [{bar}]&nbsp;&nbsp;{pct}&nbsp;%
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${DIM}`, paddingTop: 12, height: 40 }} />
          </div>
        )}

        {/* ── ANIMATION BIENVENUE ── */}
        {showButton && (
          <div style={{
            width:          '100%',
            height:         '100%',
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        '0 48px',
            boxSizing:      'border-box',
          }}>

            {welcomeStep >= 1 && (
              <div className="fade-in-up" style={{
                color:         DIM,
                fontSize:      12,
                letterSpacing: '0.35em',
                textTransform: 'uppercase',
                marginBottom:  20,
              }}>
                — Bienvenue —
              </div>
            )}

            {welcomeStep >= 2 && (
              <div className="fade-in-up" style={{
                fontSize:      30,
                fontWeight:    'bold',
                letterSpacing: '0.06em',
                marginBottom:  52,
                textAlign:     'center',
              }}>
                Dans mon Portfolio 3D
                {welcomeStep < 3 && <span className="bios-cursor" style={{ marginLeft: 8 }} />}
              </div>
            )}

            {welcomeStep >= 3 && (
              <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{ color: DIM, fontSize: 12, letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Appuyez sur START pour continuer
                  <span className="bios-cursor" />
                </div>
                <button
                  onClick={handleClick}
                  onMouseEnter={() => setBtnHover(true)}
                  onMouseLeave={() => setBtnHover(false)}
                  autoFocus
                  style={{
                    background:    btnHover ? WHITE : 'transparent',
                    border:        `1px solid ${WHITE}`,
                    color:         btnHover ? '#000' : WHITE,
                    fontFamily:    FONT,
                    fontSize:      13,
                    padding:       '7px 52px',
                    cursor:        'pointer',
                    letterSpacing: '0.3em',
                    outline:       'none',
                    transition:    'background 0.1s, color 0.1s',
                    textTransform: 'uppercase',
                    marginTop:     8,
                  }}
                >
                  START
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </>
  )
}