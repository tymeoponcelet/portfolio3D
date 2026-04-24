import { useState, useEffect, useRef, useCallback } from 'react'

// ── Constants ──────────────────────────────────────────────────────────────
const MAPS = ['de_dust2', 'de_inferno', 'de_nuke', 'de_mirage', 'de_cache']
const CT_NAMES  = ['FaZe | karrigan', 'NaVi | s1mple', 'ENCE | allu', 'Astralis | dev1ce', 'G2 | kennyS']
const T_NAMES   = ['Liquid | EliGE', 'NAVI | electronic', 'VP | Boombl4', 'Cloud9 | rush', 'mibr | fer']
const WEAPONS   = ['AK-47', 'M4A1-S', 'AWP', 'DEAGLE', 'P250', 'MP9', 'UMP-45', 'SG 553']
const KILL_MSGS = [' a tué ', ' a headshot ', ' a éliminé ']

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randOf(arr) { return arr[Math.floor(Math.random() * arr.length)] }

// ── Minimap canvas ─────────────────────────────────────────────────────────
function Minimap({ players, phase }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height

    // Background map (stylized top-down)
    ctx.fillStyle = '#1a1a0a'
    ctx.fillRect(0, 0, W, H)

    // Dust2-like layout
    ctx.strokeStyle = '#3a3a2a'
    ctx.lineWidth   = 1

    // Sites
    ctx.fillStyle = '#2a2a1a'
    ctx.fillRect(10, 10, 40, 40)   // A site
    ctx.fillRect(90, 80, 40, 40)   // B site
    ctx.fillRect(50, 45, 50, 5)    // mid
    ctx.fillStyle = '#c8a000'
    ctx.font = '7px monospace'
    ctx.fillText('A', 26, 35)
    ctx.fillText('B', 106, 105)

    // Walls/corridors
    ctx.fillStyle = '#333320'
    ctx.fillRect(10, 50, 40, 30)
    ctx.fillRect(50, 50, 5, 35)
    ctx.fillRect(55, 75, 35, 5)
    ctx.fillRect(90, 75, 5, 5)

    // Bomb plant indicator
    if (phase === 'bomb') {
      ctx.fillStyle = '#ff4400'
      ctx.font = '8px monospace'
      ctx.fillText('★', 20, 30)
    }

    // Players
    players.forEach((p) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2)
      ctx.fillStyle = p.team === 'ct' ? '#4488ff' : '#ff8822'
      ctx.fill()
      if (!p.alive) {
        ctx.strokeStyle = p.team === 'ct' ? '#224488' : '#884411'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.fillStyle = '#000'
        ctx.fill()
      }
    })
  }, [players, phase])

  return (
    <canvas
      ref={canvasRef}
      width={140}
      height={130}
      style={{ display:'block', imageRendering:'pixelated', border:'1px solid #444' }}
    />
  )
}

