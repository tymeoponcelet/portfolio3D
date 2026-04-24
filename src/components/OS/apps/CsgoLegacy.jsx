import { useRef, useEffect, useState, useCallback, useMemo } from 'react'

// ── CS click sound (Web Audio) ─────────────────────────────────────────────
let _actx = null
function audioCtx() {
  if (!_actx) {
    const C = window.AudioContext ?? window.webkitAudioContext
    if (!C) return null
    _actx = new C()
  }
  if (_actx.state === 'suspended') _actx.resume()
  return _actx
}
function csClick() {
  try {
    const c = audioCtx(); if (!c) return
    const n = c.sampleRate * 0.06
    const buf = c.createBuffer(1, n, c.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < n; i++) d[i] = (Math.random()*2-1) * Math.exp(-i/(n*0.18)) * 0.45
    const src = c.createBufferSource()
    const f   = c.createBiquadFilter()
    f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 1.5
    src.buffer = buf; src.connect(f); f.connect(c.destination); src.start()
  } catch (_) {}
}
function csBeep(freq = 660, dur = 0.08, vol = 0.18) {
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

// ══════════════════════════════════════════════════════════════════════════════
//  RAYCASTER ENGINE
// ══════════════════════════════════════════════════════════════════════════════
const W = 480, H = 296
const FOV = Math.PI / 3
const MOVE  = 0.055
const RSENS = 0.0022

// Map: 0=vide 1=béton 2=caisse 3=metal
const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,2,2,0,0,3,0,0,0,0,0,0,3,0,0,2,2,0,0,1],
  [1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,1],
  [1,0,0,0,0,0,0,0,0,3,3,0,3,3,0,0,0,0,0,0,0,1],
  [1,0,1,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,3,3,0,3,3,0,0,0,0,0,0,0,1],
  [1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,1],
  [1,0,0,2,2,0,0,3,0,0,0,0,0,0,3,0,0,2,2,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
]
const ROWS = MAP.length, COLS = MAP[0].length

const solid = (x, y) => {
  const mx = x|0, my = y|0
  return mx<0||mx>=COLS||my<0||my>=ROWS||MAP[my][mx]>0
}

function dda(px, py, angle) {
  const dx = Math.cos(angle)||1e-9, dy = Math.sin(angle)||1e-9
  let mx = px|0, my = py|0
  const dDx = Math.abs(1/dx), dDy = Math.abs(1/dy)
  let sX = dx<0?(px-mx)*dDx:(mx+1-px)*dDx
  let sY = dy<0?(py-my)*dDy:(my+1-py)*dDy
  const stX = dx<0?-1:1, stY = dy<0?-1:1
  let side=0, wall=0, safe=0
  while (!wall && safe++<80) {
    if (sX<sY){sX+=dDx;mx+=stX;side=0}else{sY+=dDy;my+=stY;side=1}
    if (mx<0||mx>=COLS||my<0||my>=ROWS){wall=1;break}
    wall=MAP[my][mx]
  }
  const dist = side===0?(mx-px+(1-stX)/2)/dx:(my-py+(1-stY)/2)/dy
  return { dist:Math.max(0.01,dist), wall, side }
}

// Wall palette: [light-face, dark-side] for types 1,2,3
const WALL_PAL = [
  null,
  [[165,158,145],[110,105,97]],   // 1 béton
  [[190,155, 75],[130,105,50]],   // 2 caisse
  [[ 90, 95,105],[ 55, 58,65]],   // 3 métal
]

let _eid = 0
const mkEnemy = (x,y) => ({id:_eid++,x,y,hp:100,alive:true,stagger:0,angle:0})

