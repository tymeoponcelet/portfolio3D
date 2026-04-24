import { useState, useEffect, useRef, useCallback } from 'react'

// ── Jeux ──────────────────────────────────────────────────────────────────
const GAMES = [
  { id: 'krunker',    name: 'Krunker.io',      desc: 'FPS multi — style CS:GO',       url: 'https://krunker.io',      tags: ['FPS', 'CS-like', 'Multi'] },
  { id: 'venge',      name: 'Venge.io',         desc: 'FPS compétitif WebGL',          url: 'https://venge.io',        tags: ['FPS', 'WebGL', 'Multi']   },
  { id: 'warbrokers', name: 'War Brokers',       desc: 'FPS tactique navigateur',       url: 'https://warbrokers.io',   tags: ['FPS', 'Tactique', 'Multi'] },
  { id: 'shellshock', name: 'Shell Shockers',    desc: 'FPS fun — œufs en guerre',      url: 'https://shellshock.io',   tags: ['FPS', 'Fun', 'Multi']     },
]

// ── Taille popup ───────────────────────────────────────────────────────────
const PW = 1280, PH = 720

// ── Son ────────────────────────────────────────────────────────────────────
let _actx = null
function audioCtx() {
  if (!_actx) { const C = window.AudioContext ?? window.webkitAudioContext; if (C) _actx = new C() }
  _actx?.state === 'suspended' && _actx.resume(); return _actx ?? null
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
      <circle cx="16" cy="16" r="8" fill="none" stroke="#c8a000" strokeWidth="0.8"/>
      <line x1="16" y1="3" x2="16" y2="10" stroke="#c8a000" strokeWidth="2.5"/>
      <line x1="16" y1="22" x2="16" y2="29" stroke="#c8a000" strokeWidth="2.5"/>
      <line x1="3" y1="16" x2="10" y2="16" stroke="#c8a000" strokeWidth="2.5"/>
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
//  ÉCRAN "EN JEU" — affiché pendant que la popup tourne
// ══════════════════════════════════════════════════════════════════════════════
function InGameScreen({ game, onReturn }) {
  const [dots, setDots] = useState('.')
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const iv1 = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500)
    const iv2 = setInterval(() => setElapsed(t => t + 1), 1000)
    return () => { clearInterval(iv1); clearInterval(iv2) }
  }, [])

  const fmt = (s) => `${String((s/60)|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  return (
    <div style={{ background: '#0a0c10', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New",monospace', userSelect: 'none' }}>

      {/* Animated "in game" indicator */}
      <div style={{ position: 'relative', marginBottom: 28 }}>
        <CsLogo size={64}/>
        <div style={{ position: 'absolute', bottom: -8, right: -8, width: 18, height: 18, borderRadius: '50%', background: '#4ade80', border: '2px solid #0a0c10', animation: 'pulse 1.5s ease-in-out infinite' }}/>
        <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.2)}}`}</style>
      </div>

      <div style={{ color: '#4ade80', fontSize: 13, fontWeight: 'bold', letterSpacing: 3, marginBottom: 4 }}>
        EN JEU{dots}
      </div>
      <div style={{ color: '#4fa3d5', fontSize: 11, letterSpacing: 2, marginBottom: 20 }}>
        {game.name.toUpperCase()}
      </div>

      {/* Timer */}
      <div style={{ color: '#4a6070', fontSize: 10, marginBottom: 32 }}>
        Durée de session : <span style={{ color: '#8a9aaa' }}>{fmt(elapsed)}</span>
      </div>

      {/* Fake scoreboard */}
      <div style={{ background: '#12181f', border: '1px solid #1a2530', padding: '10px 20px', marginBottom: 28, minWidth: 220 }}>
        <div style={{ color: '#4a6070', fontSize: 8, letterSpacing: 2, marginBottom: 8 }}>FENÊTRE DE JEU ACTIVE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }}/>
          <span style={{ color: '#c6d4df', fontSize: 10 }}>Popup ouverte • Pointer lock disponible</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4fa3d5' }}/>
          <span style={{ color: '#8a9aaa', fontSize: 10 }}>{game.url}</span>
        </div>
      </div>

      {/* Return button */}
      <button
        onClick={onReturn}
        style={{
          background: 'transparent', border: '1px solid #2a3a4a', color: '#8a9aaa',
          fontFamily: '"Courier New",monospace', fontSize: 10, padding: '8px 24px',
          cursor: 'pointer', letterSpacing: 2,
        }}
        onMouseEnter={e => { e.target.style.borderColor = '#4fa3d5'; e.target.style.color = '#4fa3d5' }}
        onMouseLeave={e => { e.target.style.borderColor = '#2a3a4a'; e.target.style.color = '#8a9aaa' }}
      >
        ← RETOUR AU BUREAU
      </button>
      <div style={{ color: '#2a3a4a', fontSize: 8, marginTop: 8 }}>La fenêtre de jeu restera ouverte</div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  ÉCRAN "POPUP BLOQUÉE"
