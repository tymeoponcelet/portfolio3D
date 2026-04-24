import { useRef, useCallback, useState, useEffect } from 'react'
import { AnimatePresence }                          from 'framer-motion'
import { icons }                                    from '../../assets/icons/index.js'
import { useOSStore }                               from '../../stores/osStore'
import { useFsStore }                               from '../../stores/fsStore'
import { Window }                                   from '../Window/Window'
import { Taskbar }                                  from './Taskbar'
import { ShowcaseExplorer }                         from './apps/ShowcaseExplorer'
import { FileExplorer }                             from './apps/FileExplorer'
import { Notepad }                                  from './apps/Notepad'
import { ContextMenu, SystemProperties }            from './ContextMenu'
import { DynamicIcon }                              from './DynamicIcon'
import { IconContextMenu }                          from './IconContextMenu'
import { TrashContextMenu }                         from './TrashContextMenu'

const SHOWCASE_WINDOW = {
  appId:   'showcase',
  title:   'Portfolio — Tyméo Poncelet',
  icon:    '🖥️',
  width:   780,
  height:  540,
  content: <ShowcaseExplorer />,
}

const PROPERTIES_WINDOW = {
  appId:   'properties',
  title:   'Propriétés système',
  icon:    '🖥️',
  width:   320,
  height:  280,
  content: <SystemProperties />,
}

const TRASH_WINDOW = {
  appId:   'trash-explorer',
  title:   'Corbeille',
  icon:    '🗑️',
  width:   480,
  height:  340,
  content: <FileExplorer folderId="trash" folderName="Corbeille" />,
}

export const ICONS = [
  {
    id:      'showcase',
    label:   'Portfolio',
    iconSrc: icons.showcaseIcon,
    pos:     { top: 6, left: 10 },
    window:  SHOWCASE_WINDOW,
  },
]

function DesktopShortcut({ entry, isSelected, onSelect, onOpen, onContextMenu }) {
  const { iconSrc, label, pos } = entry
  const timerRef = useRef(null)

  const handleClick = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      onOpen()
      return
    }
    onSelect()
    timerRef.current = setTimeout(() => { timerRef.current = null }, 300)
  }, [onSelect, onOpen])

  return (
    <button
      className={`win95-shortcut${isSelected ? ' selected' : ''}`}
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={handleClick}
      aria-label={`Ouvrir ${label}`}
      onContextMenu={onContextMenu
        ? (e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e) }
        : undefined}
    >
      <div className="win95-shortcut-icon-wrap">
        {isSelected && (
          <div
            className="win95-shortcut-overlay"
            style={{ WebkitMaskImage: `url(${iconSrc})` }}
          />
        )}
        <img src={iconSrc} alt={label} className="win95-shortcut-img" />
      </div>
      <span className="win95-shortcut-label">{label}</span>
    </button>
  )
}

