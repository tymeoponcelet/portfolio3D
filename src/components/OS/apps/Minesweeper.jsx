import { useState, useCallback, useEffect, useRef } from 'react'

// ── Difficulty levels ──────────────────────────────────────────────────────
const LEVELS = {
  easy:   { rows: 9,  cols: 9,  mines: 10, label: 'Débutant' },
  medium: { rows: 16, cols: 16, mines: 40, label: 'Intermédiaire' },
  hard:   { rows: 16, cols: 30, mines: 99, label: 'Expert' },
}

// ── Board generation (guaranteed safe first click) ─────────────────────────
function generateBoard(rows, cols, mines, safeR, safeC) {
  const safeSet = new Set()
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const r = safeR + dr, c = safeC + dc
    if (r >= 0 && r < rows && c >= 0 && c < cols) safeSet.add(r * cols + c)
  }

  const pool = []
  for (let i = 0; i < rows * cols; i++) if (!safeSet.has(i)) pool.push(i)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const mineSet = new Set(pool.slice(0, mines))

  const cells = Array.from({ length: rows * cols }, (_, i) => ({
    mine: mineSet.has(i), revealed: false, flagged: false, question: false, count: 0, exploded: false,
  }))

  // Compute adjacent mine counts
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (cells[r * cols + c].mine) continue
    let count = 0
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && cells[nr * cols + nc].mine) count++
    }
    cells[r * cols + c].count = count
  }
  return cells
}

// ── Iterative BFS reveal ───────────────────────────────────────────────────
function bfsReveal(cells, rows, cols, startR, startC) {
  const next    = cells.map((c) => ({ ...c }))
  const queue   = [[startR, startC]]
  const visited = new Set([startR * cols + startC])

  while (queue.length) {
    const [r, c] = queue.shift()
    const idx    = r * cols + c
    if (next[idx].flagged || next[idx].mine) continue
    next[idx].revealed = true

    if (next[idx].count === 0) {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc, ni = nr * cols + nc
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(ni)) {
          visited.add(ni)
          queue.push([nr, nc])
        }
      }
    }
  }
  return next
}

// ── Number colors (Win95 exact) ────────────────────────────────────────────
const NUM_COLOR = ['','#0000ff','#008000','#ff0000','#00008b','#8b0000','#008b8b','#000000','#808080']

