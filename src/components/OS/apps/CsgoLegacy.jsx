import { useRef, useEffect, useState, useCallback } from 'react'

// ── Canvas resolution ──────────────────────────────────────────────────────
const W = 480, H = 300
const FOV        = Math.PI / 3   // 60°
const MOVE_SPEED = 0.055
const ROT_SPEED  = 0.002

// ── Map  (0=vide, 1=mur béton, 2=mur caisse) ──────────────────────────────
const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,2,2,0,0,0,0,1,0,0,0,0,1,0,0,0,2,2,0,1],
  [1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,0,0,0,1,1,1,0,0,0,0,1,1,1,0,0,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,0,0,0,1,1,1,0,0,0,0,1,1,1,0,0,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
  [1,0,0,2,2,0,0,0,0,1,0,0,0,0,1,0,0,0,2,2,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
]
const ROWS = MAP.length, COLS = MAP[0].length

// ── Helpers ────────────────────────────────────────────────────────────────
const solid = (x, y) => {
  const mx = x | 0, my = y | 0
  return mx < 0 || mx >= COLS || my < 0 || my >= ROWS || MAP[my][mx] > 0
}

function castRay(px, py, angle) {
  const dx = Math.cos(angle) || 1e-10
  const dy = Math.sin(angle) || 1e-10
  let mx = px | 0, my = py | 0
  const dDx = Math.abs(1 / dx), dDy = Math.abs(1 / dy)
  let sX = dx < 0 ? (px - mx) * dDx : (mx + 1 - px) * dDx
  let sY = dy < 0 ? (py - my) * dDy : (my + 1 - py) * dDy
  const stX = dx < 0 ? -1 : 1, stY = dy < 0 ? -1 : 1
  let side = 0, wall = 0, safety = 0
  while (!wall && safety++ < 80) {
    if (sX < sY) { sX += dDx; mx += stX; side = 0 }
    else         { sY += dDy; my += stY; side = 1 }
    if (mx < 0 || mx >= COLS || my < 0 || my >= ROWS) { wall = 1; break }
    wall = MAP[my][mx]
  }
  const dist = side === 0
    ? (mx - px + (1 - stX) / 2) / dx
    : (my - py + (1 - stY) / 2) / dy
  return { dist: Math.max(0.01, dist), wall, side }
}

// ── Enemy factory ─────────────────────────────────────────────────────────
let _eid = 0
const mkEnemy = (x, y) => ({ id: _eid++, x, y, hp: 100, alive: true, stagger: 0 })

// ── Main component ─────────────────────────────────────────────────────────
export function CsgoLegacy() {
  const canvasRef  = useRef(null)
  const stateRef   = useRef(null)
  const rafRef     = useRef(null)
  const [phase,    setPhase]    = useState('menu')  // menu | playing | dead | win
  const [hpUI,     setHpUI]     = useState(100)
  const [ammoUI,   setAmmoUI]   = useState(30)
  const [killsUI,  setKillsUI]  = useState(0)
  const [locked,   setLocked]   = useState(false)

  // ── Start game ────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    stateRef.current = {
      player: { x: 1.5, y: 1.5, angle: 0.3, hp: 100, ammo: 30, kills: 0, reloading: 0 },
      enemies: [
        mkEnemy(10, 6.5), mkEnemy(15, 2.5), mkEnemy(18, 10), mkEnemy(5, 10),
        mkEnemy(10, 11),  mkEnemy(3, 6.5),  mkEnemy(18, 6.5),
      ],
      keys: {},
      flash: 0,   // muzzle flash
      hit: 0,     // red hit vignette
    }
    setHpUI(100); setAmmoUI(30); setKillsUI(0)
    setPhase('playing')
  }, [])

  // ── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: false })

    // ── Input ────────────────────────────────────────────────────────────
    const onKey   = (e) => { stateRef.current.keys[e.code] = e.type === 'keydown' }
    const onMove  = (e) => {
      if (document.pointerLockElement !== canvas) return
      stateRef.current.player.angle += e.movementX * ROT_SPEED
    }
    const onLock  = () => setLocked(document.pointerLockElement === canvas)
    const onClick = () => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock()
        return
      }
      shoot()
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup',   onKey)
    window.addEventListener('mousemove', onMove)
    document.addEventListener('pointerlockchange', onLock)
    canvas.addEventListener('click', onClick)

    // ── Shoot ────────────────────────────────────────────────────────────
    function shoot() {
      const { player, enemies } = stateRef.current
      if (player.hp <= 0 || player.reloading > 0) return
      if (player.ammo <= 0) { player.reloading = 60; return }
      player.ammo--
      stateRef.current.flash = 8

      // Hit detection: cast ray, compare with enemies
      const { dist: wallDist } = castRay(player.x, player.y, player.angle)
      let bestEn = null, bestDist = Infinity

      for (const en of enemies) {
        if (!en.alive) continue
        const dx = en.x - player.x, dy = en.y - player.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const toEn = Math.atan2(dy, dx)
        let diff = ((toEn - player.angle) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI
        if (Math.abs(diff) < 0.12 && dist < wallDist && dist < bestDist) {
          bestDist = dist; bestEn = en
        }
      }
      if (bestEn) {
        bestEn.hp -= 34 + (Math.random() * 15 | 0)
        bestEn.stagger = 12
        if (bestEn.hp <= 0) { bestEn.alive = false; player.kills++ }
      }
      setAmmoUI(player.ammo)
      setKillsUI(player.kills)
    }

    // ── Update ────────────────────────────────────────────────────────────
    function update() {
      const s = stateRef.current
      const { player, enemies, keys } = s
      if (player.hp <= 0) return

      const angle  = player.angle
      const cosA   = Math.cos(angle), sinA = Math.sin(angle)
      const cosR   = Math.cos(angle + Math.PI/2), sinR = Math.sin(angle + Math.PI/2)

      const move = (dx, dy) => {
        const nx = player.x + dx, ny = player.y + dy
        if (!solid(nx, player.y)) player.x = nx
        if (!solid(player.x, ny)) player.y = ny
      }

      if (keys['KeyW'] || keys['ArrowUp'])    move( cosA * MOVE_SPEED,  sinA * MOVE_SPEED)
      if (keys['KeyS'] || keys['ArrowDown'])  move(-cosA * MOVE_SPEED, -sinA * MOVE_SPEED)
      if (keys['KeyA'])                        move( cosR * MOVE_SPEED,  sinR * MOVE_SPEED)
      if (keys['KeyD'])                        move(-cosR * MOVE_SPEED, -sinR * MOVE_SPEED)
      if (keys['ArrowLeft'])  player.angle -= ROT_SPEED * 40
      if (keys['ArrowRight']) player.angle += ROT_SPEED * 40
      if ((keys['KeyR'] || keys['KeyF']) && !player.reloading) { player.reloading = 80 }

      if (player.reloading > 0) {
        player.reloading--
        if (player.reloading === 0) { player.ammo = 30; setAmmoUI(30) }
      }

      // Spacebar shoots
      if (keys['Space']) { keys['Space'] = false; shoot() }

      if (s.flash > 0) s.flash--
      if (s.hit   > 0) s.hit--

      // Enemy AI
      for (const en of enemies) {
        if (!en.alive) continue
        if (en.stagger > 0) { en.stagger--; continue }
        const dx = player.x - en.x, dy = player.y - en.y
        const dist = Math.sqrt(dx*dx + dy*dy)
        if (dist > 0.8 && dist < 18) {
          const spd = dist < 4 ? 0.012 : 0.007
          const nx = en.x + (dx/dist) * spd, ny = en.y + (dy/dist) * spd
          if (!solid(nx, en.y)) en.x = nx
          if (!solid(en.x, ny)) en.y = ny
        }
        if (dist < 1.2 && Math.random() < 0.015) {
          player.hp = Math.max(0, player.hp - 8)
          s.hit = 12
          setHpUI(player.hp)
        }
      }
    }

    // ── Render walls ──────────────────────────────────────────────────────
    function renderWalls(ctx, zbuf) {
      const { player } = stateRef.current
      // Ceiling gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H/2)
      grad.addColorStop(0, '#111')
      grad.addColorStop(1, '#222')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H/2)
      // Floor
      const grad2 = ctx.createLinearGradient(0, H/2, 0, H)
      grad2.addColorStop(0, '#1a1410')
      grad2.addColorStop(1, '#0a0807')
      ctx.fillStyle = grad2
      ctx.fillRect(0, H/2, W, H/2)

      for (let col = 0; col < W; col++) {
        const rayA = player.angle - FOV/2 + (col / W) * FOV
        const { dist, wall, side } = castRay(player.x, player.y, rayA)
        const corr  = dist * Math.cos(rayA - player.angle)
        zbuf[col]   = corr
        const wallH = Math.min(H * 2, (H / corr) | 0)
        const top   = ((H - wallH) / 2) | 0

        // Wall colors: concrete (1) or crate (2)
        let r, g, b
        if (wall === 2) { r=180; g=140; b=80 }   // yellow crate
        else            { r=160; g=155; b=140 }   // concrete

        const shade = Math.min(1, 1.5 / corr) * (side === 1 ? 0.7 : 1)
        ctx.fillStyle = `rgb(${r*shade|0},${g*shade|0},${b*shade|0})`
        ctx.fillRect(col, top, 1, wallH)
      }
    }

    // ── Render enemies ────────────────────────────────────────────────────
    function renderEnemies(ctx, zbuf) {
      const { player, enemies } = stateRef.current
      // Sort by distance (farthest first)
      const sorted = [...enemies].filter(e => e.alive).sort((a, b) => {
        const da = (a.x-player.x)**2 + (a.y-player.y)**2
        const db = (b.x-player.x)**2 + (b.y-player.y)**2
        return db - da
      })

      for (const en of sorted) {
        const dx = en.x - player.x, dy = en.y - player.y
        const cosA = Math.cos(-player.angle), sinA = Math.sin(-player.angle)
        const tx = dx*cosA - dy*sinA
        const ty = dx*sinA + dy*cosA   // depth

        if (ty < 0.3) continue

        const sprH = Math.min(H * 2, ((H / ty) * 0.85) | 0)
        const sprW = sprH * 0.6
        const sx   = ((W/2) * (1 + tx/ty)) | 0
        const sTop = ((H - sprH) / 2) | 0
        const sL   = sx - (sprW/2) | 0

        const shade = Math.min(1, 1.5 / ty)
        const hurt  = en.stagger > 0

        for (let c = Math.max(0, sL); c < Math.min(W, sL + sprW); c++) {
          if (ty >= zbuf[c]) continue
          const u = (c - sL) / sprW   // 0..1 horizontal texture coord

          // Simple "soldier" silhouette from texture UV
          let alpha = 1
          // Rounded head top
          if (u > 0.2 && u < 0.8 && sTop >= 0) {
            const headH = (sprH * 0.25) | 0
            ctx.fillStyle = hurt
              ? `rgba(255,120,50,${shade})`
              : `rgba(220,185,140,${shade})`
            ctx.fillRect(c, sTop, 1, headH)
          }
          // Body
          const bodyTop  = sTop + ((sprH * 0.25)|0)
          const bodyH    = (sprH * 0.55) | 0
          ctx.fillStyle = hurt
            ? `rgba(255,80,40,${shade})`
            : `rgba(60,80,60,${shade})`
          ctx.fillRect(c, bodyTop, 1, bodyH)

          // HP bar
          if (ty < 6) {
            const barW = sprW, barY = sTop - 5
            if (barY >= 0 && c === sL) {
              ctx.fillStyle = '#ff4444'
              ctx.fillRect(sL, barY, barW, 3)
              ctx.fillStyle = '#44ff44'
              ctx.fillRect(sL, barY, (barW * en.hp/100)|0, 3)
            }
          }
        }
      }
    }

    // ── HUD ───────────────────────────────────────────────────────────────
    function renderHUD(ctx) {
      const { player, flash, hit, enemies } = stateRef.current
      const alive = enemies.filter(e => e.alive).length

      // Hit vignette
      if (hit > 0) {
        const g = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*0.8)
        g.addColorStop(0, 'rgba(200,0,0,0)')
        g.addColorStop(1, `rgba(200,0,0,${(hit/12)*0.6})`)
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)
      }

      // Muzzle flash
      if (flash > 0) {
        ctx.fillStyle = `rgba(255,200,80,${flash/8 * 0.3})`
        ctx.fillRect(0, 0, W, H)
      }

      // Crosshair
      const cx = W/2, cy = H/2
      const gap = 5, len = 10
      ctx.strokeStyle = player.hp > 0 ? 'rgba(0,255,0,0.9)' : 'rgba(255,0,0,0.9)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cx-gap-len, cy); ctx.lineTo(cx-gap, cy)
      ctx.moveTo(cx+gap,     cy); ctx.lineTo(cx+gap+len, cy)
      ctx.moveTo(cx, cy-gap-len); ctx.lineTo(cx, cy-gap)
      ctx.moveTo(cx, cy+gap);     ctx.lineTo(cx, cy+gap+len)
      ctx.stroke()
      // Center dot
      ctx.fillStyle = 'rgba(0,255,0,0.9)'
      ctx.beginPath(); ctx.arc(cx, cy, 1.5, 0, Math.PI*2); ctx.fill()

      // Gun sprite (bottom center)
      if (player.hp > 0) {
        const gy = H - 40 + (flash > 0 ? -4 : 0)
        ctx.fillStyle = '#555'
        ctx.fillRect(W/2 + 10, gy + 15, 80, 10)  // barrel
        ctx.fillRect(W/2 + 50, gy +  5, 40, 20)  // body
        ctx.fillRect(W/2 + 60, gy + 25, 15, 20)  // grip
        ctx.fillStyle = '#444'
        ctx.fillRect(W/2 + 30, gy + 13, 40, 14)  // slide detail
        if (flash > 0) {
          ctx.fillStyle = `rgba(255,200,50,${flash/8})`
          ctx.beginPath(); ctx.arc(W/2+12, gy+19, 8, 0, Math.PI*2); ctx.fill()
        }
      }

      // HP bar
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(8, H-26, 100, 12)
      ctx.fillStyle = player.hp > 50 ? '#44ff44' : player.hp > 25 ? '#ffcc00' : '#ff4444'
      ctx.fillRect(8, H-26, player.hp, 12)
      ctx.fillStyle = '#fff'
      ctx.font = '10px "Courier New"'
      ctx.fillText(`❤ ${player.hp}`, 10, H-17)

      // Ammo
      const ammoStr = player.reloading > 0
        ? 'RECHARGEMENT...'
        : `${player.ammo} / 30`
      ctx.textAlign = 'right'
      ctx.fillStyle = player.ammo > 5 ? '#ffcc00' : '#ff4444'
      ctx.font = 'bold 12px "Courier New"'
      ctx.fillText(ammoStr, W-8, H-10)
      ctx.textAlign = 'left'

      // Kills
      ctx.fillStyle = '#fff'
      ctx.font = '10px "Courier New"'
      ctx.fillText(`🎯 ${player.kills} kills`, 8, 14)
      ctx.fillStyle = '#aaa'
      ctx.fillText(`${alive} ennemis restants`, 8, 26)

      // Controls hint (bottom left, small)
      if (!locked) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.font = '9px "Courier New"'
        ctx.fillText('Cliquer pour capturer la souris', 8, H-30)
      }
    }

    // ── Minimap ────────────────────────────────────────────────────────────
    function renderMinimap(ctx) {
      const { player, enemies } = stateRef.current
      const S = 4, ox = W - COLS*S - 4, oy = 4
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(ox-1, oy-1, COLS*S+2, ROWS*S+2)
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (MAP[r][c]) {
            ctx.fillStyle = MAP[r][c] === 2 ? '#886' : '#555'
            ctx.fillRect(ox + c*S, oy + r*S, S, S)
          }
        }
      }
      // Enemies on minimap
      for (const en of enemies) {
        if (!en.alive) continue
        ctx.fillStyle = '#f44'
        ctx.fillRect(ox + en.x*S - 1, oy + en.y*S - 1, 3, 3)
      }
      // Player
      ctx.fillStyle = '#4af'
      ctx.fillRect(ox + player.x*S - 2, oy + player.y*S - 2, 4, 4)
      // FOV lines
      ctx.strokeStyle = 'rgba(100,180,255,0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(ox + player.x*S, oy + player.y*S)
      ctx.lineTo(ox + (player.x + Math.cos(player.angle-FOV/2)*4)*S,
                 oy + (player.y + Math.sin(player.angle-FOV/2)*4)*S)
      ctx.moveTo(ox + player.x*S, oy + player.y*S)
      ctx.lineTo(ox + (player.x + Math.cos(player.angle+FOV/2)*4)*S,
                 oy + (player.y + Math.sin(player.angle+FOV/2)*4)*S)
      ctx.stroke()
    }

    // ── Main loop ─────────────────────────────────────────────────────────
    const zbuf = new Float32Array(W)
    function loop() {
      const s = stateRef.current
      update()

      renderWalls(ctx, zbuf)
      renderEnemies(ctx, zbuf)
      renderHUD(ctx)
      renderMinimap(ctx)

      // Win / Dead check
      if (s.player.hp <= 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = '#ff4444'
        ctx.font = 'bold 28px "Courier New"'
        ctx.textAlign = 'center'
        ctx.fillText('VOUS ÊTES MORT', W/2, H/2)
        ctx.fillStyle = '#ccc'
        ctx.font = '13px "Courier New"'
        ctx.fillText('Appuyez R pour rejouer', W/2, H/2 + 26)
        ctx.textAlign = 'left'
        setPhase('dead')
        if (document.pointerLockElement === canvas) document.exitPointerLock()
        return
      }
      if (s.enemies.every(e => !e.alive)) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = '#44ff44'
        ctx.font = 'bold 24px "Courier New"'
        ctx.textAlign = 'center'
        ctx.fillText('VICTOIRE !', W/2, H/2)
        ctx.fillStyle = '#fff'
        ctx.font = '12px "Courier New"'
        ctx.fillText(`${s.player.kills} kills — Appuyez R pour rejouer`, W/2, H/2 + 26)
        ctx.textAlign = 'left'
        setPhase('win')
        if (document.pointerLockElement === canvas) document.exitPointerLock()
        return
      }

      // Restart
      if ((s.keys['KeyR'] || s.keys['Enter']) && (phase === 'dead' || phase === 'win')) {
        startGame()
        return
      }

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('keydown',         onKey)
      window.removeEventListener('keyup',           onKey)
      window.removeEventListener('mousemove',       onMove)
      document.removeEventListener('pointerlockchange', onLock)
      canvas.removeEventListener('click',           onClick)
      if (document.pointerLockElement === canvas) document.exitPointerLock()
    }
  }, [phase, startGame]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Menu ────────────────────────────────────────────────────────────────
  if (phase === 'menu') {
    return (
      <div style={{ background:'#0a0a0a', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'"Courier New",monospace', userSelect:'none' }}>
        <div style={{ color:'#e8a100', fontSize:32, fontWeight:'bold', letterSpacing:4, textShadow:'0 0 30px #e8a10080' }}>CS:GO</div>
        <div style={{ color:'#666',    fontSize:11, letterSpacing:6, marginTop:2 }}>LEGACY FPS</div>
        <div style={{ width:200, height:1, background:'linear-gradient(90deg,transparent,#e8a100,transparent)', margin:'18px 0' }}/>

        <div style={{ color:'#aaa', fontSize:10, marginBottom:20, textAlign:'center', lineHeight:2 }}>
          <span style={{ color:'#e8a100' }}>WASD</span> déplacer &nbsp;|&nbsp;
          <span style={{ color:'#e8a100' }}>Souris</span> viser &nbsp;|&nbsp;
          <span style={{ color:'#e8a100' }}>Clic</span> tirer<br/>
          <span style={{ color:'#e8a100' }}>R</span> recharger &nbsp;|&nbsp;
          <span style={{ color:'#e8a100' }}>Espace</span> tirer
        </div>

        <button
          onClick={startGame}
          style={{ background:'transparent', border:'2px solid #e8a100', color:'#e8a100', fontFamily:'"Courier New",monospace', fontSize:14, padding:'10px 32px', cursor:'pointer', letterSpacing:3 }}
          onMouseEnter={(e)=>{ e.target.style.background='#e8a100'; e.target.style.color='#000' }}
          onMouseLeave={(e)=>{ e.target.style.background='transparent'; e.target.style.color='#e8a100' }}
        >
          ▶ JOUER
        </button>
        <div style={{ marginTop:24, color:'#333', fontSize:9 }}>7 ennemis · de_dust2 (simplifié)</div>
      </div>
    )
  }

  // ── End screens (handled in canvas render) ─────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#000', alignItems:'center', justifyContent:'center' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ display:'block', imageRendering:'pixelated', cursor:'none', width:'100%', height:'100%', objectFit:'contain' }}
      />
      {(phase === 'dead' || phase === 'win') && (
        <button
          onClick={startGame}
          style={{ position:'absolute', bottom:12, background:'rgba(0,0,0,0.7)', border:'1px solid #e8a100', color:'#e8a100', fontFamily:'"Courier New",monospace', fontSize:11, padding:'6px 20px', cursor:'pointer' }}
        >
          Rejouer
        </button>
      )}
    </div>
  )
}