// ── Render all geometry ────────────────────────────────────────────────────
function renderFrame(ctx, state, zbuf) {
  const { player, enemies } = state

  // Sky / floor gradient
  const sky = ctx.createLinearGradient(0,0,0,H/2)
  sky.addColorStop(0,'#0e1117'); sky.addColorStop(1,'#1c2530')
  ctx.fillStyle = sky; ctx.fillRect(0,0,W,H/2)
  const flr = ctx.createLinearGradient(0,H/2,0,H)
  flr.addColorStop(0,'#18160f'); flr.addColorStop(1,'#0a0906')
  ctx.fillStyle = flr; ctx.fillRect(0,H/2,W,H/2)

  // Walls
  for (let col=0;col<W;col++) {
    const ra = player.angle - FOV/2 + (col/W)*FOV
    const {dist,wall,side} = dda(player.x, player.y, ra)
    const corr = dist * Math.cos(ra - player.angle)
    zbuf[col] = corr
    const h   = Math.min(H*2, (H/corr)|0)
    const top = ((H-h)/2)|0
    const pal = WALL_PAL[wall] ?? WALL_PAL[1]
    const [rc,gc,bc] = side===1 ? pal[1] : pal[0]
    const sh  = Math.min(1, 1.8/corr)
    ctx.fillStyle = `rgb(${rc*sh|0},${gc*sh|0},${bc*sh|0})`
    ctx.fillRect(col, top, 1, h)
  }

  // Sprites (enemies)
  const sorted = [...enemies].filter(e=>e.alive).sort((a,b)=>{
    const da=(a.x-player.x)**2+(a.y-player.y)**2
    const db=(b.x-player.x)**2+(b.y-player.y)**2
    return db-da
  })
  for (const en of sorted) {
    const dx=en.x-player.x, dy=en.y-player.y
    const cosA=Math.cos(-player.angle), sinA=Math.sin(-player.angle)
    const tx=dx*cosA-dy*sinA, ty=dx*sinA+dy*cosA
    if (ty<0.25) continue
    const sprH = Math.min(H*2,(H/ty*0.85)|0)
    const sprW = (sprH*0.55)|0
    const sx   = ((W/2)*(1+tx/ty))|0
    const sL   = sx-(sprW/2)|0
    const sTop = ((H-sprH)/2)|0
    const sh   = Math.min(1,1.8/ty)
    const hurt = en.stagger>0

    for (let c=Math.max(0,sL);c<Math.min(W,sL+sprW);c++) {
      if (ty>=zbuf[c]) continue
      const u=(c-sL)/sprW
      // Head
      if (u>0.2&&u<0.8) {
        ctx.fillStyle = hurt?`rgba(255,130,60,${sh})`:`rgba(215,180,130,${sh})`
        ctx.fillRect(c, sTop, 1, (sprH*0.24)|0)
      }
      // Body
      const bTop=sTop+((sprH*0.24)|0), bH=(sprH*0.55)|0
      ctx.fillStyle = hurt?`rgba(255,70,30,${sh})`:`rgba(50,72,50,${sh})`
      ctx.fillRect(c, bTop, 1, bH)
    }
    // HP bar at close range
    if (ty<6&&sL>=0) {
      ctx.fillStyle='#f44'; ctx.fillRect(sL, sTop-5, sprW, 3)
      ctx.fillStyle='#4f4'; ctx.fillRect(sL, sTop-5, (sprW*en.hp/100)|0, 3)
    }
  }
}

