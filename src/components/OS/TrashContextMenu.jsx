import { useEffect, useRef } from 'react'
import { win95sounds }  from '../../utils/win95sounds'
import { useFsStore }   from '../../stores/fsStore'

export function TrashContextMenu({ clientX, clientY, isEmpty, onOpen, onClose }) {
  const menuRef    = useRef(null)
  const emptyTrash = useFsStore((s) => s.emptyTrash)

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
      style={{ position: 'fixed', left: clientX, top: clientY, zIndex: 9999 }}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="win95-contextmenu-item"
        onMouseDown={() => { win95sounds.click(); onOpen(); onClose() }}
      >
        Ouvrir
      </div>
      <div className="win95-contextmenu-divider" />
      <div
        className={`win95-contextmenu-item${isEmpty ? ' disabled' : ''}`}
        onMouseDown={() => {
          if (isEmpty) return
          win95sounds.click()
          emptyTrash()
          onClose()
        }}
      >
        Vider la Corbeille
      </div>
    </div>
  )
}
