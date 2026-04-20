import { useEffect, useRef } from 'react'
import { win95sounds } from '../../utils/win95sounds'

export function IconContextMenu({ clientX, clientY, item, onRename, onClose }) {
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (e.type === 'keydown' && e.key === 'Escape') { onClose(); return }
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown',   handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown',   handler)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="win95-contextmenu"
      style={{ position: 'fixed', left: clientX, top: clientY }}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="win95-contextmenu-item"
        onClick={(e) => { e.stopPropagation(); win95sounds.click(); onRename(item.id); onClose() }}
      >
        Renommer
      </div>
    </div>
  )
}