function renderHUD(ctx, state) {
  const {player, flash, hit, enemies} = state
  const alive = enemies.filter(e=>e.alive).length

  // Damage vignette
  if (hit>0) {
    const g=ctx.createRadialGradient(W/2,H/2,H*0.2,W/2,H/2,H*0.8)
    g.addColorStop(0,'rgba(180,0,0,0)')
    g.addColorStop(1,`rgba(180,0,0,${(hit/15)*0.55})`)
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H)
  }

  // Muzzle flash
  if (flash>0) {
    ctx.fillStyle=`rgba(255,210,90,${flash/8*0.28})`
    ctx.fillRect(0,0,W,H)
  }

  // Crosshair (CS:GO style — 4 lines + dot)
  const cx=W/2, cy=H/2, gap=6, len=9
  ctx.strokeStyle='rgba(0,255,80,0.9)'; ctx.lineWidth=1.5
  ctx.beginPath()
  ctx.moveTo(cx-gap-len,cy); ctx.lineTo(cx-gap,cy)
  ctx.moveTo(cx+gap,cy);     ctx.lineTo(cx+gap+len,cy)
  ctx.moveTo(cx,cy-gap-len); ctx.lineTo(cx,cy-gap)
  ctx.moveTo(cx,cy+gap);     ctx.lineTo(cx,cy+gap+len)
  ctx.stroke()
  ctx.fillStyle='rgba(0,255,80,0.95)'; ctx.beginPath(); ctx.arc(cx,cy,1.5,0,Math.PI*2); ctx.fill()

  // Gun (AK-47 silhouette)
  if (player.hp>0) {
    const gy=H-38+(flash>0?-5:0)
    ctx.fillStyle='#6a6a6a'; ctx.fillRect(W/2+8,gy+18,75,9)   // barrel
    ctx.fillStyle='#505050'; ctx.fillRect(W/2+46,gy+8,38,18)   // body
    ctx.fillStyle='#444';    ctx.fillRect(W/2+58,gy+26,14,18)   // grip
    ctx.fillStyle='#5a5a5a'; ctx.fillRect(W/2+28,gy+14,38,12)   // handguard
    ctx.fillStyle='#383838'; ctx.fillRect(W/2+62,gy+10, 8,18)   // charging handle
    if (flash>0) {
      ctx.fillStyle=`rgba(255,200,60,${flash/8*0.9})`
      ctx.beginPath(); ctx.arc(W/2+10,gy+22,9,0,Math.PI*2); ctx.fill()
      ctx.fillStyle=`rgba(255,255,200,${flash/8*0.7})`
      ctx.beginPath(); ctx.arc(W/2+10,gy+22,4,0,Math.PI*2); ctx.fill()
    }
  }

  // Bottom-left: HP + armor
  ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(4,H-30,108,26)
  const hpColor=player.hp>50?'#4ef':'#f55'
  ctx.fillStyle=hpColor; ctx.fillRect(6,H-28,Math.min(100,player.hp),10)
  ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(6+Math.min(100,player.hp),H-28,100-Math.min(100,player.hp),10)
  ctx.fillStyle='#fff'; ctx.font='bold 10px "Courier New"'; ctx.textAlign='left'
  ctx.fillText(`❤ ${player.hp}  🛡 ${player.armor}`, 6, H-10)

  // Bottom-right: ammo
  ctx.textAlign='right'
  const reloading = player.reloading>0
  ctx.fillStyle = reloading ? '#fc0' : player.ammo>5 ? '#ffd700' : '#f44'
  ctx.font='bold 13px "Courier New"'
  ctx.fillText(reloading ? 'RELOAD...' : `${player.ammo}/30`, W-6, H-10)

  // Top: kills + enemies
  ctx.textAlign='left'; ctx.font='10px "Courier New"'
  ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(4,4,180,28)
  ctx.fillStyle='#4ef'; ctx.fillText(`Kills: ${player.kills}`, 8, 15)
  ctx.fillStyle='#fa8'; ctx.fillText(`Ennemis: ${alive} restants`, 8, 27)

  // ESC hint
  ctx.fillStyle='rgba(180,180,180,0.4)'; ctx.textAlign='right'; ctx.font='8px "Courier New"'
  ctx.fillText('ESC → menu', W-4, 12)
  ctx.textAlign='left'
}

function renderMinimap(ctx, state) {
  const {player,enemies}=state
  const S=3.5, ox=W-COLS*S-3, oy=3
  ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(ox-1,oy-1,COLS*S+2,ROWS*S+2)
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    if (!MAP[r][c]) continue
    ctx.fillStyle = MAP[r][c]===2?'#8a7a40':MAP[r][c]===3?'#505868':'#555'
    ctx.fillRect(ox+c*S,oy+r*S,S,S)
  }
  for (const en of enemies) {
    if (!en.alive) continue
    ctx.fillStyle='#f55'; ctx.fillRect(ox+en.x*S-1,oy+en.y*S-1,3,3)
  }
  ctx.fillStyle='#4ef'; ctx.fillRect(ox+player.x*S-2,oy+player.y*S-2,4,4)
  ctx.strokeStyle='rgba(80,180,255,0.35)'; ctx.lineWidth=1
  ctx.beginPath()
  const fov2=FOV/2
  ctx.moveTo(ox+player.x*S,oy+player.y*S)
  ctx.lineTo(ox+(player.x+Math.cos(player.angle-fov2)*5)*S,oy+(player.y+Math.sin(player.angle-fov2)*5)*S)
  ctx.moveTo(ox+player.x*S,oy+player.y*S)
  ctx.lineTo(ox+(player.x+Math.cos(player.angle+fov2)*5)*S,oy+(player.y+Math.sin(player.angle+fov2)*5)*S)
  ctx.stroke()
}

