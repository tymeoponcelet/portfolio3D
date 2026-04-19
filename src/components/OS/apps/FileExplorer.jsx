import { useState, useCallback, useEffect } from 'react'
import { useFsStore }     from '../../../stores/fsStore'
import { useOSStore }     from '../../../stores/osStore'
import { DynamicIcon }    from '../DynamicIcon'
import { IconContextMenu } from '../IconContextMenu'
import { Notepad }        from './Notepad'

export function FileExplorer({ folderId, folderName }) {
  const allItems   = useFsStore((s) => s.items)
  const renameItem = useFsStore((s) => s.renameItem)
  const openWindow = useOSStore((s) => s.openWindow)

  const items = allItems.filter((i) => i.parentId === folderId)

  const [selectedId,      setSelectedId]      = useState(null)
  const [renamingId,      setRenamingId]      = useState(null)
  const [drag,            setDrag]            = useState(null)
  const [iconContextMenu, setIconContextMenu] = useState(null)

  useEffect(() => {
    if (!drag) return
    const { id } = drag

    const onMove = (e) => {
      const el         = document.elementFromPoint(e.clientX, e.clientY)
      const btn        = el?.closest('[data-itemid]')
      const tid        = btn?.dataset.itemid
      const tItem      = tid ? useFsStore.getState().items.find((i) => i.id === tid) : null
      const dropTarget = (tItem?.type === 'folder' && tid !== id) ? tid : null
      setDrag((d) => d ? { ...d, clientX: e.clientX, clientY: e.clientY, dropTarget } : null)
    }

    const onUp = (e) => {
      const el    = document.elementFromPoint(e.clientX, e.clientY)
      const btn   = el?.closest('[data-itemid]')
      const tid   = btn?.dataset.itemid
      const tItem = tid ? useFsStore.getState().items.find((i) => i.id === tid) : null

      if (tItem?.type === 'folder' && tid !== id) {
        useFsStore.getState().setParent(id, tid)
      }
      setDrag(null)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [drag?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenFsItem = useCallback((item) => {
    if (item.type === 'folder') {
      openWindow({
        appId:   `explorer-${item.id}`,
        title:   item.name,
        icon:    '📁',
        width:   480,
        height:  320,
        content: <FileExplorer folderId={item.id} folderName={item.name} />,
      })
    } else {
      openWindow({
        appId:   `notepad-${item.id}`,
        title:   `${item.name} — Bloc-notes`,
        icon:    '📄',
        width:   400,
        height:  300,
        content: <Notepad fileId={item.id} />,
      })
    }
  }, [openWindow])

  const handleSelect       = useCallback((id) => setSelectedId(id), [])
  const handleRenameStart  = useCallback((id) => setRenamingId(id), [])

  const handleRenameConfirm = useCallback((id, name) => {
    renameItem(id, name)
    setRenamingId(null)
  }, [renameItem])

  const handleRenameCancel = useCallback(() => setRenamingId(null), [])

  const handleDragStart = useCallback((item, offX, offY, clientX, clientY) => {
    setSelectedId(item.id)
    setDrag({ id: item.id, offsetX: offX, offsetY: offY, clientX, clientY, dropTarget: null })
  }, [])

  const handleIconContextMenu = useCallback((item, clientX, clientY) => {
    setSelectedId(item.id)
    setIconContextMenu({ item, clientX, clientY })
  }, [])

  const handleBodyClick = useCallback((e) => {
    e.stopPropagation()
    setSelectedId(null)
    setRenamingId(null)
    setIconContextMenu(null)
  }, [])

  const draggedItem = drag ? allItems.find((i) => i.id === drag.id) : null

  return (
    <div className="win95-fileexplorer">
      <div className="win95-fileexplorer-addressbar">
        📁 C:\Bureau\{folderName}
      </div>
      <div
        className="win95-fileexplorer-body"
        onClick={handleBodyClick}
      >
        {items.length === 0 ? (
          <p style={{ color: '#808080', fontSize: 11, padding: 16, fontFamily: 'var(--w-font)' }}>
            Ce dossier est vide.
          </p>
        ) : (
          items.map((item, index) => (
            <DynamicIcon
              key={item.id}
              item={item}
              style={{
                top:     8 + Math.floor(index / 3) * 80,
                left:    8 + (index % 3) * 80,
                opacity: drag?.id === item.id ? 0.3 : 1,
              }}
              isSelected={selectedId === item.id}
              isRenaming={renamingId === item.id}
              isDropTarget={drag?.dropTarget === item.id}
              onSelect={handleSelect}
              onOpen={handleOpenFsItem}
              onRenameStart={handleRenameStart}
              onRenameConfirm={handleRenameConfirm}
              onRenameCancel={handleRenameCancel}
              onDragStart={handleDragStart}
              onContextMenu={handleIconContextMenu}
            />
          ))
        )}

        {drag && draggedItem && (
          <div
            className="win95-drag-ghost"
            style={{ left: drag.clientX - drag.offsetX, top: drag.clientY - drag.offsetY }}
          >
            <img
              src={draggedItem.type === 'folder' ? '/png/folder.png' : '/png/txtfile.png'}
              alt=""
            />
            <span>{draggedItem.name}</span>
          </div>
        )}
      </div>

      {iconContextMenu && (
        <IconContextMenu
          clientX={iconContextMenu.clientX}
          clientY={iconContextMenu.clientY}
          item={iconContextMenu.item}
          onRename={(id) => { setRenamingId(id); setSelectedId(id) }}
          onClose={() => setIconContextMenu(null)}
        />
      )}
    </div>
  )
}
