import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

// ── Jeux embarquables (1v1.lol retiré — bloque les iframes) ───────────────
const GAMES = [
  {
    id:   'krunker',
    name: 'Krunker.io',
    desc: 'FPS multi — style CS:GO',
    url:  'https://krunker.io',
    tags: ['FPS', 'Multi', 'CS-like'],
  },
  {
    id:   'venge',
    name: 'Venge.io',
    desc: 'FPS compétitif WebGL',
    url:  'https://venge.io',
    tags: ['FPS', 'Multi', 'WebGL'],
  },
  {
    id:   'warbrokers',
    name: 'War Brokers',
    desc: 'FPS tactique navigateur',
    url:  'https://warbrokers.io',
    tags: ['FPS', 'Multi', 'Tactique'],
  },
  {
    id:   'shellshock',
    name: 'Shell Shockers',
    desc: 'FPS décalé — œufs en guerre',
    url:  'https://shellshock.io',
    tags: ['FPS', 'Multi', 'Fun'],
  },
]

// ── Son ────────────────────────────────────────────────────────────────────
let _actx = null
function audioCtx() {
  if (!_actx) { const C = window.AudioContext ?? window.webkitAudioContext; if (C) _actx = new C() }
  _actx?.state === 'suspended' && _actx.resume()
  return _actx ?? null
}
function beep(freq = 660, dur = 0.07, vol = 0.15) {
  try {
    const c = audioCtx(); if (!c) return
    const o = c.createOscillator(), g = c.createGain()
    o.connect(g); g.connect(c.destination)
    o.frequency.value = freq
    g.gain.setValueAtTime(vol, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur)
    o.start(); o.stop(c.currentTime + dur)
  } catch (_) {}
}

// ── Logo ───────────────────────────────────────────────────────────────────
function CsLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated', flexShrink: 0 }}>
      <rect width="32" height="32" fill="#1a1f2e"/>
      <circle cx="16" cy="16" r="13" fill="none" stroke="#c8a000" strokeWidth="2"/>
      <circle cx="16" cy="16" r="8"  fill="none" stroke="#c8a000" strokeWidth="0.8"/>
      <line x1="16" y1="3"  x2="16" y2="10" stroke="#c8a000" strokeWidth="2.5"/>
      <line x1="16" y1="22" x2="16" y2="29" stroke="#c8a000" strokeWidth="2.5"/>
      <line x1="3"  y1="16" x2="10" y2="16" stroke="#c8a000" strokeWidth="2.5"/>
      <line x1="22" y1="16" x2="29" y2="16" stroke="#c8a000" strokeWidth="2.5"/>
      <rect x="12" y="14" width="11" height="3.5" rx="0.5" fill="#c8a000"/>
      <rect x="20" y="11.5" width="4.5" height="6" rx="0.5" fill="#c8a000"/>
      <rect x="21" y="17.5" width="2.5" height="4" rx="0.5" fill="#c8a000"/>
    </svg>
  )
}

