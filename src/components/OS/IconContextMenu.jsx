import { useEffect, useRef } from 'react'
import { win95sounds }  from '../../utils/win95sounds'
import { useFsStore }   from '../../stores/fsStore'

export function IconContextMenu({
  clientX, clientY, item,
  context = 'normal',
  onRename,
  onOpen,
  onClose,
}) {
  const menuRef       = useRef(null)
  const trashItem     = useFsStore((s) => s.trashItem)
  const restoreItem   = useFsStore((s) => s.restoreItem)
  const deleteItem    = useFsStore((s) => s.deleteItem)

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
      {context === 'normal' && (
        <>
          <div
            className="win95-contextmenu-item"
            onMouseDown={() => { win95sounds.click(); onOpen?.(item); onClose() }}
          >
            Ouvrir
          </div>
          <div className="win95-contextmenu-divider" />
          <div
            className="win95-contextmenu-item"
            onMouseDown={() => { win95sounds.click(); onRename?.(item.id); onClose() }}
          >
            Renommer
          </div>
          <div
            className="win95-contextmenu-item"
            onMouseDown={() => { win95sounds.click(); trashItem(item.id); onClose() }}
          >
            Supprimer
          </div>
        </>
      )}
      {context === 'trash' && (
        <>
          <div
            className="win95-contextmenu-item"
            onMouseDown={() => { win95sounds.click(); onOpen?.(item); onClose() }}
          >
            Ouvrir
          </div>
          <div className="win95-contextmenu-divider" />
          <div
            className="win95-contextmenu-item"
            onMouseDown={() => { win95sounds.click(); restoreItem(item.id); onClose() }}
          >
            Restaurer
          </div>
          <div
            className="win95-contextmenu-item"
            onMouseDown={() => { win95sounds.click(); deleteItem(item.id); onClose() }}
          >
            Supprimer définitivement
          </div>
        </>
      )}
    </div>
  )
}
