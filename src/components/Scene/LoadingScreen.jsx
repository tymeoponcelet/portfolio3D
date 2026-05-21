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

const getCurrentDate = () => {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${d.getFullYear()}`
}

export function LoadingScreen({ onStart }) {
  const { progress, active } = useProgress()
  const [visible,    setVisible]    = useState(true)
  const [fadeOut,    setFadeOut]    = useState(false)
  const [blink,      setBlink]      = useState(true)
  const [showButton, setShowButton] = useState(false)
  const [btnHover,   setBtnHover]   = useState(false)

  const isReady = !active && progress >= 99

  useEffect(() => {
    const id = setInterval(() => setBlink(b => !b), 530)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!isReady) return
    const id = setTimeout(() => setShowButton(true), 800)
    return () => clearTimeout(id)
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
        @keyframes btn-appear {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bios-blink {
          0%, 49%  { opacity: 1; }
          50%, 100%{ opacity: 0; }
        }
        .bios-cursor {
          display: inline-block;
          width: 9px; height: 15px;
          background: #fff;
          animation: bios-blink 1.06s step-end infinite;
          vertical-align: middle;
          margin-left: 2px;
        }
      `}</style>

      {/* ── FOND / BOOT LOG ── */}
      <div style={{
        position:       'fixed',
        inset:          0,
        zIndex:         9999,
        background:     '#000',
        color:          WHITE,
        fontFamily:     FONT,
        fontSize:       15,
        lineHeight:     1.65,
        letterSpacing:  '0.04em',
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'space-between',
        padding:        '32px 48px',
        boxSizing:      'border-box',
        transition:     'opacity 0.6s ease',
        opacity:        fadeOut ? 0 : 1,
        pointerEvents:  fadeOut ? 'none' : 'auto',
      }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${DIM}`, paddingBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 17 }}>Poncelet, Tyméo Inc.</div>
            <div style={{ color: DIM, fontSize: 13 }}>PTBIOS (C){new Date().getFullYear()}</div>
          </div>
          <div style={{ textAlign: 'right', color: DIM, fontSize: 13 }}>
            <div>Released: 01/01/2025</div>
            <div>Portfolio System v1.0</div>
          </div>
        </div>

        {/* BOOT LOG */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 0' }}>
          <div style={{ marginBottom: 28 }}>
            {visLines.map((l, i) => (
              <div key={i} style={{ color: i === visLines.length - 1 ? WHITE : DIM }}>
                {i === visLines.length - 1 ? '> ' : '\u00a0\u00a0'}{l.text}
                {i === visLines.length - 1 && !isReady && <span className="bios-cursor" />}
              </div>
            ))}
          </div>

          {/* Barre — masquée quand le bouton apparaît */}
          {!showButton && (
            <div style={{ color: WHITE, fontFamily: FONT }}>
              [{bar}]&nbsp;&nbsp;{pct}&nbsp;%
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ borderTop: `1px solid ${DIM}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between', color: DIM, fontSize: 13 }}>
          <div>
            Press <b style={{ color: WHITE }}>DEL</b> to enter SETUP ,{' '}
            <b style={{ color: WHITE }}>ESC</b> to skip memory test
          </div>
          <div>{getCurrentDate()}</div>
        </div>

      </div>

      {/* ── POPUP START ── */}
      {showButton && (
        <div style={{
          position:       'fixed',
          inset:          0,
          zIndex:         10000,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          animation:      'btn-appear 0.4s ease forwards',
        }}>
          <div style={{
            background:    '#000',
            border:        `1px solid rgba(255,255,255,0.3)`,
            outline:       `1px solid rgba(255,255,255,0.08)`,
            padding:       '36px 52px',
            maxWidth:      420,
            width:         '100%',
            fontFamily:    FONT,
            color:         WHITE,
            fontSize:      14,
            lineHeight:    1.8,
            display:       'flex',
            flexDirection: 'column',
            gap:           16,
          }}>

            {/* Ligne titre */}
            <div style={{ borderBottom: `1px solid ${DIM}`, paddingBottom: 12, color: DIM, fontSize: 12, letterSpacing: '0.15em' }}>
              PORTFOLIO SYSTEM v1.0 — READY
            </div>

            <div>Poncelet Tyméo &mdash; Portfolio 3D</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: DIM, fontSize: 13 }}>
              <span>Appuyez sur START pour lancer</span>
              <span className="bios-cursor" />
            </div>

            {/* Bouton */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 8 }}>
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
                  padding:       '5px 32px',
                  cursor:        'pointer',
                  letterSpacing: '0.25em',
                  outline:       'none',
                  transition:    'background 0.1s, color 0.1s',
                  textTransform: 'uppercase',
                }}
              >
                START
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}