// ── LED display ────────────────────────────────────────────────────────────
function LedDisplay({ value }) {
  return (
    <div style={{
      background: '#000', color: '#ff0000',
      fontFamily: '"Courier New", monospace',
      fontSize: 20, fontWeight: 'bold',
      padding: '2px 6px', minWidth: 46,
      textAlign: 'right', letterSpacing: 2,
      boxShadow: 'inset 1px 1px #808080, inset -1px -1px #fff',
    }}>
      {String(Math.max(0, Math.min(999, value))).padStart(3, '0')}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function Minesweeper() {
  const [levelKey, setLevelKey] = useState('easy')
  const [cells,    setCells]    = useState(null)
  const [status,   setStatus]   = useState('idle')   // idle | playing | won | lost
  const [flags,    setFlags]    = useState(0)
  const [time,     setTime]     = useState(0)
  const timerRef = useRef(null)

  const { rows, cols, mines } = LEVELS[levelKey]

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  useEffect(() => () => stopTimer(), [stopTimer])

  const reset = useCallback((lvl = levelKey) => {
    stopTimer()
    setLevelKey(lvl)
    setCells(null)
    setStatus('idle')
    setFlags(0)
    setTime(0)
  }, [levelKey, stopTimer])

  const handleReveal = useCallback((r, c) => {
    if (status === 'won' || status === 'lost') return
    const lvl  = LEVELS[levelKey]

    // First click: generate board now
    let board = cells
    if (!board) {
      board = generateBoard(lvl.rows, lvl.cols, lvl.mines, r, c)
      timerRef.current = setInterval(() => setTime((t) => Math.min(t + 1, 999)), 1000)
      setStatus('playing')
    }

    const idx = r * lvl.cols + c
    if (board[idx].revealed || board[idx].flagged) return

    if (board[idx].mine) {
      const exploded = board.map((cell, i) => ({
        ...cell,
        revealed: cell.mine ? true : cell.revealed,
        exploded: i === idx,
      }))
      setCells(exploded)
      setStatus('lost')
      stopTimer()
      return
    }

    const next = bfsReveal(board, lvl.rows, lvl.cols, r, c)
    const won  = next.every((cell) => cell.mine || cell.revealed)
    setCells(next)
    if (won) { setStatus('won'); stopTimer() }
  }, [cells, status, levelKey, stopTimer])

  const handleFlag = useCallback((e, r, c) => {
    e.preventDefault()
    if (status === 'won' || status === 'lost' || !cells) return
    const idx = r * cols + c
    if (cells[idx].revealed) return
    const next = cells.map((cell, i) => {
      if (i !== idx) return cell
      if (!cell.flagged && !cell.question) return { ...cell, flagged: true }
      if (cell.flagged)                    return { ...cell, flagged: false, question: true }
      return                                      { ...cell, question: false }
    })
    const wasFlagged = cells[idx].flagged
    const nowFlagged = next[idx].flagged
    setFlags((f) => f + (nowFlagged ? 1 : wasFlagged ? -1 : 0))
    setCells(next)
  }, [cells, status, cols])

  const face = status === 'lost' ? '😵' : status === 'won' ? '😎' : '🙂'
  const remaining = mines - flags

  const cellSize = levelKey === 'hard' ? 16 : 20

  return (
    <div
      style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:8, background:'var(--w-surface)', height:'100%', boxSizing:'border-box', overflow:'auto', userSelect:'none' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Difficulty selector */}
      <div style={{ display:'flex', gap:4, marginBottom:8 }}>
        {Object.entries(LEVELS).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => reset(key)}
            style={{
              fontFamily:'var(--w-font)', fontSize:10, padding:'2px 8px', cursor:'pointer',
              background: levelKey===key ? '#808080' : 'var(--w-surface)',
              color:      levelKey===key ? '#fff'    : '#000',
              boxShadow:  levelKey===key
                ? 'inset 1px 1px #000, inset -1px -1px #fff'
                : 'inset -1px -1px #000, inset 1px 1px #fff',
              border: 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Header panel */}
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        width: cols * cellSize + 6,
        padding:'4px 6px', marginBottom:4,
        boxShadow:'inset 2px 2px #808080, inset -1px -1px #fff',
        background:'var(--w-surface)',
      }}>
        <LedDisplay value={remaining} />
        <button
          onClick={() => reset()}
          style={{ fontSize:16, lineHeight:1, padding:'1px 6px', cursor:'pointer', background:'var(--w-surface)', border:'none', boxShadow:'inset -1px -1px #000, inset 1px 1px #fff, inset -2px -2px #808080, inset 2px 2px #dfdfdf' }}
        >
          {face}
        </button>
        <LedDisplay value={time} />
      </div>

      {/* Grid */}
      <div
        style={{
          display:'grid',
          gridTemplateColumns:`repeat(${cols}, ${cellSize}px)`,
          boxShadow:'inset 2px 2px #808080, inset -1px -1px #fff',
          border:'3px solid',
          borderColor:'#808080 #fff #fff #808080',
        }}
      >
        {(cells ?? Array(rows * cols).fill(null)).map((cell, i) => {
          const r = (i / cols) | 0, c = i % cols
          const ch = cell ?? { mine:false, revealed:false, flagged:false, question:false, count:0, exploded:false }

          let content = null
          let bg  = 'var(--w-surface)'
          let shadow = `inset -${cellSize===16?1:2}px -${cellSize===16?1:2}px #000, inset ${cellSize===16?1:2}px ${cellSize===16?1:2}px #fff, inset -${cellSize===16?2:3}px -${cellSize===16?2:3}px #808080, inset ${cellSize===16?2:3}px ${cellSize===16?2:3}px #dfdfdf`
          let color = '#000'
          let fontSize = cellSize === 16 ? 10 : 12

          if (ch.revealed) {
            bg = '#c0c0c0'
            shadow = 'inset 1px 1px #808080'
            if (ch.mine) {
              content = ch.exploded ? '💥' : '💣'
              bg      = ch.exploded ? '#ff0000' : '#c0c0c0'
              fontSize = cellSize === 16 ? 9 : 11
            } else if (ch.count > 0) {
              content  = ch.count
              color    = NUM_COLOR[ch.count]
              fontSize = cellSize === 16 ? 10 : 13
            }
          } else if (ch.flagged) {
            content  = '🚩'
            fontSize = cellSize === 16 ? 9 : 11
          } else if (ch.question) {
            content  = '?'
            color    = '#808000'
            fontSize = cellSize === 16 ? 11 : 14
          }

          return (
            <button
              key={i}
              onClick={() => handleReveal(r, c)}
              onContextMenu={(e) => handleFlag(e, r, c)}
              style={{
                width:cellSize, height:cellSize,
                padding:0, margin:0, border:'none',
                background:bg, boxShadow:shadow,
                fontFamily:'var(--w-font)',
                fontSize, fontWeight:'bold', color,
                cursor:'default', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1,
              }}
            >
              {content}
            </button>
          )
        })}
      </div>

      {/* Status message */}
      {(status === 'won' || status === 'lost') && (
        <p style={{ fontFamily:'var(--w-font)', fontSize:11, marginTop:8, fontWeight:'bold' }}>
          {status === 'won' ? `🎉 Félicitations ! Terminé en ${time}s.` : '💣 Boom ! Réessayez.'}
        </p>
      )}
    </div>
  )
}