export function Desktop() {
  const windows    = useOSStore((s) => s.windows)
  const openWindow = useOSStore((s) => s.openWindow)

  const fsItems    = useFsStore((s) => s.items)
  const createItem = useFsStore((s) => s.createItem)
  const renameItem = useFsStore((s) => s.renameItem)

  const desktopFsItems = fsItems.filter((i) => i.parentId === null && !i.system)

  const trashIsEmpty   = useFsStore((s) => !s.items.some((i) => i.parentId === 'trash'))
  const [trashCtxMenu, setTrashCtxMenu] = useState(null)

  const [selected,        setSelected]        = useState(null)
  const [selectedFsId,    setSelectedFsId]    = useState(null)
  const [renamingId,      setRenamingId]      = useState(null)
  const [contextMenu,     setContextMenu]     = useState(null)
  const [drag,            setDrag]            = useState(null)
  const [iconContextMenu, setIconContextMenu] = useState(null)
  const desktopRef = useRef(null)

  useEffect(() => { openWindow(SHOWCASE_WINDOW) }, []) // eslint-disable-line

  useEffect(() => {
    if (!selectedFsId) return
    const handler = (e) => {
      if (e.key === 'F2') { e.preventDefault(); setRenamingId(selectedFsId) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedFsId])

  /* Global drag listeners — re-registered only when drag id changes */
  useEffect(() => {
    if (!drag) return
    const { id, offsetX, offsetY } = drag

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

      const items = useFsStore.getState().items
      const isDescendant = (ancestorId, targetId) => {
        let cur = items.find((i) => i.id === targetId)
        while (cur) {
          if (cur.parentId === ancestorId) return true
          cur = items.find((i) => i.id === cur.parentId)
        }
        return false
      }
      if (tItem?.type === 'folder' && tid !== id && !isDescendant(id, tid)) {
        useFsStore.getState().setParent(id, tid)
      } else {
        const rect = desktopRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 }
        const x    = Math.max(0, e.clientX - rect.left - offsetX)
        const y    = Math.max(0, e.clientY - rect.top  - offsetY)
        useFsStore.getState().moveItem(id, x, y)
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

  const contentRefs = useRef({})
  windows.forEach((w) => {
    if (!contentRefs.current[w.id]) {
      const icon = ICONS.find((i) => i.id === w.appId)
      contentRefs.current[w.id] = icon?.window.content ?? w.content ?? null
    }
  })
  const openIds = new Set(windows.map((w) => w.id))
  Object.keys(contentRefs.current).forEach((id) => {
    if (!openIds.has(Number(id))) delete contentRefs.current[id]
  })

  const handleOpen = useCallback((icon) => { openWindow(icon.window) }, [openWindow])

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    if (e.target.closest('.win95-window')) return
    setIconContextMenu(null)
    const rect = desktopRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 }
    setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  const openProperties = useCallback(() => { openWindow(PROPERTIES_WINDOW) }, [openWindow])

  const findFreePos = useCallback(() => {
    const STEP = 80, X = 10, START_Y = 170
    for (let row = 0; row < 30; row++) {
      const y = START_Y + row * STEP
      const taken = desktopFsItems.some(
        (i) => i.pos && Math.abs(i.pos.x - X) < STEP && Math.abs(i.pos.y - y) < STEP
      )
      if (!taken) return { x: X, y }
    }
    return { x: X + STEP, y: START_Y }
  }, [desktopFsItems])

  const handleCreateFolder = useCallback(() => {
    const id = createItem('folder', null, findFreePos())
    setRenamingId(id)
  }, [createItem, findFreePos])

  const handleCreateFile = useCallback(() => {
    const id = createItem('file', null, findFreePos())
    setRenamingId(id)
  }, [createItem, findFreePos])

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

  const handleFsSelect    = useCallback((id) => { setSelectedFsId(id); setSelected(null) }, [])
  const handleRenameStart = useCallback((id) => setRenamingId(id), [])

  const handleRenameConfirm = useCallback((id, name) => {
    renameItem(id, name)
    setRenamingId(null)
  }, [renameItem])

  const handleRenameCancel = useCallback(() => setRenamingId(null), [])

  const handleDragStart = useCallback((item, offX, offY, clientX, clientY) => {
    setSelectedFsId(item.id)
    setDrag({ id: item.id, offsetX: offX, offsetY: offY, clientX, clientY, dropTarget: null })
  }, [])

  const handleIconContextMenu = useCallback((item, clientX, clientY) => {
    setSelectedFsId(item.id)
    setContextMenu(null)
    setIconContextMenu({ item, clientX, clientY })
  }, [])

  const handleDesktopClick = useCallback(() => {
    setSelected(null)
    setSelectedFsId(null)
    setRenamingId(null)
    setIconContextMenu(null)
  }, [])

  const draggedItem = drag ? fsItems.find((i) => i.id === drag.id) : null

  return (
    <div
      ref={desktopRef}
      className="win95-desktop"
      onClick={handleDesktopClick}
      onContextMenu={handleContextMenu}
    >
      {ICONS.map((icon) => (
        <DesktopShortcut
          key={icon.id}
          entry={icon}
          isSelected={selected === icon.id}
          onSelect={() => { setSelected(icon.id); setSelectedFsId(null) }}
          onOpen={() => handleOpen(icon)}
        />
      ))}

      <DesktopShortcut
        key="trash"
        entry={{
          id:      'trash',
          label:   'Corbeille',
          iconSrc: trashIsEmpty ? icons.trashEmpty : icons.trashFull,
          pos:     { top: 90, left: 10 },
          window:  TRASH_WINDOW,
        }}
        isSelected={selected === 'trash'}
        onSelect={() => { setSelected('trash'); setSelectedFsId(null) }}
        onOpen={() => openWindow(TRASH_WINDOW)}
        onContextMenu={(e) => setTrashCtxMenu({ clientX: e.clientX, clientY: e.clientY })}
      />

      {desktopFsItems.map((item) => (
        <DynamicIcon
          key={item.id}
          item={item}
          style={{
            top:     item.pos?.y ?? 0,
            left:    item.pos?.x ?? 0,
            opacity: drag?.id === item.id ? 0.3 : 1,
          }}
          isSelected={selectedFsId === item.id}
          isRenaming={renamingId === item.id}
          isDropTarget={drag?.dropTarget === item.id}
          onSelect={handleFsSelect}
          onOpen={handleOpenFsItem}
          onRenameStart={handleRenameStart}
          onRenameConfirm={handleRenameConfirm}
          onRenameCancel={handleRenameCancel}
          onDragStart={handleDragStart}
          onContextMenu={handleIconContextMenu}
        />
      ))}

      <AnimatePresence>
        {windows.map((win) => (
          <Window key={win.id} {...win}>
            {contentRefs.current[win.id]}
          </Window>
        ))}
      </AnimatePresence>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          containerRef={desktopRef}
          onClose={() => setContextMenu(null)}
          onOpenProperties={openProperties}
          onCreateFolder={handleCreateFolder}
          onCreateFile={handleCreateFile}
        />
      )}

      {iconContextMenu && (
        <IconContextMenu
          clientX={iconContextMenu.clientX}
          clientY={iconContextMenu.clientY}
          item={iconContextMenu.item}
          onRename={(id) => { setRenamingId(id); setSelectedFsId(id) }}
          onClose={() => setIconContextMenu(null)}
        />
      )}

      {trashCtxMenu && (
        <TrashContextMenu
          clientX={trashCtxMenu.clientX}
          clientY={trashCtxMenu.clientY}
          isEmpty={trashIsEmpty}
          onOpen={() => openWindow(TRASH_WINDOW)}
          onClose={() => setTrashCtxMenu(null)}
        />
      )}

      {drag && draggedItem && (
        <div
          className="win95-drag-ghost"
          style={{ left: drag.clientX - drag.offsetX, top: drag.clientY - drag.offsetY }}
        >
          <img
            src={draggedItem.type === 'folder' ? icons.folder : icons.txtfile}
            alt=""
          />
          <span>{draggedItem.name}</span>
        </div>
      )}

      <Taskbar />
    </div>
  )
}