// ══════════════════════════════════════════════════════════════════════════════
//  FPS GAME COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
function FPSGame({ onExit }) {
  const canvasRef = useRef(null)
  const stateRef  = useRef(null)
  const rafRef    = useRef(null)
  const [hpUI,    setHpUI]    = useState(100)
  const [ammoUI,  setAmmoUI]  = useState(30)
  const [kills,   setKills]   = useState(0)
  const [ended,   setEnded]   = useState(null) // null | 'dead' | 'win'

  // Init game state
  useEffect(() => {
    stateRef.current = {
      player: { x:1.5, y:1.5, angle:0.4, hp:100, armor:100, ammo:30, kills:0, reloading:0 },
      enemies: [
        mkEnemy(10,6.5), mkEnemy(15,2.5), mkEnemy(18,10.5),
        mkEnemy(5,10.5), mkEnemy(10,11),  mkEnemy(3,6.5), mkEnemy(18,6.5),
      ],
      keys:  {},
      flash: 0,
      hit:   0,
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !stateRef.current) return
    const ctx = canvas.getContext('2d', { alpha:false })
    const zbuf = new Float32Array(W)

    // ── Input ────────────────────────────────────────────────────────────
    // ZQSD (AZERTY) + WASD (QWERTY) : on utilise e.key pour être layout-agnostic
    const KEY_MAP = { z:'FWD',w:'FWD', s:'BACK', q:'LEFT',a:'LEFT', d:'RIGHT', r:'RELOAD',f:'RELOAD' }
    const onKey = (e) => {
      const s = stateRef.current; if (!s) return
      const k   = e.key.toLowerCase()
      const virt = KEY_MAP[k]
      if (virt) { e.preventDefault(); s.keys[virt] = e.type==='keydown' }
      else s.keys[e.code] = e.type==='keydown'
    }

    // Drag-to-rotate fallback (marche sans pointer lock)
    let prevDragX = null, isDragging = false
    const onCanvasDown = (e) => {
      if (e.button !== 0) return
      isDragging = true; prevDragX = e.clientX
      canvas.requestPointerLock?.()
    }
    const onCanvasUp = (e) => {
      if (e.button !== 0) return
      isDragging = false; prevDragX = null
      shootFn()   // tirer au mouseup pour distinguer drag et clic
    }
    const onMove = (e) => {
      const s = stateRef.current; if (!s) return
      if (document.pointerLockElement === canvas) {
        s.player.angle += e.movementX * RSENS
      } else if (isDragging && prevDragX !== null) {
        s.player.angle += (e.clientX - prevDragX) * RSENS * 0.8
        prevDragX = e.clientX
      }
    }
    const onContextMenu = (e) => e.preventDefault()

    function shootFn() {
      const s = stateRef.current; if (!s) return
      const p = s.player
      if (p.hp<=0 || p.reloading>0) return
      if (p.ammo<=0) { p.reloading=80; return }
      p.ammo--; s.flash=9
      csClick()
      setAmmoUI(p.ammo)

      let best=null, bDist=Infinity
      for (const en of s.enemies) {
        if (!en.alive) continue
        const dx=en.x-p.x, dy=en.y-p.y
        const dist=Math.sqrt(dx*dx+dy*dy)
        const toE=Math.atan2(dy,dx)
        // Normalisation fiable de la différence d'angle → [-π, π]
        let diff = toE - p.angle
        while (diff >  Math.PI) diff -= Math.PI*2
        while (diff < -Math.PI) diff += Math.PI*2
        diff = Math.abs(diff)
        // Seuil dynamique : plus large pour les ennemis proches
        const threshold = Math.max(0.14, Math.atan2(0.55, dist))
        if (diff < threshold && dist < bDist) {
          // Occlusion : rayon vers l'ennemi (pas vers la camera)
          const { dist: wallD } = dda(p.x, p.y, toE)
          if (dist < wallD + 0.4) { bDist=dist; best=en }
        }
      }
      if (best) {
        best.hp -= 34+(Math.random()*16|0)
        best.stagger = 16
        if (best.hp<=0) { best.alive=false; p.kills++; setKills(p.kills) }
      }
    }

    window.addEventListener('keydown',   onKey)
    window.addEventListener('keyup',     onKey)
    window.addEventListener('mousemove', onMove)
    canvas.addEventListener('mousedown', onCanvasDown)
    window.addEventListener('mouseup',   onCanvasUp)
    canvas.addEventListener('contextmenu', onContextMenu)

    // ── Game loop ────────────────────────────────────────────────────────
    function update() {
      const s=stateRef.current; if(!s) return
      const {player:p,keys,enemies}=s

      // Visibility-based skip (pause when minimized)
      const r = canvas.getBoundingClientRect()
      if (r.width===0) return

      const cosA=Math.cos(p.angle), sinA=Math.sin(p.angle)
      const cosR=Math.cos(p.angle+Math.PI/2), sinR=Math.sin(p.angle+Math.PI/2)
      const move=(dx,dy)=>{
        const nx=p.x+dx, ny=p.y+dy
        if(!solid(nx,p.y))p.x=nx
        if(!solid(p.x,ny))p.y=ny
      }
      // ZQSD (AZERTY) + WASD (QWERTY) via clés virtuelles
      if(keys['FWD']  || keys['ArrowUp'])    move( cosA*MOVE,  sinA*MOVE)
      if(keys['BACK'] || keys['ArrowDown'])   move(-cosA*MOVE, -sinA*MOVE)
      if(keys['LEFT'])                        move( cosR*MOVE,  sinR*MOVE)
      if(keys['RIGHT'])                       move(-cosR*MOVE, -sinR*MOVE)
      if(keys['ArrowLeft'])  p.angle -= RSENS*40
      if(keys['ArrowRight']) p.angle += RSENS*40
      if(keys['Escape'])  { keys['Escape']=false; if(document.pointerLockElement===canvas)document.exitPointerLock(); onExit(); return }
      if(keys['Space'])   { keys['Space']=false; shootFn() }
      if(keys['RELOAD'] && !p.reloading && p.ammo<30) { keys['RELOAD']=false; p.reloading=80 }

      if(p.reloading>0){p.reloading--;if(p.reloading===0){p.ammo=30;setAmmoUI(30);csBeep(440,0.12)}}
      if(s.flash>0)s.flash--
      if(s.hit>0)  s.hit--

      for (const en of enemies) {
        if(!en.alive) continue
        if(en.stagger>0){en.stagger--;continue}
        const dx=p.x-en.x,dy=p.y-en.y,dist=Math.sqrt(dx*dx+dy*dy)
        if(dist>0.9&&dist<18){
          const spd=dist<5?0.013:0.007
          const nx=en.x+(dx/dist)*spd,ny=en.y+(dy/dist)*spd
          if(!solid(nx,en.y))en.x=nx
          if(!solid(en.x,ny))en.y=ny
        }
        if(dist<1.2&&Math.random()<0.018){p.hp=Math.max(0,p.hp-7);s.hit=15;setHpUI(p.hp)}
      }
    }

    function loop() {
      const s=stateRef.current; if(!s) {rafRef.current=requestAnimationFrame(loop);return}

      // Pause if not visible
      const r=canvas.getBoundingClientRect()
      if(r.width===0||document.hidden){rafRef.current=requestAnimationFrame(loop);return}

      update()
      renderFrame(ctx,s,zbuf)
      renderHUD(ctx,s)
      renderMinimap(ctx,s)

      if(s.player.hp<=0&&!ended){
        setEnded('dead')
        if(document.pointerLockElement===canvas)document.exitPointerLock()
      }
      if(s.enemies.every(e=>!e.alive)&&!ended){
        setEnded('win')
        csBeep(880,0.3); setTimeout(()=>csBeep(1100,0.25),300)
        if(document.pointerLockElement===canvas)document.exitPointerLock()
      }

      rafRef.current=requestAnimationFrame(loop)
    }
    rafRef.current=requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('keydown',   onKey)
      window.removeEventListener('keyup',     onKey)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onCanvasUp)
      canvas.removeEventListener('mousedown', onCanvasDown)
      canvas.removeEventListener('contextmenu', onContextMenu)
      if(document.pointerLockElement===canvas)document.exitPointerLock()
    }
  }, [onExit]) // eslint-disable-line

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', background:'#000' }}>
      <canvas
        ref={canvasRef}
        width={W} height={H}
        style={{ display:'block', width:'100%', height:'100%', objectFit:'contain', cursor:'none', imageRendering:'pixelated' }}
      />
      {ended && (
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.65)', fontFamily:'"Courier New",monospace' }}>
          <div style={{ fontSize:28, fontWeight:'bold', color: ended==='win'?'#4ef':'#f44', textShadow:`0 0 20px ${ended==='win'?'#4ef':'#f44'}` }}>
            {ended==='win' ? '✔ VICTOIRE' : '✘ ÉLIMINÉ'}
          </div>
          {stateRef.current && (
            <div style={{ color:'#aaa', fontSize:11, marginTop:8 }}>
              {stateRef.current.player.kills} kills
            </div>
          )}
          <div style={{ display:'flex', gap:10, marginTop:20 }}>
            <button onClick={() => { setEnded(null); const s=stateRef.current; if(s){s.player.hp=100;s.player.armor=100;s.player.ammo=30;s.player.kills=0;s.enemies.forEach(e=>{e.alive=true;e.hp=100;e.stagger=0});setHpUI(100);setAmmoUI(30);setKills(0)} }} style={btnStyle('#4ef')}>Rejouer</button>
            <button onClick={onExit} style={btnStyle('#fa8')}>← Menu</button>
          </div>
        </div>
      )}
    </div>
  )
}

