# Drag, PNG Icons & Right-click Rename — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer les icônes par les PNGs `/png/folder.png` et `/png/txtfile.png`, permettre le drag-and-drop des icônes sur le bureau et dans les dossiers, et ajouter un menu contextuel clic-droit sur chaque icône avec "Renommer".

**Architecture:** `fsStore` gagne un champ `pos: {x,y}|null` par item et deux nouvelles actions (`moveItem`, `setParent`). `DynamicIcon` détecte le drag via global `mousemove`/`mouseup` et émet `onDragStart`. Desktop et FileExplorer gèrent l'état de drag, affichent un ghost `position:fixed`, et utilisent `document.elementFromPoint` + `data-itemid` pour détecter le dossier cible. Un composant `IconContextMenu` partagé gère le clic-droit.

**Tech Stack:** React 18, Zustand (getState() pour éviter les stale closures dans les effets), CSS

---

## File Map

| Action   | Fichier |
|----------|---------|
| Modifier | `src/stores/fsStore.js` |
| Modifier | `src/components/OS/DynamicIcon.jsx` |
| Créer    | `src/components/OS/IconContextMenu.jsx` |
| Modifier | `src/styles/win95.css` (append) |
| Modifier | `src/components/OS/Desktop.jsx` |
| Modifier | `src/components/OS/apps/FileExplorer.jsx` |

---

## Task 1: fsStore — pos, moveItem, setParent

**Files:**
- Modify: `src/stores/fsStore.js`

- [ ] **Step 1: Read the current file**

Read `src/stores/fsStore.js` to understand current shape before editing.

- [ ] **Step 2: Replace with updated version**

Write EXACTLY this to `src/stores/fsStore.js`:

```js
import { create } from 'zustand'

function uniqueName(items, parentId, baseName) {
  const siblings = items
    .filter((i) => i.parentId === parentId)
    .map((i) => i.name)
  if (!siblings.includes(baseName)) return baseName
  let n = 2
  while (siblings.includes(`${baseName} (${n})`)) n++
  return `${baseName} (${n})`
}

export const useFsStore = create((set, get) => ({
  items: [],

  createItem: (type, parentId, pos = null) => {
    const base = type === 'folder'
      ? 'Nouveau dossier'
      : 'Nouveau document texte.txt'
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set((s) => {
      const name = uniqueName(s.items, parentId, base)
      return {
        items: [...s.items, {
          id,
          type,
          name,
          parentId: parentId ?? null,
          pos:      pos ?? null,
          ...(type === 'file' ? { content: '' } : {}),
        }],
      }
    })
    return id
  },

  renameItem: (id, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    set((s) => {
      const item = s.items.find((i) => i.id === id)
      if (!item) return s
      const siblings = s.items.filter((i) => i.parentId === item.parentId && i.id !== id)
      let finalName = trimmed
      if (siblings.some((i) => i.name === trimmed)) {
        let n = 2
        while (siblings.some((i) => i.name === `${trimmed} (${n})`)) n++
        finalName = `${trimmed} (${n})`
      }
      return { items: s.items.map((i) => i.id === id ? { ...i, name: finalName } : i) }
    })
  },

  updateContent: (id, content) => {
    set((s) => ({
      items: s.items.map((i) => i.id === id ? { ...i, content } : i),
    }))
  },

  moveItem: (id, x, y) => {
    set((s) => ({
      items: s.items.map((i) => i.id === id ? { ...i, pos: { x, y } } : i),
    }))
  },

  setParent: (id, parentId) => {
    set((s) => ({
      items: s.items.map((i) => i.id === id ? { ...i, parentId, pos: null } : i),
    }))
  },

  deleteItem: (id) => {
    const collect = (items, rootId) => {
      const result = [rootId]
      items.filter((i) => i.parentId === rootId)
           .forEach((c) => result.push(...collect(items, c.id)))
      return result
    }
    set((s) => {
      const toDelete = new Set(collect(s.items, id))
      return { items: s.items.filter((i) => !toDelete.has(i.id)) }
    })
  },
}))
```

- [ ] **Step 3: Verify**

Re-read the file. Confirm: `createItem` takes optional third arg `pos`, `moveItem` and `setParent` are present, `pos` field is included in new items.

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/TYM/Desktop/site old pc - Copie/portfolio-3d" && git add src/stores/fsStore.js && git commit -m "feat: add pos, moveItem, setParent to fsStore"
```

---

## Task 2: DynamicIcon — PNGs + drag detection + new props

**Files:**
- Modify: `src/components/OS/DynamicIcon.jsx`

- [ ] **Step 1: Write the complete new DynamicIcon.jsx**

Write EXACTLY this to `src/components/OS/DynamicIcon.jsx`:

```jsx
import { useRef, useEffect, useCallback } from 'react'

