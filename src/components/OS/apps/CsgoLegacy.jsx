import { useState, useRef, useEffect, useCallback } from 'react'

// ── Jeux embarquables (ordre de préférence) ────────────────────────────────
const GAMES = [
  {
    id:   'krunker',
    name: 'Krunker.io',
    desc: 'FPS multi — style CS:GO',
    url:  'https://krunker.io',
    tags: ['FPS','Multi','CS-like'],
  },
  {
    id:   'warbrokers',
    name: 'War Brokers',
    desc: 'FPS tactique navigateur',
    url:  'https://warbrokers.io',
    tags: ['FPS','Multi','Tactique'],
  },
  {
    id:   'venge',
    name: 'Venge.io',
    desc: 'FPS compétitif WebGL',
    url:  'https://venge.io',
    tags: ['FPS','Multi','WebGL'],
  },
  {
    id:   '1v1lol',
    name: '1v1.LOL',
    desc: 'Build & Shoot — style Fortnite',
    url:  'https://1v1.lol',
    tags: ['FPS','Build','Multi'],
  },
  {
    id:   'shellshock',
    name: 'Shell Shockers',
    desc: 'FPS décalé — œufs en guerre',
    url:  'https://shellshock.io',
    tags: ['FPS','Multi','Fun'],
  },
]

// ── Sound (Web Audio) ──────────────────────────────────────────────────────
let _actx = null
function audioCtx() {
  if (!_actx) { const C = window.AudioContext ?? window.webkitAudioContext; if (C) _actx = new C() }
  if (_actx?.state === 'suspended') _actx.resume()
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
function csClick() {
  try {
    const c = audioCtx(); if (!c) return
    const n = (c.sampleRate * 0.055) | 0
    const buf = c.createBuffer(1, n, c.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < n; i++) d[i] = (Math.random()*2-1) * Math.exp(-i/(n*0.2)) * 0.4
    const src = c.createBufferSource(), f = c.createBiquadFilter()
    f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = 1.5
    src.buffer = buf; src.connect(f); f.connect(c.destination); src.start()
  } catch (_) {}
}

// ══════════════════════════════════════════════════════════════════════════════
//  CS LOGO pixel art SVG
// ══════════════════════════════════════════════════════════════════════════════
function CsLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering:'pixelated', flexShrink:0 }}>
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

