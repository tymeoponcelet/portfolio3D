import { useState, useEffect, useRef, useCallback } from 'react'
import { useOSStore }        from '../../stores/osStore'
import { win95sounds }       from '../../utils/win95sounds'
import { Calculator }        from './apps/Calculator'
import { WallpaperPicker }   from './apps/WallpaperPicker'
import { ShowcaseExplorer }  from './apps/ShowcaseExplorer'
import { FileExplorer }      from './apps/FileExplorer'
import { MsPaint }           from './apps/MsPaint'
import { Minesweeper }       from './apps/Minesweeper'
import { CsgoLegacy }        from './apps/CsgoLegacy'

const CALC_WINDOW = {
  appId: 'calculator', title: 'Calculatrice', icon: '🧮',
  width: 240, height: 300, content: <Calculator />,
}
const WALLPAPER_WINDOW = {
  appId: 'wallpaper', title: "Propriétés de l'affichage", icon: '🖼️',
  width: 400, height: 320, content: <WallpaperPicker />,
}
const EXPLORER_WINDOW = {
  appId: 'desktop-explorer', title: 'Bureau', icon: '📁',
  width: 480, height: 340, content: <FileExplorer folderId={null} />,
}
const PORTFOLIO_WINDOW = {
  appId: 'showcase', title: 'Portfolio — Tyméo Poncelet', icon: '🖥️',
  width: 780, height: 540, content: <ShowcaseExplorer />,
}

export function RunDialog() {
  const runDialogOpen  = useOSStore((s) => s.runDialogOpen)
  const closeRunDialog = useOSStore((s) => s.closeRunDialog)
  const openWindow     = useOSStore((s) => s.openWindow)
  const triggerShutdown = useOSStore((s) => s.triggerShutdown)
  const setWallpaper   = useOSStore((s) => s.setWallpaper)

  const [cmd,       setCmd]       = useState('')
  const [error,     setError]     = useState('')
  const [dialogPos, setDialogPos] = useState(null)
  const inputRef  = useRef(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    if (runDialogOpen) {
      setError('')
      setDialogPos(null)   // recentre à chaque ouverture
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [runDialogOpen])

  const handleTitleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    e.preventDefault()
    const rect = dialogRef.current?.getBoundingClientRect()
    if (!rect) return
    const offX = e.clientX - rect.left
    const offY = e.clientY - rect.top

    const onMove = (me) => {
      setDialogPos({ left: me.clientX - offX, top: me.clientY - offY })
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }, [])

  const execute = useCallback(() => {
    const trimmed = cmd.trim()
    const lower   = trimmed.toLowerCase()
    setError('')

    if (lower === 'shutdown') {
      closeRunDialog()
      triggerShutdown()
      return
    }

    if (lower.startsWith('color ')) {
      const hex = trimmed.slice(6).trim()
      if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
        setWallpaper({ type: 'solid', value: hex })
        closeRunDialog()
        return
      }
      setError('Couleur invalide. Format attendu : #rrggbb (ex: #1a2b3c)')
      return
    }

    const PAINT_WINDOW = {
      appId: 'mspaint', title: 'Paint', icon: '🎨', width: 640, height: 460, content: <MsPaint />,
    }
    const MINESWEEPER_WINDOW = {
      appId: 'minesweeper', title: 'Démineur', icon: '💣', width: 240, height: 320, content: <Minesweeper />,
    }
    const CSGO_WINDOW = {
      appId: 'csgo', title: 'CS:GO Legacy', icon: '🔫', width: 640, height: 420, content: <CsgoLegacy />,
    }

    const OPEN_MAP = {
      'calculator':      CALC_WINDOW,
      'open calculator': CALC_WINDOW,
      'wallpaper':       WALLPAPER_WINDOW,
      'open wallpaper':  WALLPAPER_WINDOW,
      'explorer':        EXPLORER_WINDOW,
      'open explorer':   EXPLORER_WINDOW,
      'portfolio':       PORTFOLIO_WINDOW,
      'open portfolio':  PORTFOLIO_WINDOW,
      'paint':           PAINT_WINDOW,
      'mspaint':         PAINT_WINDOW,
      'open paint':      PAINT_WINDOW,
      'minesweeper':     MINESWEEPER_WINDOW,
      'démineur':        MINESWEEPER_WINDOW,
      'demineur':        MINESWEEPER_WINDOW,
      'open minesweeper':MINESWEEPER_WINDOW,
      'csgo':            CSGO_WINDOW,
      'cs:go':           CSGO_WINDOW,
      'open csgo':       CSGO_WINDOW,
    }

    if (OPEN_MAP[lower]) {
      openWindow(OPEN_MAP[lower])
      closeRunDialog()
      return
    }

    setError(`Windows ne peut pas trouver "${trimmed}". Vérifiez le nom et réessayez.`)
  }, [cmd, closeRunDialog, openWindow, triggerShutdown, setWallpaper])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter')  { e.preventDefault(); win95sounds.click(); execute() }
    if (e.key === 'Escape') { closeRunDialog() }
  }, [execute, closeRunDialog])

  if (!runDialogOpen) return null

  const posStyle = dialogPos
    ? { top: dialogPos.top, left: dialogPos.left, transform: 'none' }
    : {}

  return (
    <div ref={dialogRef} className="win95-run-dialog" style={posStyle} onKeyDown={handleKeyDown}>
      {/* ── Title bar ── */}
      <div className="win95-titlebar" onMouseDown={handleTitleMouseDown} style={{ cursor: 'move' }}>
        <span className="win95-titlebar-title">Exécuter</span>
        <button
          className="win95-titlebar-btn"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => { win95sounds.click(); closeRunDialog() }}
        >
          ✕
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Icon + description */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>⚙️</span>
          <p style={{ fontFamily: 'var(--w-font)', fontSize: 11, lineHeight: 1.4, margin: 0 }}>
            Entrez le nom d'un programme, dossier, document ou ressource Internet et Windows l'ouvrira.
          </p>
        </div>

        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontFamily: 'var(--w-font)', fontSize: 11, flexShrink: 0 }}>
            Ouvrir :
          </label>
          <input
            ref={inputRef}
            className="win95-run-input"
            value={cmd}
            onChange={(e) => { setCmd(e.target.value); setError('') }}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Error */}
        {error && <p className="win95-run-error">{error}</p>}

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button
            className="win95-toolbar-btn"
            onClick={() => { win95sounds.click(); execute() }}
          >
            OK
          </button>
          <button
            className="win95-toolbar-btn"
            onClick={() => { win95sounds.click(); closeRunDialog() }}
          >
            Annuler
          </button>
          <button className="win95-toolbar-btn" disabled>
            Parcourir…
          </button>
        </div>
      </div>
    </div>
  )
}
