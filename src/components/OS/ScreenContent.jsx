import { useState, useEffect, useRef } from 'react'

// ── Palette Commodore 64 ─────────────────────────────────────────────
const C = {
  bg:    '#0000AA',   // bleu C64
  text:  '#FFFFFF',
  cyan:  '#55FFFF',
  light: '#AAAAFF',
  amber: '#FFFF55',
}

// Séquence de boot BASIC V2
const BOOT = [
  { text: '    **** COMMODORE 64 BASIC V2 ****', color: C.cyan },
  { text: '' },
  { text: ' 64K RAM SYSTEM  38911 BASIC BYTES FREE' },
  { text: '' },
  { text: 'READY.' },
]

// ── ScreenContent ────────────────────────────────────────────────────
// Composant autonome — C64 BASIC avec curseur clignotant et saisie clavier.
// Conçu pour être rendu dans un <Html transform> React-Three-Fiber.
export function ScreenContent() {
  const [lines,     setLines]     = useState([])      // lignes affichées
  const [input,     setInput]     = useState('')       // saisie courante
  const [cursor,    setCursor]    = useState(true)     // clignotement
  const [booted,    setBooted]    = useState(false)    // boot terminé
  const scrollRef                 = useRef(null)

  // ── Boot : affichage ligne par ligne ─────────────────────────────
  useEffect(() => {
    let i = 0
    const tick = () => {
      if (i >= BOOT.length) { setBooted(true); return }
      const line = BOOT[i++]
      setLines(prev => [...prev, line])
      setTimeout(tick, i === 1 ? 80 : 160)
    }
    setTimeout(tick, 350)
  }, [])

  // ── Curseur clignotant 530 ms ─────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setCursor(v => !v), 530)
    return () => clearInterval(id)
  }, [])

  // ── Capture clavier (actif seulement quand booté) ─────────────────
  useEffect(() => {
    if (!booted) return
    const onKey = (e) => {
      if (e.key === 'Enter') {
        const cmd = input.trim().toUpperCase()
        setLines(prev => [...prev, { text: input.toUpperCase() || '' }])
        setInput('')
        if (cmd === 'LOAD') {
          setLines(prev => [...prev,
            { text: 'SEARCHING FOR "PORTFOLIO"...' },
          ])
          setTimeout(() => setLines(prev => [...prev,
            { text: '' },
            { text: 'LOADING...', color: C.amber },
            { text: '' },
          ]), 600)
          setTimeout(() => setLines(prev => [...prev,
            { text: 'READY.' },
          ]), 1600)
        } else if (cmd === 'RUN') {
          setLines(prev => [...prev,
            { text: '' },
            { text: '?SYNTAX ERROR  IN 10', color: C.amber },
            { text: '' },
            { text: 'READY.' },
          ])
        } else if (cmd !== '') {
          setLines(prev => [...prev,
            { text: '' },
            { text: '?SYNTAX ERROR', color: C.amber },
            { text: '' },
            { text: 'READY.' },
          ])
        } else {
          setLines(prev => [...prev, { text: '' }, { text: 'READY.' }])
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        setInput(prev => prev.slice(0, -1))
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setInput(prev => (prev + e.key).slice(0, 38))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [booted, input])

  // ── Auto-scroll vers le bas ───────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines, input])

  return (
    <div
      style={{
        width:      '100%',
        height:     '100%',
        background: C.bg,
        color:      C.text,
        fontFamily: '"Lucida Console", "Courier New", monospace',
        fontSize:   18,
        lineHeight: 1.45,
        boxSizing:  'border-box',
        overflow:   'hidden',
        userSelect: 'none',
        cursor:     'text',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Bordure CRT style C64 (marges claires simulant le bezel) */}
      <div
        ref={scrollRef}
        style={{
          width:      '100%',
          height:     '100%',
          padding:    '14px 18px',
          boxSizing:  'border-box',
          overflowY:  'auto',
          scrollbarWidth: 'none',
        }}
      >
        {/* Lignes bootées */}
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              color:      line.color ?? C.text,
              whiteSpace: 'pre',
              minHeight:  '1.45em',
            }}
          >
            {line.text}
          </div>
        ))}

        {/* Ligne de saisie avec curseur */}
        {booted && (
          <div style={{ whiteSpace: 'pre', color: C.text }}>
            {input.toUpperCase()}
            <span
              style={{
                display:         'inline-block',
                width:           '0.55em',
                height:          '1.1em',
                background:      cursor ? C.text : 'transparent',
                verticalAlign:   'text-bottom',
                marginLeft:      1,
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