const btnStyle = (color) => ({
  background:'transparent', border:`1px solid ${color}`, color,
  fontFamily:'"Courier New",monospace', fontSize:11, padding:'6px 18px', cursor:'pointer',
})

// ══════════════════════════════════════════════════════════════════════════════
//  LOADING CONSOLE
// ══════════════════════════════════════════════════════════════════════════════
const LOAD_LINES = [
  { text:'> Connexion à Steam Community...', delay:0   },
  { text:'> Authentification VAC vérifiée.', delay:600 },
  { text:'> Chargement Counter-Strike: Global Offensive...', delay:1100 },
  { text:'> Initialisation des shaders...', delay:1700 },
  { text:'> Téléchargement de de_dust2 [7.4 MB]...', delay:2300 },
  { text:'> Connexion au serveur 91.134.175.48:27015', delay:2900 },
  { text:'> GOTV: cs_france_compete_dust2', delay:3400 },
  { text:'> Warm-up en cours... [4/10 joueurs]', delay:3900 },
  { text:'> Chargement terminé. Bonne chance !', delay:4600 },
]

function LoadingScreen({ onDone }) {
  const [lines, setLines] = useState([])
  const [pct,   setPct]   = useState(0)

  useEffect(() => {
    LOAD_LINES.forEach(({ text, delay }) => {
      setTimeout(() => {
        csBeep(440 + Math.random()*200, 0.04, 0.08)
        setLines(l => [...l, text])
        setPct((delay / 4600) * 100)
      }, delay)
    })
    const done = setTimeout(() => { csBeep(880,0.15); onDone() }, 5300)
    return () => clearTimeout(done)
  }, [onDone])

  return (
    <div style={{ background:'#0a0c0f', height:'100%', display:'flex', flexDirection:'column', padding:16, fontFamily:'"Courier New",monospace', boxSizing:'border-box' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, borderBottom:'1px solid #2a3540', paddingBottom:10 }}>
        <CsLogo size={28} />
        <div>
          <div style={{ color:'#c6d4df', fontSize:12, fontWeight:'bold', letterSpacing:2 }}>COUNTER-STRIKE: GLOBAL OFFENSIVE</div>
          <div style={{ color:'#4fa3d5', fontSize:9, letterSpacing:1 }}>Connexion à de_dust2 — mode Compétitif</div>
        </div>
      </div>

      {/* Console */}
      <div style={{ flex:1, overflowY:'auto', paddingBottom:8 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ color: l.includes('terminé')||l.includes('Bonne') ? '#4eff88' : '#8fa8b8', fontSize:10, lineHeight:1.8, letterSpacing:0.5 }}>
            {l}
          </div>
        ))}
        {lines.length < LOAD_LINES.length && (
          <span style={{ color:'#4fa3d5', fontSize:10, animation:'none' }}>▮</span>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ marginTop:10 }}>
        <div style={{ color:'#4a6070', fontSize:9, marginBottom:4, letterSpacing:1 }}>
          CHARGEMENT DES RESSOURCES : {pct|0}%
        </div>
        <div style={{ height:6, background:'#1a2530', border:'1px solid #2a3a4a' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#1a6898,#4fa3d5)', width:`${pct}%`, transition:'width 0.4s ease' }}/>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  CS LOGO SVG (pixel art 32×32)
// ══════════════════════════════════════════════════════════════════════════════
function CsLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering:'pixelated', flexShrink:0 }}>
      <rect width="32" height="32" fill="#1a1f2e"/>
      <circle cx="16" cy="16" r="13" fill="none" stroke="#c8a000" strokeWidth="2"/>
      <circle cx="16" cy="16" r="9"  fill="none" stroke="#c8a000" strokeWidth="1"/>
      {/* Crosshair */}
      <line x1="16" y1="4"  x2="16" y2="10" stroke="#c8a000" strokeWidth="2"/>
      <line x1="16" y1="22" x2="16" y2="28" stroke="#c8a000" strokeWidth="2"/>
      <line x1="4"  y1="16" x2="10" y2="16" stroke="#c8a000" strokeWidth="2"/>
      <line x1="22" y1="16" x2="28" y2="16" stroke="#c8a000" strokeWidth="2"/>
      {/* Gun silhouette */}
      <rect x="13" y="14" width="10" height="3" fill="#c8a000"/>
      <rect x="20" y="12" width="4"  height="5" fill="#c8a000"/>
      <rect x="21" y="17" width="2"  height="4" fill="#c8a000"/>
      <rect x="12" y="15" width="2"  height="2" fill="#c8a000"/>
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  LAUNCHER (Early Steam style)
// ══════════════════════════════════════════════════════════════════════════════
const FAKE_STATS = { hours:'1 247', rank:'Global Elite', wins:'842', kd:'1.38', hs:'47%' }
const NEWS = [
  { date:'2026-04-22', title:'Operation Breakout — Nouveau mode Deathmatch' },
  { date:'2026-04-18', title:'Mise à jour des armes : AWP et M4A1-S rééquilibrés' },
  { date:'2026-04-10', title:'de_anubis et de_ancient ajoutés au pool compétitif' },
]