// ══════════════════════════════════════════════════════════════════════════════
function BlockedScreen({ game, onBack }) {
  return (
    <div style={{ background: '#0a0c10', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New",monospace', padding: 20 }}>
      <div style={{ fontSize: 32, marginBottom: 14 }}>🚫</div>
      <div style={{ color: '#f87171', fontSize: 12, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 }}>POPUP BLOQUÉE</div>
      <div style={{ color: '#8a9aaa', fontSize: 10, textAlign: 'center', lineHeight: 1.8, maxWidth: 300, marginBottom: 24 }}>
        Votre navigateur a bloqué la fenêtre de jeu.<br/>
        <span style={{ color: '#c8a000' }}>Autorisez les popups</span> pour ce site dans la barre d'adresse,<br/>
        puis relancez.
      </div>

      {/* Manual link */}
      <a
        href={game.url}
        target="_blank"
        rel="noreferrer"
        style={{ display: 'inline-block', marginBottom: 16, background: 'transparent', border: '2px solid #4fa3d5', color: '#4fa3d5', fontFamily: '"Courier New",monospace', fontSize: 11, padding: '9px 22px', cursor: 'pointer', letterSpacing: 2, textDecoration: 'none' }}
        onMouseEnter={e => { e.target.style.background = '#4fa3d5'; e.target.style.color = '#000' }}
        onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#4fa3d5' }}
      >
        ↗ OUVRIR MANUELLEMENT
      </a>

      <button
        onClick={onBack}
        style={{ background: 'transparent', border: '1px solid #2a3a4a', color: '#4a6070', fontFamily: '"Courier New",monospace', fontSize: 10, padding: '6px 18px', cursor: 'pointer' }}
      >
        ← Retour
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  LAUNCHER
// ══════════════════════════════════════════════════════════════════════════════
function Launcher({ onLaunch }) {
  const [selected, setSelected] = useState(GAMES[0])
  const [hover,    setHover]    = useState(false)

  return (
    <div style={{ background: '#1b2838', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: '"Courier New",monospace', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ position: 'relative', height: 80, background: 'linear-gradient(135deg,#0e1821 0%,#192a3a 50%,#0a1520 100%)', flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12, overflow: 'hidden' }}>
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none' }} width="100%" height="80">
          {Array.from({ length: 14 }, (_, i) => <line key={i} x1={i*44} y1="0" x2={i*44} y2="80" stroke="#4fa3d5" strokeWidth="0.5"/>)}
          {Array.from({ length: 5 }, (_, i) => <line key={`h${i}`} x1="0" y1={i*20} x2="640" y2={i*20} stroke="#4fa3d5" strokeWidth="0.5"/>)}
        </svg>
        <CsLogo size={52}/>
        <div>
          <div style={{ color: '#c6d4df', fontSize: 14, fontWeight: 'bold', letterSpacing: 3 }}>FPS GAME LIBRARY</div>
          <div style={{ color: '#c8a000', fontSize: 8, letterSpacing: 5, marginTop: 2 }}>BROWSER GAMES</div>
          <div style={{ color: '#4a6070', fontSize: 8, marginTop: 4 }}>{GAMES.length} jeux disponibles</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ color: '#4fa3d5', fontSize: 8, letterSpacing: 1 }}>SÉLECTIONNÉ</div>
          <div style={{ color: '#c6d4df', fontSize: 10, fontWeight: 'bold', marginTop: 2 }}>{selected.name}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* List */}
        <div style={{ width: 195, borderRight: '1px solid #2a3540', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '6px 10px 4px', color: '#4a6070', fontSize: 8, letterSpacing: 2, borderBottom: '1px solid #1a2530', flexShrink: 0 }}>
            BIBLIOTHÈQUE
          </div>
          {GAMES.map((g, idx) => {
            const active = selected.id === g.id
            return (
              <button
                key={g.id}
                onClick={() => { beep(480 + idx*55, 0.05); setSelected(g) }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none', cursor: 'pointer', background: active ? 'rgba(79,163,213,0.15)' : 'transparent', borderLeft: `2px solid ${active ? '#4fa3d5' : 'transparent'}` }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#4fa3d5' : '#2a3a4a', flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: active ? '#c6d4df' : '#8a9aaa', fontSize: 11, fontWeight: active ? 'bold' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
                  <div style={{ color: '#4a6070', fontSize: 9, marginTop: 1 }}>{g.desc}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Detail */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 14, gap: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ color: '#c6d4df', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 }}>{selected.name}</div>
              <div style={{ color: '#8a9aaa', fontSize: 10, marginTop: 3 }}>{selected.desc}</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                {selected.tags.map(t => <Tag key={t} label={t}/>)}
              </div>
            </div>
            <button
              onClick={() => { beep(880, 0.08); onLaunch(selected) }}
              onMouseEnter={() => { setHover(true); beep(660, 0.05) }}
              onMouseLeave={() => setHover(false)}
              style={{
                background: hover ? 'linear-gradient(180deg,#4fa3d5,#1a6898)' : 'linear-gradient(180deg,#1a6898,#0e4060)',
                border: '1px solid #4fa3d5', color: '#fff',
                fontFamily: '"Courier New",monospace', fontSize: 12, fontWeight: 'bold',
                padding: '10px 22px', cursor: 'pointer', letterSpacing: 3, flexShrink: 0,
                boxShadow: hover ? '0 0 14px #4fa3d540' : 'none', transition: 'all 0.1s',
              }}
            >
              ▶ JOUER
            </button>
          </div>

          {/* Info */}
          <div style={{ background: '#16202d', border: '1px solid #2a3540', padding: '10px 12px' }}>
            <div style={{ color: '#4a6070', fontSize: 8, letterSpacing: 2, marginBottom: 6 }}>INFORMATIONS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
              {[['URL', selected.url], ['Type', selected.tags[0]], ['Mode', selected.tags[1]], ['Moteur', 'WebGL / Browser'], ['Réseau', 'Multijoueur en ligne']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a2530', padding: '2px 0' }}>
                  <span style={{ color: '#4a6070', fontSize: 9 }}>{k}</span>
                  <span style={{ color: '#8a9aaa', fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div style={{ background: 'rgba(79,163,213,0.07)', border: '1px solid #4fa3d520', padding: '8px 10px', display: 'flex', gap: 8 }}>
            <span style={{ color: '#4fa3d5', fontSize: 14, flexShrink: 0, lineHeight: 1 }}>ℹ</span>
            <div style={{ color: '#607888', fontSize: 9, lineHeight: 1.7 }}>
              Le jeu s'ouvre dans une <span style={{ color: '#c6d4df' }}>fenêtre dédiée</span> du navigateur<br/>
              (comme un vrai lanceur de jeux). Le pointer lock et la<br/>
              souris fonctionnent parfaitement sans interférence.
            </div>
          </div>

          <div style={{ marginTop: 'auto', background: '#0e1520', border: '1px solid #1a2530', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#4a6070', fontSize: 9 }}>🔒</span>
            <span style={{ color: '#4fa3d5', fontSize: 9 }}>{selected.url}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  ROOT — ouvre le jeu dans une popup navigateur native
// ══════════════════════════════════════════════════════════════════════════════
export function CsgoLegacy() {
  const [screen,  setScreen]  = useState('launcher')  // launcher | ingame | blocked
  const [game,    setGame]    = useState(null)
  const popupRef = useRef(null)

  const launch = useCallback((selected) => {
    setGame(selected)
    const left = Math.round((screen.width  - PW) / 2)
    const top  = Math.round((screen.height - PH) / 2)
    const popup = window.open(
      selected.url,
      `game_${selected.id}`,
      `width=${PW},height=${PH},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no`
    )
    if (!popup || popup.closed) {
      setScreen('blocked')
    } else {
      popupRef.current = popup
      setScreen('ingame')
      // Détecte si la popup est fermée → retour au launcher
      const iv = setInterval(() => {
        if (popup.closed) { clearInterval(iv); setScreen('launcher'); popupRef.current = null }
      }, 800)
    }
  }, [])

  const handleReturn = useCallback(() => {
    setScreen('launcher')
  }, [])

  if (screen === 'ingame')  return <InGameScreen game={game} onReturn={handleReturn}/>
  if (screen === 'blocked') return <BlockedScreen game={game} onBack={() => setScreen('launcher')}/>
  return <Launcher onLaunch={launch}/>
}