function Tag({ label }) {
  return (
    <span style={{ background: 'rgba(79,163,213,0.15)', border: '1px solid #4fa3d530', color: '#4fa3d5', fontSize: 8, padding: '1px 5px', letterSpacing: 1 }}>
      {label}
    </span>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  THEATER — iframe rendu sur document.body via createPortal
//  ↳ Évite totalement le contexte CSS3D de Three.js → pointer lock correct
// ══════════════════════════════════════════════════════════════════════════════
function GameTheater({ game, onClose }) {
  const [locked, setLocked] = useState(false)

  // Ferme si ESC ET pointer lock déjà relâché (évite de fermer pendant le jeu)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && document.pointerLockElement === null) {
        // Délai court : le jeu relâche le lock avant cet event
        setTimeout(() => {
          if (document.pointerLockElement === null) onClose()
        }, 120)
      }
    }
    const onLock = () => setLocked(!!document.pointerLockElement)
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerlockchange', onLock)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerlockchange', onLock)
    }
  }, [onClose])

  const theater = (
    <div
      style={{
        position: 'fixed', inset: 0,
        zIndex: 2147483647,           // maximum possible
        background: '#000',
        display: 'flex', flexDirection: 'column',
        fontFamily: '"Courier New", monospace',
      }}
    >
      {/* ── Barre de navigation (se cache quand pointer lock actif) ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '4px 10px',
          background: 'rgba(10,12,15,0.95)',
          borderBottom: '1px solid #1a2530',
          flexShrink: 0,
          opacity: locked ? 0 : 1,
          transition: 'opacity 0.3s',
          pointerEvents: locked ? 'none' : 'auto',
        }}
      >
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: '1px solid #2a3a4a', color: '#c6d4df', fontFamily: '"Courier New",monospace', fontSize: 10, padding: '3px 10px', cursor: 'pointer' }}
        >
          ✕ Quitter
        </button>
        <CsLogo size={18}/>
        <span style={{ color: '#4fa3d5', fontSize: 11, letterSpacing: 1 }}>{game.name}</span>
        <span style={{ color: '#4a6070', fontSize: 9, marginLeft: 'auto' }}>
          ESC deux fois → quitter · Pointer lock : {locked ? '🟢 actif' : '⚪ inactif'}
        </span>
      </div>

      {/* ── Iframe HORS du contexte CSS3D → pointer lock natif ── */}
      <iframe
        src={game.url}
        title={game.name}
        sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads"
        allow="pointer-lock *; fullscreen *; autoplay *"
        style={{ flex: 1, border: 'none', display: 'block' }}
      />
    </div>
  )

  // createPortal → rendu direct sur document.body, hors Three.js/CSS3D
  return createPortal(theater, document.body)
}