function LauncherScreen({ onPlay }) {
  const [hover, setHover] = useState(false)

  return (
    <div style={{ background:'#1b2838', height:'100%', display:'flex', flexDirection:'column', fontFamily:'"Courier New",monospace', overflow:'hidden' }}>

      {/* Banner hero */}
      <div style={{ position:'relative', height:90, background:'linear-gradient(135deg,#0e1821 0%,#1a2a3a 40%,#0a1520 100%)', flexShrink:0, display:'flex', alignItems:'center', padding:'0 16px', gap:14, overflow:'hidden' }}>
        {/* Decorative grid */}
        <svg style={{ position:'absolute', inset:0, opacity:0.06 }} width="100%" height="100%">
          {Array.from({length:10},(_,i)=><line key={`v${i}`} x1={i*50} y1="0" x2={i*50} y2="90" stroke="#4fa3d5" strokeWidth="0.5"/>)}
          {Array.from({length:5},(_,i)=><line key={`h${i}`}  x1="0" y1={i*20} x2="500" y2={i*20} stroke="#4fa3d5" strokeWidth="0.5"/>)}
        </svg>
        <CsLogo size={56} />
        <div>
          <div style={{ color:'#c6d4df', fontSize:15, fontWeight:'bold', letterSpacing:3, textShadow:'0 0 18px #4fa3d580' }}>
            COUNTER-STRIKE
          </div>
          <div style={{ color:'#c8a000', fontSize:9, letterSpacing:4, marginTop:2 }}>GLOBAL OFFENSIVE</div>
          <div style={{ color:'#4a6070', fontSize:8, marginTop:4, letterSpacing:1 }}>Version 1.38.9.0 · Secure</div>
        </div>
        {/* Steam-style badge */}
        <div style={{ marginLeft:'auto', textAlign:'right' }}>
          <div style={{ color:'#4fa3d5', fontSize:8, letterSpacing:1 }}>JOUÉ RÉCEMMENT</div>
          <div style={{ color:'#c6d4df', fontSize:11, fontWeight:'bold' }}>{FAKE_STATS.hours}h</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Left: stats + play */}
        <div style={{ width:170, borderRight:'1px solid #2a3540', padding:'12px 10px', display:'flex', flexDirection:'column', gap:10 }}>
          {/* Play button */}
          <button
            onClick={() => { csClick(); onPlay() }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
              background: hover ? 'linear-gradient(180deg,#4fa3d5,#1a6898)' : 'linear-gradient(180deg,#1a6898,#0e4060)',
              border:'1px solid #4fa3d5',
              color:'#fff', fontFamily:'"Courier New",monospace', fontSize:13, fontWeight:'bold',
              padding:'10px 0', cursor:'pointer', letterSpacing:3, width:'100%',
              boxShadow: hover ? '0 0 12px #4fa3d560' : 'none',
              transition:'all 0.1s',
            }}
          >
            ▶ JOUER
          </button>

          {/* Stats grid */}
          <div style={{ borderTop:'1px solid #2a3540', paddingTop:8 }}>
            <div style={{ color:'#4a6070', fontSize:8, letterSpacing:2, marginBottom:6 }}>STATISTIQUES</div>
            {[
              ['Rang',        FAKE_STATS.rank],
              ['Victoires',   FAKE_STATS.wins],
              ['Ratio K/D',   FAKE_STATS.kd],
              ['Headshots',   FAKE_STATS.hs],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ color:'#607080', fontSize:9 }}>{k}</span>
                <span style={{ color:'#c6d4df', fontSize:9, fontWeight:'bold' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Controls reminder */}
          <div style={{ borderTop:'1px solid #2a3540', paddingTop:8, marginTop:'auto' }}>
            <div style={{ color:'#4a6070', fontSize:8, letterSpacing:1, marginBottom:4 }}>CONTRÔLES</div>
            {[['ZQSD','Déplacer'],['Glisser souris','Viser'],['Clic','Tirer'],['R / F','Recharger'],['ESC','Menu']].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ color:'#c8a000', fontSize:8, fontWeight:'bold' }}>{k}</span>
                <span style={{ color:'#607080', fontSize:8 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: news + achievements */}
        <div style={{ flex:1, padding:'12px 12px', overflowY:'auto', display:'flex', flexDirection:'column', gap:10 }}>
          {/* News */}
          <div>
            <div style={{ color:'#4a6070', fontSize:8, letterSpacing:2, marginBottom:6 }}>ACTUALITÉS CS:GO</div>
            {NEWS.map((n,i) => (
              <div key={i} style={{ borderLeft:'2px solid #1a6898', padding:'4px 8px', marginBottom:6, background:'#16202d' }}>
                <div style={{ color:'#4fa3d5', fontSize:8, marginBottom:2 }}>{n.date}</div>
                <div style={{ color:'#c6d4df', fontSize:9, lineHeight:1.4 }}>{n.title}</div>
              </div>
            ))}
          </div>

          {/* Map info */}
          <div style={{ borderTop:'1px solid #2a3540', paddingTop:8 }}>
            <div style={{ color:'#4a6070', fontSize:8, letterSpacing:2, marginBottom:6 }}>CARTE EN JEU</div>
            <MapThumb />
          </div>
        </div>
      </div>
    </div>
  )
}

