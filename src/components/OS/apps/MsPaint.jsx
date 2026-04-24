import { useRef, useState, useEffect, useCallback } from 'react'
import { useFsStore } from '../../../stores/fsStore'

// ── Win95 color palette (28 colors) ───────────────────────────────────────
const PALETTE = [
  '#000000','#808080','#800000','#808000','#008000','#008080','#000080','#800080',
  '#ffffff','#c0c0c0','#ff0000','#ffff00','#00ff00','#00ffff','#0000ff','#ff00ff',
  '#ff8040','#804000','#004000','#0080ff','#004080','#8000ff','#ff0080','#ff8080',
  '#ffff80','#00ff80','#80ffff','#8080ff',
]

const CANVAS_W = 560
const CANVAS_H = 340

// ── Iterative flood fill ───────────────────────────────────────────────────
function floodFill(ctx, sx, sy, fillHex) {
  const { width, height } = ctx.canvas
  const img  = ctx.getImageData(0, 0, width, height)
  const data = img.data
  const si   = (sy * width + sx) * 4
  const sR = data[si], sG = data[si+1], sB = data[si+2], sA = data[si+3]

  const fR = parseInt(fillHex.slice(1,3), 16)
  const fG = parseInt(fillHex.slice(3,5), 16)
  const fB = parseInt(fillHex.slice(5,7), 16)
  if (sR===fR && sG===fG && sB===fB && sA===255) return

  // Tolerance to handle antialiased edges
  const TOLS = 30
  const match = (i) =>
    Math.abs(data[i]-sR)   <= TOLS &&
    Math.abs(data[i+1]-sG) <= TOLS &&
    Math.abs(data[i+2]-sB) <= TOLS &&
    data[i+3] > 200

  const seen  = new Uint8Array(width * height)
  const stack = [sx + sy * width]
  seen[sx + sy * width] = 1

  while (stack.length) {
    const pos = stack.pop()
    const i   = pos * 4
    if (!match(i)) continue
    data[i] = fR; data[i+1] = fG; data[i+2] = fB; data[i+3] = 255
    const x = pos % width, y = (pos / width) | 0
    const push = (nx, ny) => {
      const np = nx + ny * width
      if (nx>=0 && nx<width && ny>=0 && ny<height && !seen[np]) {
        seen[np] = 1; stack.push(np)
      }
    }
    push(x+1,y); push(x-1,y); push(x,y+1); push(x,y-1)
  }
  ctx.putImageData(img, 0, 0)
}