// ══════════════════════════════════════════════════════════════════════════════
//  LAUNCHER
// ══════════════════════════════════════════════════════════════════════════════
function Launcher({ onLaunch }) {
  const [selected, setSelected] = useState(GAMES[0])
  const [hover,    setHover]    = useState(false)

  const launch = useCallback(() => { beep(880, 0.08); onLaunch(selected) }, [selected, onLaunch])

  return (
    <div style={{ background: '#1b2838', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: '"Courier New",monospace', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ position: 'relative', height: 80, background: 'linear-gradient(135deg,#0e1821 0%,#192a3a 50%,#0a1520 100%)', flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12, overflow: 'hidden' }}>
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none' }} width="100%" height="80">
          {Array.from({ length: 14 }, (_, i) => <line key={i} x1={i*44} y1="0" x2={i*44} y2="80" stroke="#4fa3d5" strokeWidth="0.5"/>)}
          {Array.from({ length: 5  }, (_, i) => <line key={`h${i}`} x1="0" y1={i*20} x2="640" y2={i*20} stroke="#4fa3d5" strokeWidth="0.5"/>)}
        </svg>
        <CsLogo size={52}/>
        <div>
          <div style={{ color: '#c6d4df', fontSize: 14, fontWeight: 'bold', letterSpacing: 3 }}>FPS GAME LIBRARY</div>
          <div style={{ color: '#c8a000', fontSize: 8, letterSpacing: 5, marginTop: 2 }}>OPEN-SOURCE &amp; BROWSER</div>
          <div style={{ color: '#4a6070', fontSize: 8, marginTop: 4 }}>{GAMES.length} jeux disponibles</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ color: '#4fa3d5', fontSize: 8, letterSpacing: 1 }}>SÉLECTIONNÉ</div>
          <div style={{ color: '#c6d4df', fontSize: 10, fontWeight: 'bold', marginTop: 2 }}>{selected.name}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Game list */}
        <div style={{ width: 200, borderRight: '1px solid #2a3540', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '6px 10px 4px', color: '#4a6070', fontSize: 8, letterSpacing: 2, borderBottom: '1px solid #1a2530', flexShrink: 0 }}>
            BIBLIOTHÈQUE
          </div>
          {GAMES.map((g, idx) => {
            const isActive = selected.id === g.id
            return (
              <button
                key={g.id}
                onClick={() => { beep(500 + idx*55, 0.05); setSelected(g) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                  padding: '8px 10px', border: 'none', cursor: 'pointer',
                  background: isActive ? 'rgba(79,163,213,0.15)' : 'transparent',
                  borderLeft: `2px solid ${isActive ? '#4fa3d5' : 'transparent'}`,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#4fa3d5' : '#2a3a4a', flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: isActive ? '#c6d4df' : '#8a9aaa', fontSize: 11, fontWeight: isActive ? 'bold' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {g.name}
                  </div>
                  <div style={{ color: '#4a6070', fontSize: 9, marginTop: 1 }}>{g.desc}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Detail */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 14, gap: 12, overflow: 'hidden' }}>

          {/* Title + play */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ color: '#c6d4df', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 }}>{selected.name}</div>
              <div style={{ color: '#8a9aaa', fontSize: 10, marginTop: 3 }}>{selected.desc}</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                {selected.tags.map(t => <Tag key={t} label={t}/>)}
              </div>
            </div>
            <button
              onClick={launch}
              onMouseEnter={() => { setHover(true); beep(660,0.05) }}
              onMouseLeave={() => setHover(false)}
              style={{
                background: hover ? 'linear-gradient(180deg,#4fa3d5,#1a6898)' : 'linear-gradient(180deg,#1a6898,#0e4060)',
                border: '1px solid #4fa3d5', color: '#fff',
                fontFamily: '"Courier New",monospace', fontSize: 12, fontWeight: 'bold',
                padding: '10px 22px', cursor: 'pointer', letterSpacing: 3, flexShrink: 0,
                boxShadow: hover ? '0 0 14px #4fa3d540' : 'none',
                transition: 'all 0.1s',
              }}
            >
              ▶ JOUER
            </button>
          </div>

          {/* Info */}
          <div style={{ background: '#16202d', border: '1px solid #2a3540', padding: '10px 12px' }}>
            <div style={{ color: '#4a6070', fontSize: 8, letterSpacing: 2, marginBottom: 6 }}>INFORMATIONS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
              {[
                ['URL',     selected.url],
                ['Type',    selected.tags[0]],
                ['Mode',    selected.tags[1] ?? '—'],
                ['Moteur',  'WebGL / Browser'],
                ['Réseau',  'Multijoueur en ligne'],
              ].map(([k,v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a2530', padding: '2px 0' }}>
                  <span style={{ color: '#4a6070', fontSize: 9 }}>{k}</span>
                  <span style={{ color: '#8a9aaa', fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech note */}
          <div style={{ background: 'rgba(79,163,213,0.07)', border: '1px solid #4fa3d520', padding: '8px 10px', display: 'flex', gap: 8 }}>
            <span style={{ color: '#4fa3d5', fontSize: 13, flexShrink: 0 }}>ℹ</span>
            <div style={{ color: '#607888', fontSize: 9, lineHeight: 1.7 }}>
              Le jeu s'ouvre en <span style={{ color: '#c6d4df' }}>plein écran natif</span> au-dessus du bureau virtuel.<br/>
              La caméra et le pointer lock fonctionnent sans interférence 3D.<br/>
              <span style={{ color: '#c8a000' }}>ESC</span> (relâche la souris) puis à nouveau <span style={{ color: '#c8a000' }}>ESC</span> ou le bouton <span style={{ color: '#c8a000' }}>✕ Quitter</span> pour revenir.
            </div>
          </div>

          {/* URL bar */}
          <div style={{ marginTop: 'auto', background: '#0e1520', border: '1px solid #1a2530', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#4a6070', fontSize: 9 }}>🔒</span>
            <span style={{ color: '#4fa3d5', fontSize: 9, fontFamily: '"Courier New",monospace' }}>{selected.url}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  ROOT
// ══════════════════════════════════════════════════════════════════════════════
export function CsgoLegacy() {
  const [activeGame, setActiveGame] = useState(null)

  return (
    <>
      <Launcher onLaunch={setActiveGame}/>
      {activeGame && (
        <GameTheater game={activeGame} onClose={() => setActiveGame(null)}/>
      )}
    </>
  )
}