// ── Player row ─────────────────────────────────────────────────────────────
function PlayerRow({ name, kills, deaths, assists, adr, team, alive }) {
  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:'1fr 28px 28px 28px 36px',
      gap:2, padding:'1px 4px',
      background: alive ? 'transparent' : 'rgba(0,0,0,0.3)',
      opacity: alive ? 1 : 0.5,
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <span style={{ color: team==='ct' ? '#7cb8ff' : '#ffaa55', fontSize:10, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
        {alive ? '' : '✝ '}{name}
      </span>
      <span style={{ textAlign:'center', fontSize:10, color:'#eee' }}>{kills}</span>
      <span style={{ textAlign:'center', fontSize:10, color:'#999' }}>{deaths}</span>
      <span style={{ textAlign:'center', fontSize:10, color:'#777' }}>{assists}</span>
      <span style={{ textAlign:'right',  fontSize:10, color:'#cc8' }}>{adr}</span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function CsgoLegacy() {
  const [screen,  setScreen]  = useState('menu')   // menu | loading | ingame
  const [map,     setMap]     = useState(MAPS[0])
  const [score,   setScore]   = useState({ ct: 0, t: 0 })
  const [round,   setRound]   = useState(1)
  const [phase,   setPhase]   = useState('buy')     // buy | playing | bomb | end
  const [timer,   setTimer]   = useState(15)
  const [feed,    setFeed]    = useState([])
  const [hp,      setHp]      = useState(100)
  const [armor,   setArmor]   = useState(100)
  const [ammo,    setAmmo]    = useState(30)
  const [weapon,  setWeapon]  = useState('AK-47')
  const [money,   setMoney]   = useState(3400)
  const [loadPct, setLoadPct] = useState(0)

  const tickRef    = useRef(null)
  const eventRef   = useRef(null)

  const [players, setPlayers] = useState(() => buildPlayers())
  const playersRef = useRef(players)

  function buildPlayers() {
    return [
      ...CT_NAMES.map((n, i) => ({ id:`ct${i}`, name:n, team:'ct', kills:0, deaths:0, assists:0, adr:rand(60,110), alive:true, x:rand(15,45), y:rand(15,45) })),
      ...T_NAMES .map((n, i) => ({ id:`t${i}`,  name:n, team:'t',  kills:0, deaths:0, assists:0, adr:rand(60,110), alive:true, x:rand(92,128), y:rand(82,115) })),
    ]
  }

  const addFeed = useCallback((msg) => {
    setFeed((f) => [{ id: Date.now() + Math.random(), msg }, ...f].slice(0, 8))
  }, [])

  // ── Loading sequence ──────────────────────────────────────────────────────
  const startLoading = useCallback(() => {
    setScreen('loading')
    setLoadPct(0)
    let p = 0
    const iv = setInterval(() => {
      p += rand(8, 20)
      setLoadPct(Math.min(p, 100))
      if (p >= 100) {
        clearInterval(iv)
        setScreen('ingame')
        setScore({ ct:0, t:0 })
        setRound(1)
        setPhase('buy')
        setTimer(15)
        setFeed([])
        setHp(100)
        setArmor(100)
        setAmmo(30)
        setMoney(3400)
        setWeapon(randOf(WEAPONS))
        const fresh = buildPlayers()
        setPlayers(fresh)
        playersRef.current = fresh
      }
    }, 120)
  }, [])

  // ── Game tick ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'ingame') return
    tickRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          // Phase transition
          setPhase((ph) => {
            if (ph === 'buy') {
              setTimer(105)
              return 'playing'
            }
            if (ph === 'playing' || ph === 'bomb') {
              // Round ends: CT win (time) or random
              const ctWins = Math.random() > 0.45
              setScore((s) => ctWins ? { ...s, ct: s.ct+1 } : { ...s, t: s.t+1 })
              setRound((r) => r + 1)
              addFeed(ctWins ? '💙 CT remporte la manche' : '🧡 T remporte la manche')
              // Reset players
              setPlayers((prev) => prev.map((p) => ({ ...p, alive:true, x: p.team==='ct' ? rand(15,45) : rand(92,128), y: p.team==='ct' ? rand(15,45) : rand(82,115) })))
              setHp(100); setArmor(100); setAmmo(rand(15,30)); setMoney((m) => Math.min(m + 2400, 16000))
              setTimer(15)
              return 'buy'
            }
            setTimer(115)
            return 'playing'
          })
          return t
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(tickRef.current)
  }, [screen, addFeed])

  // ── Random events ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'ingame') return
    eventRef.current = setInterval(() => {
      setPhase((ph) => {
        if (ph !== 'playing' && ph !== 'bomb') return ph

        const aliveCT = playersRef.current.filter((p) => p.team==='ct' && p.alive)
        const aliveT  = playersRef.current.filter((p) => p.team==='t'  && p.alive)
        if (!aliveCT.length || !aliveT.length) return ph

        // Random kill
        const killT = Math.random() > 0.5
        const killer = killT ? randOf(aliveCT) : randOf(aliveT)
        const victim = killT ? randOf(aliveT)  : randOf(aliveCT)
        const wep    = randOf(WEAPONS)
        const hs     = Math.random() > 0.6 ? ' 🎯' : ''

        setPlayers((prev) => prev.map((p) => {
          if (p.id === victim.id) return { ...p, alive:false, deaths: p.deaths+1 }
          if (p.id === killer.id) return { ...p, kills: p.kills+1 }
          return p
        }))
        playersRef.current = playersRef.current.map((p) => {
          if (p.id === victim.id) return { ...p, alive:false }
          return p
        })

        addFeed(`${killer.name} [${wep}]${KILL_MSGS[rand(0,1)]}${victim.name}${hs}`)

        // Player move
        setPlayers((prev) => prev.map((p) => {
          if (!p.alive) return p
          return { ...p, x: Math.max(10, Math.min(130, p.x + rand(-12, 12))), y: Math.max(10, Math.min(120, p.y + rand(-10, 10))) }
        }))

        // Ammo drain
        setAmmo((a) => Math.max(0, a - rand(3, 8)))

        // Bomb plant?
        if (ph === 'playing' && Math.random() > 0.88) {
          addFeed('💣 Bombe plantée !')
          return 'bomb'
        }
        return ph
      })
    }, rand(2500, 4500))
    return () => clearInterval(eventRef.current)
  }, [screen, addFeed])

  // ── Screens ───────────────────────────────────────────────────────────────

  if (screen === 'menu') {
    return (
      <div style={{ background:'#0d0d0d', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'"Courier New", monospace', userSelect:'none' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:28, fontWeight:'bold', color:'#e8a100', letterSpacing:4, textShadow:'0 0 20px #e8a10066' }}>
            CS:GO
          </div>
          <div style={{ fontSize:11, color:'#888', letterSpacing:6, marginTop:2 }}>LEGACY EDITION</div>
          <div style={{ width:160, height:1, background:'linear-gradient(90deg,transparent,#e8a100,transparent)', margin:'12px auto' }}/>
          <div style={{ fontSize:9, color:'#555', letterSpacing:2 }}>Counter-Strike: Global Offensive</div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8, width:200, alignItems:'stretch' }}>
          {[
            { label:'▶  JOUER',     action: () => { setMap(randOf(MAPS)); startLoading() } },
            { label:'🗺  Carte',     action: () => setMap(randOf(MAPS))                     },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              style={{
                background:'transparent', border:'1px solid #e8a100', color:'#e8a100',
                fontFamily:'"Courier New", monospace', fontSize:12, padding:'8px 16px',
                cursor:'pointer', letterSpacing:2, transition:'all 0.1s',
              }}
              onMouseEnter={(e) => { e.target.style.background='#e8a100'; e.target.style.color='#000' }}
              onMouseLeave={(e) => { e.target.style.background='transparent'; e.target.style.color='#e8a100' }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ marginTop:24, fontSize:9, color:'#333', fontFamily:'monospace' }}>
          Carte actuelle : <span style={{ color:'#888' }}>{map}</span>
        </div>
        <div style={{ marginTop:8, fontSize:8, color:'#222' }}>
          Simulation visuelle — pas de réseau requis
        </div>
      </div>
    )
  }

  if (screen === 'loading') {
    return (
      <div style={{ background:'#0d0d0d', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'"Courier New", monospace' }}>
        <div style={{ color:'#e8a100', fontSize:14, marginBottom:16, letterSpacing:2 }}>CONNEXION EN COURS…</div>
        <div style={{ color:'#888',    fontSize:10, marginBottom:24 }}>{map.toUpperCase()}</div>
        <div style={{ width:280, height:6, background:'#222', border:'1px solid #444' }}>
          <div style={{ width:`${loadPct}%`, height:'100%', background:'#e8a100', transition:'width 0.1s' }} />
        </div>
        <div style={{ color:'#555', fontSize:9, marginTop:8 }}>{loadPct}%</div>
      </div>
    )
  }

  // In-game
  const mmss = `${String((timer/60)|0).padStart(2,'0')}:${String(timer%60).padStart(2,'0')}`
  const ctAlive = players.filter((p) => p.team==='ct' && p.alive).length
  const tAlive  = players.filter((p) => p.team==='t'  && p.alive).length
  const phaseLabel = { buy:'ACHAT', playing:'EN JEU', bomb:'💣 BOMBE', end:'FIN' }[phase] ?? ''

  return (
    <div style={{ background:'#111', height:'100%', display:'flex', flexDirection:'column', fontFamily:'"Courier New", monospace', fontSize:10, color:'#ccc', overflow:'hidden' }}>

      {/* ── Top HUD ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#1a1a1a', padding:'3px 10px', borderBottom:'1px solid #333' }}>
        <div style={{ color:'#7cb8ff', fontSize:10 }}>💙 CT {score.ct} — {ctAlive}/5 vivants</div>
        <div style={{ textAlign:'center' }}>
          <div style={{ color: phase==='bomb' ? '#ff4400' : '#e8a100', fontWeight:'bold', fontSize:13, letterSpacing:1 }}>{mmss}</div>
          <div style={{ fontSize:8, color:'#555', letterSpacing:1 }}>{phaseLabel} · Manche {round}/30 · {map}</div>
        </div>
        <div style={{ color:'#ffaa55', fontSize:10 }}>🧡 T {score.t} — {tAlive}/5 vivants</div>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex:1, display:'flex', gap:0, overflow:'hidden' }}>

        {/* Scoreboard */}
        <div style={{ width:260, flexShrink:0, display:'flex', flexDirection:'column', borderRight:'1px solid #333', background:'#0e0e0e' }}>
          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 28px 28px 28px 36px', gap:2, padding:'2px 4px', borderBottom:'1px solid #333', color:'#555' }}>
            <span style={{ fontSize:9 }}>Joueur</span>
            <span style={{ textAlign:'center', fontSize:9 }}>K</span>
            <span style={{ textAlign:'center', fontSize:9 }}>D</span>
            <span style={{ textAlign:'center', fontSize:9 }}>A</span>
            <span style={{ textAlign:'right',  fontSize:9 }}>ADR</span>
          </div>
          {/* CT */}
          <div style={{ padding:'2px 0', borderBottom:'1px solid #222' }}>
            <div style={{ padding:'1px 4px', fontSize:9, color:'#4488ff', letterSpacing:1 }}>— COUNTER-TERRORISTS —</div>
            {players.filter((p) => p.team==='ct').map((p) => (
              <PlayerRow key={p.id} {...p} />
            ))}
          </div>
          {/* T */}
          <div style={{ padding:'2px 0' }}>
            <div style={{ padding:'1px 4px', fontSize:9, color:'#ff8844', letterSpacing:1 }}>— TERRORISTS —</div>
            {players.filter((p) => p.team==='t').map((p) => (
              <PlayerRow key={p.id} {...p} />
            ))}
          </div>
        </div>

        {/* Right: minimap + killfeed + player HUD */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', padding:6, gap:6, overflow:'hidden' }}>

          {/* Minimap + killfeed row */}
          <div style={{ display:'flex', gap:8 }}>
            <div>
              <div style={{ fontSize:8, color:'#555', marginBottom:2, letterSpacing:1 }}>{map.toUpperCase()}</div>
              <Minimap players={players} phase={phase} />
            </div>
            {/* Kill feed */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:2, overflow:'hidden' }}>
              <div style={{ fontSize:8, color:'#555', letterSpacing:1, marginBottom:2 }}>ÉVÉNEMENTS</div>
              {feed.map((entry) => (
                <div key={entry.id} style={{ fontSize:9, color:'#ccc', background:'rgba(0,0,0,0.4)', padding:'1px 4px', borderLeft:'2px solid #e8a100', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                  {entry.msg}
                </div>
              ))}
            </div>
          </div>

          {/* Player HUD */}
          <div style={{ background:'#0d0d0d', border:'1px solid #333', padding:'4px 8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            {/* Health */}
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:18, color: hp > 50 ? '#44ff44' : hp > 25 ? '#ffaa00' : '#ff4444' }}>❤️</span>
              <div>
                <div style={{ fontSize:16, fontWeight:'bold', color: hp>50?'#44ff44':hp>25?'#ffaa00':'#ff4444' }}>{hp}</div>
                <div style={{ width:60, height:4, background:'#333' }}>
                  <div style={{ width:`${hp}%`, height:'100%', background: hp>50?'#44ff44':hp>25?'#ffaa00':'#ff4444' }}/>
                </div>
              </div>
            </div>
            {/* Armor */}
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:14 }}>🛡️</span>
              <div style={{ fontSize:14, color:'#88aaff' }}>{armor}</div>
            </div>
            {/* Weapon + Ammo */}
            <div style={{ textAlign:'right' }}>
              <div style={{ color:'#e8a100', fontSize:11, letterSpacing:1 }}>{weapon}</div>
              <div style={{ color:'#ccc', fontSize:14, fontWeight:'bold' }}>{ammo} / <span style={{ color:'#666' }}>90</span></div>
            </div>
            {/* Money */}
            <div style={{ color:'#44cc44', fontSize:13, fontWeight:'bold' }}>$ {money.toLocaleString()}</div>
          </div>

          {/* Buy phase UI */}
          {phase === 'buy' && (
            <div style={{ background:'#0d0d0d', border:'1px solid #e8a10033', padding:6 }}>
              <div style={{ fontSize:9, color:'#e8a100', marginBottom:4, letterSpacing:1 }}>PHASE D'ACHAT</div>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {[['AK-47',2700],['AWP',4750],['M4A1-S',3100],['Kevlar+Casque',1000],['Flashbang',200]].map(([name, cost]) => (
                  <button
                    key={name}
                    disabled={money < cost}
                    onClick={() => { setMoney((m) => m-cost); if(name!=='Kevlar+Casque'&&name!=='Flashbang') setWeapon(name); if(name==='Kevlar+Casque') { setArmor(100) } }}
                    style={{
                      background:'transparent', border:`1px solid ${money>=cost?'#e8a100':'#333'}`,
                      color: money>=cost ? '#e8a100' : '#444',
                      fontFamily:'"Courier New", monospace', fontSize:8,
                      padding:'2px 6px', cursor: money>=cost ? 'pointer' : 'default',
                    }}
                  >
                    {name} <span style={{ color:'#44cc44' }}>${cost}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Return to menu */}
          <button
            onClick={() => { stopAllTimers(); setScreen('menu') }}
            style={{ background:'transparent', border:'1px solid #333', color:'#555', fontFamily:'"Courier New", monospace', fontSize:9, padding:'3px 8px', cursor:'pointer', alignSelf:'flex-start' }}
          >
            ← Menu
          </button>
        </div>
      </div>
    </div>
  )

  function stopAllTimers() {
    clearInterval(tickRef.current)
    clearInterval(eventRef.current)
  }
}