// ── Tool button ────────────────────────────────────────────────────────────
function ToolBtn({ active, onClick, title, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        fontFamily: 'var(--w-font)',
        fontSize: 13,
        lineHeight: 1,
        padding: '2px 6px',
        minWidth: 28,
        minHeight: 26,
        cursor: 'pointer',
        background: active ? '#808080' : 'var(--w-surface)',
        color: active ? '#fff' : '#000',
        boxShadow: active
          ? 'inset 1px 1px #000, inset -1px -1px #fff, inset 2px 2px #808080'
          : 'inset -1px -1px #000, inset 1px 1px #fff, inset -2px -2px #808080, inset 2px 2px #dfdfdf',
        border: 'none',
        userSelect: 'none',
      }}
    >
      {children}
    </button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function MsPaint({ initialFileId }) {
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)
  const lastPos   = useRef(null)

  const [tool,      setTool]      = useState('brush') // 'brush' | 'eraser' | 'fill'
  const [color,     setColor]     = useState('#000000')
  const [bgColor,   setBgColor]   = useState('#ffffff')
  const [brushSize, setBrushSize] = useState(3)
  const [pickingBg, setPickingBg] = useState(false)  // true = next palette click sets bg

  const createItem    = useFsStore((s) => s.createItem)
  const renameItem    = useFsStore((s) => s.renameItem)
  const updateContent = useFsStore((s) => s.updateContent)

  // Init white canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
  }, [])

  // Convert mouse event to canvas coordinates (handles CSS scaling + 3D transform)
  const getPos = useCallback((e) => {
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    return {
      x: Math.round((e.clientX - rect.left) * (CANVAS_W / rect.width)),
      y: Math.round((e.clientY - rect.top)  * (CANVAS_H / rect.height)),
    }
  }, [])

  const applyBrush = useCallback((ctx, from, to) => {
    const eraserMode = tool === 'eraser'
    ctx.lineWidth   = eraserMode ? brushSize * 4 : brushSize
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.strokeStyle = eraserMode ? bgColor : color
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }, [tool, color, bgColor, brushSize])

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0 && e.button !== 2) return
    e.preventDefault()
    const canvas   = canvasRef.current
    const ctx      = canvas.getContext('2d')
    const pos      = getPos(e)
    const useColor = e.button === 2 ? bgColor : color

    if (tool === 'fill') {
      floodFill(ctx, Math.max(0, Math.min(CANVAS_W-1, pos.x)), Math.max(0, Math.min(CANVAS_H-1, pos.y)), useColor)
      return
    }

    isDrawing.current = true
    lastPos.current   = pos

    // Draw initial dot
    ctx.lineWidth   = tool === 'eraser' ? brushSize * 4 : brushSize
    ctx.lineCap     = 'round'
    ctx.strokeStyle = tool === 'eraser' ? bgColor : useColor
    ctx.fillStyle   = tool === 'eraser' ? bgColor : useColor
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, ctx.lineWidth / 2, 0, Math.PI * 2)
    ctx.fill()

    const onMove = (me) => {
      if (!isDrawing.current) return
      const p = getPos(me)
      applyBrush(canvas.getContext('2d'), lastPos.current, p)
      lastPos.current = p
    }
    const onUp = () => {
      isDrawing.current = false
      lastPos.current   = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }, [tool, color, bgColor, brushSize, getPos, applyBrush])

  const handlePaletteClick = useCallback((c) => {
    if (pickingBg) { setBgColor(c); setPickingBg(false) }
    else           setColor(c)
  }, [pickingBg])

  const handleExport = useCallback(() => {
    const canvas  = canvasRef.current
    const dataUrl = canvas.toDataURL('image/png')
    const id      = createItem('file', null, { x: 80, y: 170 })
    renameItem(id, 'dessin.bmp')
    updateContent(id, dataUrl)
  }, [createItem, renameItem, updateContent])

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
  }, [bgColor])

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--w-surface)', overflow:'hidden' }}>

      {/* ── Toolbar ── */}
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'2px 4px', borderBottom:'2px solid #808080', flexWrap:'wrap', flexShrink:0 }}>
        <ToolBtn active={tool==='brush'}  onClick={() => setTool('brush')}  title="Pinceau (B)">✏️</ToolBtn>
        <ToolBtn active={tool==='eraser'} onClick={() => setTool('eraser')} title="Gomme (E)">⬜</ToolBtn>
        <ToolBtn active={tool==='fill'}   onClick={() => setTool('fill')}   title="Remplissage (F)">🪣</ToolBtn>

        <div style={{ width:1, height:22, background:'#808080', margin:'0 3px' }}/>

        <label style={{ display:'flex', alignItems:'center', gap:4, fontFamily:'var(--w-font)', fontSize:10 }}>
          Taille :
          <input
            type="range" min={1} max={24} value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            style={{ width:55 }}
          />
          <span style={{ minWidth:18 }}>{brushSize}</span>
        </label>

        <div style={{ width:1, height:22, background:'#808080', margin:'0 3px' }}/>

        <ToolBtn active={false} onClick={handleClear} title="Effacer tout">🗑️</ToolBtn>
        <ToolBtn active={false} onClick={handleExport} title="Exporter vers le Bureau">💾</ToolBtn>
      </div>

      {/* ── Canvas area ── */}
      <div style={{ flex:1, overflow:'auto', background:'#808080', padding:6 }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display:'block', cursor:'crosshair', imageRendering:'pixelated', boxShadow:'2px 2px 0 #000,inset 1px 1px #fff' }}
          onMouseDown={onMouseDown}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      {/* ── Color palette ── */}
      <div style={{ display:'flex', alignItems:'center', gap:2, padding:'3px 6px', borderTop:'2px solid #808080', flexShrink:0 }}>
        {/* Active colors preview */}
        <div style={{ position:'relative', width:28, height:28, flexShrink:0, marginRight:6 }}>
          <div
            title={`Fond : ${bgColor} (Clic droit palette pour changer)`}
            style={{ position:'absolute', bottom:0, right:0, width:18, height:18, background:bgColor, border:'1px solid #000', cursor:'pointer' }}
            onClick={() => setPickingBg(true)}
          />
          <div
            title={`Premier plan : ${color}`}
            style={{ position:'absolute', top:0, left:0, width:18, height:18, background:color, border:'1px solid #000' }}
          />
        </div>

        {/* Palette cells */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:1, maxWidth:320 }}>
          {PALETTE.map((c) => (
            <button
              key={c}
              title={c}
              onMouseDown={(e) => { e.preventDefault(); if(e.button===2){setBgColor(c)}else{handlePaletteClick(c)} }}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                width:14, height:14, padding:0, flexShrink:0, cursor:'pointer',
                background: c,
                border: (color===c||bgColor===c) ? '2px solid #000' : '1px solid #808080',
              }}
            />
          ))}
        </div>

        {pickingBg && (
          <span style={{ fontFamily:'var(--w-font)', fontSize:10, color:'#808080', marginLeft:6 }}>
            Cliquez une couleur → fond
          </span>
        )}
      </div>
    </div>
  )
}