// Mini SVG "thumbnail" de de_dust2
function MapThumb() {
  return (
    <div style={{ position:'relative', height:80, background:'#0e1821', border:'1px solid #2a3540', overflow:'hidden' }}>
      <svg width="100%" height="100%" viewBox="0 0 200 80" style={{ opacity:0.85 }}>
        {/* Map outline */}
        <rect x="5"  y="5"  width="190" height="70" fill="none" stroke="#2a3a4a" strokeWidth="1"/>
        {/* Sites */}
        <rect x="10" y="10" width="40" height="25" fill="#1a2830" stroke="#c8a000" strokeWidth="0.5"/>
        <rect x="150" y="45" width="40" height="25" fill="#1a2830" stroke="#c8a000" strokeWidth="0.5"/>
        <text x="23" y="26" fill="#c8a000" fontSize="7" fontFamily="monospace">A</text>
        <text x="163" y="61" fill="#c8a000" fontSize="7" fontFamily="monospace">B</text>
        {/* Corridors */}
        <rect x="50" y="17" width="60" height="6"  fill="#243040"/>
        <rect x="90" y="23" width="6"  height="35" fill="#243040"/>
        <rect x="50" y="52" width="60" height="6"  fill="#243040"/>
        <rect x="96" y="17" width="55" height="6"  fill="#243040"/>
        {/* Spawn areas */}
        <rect x="10" y="50" width="28" height="18" fill="#1a3020" stroke="#4a7050" strokeWidth="0.5"/>
        <text x="13" y="62" fill="#4a7050" fontSize="6" fontFamily="monospace">CT</text>
        <rect x="163" y="10" width="27" height="18" fill="#3a1a10" stroke="#7a4030" strokeWidth="0.5"/>
        <text x="167" y="22" fill="#7a4030" fontSize="6" fontFamily="monospace">T</text>
      </svg>
      <div style={{ position:'absolute', bottom:4, right:6, color:'#4a6070', fontSize:8, fontFamily:'monospace' }}>de_dust2</div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  ROOT EXPORT
// ══════════════════════════════════════════════════════════════════════════════
export function CsgoLegacy() {
  const [phase, setPhase] = useState('launcher')  // launcher | loading | game

  const handlePlay   = useCallback(() => setPhase('loading'),  [])
  const handleDone   = useCallback(() => setPhase('game'),     [])
  const handleExit   = useCallback(() => setPhase('launcher'), [])

  if (phase === 'launcher') return <LauncherScreen onPlay={handlePlay} />
  if (phase === 'loading')  return <LoadingScreen  onDone={handleDone} />
  return <FPSGame onExit={handleExit} />
}