export function DynamicIcon({
  item,
  style,
  isSelected,
  isRenaming,
  isDropTarget,
  onSelect,
  onOpen,
  onRenameStart,
  onRenameConfirm,
  onRenameCancel,
  onDragStart,
  onContextMenu,
}) {
  const inputRef      = useRef(null)
  const clickTimerRef = useRef(null)
  const committedRef  = useRef(false)

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  useEffect(() => () => { if (clickTimerRef.current) clearTimeout(clickTimerRef.current) }, [])

  const handleMouseDown = useCallback((e) => {
    e.stopPropagation()
    if (isRenaming) return

    const startX  = e.clientX
    const startY  = e.clientY
    const rect    = e.currentTarget.getBoundingClientRect()
    const offX    = e.clientX - rect.left
    const offY    = e.clientY - rect.top
    let   dragged = false

    const cleanup = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }

    const onMove = (me) => {
      if (Math.abs(me.clientX - startX) > 5 || Math.abs(me.clientY - startY) > 5) {
        dragged = true
        cleanup()
        if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null }
        onDragStart?.(item, offX, offY, me.clientX, me.clientY)
      }
    }

    const onUp = () => {
      cleanup()
      if (dragged) return
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
        clickTimerRef.current = null
        onOpen(item)
      } else if (isSelected) {
        clickTimerRef.current = setTimeout(() => {
          clickTimerRef.current = null
          onRenameStart(item.id)
        }, 300)
      } else {
        onSelect(item.id)
        clickTimerRef.current = setTimeout(() => { clickTimerRef.current = null }, 300)
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }, [isRenaming, isSelected, item, onSelect, onOpen, onRenameStart, onDragStart])

  const handleKeyDown = useCallback((e) => {
    if (!isRenaming) return
    if (e.key === 'Enter') {
      e.preventDefault()
      committedRef.current = true
      onRenameConfirm(item.id, inputRef.current?.value ?? item.name)
    }
    if (e.key === 'Escape') {
      committedRef.current = true
      onRenameCancel(item.id)
    }
  }, [isRenaming, item.id, item.name, onRenameConfirm, onRenameCancel])

  const handleBlur = useCallback(() => {
    if (!isRenaming) return
    if (committedRef.current) { committedRef.current = false; return }
    onRenameConfirm(item.id, inputRef.current?.value ?? item.name)
  }, [isRenaming, item.id, item.name, onRenameConfirm])

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    onContextMenu?.(item, e.clientX, e.clientY)
  }, [item, onContextMenu])

  const iconSrc = item.type === 'folder' ? '/png/folder.png' : '/png/txtfile.png'

  return (
    <button
      className={`win95-shortcut${isSelected ? ' selected' : ''}${isDropTarget ? ' drop-target' : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      data-itemid={item.id}
      aria-label={item.name}
    >
      <div className="win95-shortcut-icon-wrap">
        {isSelected && (
          <div
            className="win95-shortcut-overlay"
            style={{ WebkitMaskImage: `url(${iconSrc})` }}
          />
        )}
        <img src={iconSrc} alt="" className="win95-shortcut-img" />
      </div>
      {isRenaming ? (
        <input
          ref={inputRef}
          className="win95-rename-input"
          defaultValue={item.name}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="win95-shortcut-label">{item.name}</span>
      )}
    </button>
  )
}
```

- [ ] **Step 2: Verify**

Re-read the file. Confirm: no `import { icons }`, `iconSrc` uses `/png/` paths, `data-itemid` on button, `onDragStart` and `onContextMenu` props present, `isDropTarget` adds `drop-target` class, drag detection in `handleMouseDown`.

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/TYM/Desktop/site old pc - Copie/portfolio-3d" && git add src/components/OS/DynamicIcon.jsx && git commit -m "feat: PNG icons, drag detection and context-menu props in DynamicIcon"
```

---

## Task 3: IconContextMenu shared component

**Files:**
- Create: `src/components/OS/IconContextMenu.jsx`

- [ ] **Step 1: Create the file**

Write EXACTLY this to `src/components/OS/IconContextMenu.jsx`:

```jsx
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
        onMouseDown={() => { win95sounds.click(); onRename(item.id); onClose() }}
      >
        Renommer
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd "C:/Users/TYM/Desktop/site old pc - Copie/portfolio-3d" && git add src/components/OS/IconContextMenu.jsx && git commit -m "feat: add IconContextMenu shared component"
```

---

## Task 4: CSS — drag ghost + drop-target styles

**Files:**
- Modify: `src/styles/win95.css` (append only)

- [ ] **Step 1: Read last 10 lines of win95.css**

Confirm the file ends after the FileExplorer section, then append.

- [ ] **Step 2: Append to win95.css**

Add EXACTLY these blocks at the very end of the file:

```css
/* ═══════════════════════════════════════════════════════════════
   DRAG GHOST
   ═══════════════════════════════════════════════════════════════ */

.win95-drag-ghost {
  position: fixed;
  pointer-events: none;
  opacity: 0.65;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 72px;
  padding: 4px;
  user-select: none;
}

.win95-drag-ghost img {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}

.win95-drag-ghost span {
  font-family: var(--w-font);
  font-size: 11px;
  color: #ffffff;
  text-shadow: 1px 1px 0 #000000;
  margin-top: 2px;
  text-align: center;
  max-width: 68px;
  overflow-wrap: break-word;
}

/* ═══════════════════════════════════════════════════════════════
   DROP TARGET
   ═══════════════════════════════════════════════════════════════ */

.win95-shortcut.drop-target {
  outline: 2px dotted #000080;
  background: rgba(0, 0, 128, 0.15);
}
```

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/TYM/Desktop/site old pc - Copie/portfolio-3d" && git add src/styles/win95.css && git commit -m "feat: add drag ghost and drop-target CSS"
```

---

## Task 5: Desktop — drag, pos-based positioning, icon right-click

**Files:**
- Modify: `src/components/OS/Desktop.jsx`

- [ ] **Step 1: Read the current Desktop.jsx**

Read `src/components/OS/Desktop.jsx` to understand current structure.

- [ ] **Step 2: Write the complete new Desktop.jsx**

Write EXACTLY this to `src/components/OS/Desktop.jsx`:

```jsx
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

export const ICONS = [
  {
    id:      'showcase',
    label:   'Portfolio',
    iconSrc: icons.showcaseIcon,
    pos:     { top: 6, left: 10 },
    window:  SHOWCASE_WINDOW,
  },
]

function DesktopShortcut({ entry, isSelected, onSelect, onOpen }) {
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

  const desktopFsItems = fsItems.filter((i) => i.parentId === null)

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

      if (tItem?.type === 'folder' && tid !== id) {
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

  const handleCreateFolder = useCallback(() => {
    const id = createItem('folder', null, { x: 10, y: 90 + desktopFsItems.length * 72 })
    setRenamingId(id)
  }, [createItem, desktopFsItems.length])

  const handleCreateFile = useCallback(() => {
    const id = createItem('file', null, { x: 10, y: 90 + desktopFsItems.length * 72 })
    setRenamingId(id)
  }, [createItem, desktopFsItems.length])

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

      <Taskbar />
    </div>
  )
}
```

- [ ] **Step 3: Verify**

Re-read and confirm: `drag` state present, `useEffect` with `[drag?.id]`, `handleDragStart` and `handleIconContextMenu` defined, `DynamicIcon` renders at `item.pos?.y / item.pos?.x`, ghost rendered when `drag && draggedItem`, `IconContextMenu` rendered when `iconContextMenu` set, `handleCreateFolder/File` passes pos as third arg to `createItem`.

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/TYM/Desktop/site old pc - Copie/portfolio-3d" && git add src/components/OS/Desktop.jsx && git commit -m "feat: drag-and-drop and icon right-click menu in Desktop"
```

---

## Task 6: FileExplorer — drag into sub-folders + icon right-click

**Files:**
- Modify: `src/components/OS/apps/FileExplorer.jsx`

- [ ] **Step 1: Write the complete new FileExplorer.jsx**

Write EXACTLY this to `src/components/OS/apps/FileExplorer.jsx`:

```jsx
import { useState, useCallback, useRef, useEffect } from 'react'
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

  /* Global drag listeners for this FileExplorer instance */
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
```

- [ ] **Step 2: Verify**

Re-read and confirm: `drag` state present, `useEffect` with `[drag?.id]`, `handleDragStart` and `handleIconContextMenu` callbacks present, `isDropTarget`, `onDragStart`, `onContextMenu` passed to each `DynamicIcon`, ghost rendered, `IconContextMenu` imported and rendered.

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/TYM/Desktop/site old pc - Copie/portfolio-3d" && git add src/components/OS/apps/FileExplorer.jsx && git commit -m "feat: drag-and-drop and icon right-click menu in FileExplorer"
```

---

## Self-review checklist

**Spec coverage:**
- ✅ PNGs `/png/folder.png` et `/png/txtfile.png` — Task 2
- ✅ Drag libre sur le bureau — Task 5 (`moveItem` on mouseup)
- ✅ Drop dans un dossier depuis le bureau — Task 5 (`setParent`)
- ✅ Drop dans un sous-dossier depuis FileExplorer — Task 6
- ✅ Clic-droit icône → Renommer — Tasks 3 + 5 + 6

**Placeholders:** aucun — tout le code est complet.

**Type consistency:**
- `createItem(type, parentId, pos?)` — Task 1 définit, Task 5 appelle avec 3 args ✓
- `onDragStart(item, offX, offY, clientX, clientY)` — Task 2 émet, Tasks 5+6 reçoivent ✓
- `moveItem(id, x, y)` — Task 1 définit, Task 5 appelle via `getState()` ✓
- `setParent(id, parentId)` — Task 1 définit, Tasks 5+6 appellent via `getState()` ✓
- `IconContextMenu({ clientX, clientY, item, onRename, onClose })` — Task 3 définit, Tasks 5+6 utilisent ✓