// ══════════════════════════════════════════════════════════════════════════════
//  GAME TAG
// ══════════════════════════════════════════════════════════════════════════════
function Tag({ label }) {
  return (
    <span style={{ background:'rgba(79,163,213,0.15)', border:'1px solid #4fa3d530', color:'#4fa3d5', fontSize:8, padding:'1px 5px', letterSpacing:1 }}>
      {label}
    </span>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  GAME ROW (launcher list)
// ══════════════════════════════════════════════════════════════════════════════
function GameRow({ game, isActive, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display:'flex', alignItems:'center', gap:10, width:'100%', textAlign:'left',
        padding:'7px 10px', border:'none', cursor:'pointer',
        background: isActive ? 'rgba(79,163,213,0.18)' : hover ? 'rgba(255,255,255,0.04)' : 'transparent',
        borderLeft: isActive ? '2px solid #4fa3d5' : '2px solid transparent',
        transition:'background 0.1s',
      }}
    >
      <div style={{ width:6, height:6, borderRadius:'50%', background: isActive?'#4fa3d5':'#2a3a4a', flexShrink:0 }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ color: isActive?'#c6d4df':'#8a9aaa', fontSize:11, fontWeight: isActive?'bold':'normal', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {game.name}
        </div>
        <div style={{ color:'#4a6070', fontSize:9, marginTop:1 }}>{game.desc}</div>
      </div>
      <div style={{ display:'flex', gap:3 }}>
        {game.tags.slice(0,2).map(t => <Tag key={t} label={t}/>)}
      </div>
    </button>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  IFRAME PLAYER
// ══════════════════════════════════════════════════════════════════════════════
function GameFrame({ game, onBack }) {
  const [state,  setState]  = useState('loading')  // loading | ok | blocked
  const iframeRef = useRef(null)
  const timerRef  = useRef(null)

  useEffect(() => {
    setState('loading')
    // Si le jeu ne charge pas en 8s → probablement bloqué
    timerRef.current = setTimeout(() => {
      // Tenter de lire le contenu (échoue si bloqué cross-origin)
      setState('blocked')
    }, 8000)
    return () => clearTimeout(timerRef.current)
  }, [game.url])

  const handleLoad = useCallback(() => {
    clearTimeout(timerRef.current)
    // Essai de lecture du contenu — si X-Frame-Options bloque, on ne peut pas
    try {
      const doc = iframeRef.current?.contentDocument
      // Si le document existe mais est vide → bloqué par le navigateur
      if (doc && doc.body && doc.body.innerHTML === '') {
        setState('blocked')
      } else {
        setState('ok')
      }
    } catch {
      // Cross-origin → on ne sait pas → on suppose que ça marche
      setState('ok')
    }
  }, [])

  const handleError = useCallback(() => {
    clearTimeout(timerRef.current)
    setState('blocked')
  }, [])

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', background:'#0a0c0f' }}>

      {/* Back button */}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:10, display:'flex', alignItems:'center', gap:8, padding:'3px 8px', background:'rgba(10,12,15,0.92)', borderBottom:'1px solid #1a2530' }}>
        <button
          onClick={onBack}
          style={{ background:'transparent', border:'1px solid #2a3a4a', color:'#8a9aaa', fontFamily:'"Courier New",monospace', fontSize:9, padding:'2px 8px', cursor:'pointer' }}
        >
          ← Retour
        </button>
        <CsLogo size={16}/>
        <span style={{ color:'#4fa3d5', fontSize:10, fontFamily:'"Courier New",monospace', letterSpacing:1 }}>{game.name}</span>
        <span style={{ color:'#4a6070', fontSize:9, marginLeft:'auto', fontFamily:'"Courier New",monospace' }}>{game.url}</span>
        <button
          onClick={() => window.open(game.url, '_blank')}
          style={{ background:'transparent', border:'1px solid #2a3a4a', color:'#c8a000', fontFamily:'"Courier New",monospace', fontSize:9, padding:'2px 8px', cursor:'pointer' }}
        >
          ↗ Plein écran
        </button>
      </div>

      {/* Loading overlay */}
      {state === 'loading' && (
        <div style={{ position:'absolute', inset:0, top:26, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0a0c0f', zIndex:5, fontFamily:'"Courier New",monospace' }}>
          <CsLogo size={42}/>
          <div style={{ color:'#4fa3d5', fontSize:11, marginTop:14, letterSpacing:2 }}>CHARGEMENT {game.name.toUpperCase()}…</div>
          <div style={{ width:200, height:3, background:'#1a2530', marginTop:12, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'linear-gradient(90deg,#1a6898,#4fa3d5)', animation:'csbar 1.4s ease-in-out infinite' }}/>
          </div>
          <style>{`@keyframes csbar{0%{width:0%;margin-left:0}50%{width:70%;margin-left:0}100%{width:0%;margin-left:100%}}`}</style>
          <div style={{ color:'#4a6070', fontSize:9, marginTop:10 }}>Connexion à {game.url}…</div>
        </div>
      )}

      {/* Blocked overlay */}
      {state === 'blocked' && (
        <div style={{ position:'absolute', inset:0, top:26, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0a0c0f', zIndex:5, fontFamily:'"Courier New",monospace', padding:20 }}>
          <div style={{ fontSize:28, marginBottom:12 }}>🛡️</div>
          <div style={{ color:'#f44', fontSize:12, fontWeight:'bold', letterSpacing:2, marginBottom:8 }}>CONNEXION BLOQUÉE</div>
          <div style={{ color:'#8a9aaa', fontSize:10, textAlign:'center', lineHeight:1.8, maxWidth:280 }}>
            <span style={{ color:'#c6d4df' }}>{game.name}</span> refuse d'être embarqué dans une iframe<br/>
            <span style={{ color:'#4a6070', fontSize:9 }}>(X-Frame-Options ou Content-Security-Policy)</span>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:20 }}>
            <button
              onClick={() => window.open(game.url, '_blank')}
              style={{ background:'transparent', border:'2px solid #4fa3d5', color:'#4fa3d5', fontFamily:'"Courier New",monospace', fontSize:10, padding:'8px 20px', cursor:'pointer', letterSpacing:2 }}
              onMouseEnter={e=>{e.target.style.background='#4fa3d5';e.target.style.color='#000'}}
              onMouseLeave={e=>{e.target.style.background='transparent';e.target.style.color='#4fa3d5'}}
            >
              ↗ OUVRIR DANS UN NOUVEL ONGLET
            </button>
            <button
              onClick={onBack}
              style={{ background:'transparent', border:'1px solid #2a3a4a', color:'#8a9aaa', fontFamily:'"Courier New",monospace', fontSize:10, padding:'8px 16px', cursor:'pointer' }}
            >
              ← Changer de jeu
            </button>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        src={game.url}
        title={game.name}
        onLoad={handleLoad}
        onError={handleError}
        sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals"
        allow="pointer-lock; fullscreen"
        style={{
          display:'block',
          width:'100%',
          height:'100%',
          paddingTop:26,
          boxSizing:'border-box',
          border:'none',
          opacity: state === 'ok' ? 1 : 0,
          transition:'opacity 0.3s',
        }}
      />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  LAUNCHER
// ══════════════════════════════════════════════════════════════════════════════
function Launcher({ onLaunch }) {
  const [selected, setSelected] = useState(GAMES[0])
  const [hover,    setHover]    = useState(false)

  const launch = () => { csClick(); onLaunch(selected) }

  return (
    <div style={{ background:'#1b2838', height:'100%', display:'flex', flexDirection:'column', fontFamily:'"Courier New",monospace', overflow:'hidden' }}>

      {/* ── Header ── */}
      <div style={{ position:'relative', height:80, background:'linear-gradient(135deg,#0e1821 0%,#192a3a 50%,#0a1520 100%)', flexShrink:0, display:'flex', alignItems:'center', padding:'0 14px', gap:12, overflow:'hidden' }}>
        <svg style={{ position:'absolute', inset:0, opacity:0.07, pointerEvents:'none' }} width="100%" height="80">
          {Array.from({length:12},(_,i)=><line key={i} x1={i*44} y1="0" x2={i*44} y2="80" stroke="#4fa3d5" strokeWidth="0.5"/>)}
          {Array.from({length:5}, (_,i)=><line key={`h${i}`} x1="0" y1={i*20} x2="600" y2={i*20} stroke="#4fa3d5" strokeWidth="0.5"/>)}
        </svg>
        <CsLogo size={52}/>
        <div>
          <div style={{ color:'#c6d4df', fontSize:14, fontWeight:'bold', letterSpacing:3 }}>COUNTER-STRIKE</div>
          <div style={{ color:'#c8a000', fontSize:8, letterSpacing:5, marginTop:2 }}>GAME LIBRARY</div>
          <div style={{ color:'#4a6070', fontSize:8, marginTop:4 }}>5 jeux FPS disponibles</div>
        </div>
        <div style={{ marginLeft:'auto', textAlign:'right' }}>
          <div style={{ color:'#4fa3d5', fontSize:8, letterSpacing:1 }}>SÉLECTIONNÉ</div>
          <div style={{ color:'#c6d4df', fontSize:10, fontWeight:'bold', marginTop:2 }}>{selected.name}</div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Game list */}
        <div style={{ width:220, borderRight:'1px solid #2a3540', display:'flex', flexDirection:'column', overflowY:'auto' }}>
          <div style={{ padding:'8px 10px 4px', color:'#4a6070', fontSize:8, letterSpacing:2, borderBottom:'1px solid #1a2530' }}>
            BIBLIOTHÈQUE DE JEUX
          </div>
          {GAMES.map(g => (
            <GameRow
              key={g.id}
              game={g}
              isActive={selected.id === g.id}
              onClick={() => { beep(500+GAMES.indexOf(g)*60, 0.05); setSelected(g) }}
            />
          ))}
        </div>

        {/* Game detail */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', padding:14, gap:12, overflow:'hidden' }}>

          {/* Title + play */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
            <div>
              <div style={{ color:'#c6d4df', fontSize:14, fontWeight:'bold', letterSpacing:2 }}>{selected.name}</div>
              <div style={{ color:'#8a9aaa', fontSize:10, marginTop:3 }}>{selected.desc}</div>
              <div style={{ display:'flex', gap:4, marginTop:6 }}>
                {selected.tags.map(t => <Tag key={t} label={t}/>)}
              </div>
            </div>
            <button
              onClick={launch}
              onMouseEnter={() => { setHover(true); beep(660,0.06) }}
              onMouseLeave={() => setHover(false)}
              style={{
                background: hover ? 'linear-gradient(180deg,#4fa3d5,#1a6898)' : 'linear-gradient(180deg,#1a6898,#0e4060)',
                border:'1px solid #4fa3d5', color:'#fff',
                fontFamily:'"Courier New",monospace', fontSize:12, fontWeight:'bold',
                padding:'10px 22px', cursor:'pointer', letterSpacing:3, flexShrink:0,
                boxShadow: hover ? '0 0 14px #4fa3d540' : 'none',
                transition:'all 0.1s',
              }}
            >
              ▶ JOUER
            </button>
          </div>

          {/* Info box */}
          <div style={{ background:'#16202d', border:'1px solid #2a3540', padding:'10px 12px' }}>
            <div style={{ color:'#4a6070', fontSize:8, letterSpacing:2, marginBottom:6 }}>INFORMATIONS</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 12px' }}>
              {[
                ['URL',      selected.url],
                ['Type',     selected.tags[0]],
                ['Mode',     selected.tags[1] ?? '—'],
                ['Moteur',   'WebGL / Browser'],
                ['Réseau',   'Multijoueur en ligne'],
                ['Note',     'Nécessite un compte'],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid #1a2530', padding:'2px 0' }}>
                  <span style={{ color:'#4a6070', fontSize:9 }}>{k}</span>
                  <span style={{ color:'#8a9aaa', fontSize:9, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:100 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div style={{ background:'rgba(200,160,0,0.08)', border:'1px solid #c8a00030', padding:'8px 10px', display:'flex', gap:8, alignItems:'flex-start' }}>
            <span style={{ color:'#c8a000', fontSize:12, lineHeight:1, flexShrink:0 }}>⚠</span>
            <div style={{ color:'#8a9070', fontSize:9, lineHeight:1.6 }}>
              Certains sites refusent d'être embarqués dans une iframe pour des raisons de sécurité.<br/>
              Si le jeu ne s'affiche pas, cliquez <span style={{ color:'#c8a000' }}>↗ Plein écran</span> pour l'ouvrir dans un nouvel onglet.
            </div>
          </div>

          {/* URL bar preview */}
          <div style={{ marginTop:'auto', background:'#0e1520', border:'1px solid #1a2530', padding:'4px 8px', display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ color:'#4a6070', fontSize:9 }}>🔒</span>
            <span style={{ color:'#4fa3d5', fontSize:9, fontFamily:'"Courier New",monospace' }}>{selected.url}</span>
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

  if (activeGame) return <GameFrame game={activeGame} onBack={() => setActiveGame(null)} />
  return <Launcher onLaunch={setActiveGame} />
}
