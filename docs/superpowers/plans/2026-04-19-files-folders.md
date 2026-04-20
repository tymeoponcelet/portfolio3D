# Fichiers & Dossiers Win95 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un système de fichiers virtuel éphémère au bureau Win95 — création de dossiers et fichiers .txt depuis le menu contextuel, renommage inline, explorateur de dossiers, éditeur Notepad.

**Architecture:** Un store Zustand séparé (`fsStore`) maintient une liste plate d'items `{ id, type, name, parentId, content }`. Le bureau lit ce store et affiche les icônes dynamiques via `DynamicIcon`. Les dossiers ouvrent `FileExplorer`, les fichiers `.txt` ouvrent `Notepad` — tous deux enregistrés via `osStore.openWindow` comme les autres fenêtres.

**Tech Stack:** React 18, Zustand, CSS inline Win95 existant (`win95.css`)

---

## File Map

| Action   | Fichier |
|----------|---------|
| Créer    | `src/stores/fsStore.js` |
| Créer    | `src/components/OS/DynamicIcon.jsx` |
| Créer    | `src/components/OS/apps/Notepad.jsx` |
| Créer    | `src/components/OS/apps/FileExplorer.jsx` |
| Modifier | `src/components/OS/ContextMenu.jsx` |
| Modifier | `src/components/OS/Desktop.jsx` |
| Modifier | `src/styles/win95.css` |

---

## Task 1: Virtual Filesystem Store

**Files:**
- Create: `src/stores/fsStore.js`

- [ ] **Step 1: Create the store**

```js
// src/stores/fsStore.js
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

  createItem: (type, parentId) => {
    const { items } = get()
    const base = type === 'folder'
      ? 'Nouveau dossier'
      : 'Nouveau document texte.txt'
    const name = uniqueName(items, parentId, base)
    const id   = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set((s) => ({ items: [...s.items, { id, type, name, parentId: parentId ?? null, content: '' }] }))
    return id
  },

  renameItem: (id, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    set((s) => ({
      items: s.items.map((i) => i.id === id ? { ...i, name: trimmed } : i),
    }))
  },

  updateContent: (id, content) => {
    set((s) => ({
      items: s.items.map((i) => i.id === id ? { ...i, content } : i),
    }))
  },

  deleteItem: (id) => {
    const collect = (items, rootId) => {
      const result = [rootId]
      items.filter((i) => i.parentId === rootId)
           .forEach((c) => result.push(...collect(items, c.id)))
      return result
    }
    const { items } = get()
    const toDelete = new Set(collect(items, id))
    set(() => ({ items: items.filter((i) => !toDelete.has(i.id)) }))
  },
}))
```

- [ ] **Step 2: Verify the store exists**

```bash
ls src/stores/
# Should show: fsStore.js  osStore.js  windowStore.js
```

- [ ] **Step 3: Commit**

```bash
git add src/stores/fsStore.js
git commit -m "feat: add virtual filesystem store (fsStore)"
```

---

## Task 2: DynamicIcon component

**Files:**
- Create: `src/components/OS/DynamicIcon.jsx`

- [ ] **Step 1: Create the component**

```jsx
// src/components/OS/DynamicIcon.jsx
import { useRef, useEffect, useCallback } from 'react'
import { icons } from '../../assets/icons/index.js'

export function DynamicIcon({
  item,
  style,
  isSelected,
  isRenaming,
  onSelect,
  onOpen,
  onRenameStart,
  onRenameConfirm,
  onRenameCancel,
}) {
  const inputRef     = useRef(null)
  const clickTimerRef = useRef(null)

  /* Auto-focus + select-all on rename */
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  /* Clean up pending timer on unmount */
  useEffect(() => () => { if (clickTimerRef.current) clearTimeout(clickTimerRef.current) }, [])

  const handleMouseDown = useCallback((e) => {
    e.stopPropagation()
    if (isRenaming) return

    if (clickTimerRef.current) {
      /* Second click within window → double-click → open */
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
      onOpen(item)
      return
    }

    /* Start click window */
    if (isSelected) {
      /* Slow second click on already-selected → rename after window */
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null
        onRenameStart(item.id)
      }, 300)
    } else {
      onSelect(item.id)
      clickTimerRef.current = setTimeout(() => { clickTimerRef.current = null }, 300)
    }
  }, [isRenaming, isSelected, item, onSelect, onOpen, onRenameStart])

  const handleKeyDown = useCallback((e) => {
    if (!isRenaming) return
    if (e.key === 'Enter') {
      e.preventDefault()
      onRenameConfirm(item.id, inputRef.current.value)
    }
    if (e.key === 'Escape') {
      onRenameCancel(item.id)
    }
  }, [isRenaming, item.id, onRenameConfirm, onRenameCancel])

  const handleBlur = useCallback(() => {
    if (isRenaming) onRenameConfirm(item.id, inputRef.current?.value ?? item.name)
  }, [isRenaming, item.id, item.name, onRenameConfirm])

  return (
    <button
      className={`win95-shortcut${isSelected ? ' selected' : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
      aria-label={item.name}
    >
      <div className="win95-shortcut-icon-wrap">
        {isSelected && item.type === 'folder' && (
          <div
            className="win95-shortcut-overlay"
            style={{ WebkitMaskImage: `url(${icons.windowExplorerIcon})` }}
          />
        )}
        {item.type === 'folder'
          ? <img src={icons.windowExplorerIcon} alt="dossier" className="win95-shortcut-img" />
          : <span style={{ fontSize: 28, lineHeight: '32px', display: 'block', textAlign: 'center' }}>📄</span>
        }
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

- [ ] **Step 2: Commit**

```bash
git add src/components/OS/DynamicIcon.jsx
git commit -m "feat: add DynamicIcon component with rename support"
```

---

## Task 3: Notepad app + CSS

**Files:**
- Create: `src/components/OS/apps/Notepad.jsx`
- Modify: `src/styles/win95.css` (append)

- [ ] **Step 1: Create Notepad component**

```jsx
// src/components/OS/apps/Notepad.jsx
import { useFsStore } from '../../../stores/fsStore'

export function Notepad({ fileId }) {
  const item          = useFsStore((s) => s.items.find((i) => i.id === fileId))
  const updateContent = useFsStore((s) => s.updateContent)

  if (!item) {
    return (
      <div style={{ padding: 8, fontFamily: 'var(--w-font)', fontSize: 11, color: '#808080' }}>
        Fichier introuvable.
      </div>
    )
  }

  return (
    <textarea
      className="win95-notepad-textarea"
      value={item.content}
      onChange={(e) => updateContent(fileId, e.target.value)}
      spellCheck={false}
    />
  )
}
```

- [ ] **Step 2: Append CSS for Notepad and rename input to the end of `src/styles/win95.css`**

```css
/* ═══════════════════════════════════════════════════════════════
   NOTEPAD
   ═══════════════════════════════════════════════════════════════ */

.win95-notepad-textarea {
  width: 100%;
  height: 100%;
  resize: none;
  border: none;
  outline: none;
  padding: 4px 6px;
  font-family: var(--w-font-mono);
  font-size: 12px;
  background: #ffffff;
  color: #000000;
  display: block;
  box-sizing: border-box;
}

/* ═══════════════════════════════════════════════════════════════
   RENAME INPUT (inline dans DynamicIcon)
   ═══════════════════════════════════════════════════════════════ */

.win95-rename-input {
  width: 68px;
  background: #0000AA;
  color: #ffffff;
  border: 1px dotted #ffffff;
  font-family: var(--w-font);
  font-size: 11px;
  text-align: center;
  padding: 1px 2px;
  outline: none;
  line-height: 1.3;
  word-break: break-all;
  display: block;
  margin: 0 auto;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/OS/apps/Notepad.jsx src/styles/win95.css
git commit -m "feat: add Notepad app and rename-input CSS"
```

---

## Task 4: FileExplorer app + CSS

**Files:**
- Create: `src/components/OS/apps/FileExplorer.jsx`
- Modify: `src/styles/win95.css` (append)

- [ ] **Step 1: Create FileExplorer component**

```jsx
// src/components/OS/apps/FileExplorer.jsx
import { useState, useCallback } from 'react'
import { useFsStore }  from '../../../stores/fsStore'
import { useOSStore }  from '../../../stores/osStore'
import { DynamicIcon } from '../DynamicIcon'
import { Notepad }     from './Notepad'

export function FileExplorer({ folderId, folderName }) {
  const allItems  = useFsStore((s) => s.items)
  const renameItem = useFsStore((s) => s.renameItem)
  const openWindow = useOSStore((s) => s.openWindow)

  const items = allItems.filter((i) => i.parentId === folderId)

  const [selectedId, setSelectedId] = useState(null)
  const [renamingId, setRenamingId] = useState(null)

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

  const handleSelect     = useCallback((id) => setSelectedId(id), [])
  const handleRenameStart = useCallback((id) => setRenamingId(id), [])

  const handleRenameConfirm = useCallback((id, name) => {
    renameItem(id, name)
    setRenamingId(null)
  }, [renameItem])

  const handleRenameCancel = useCallback(() => setRenamingId(null), [])

  return (
    <div
      className="win95-fileexplorer"
      onClick={(e) => { e.stopPropagation(); setSelectedId(null); setRenamingId(null) }}
    >
      <div className="win95-fileexplorer-addressbar">
        📁 C:\Bureau\{folderName}
      </div>
      <div className="win95-fileexplorer-body">
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
                top:  8  + Math.floor(index / 3) * 80,
                left: 8  + (index % 3) * 80,
              }}
              isSelected={selectedId === item.id}
              isRenaming={renamingId === item.id}
              onSelect={handleSelect}
              onOpen={handleOpenFsItem}
              onRenameStart={handleRenameStart}
              onRenameConfirm={handleRenameConfirm}
              onRenameCancel={handleRenameCancel}
            />
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Append FileExplorer CSS to end of `src/styles/win95.css`**

```css
/* ═══════════════════════════════════════════════════════════════
   FILE EXPLORER
   ═══════════════════════════════════════════════════════════════ */

.win95-fileexplorer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--w-surface);
}

.win95-fileexplorer-addressbar {
  background: var(--w-surface);
  box-shadow: var(--border-sunken);
  margin: 4px 4px 2px;
  padding: 2px 6px;
  font-family: var(--w-font);
  font-size: 11px;
  flex-shrink: 0;
}

.win95-fileexplorer-body {
  flex: 1;
  position: relative;
  overflow: auto;
  background: #ffffff;
  box-shadow: var(--border-sunken);
  margin: 0 4px 4px;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/OS/apps/FileExplorer.jsx src/styles/win95.css
git commit -m "feat: add FileExplorer app and CSS"
```

---

## Task 5: Enable ContextMenu creation items

**Files:**
- Modify: `src/components/OS/ContextMenu.jsx`

- [ ] **Step 1: Read the current file**

Read `src/components/OS/ContextMenu.jsx` to confirm the current sub-menu JSX before editing.

- [ ] **Step 2: Add `onCreateFolder` and `onCreateFile` props to `ContextMenu`**

Change the function signature from:
```jsx
export function ContextMenu({ x, y, containerRef, onClose, onOpenProperties }) {
```
to:
```jsx
export function ContextMenu({ x, y, containerRef, onClose, onOpenProperties, onCreateFolder, onCreateFile }) {
```

- [ ] **Step 3: Replace the disabled sub-menu items with active ones**

Find this block in the `{subOpen && ...}` section:
```jsx
<div className="win95-contextmenu win95-contextmenu-sub"
  style={subLeft ? { left: 'auto', right: '100%' } : undefined}
>
  <div className="win95-contextmenu-item disabled">Dossier</div>
  <div className="win95-contextmenu-item disabled">Raccourci</div>
</div>
```

Replace with:
```jsx
<div className="win95-contextmenu win95-contextmenu-sub"
  style={subLeft ? { left: 'auto', right: '100%' } : undefined}
>
  <div
    className="win95-contextmenu-item"
    onMouseDown={() => { win95sounds.click(); onCreateFolder(); onClose() }}
  >
    Dossier
  </div>
  <div
    className="win95-contextmenu-item"
    onMouseDown={() => { win95sounds.click(); onCreateFile(); onClose() }}
  >
    Fichier texte
  </div>
</div>
```

- [ ] **Step 4: Verify the file looks correct** — open it and confirm no syntax errors, the sub-menu items are no longer `disabled`, and the two new props are accepted.

- [ ] **Step 5: Commit**

```bash
git add src/components/OS/ContextMenu.jsx
git commit -m "feat: enable Dossier and Fichier texte in context menu"
```

---

## Task 6: Wire everything into Desktop.jsx

**Files:**
- Modify: `src/components/OS/Desktop.jsx`

- [ ] **Step 1: Read the current Desktop.jsx** to understand the exact current state before making changes.

- [ ] **Step 2: Replace Desktop.jsx with the full updated version**

```jsx
// src/components/OS/Desktop.jsx
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

  const [selected,     setSelected]     = useState(null)         // static icon id
  const [selectedFsId, setSelectedFsId] = useState(null)         // dynamic icon id
  const [renamingId,   setRenamingId]   = useState(null)         // dynamic icon being renamed
  const [contextMenu,  setContextMenu]  = useState(null)
  const desktopRef = useRef(null)

  /* Auto-open Portfolio on boot */
  useEffect(() => { openWindow(SHOWCASE_WINDOW) }, []) // eslint-disable-line

  /* F2 key → rename selected dynamic icon */
  useEffect(() => {
    if (!selectedFsId) return
    const handler = (e) => {
      if (e.key === 'F2') { e.preventDefault(); setRenamingId(selectedFsId) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedFsId])

  /* contentRefs — cache window content to avoid re-renders during drag */
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

  /* Static icon handlers */
  const handleOpen = useCallback((icon) => { openWindow(icon.window) }, [openWindow])

  /* Context menu */
  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    if (e.target.closest('.win95-window')) return
    const rect = desktopRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 }
    setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  const openProperties = useCallback(() => { openWindow(PROPERTIES_WINDOW) }, [openWindow])

  /* FS item creation (called by ContextMenu) */
  const handleCreateFolder = useCallback(() => {
    const id = createItem('folder', null)
    setRenamingId(id)
  }, [createItem])

  const handleCreateFile = useCallback(() => {
    const id = createItem('file', null)
    setRenamingId(id)
  }, [createItem])

  /* FS item open (double-click) */
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

  /* DynamicIcon callbacks */
  const handleFsSelect    = useCallback((id) => { setSelectedFsId(id); setSelected(null) }, [])
  const handleRenameStart = useCallback((id) => setRenamingId(id), [])

  const handleRenameConfirm = useCallback((id, name) => {
    renameItem(id, name)
    setRenamingId(null)
  }, [renameItem])

  const handleRenameCancel = useCallback(() => setRenamingId(null), [])

  /* Deselect all on desktop click */
  const handleDesktopClick = useCallback(() => {
    setSelected(null)
    setSelectedFsId(null)
    setRenamingId(null)
  }, [])

  return (
    <div
      ref={desktopRef}
      className="win95-desktop"
      onClick={handleDesktopClick}
      onContextMenu={handleContextMenu}
    >
      {/* Static icons */}
      {ICONS.map((icon) => (
        <DesktopShortcut
          key={icon.id}
          entry={icon}
          isSelected={selected === icon.id}
          onSelect={() => setSelected(icon.id)}
          onOpen={() => handleOpen(icon)}
        />
      ))}

      {/* Dynamic FS icons */}
      {desktopFsItems.map((item, index) => (
        <DynamicIcon
          key={item.id}
          item={item}
          style={{ top: 90 + index * 72, left: 10 }}
          isSelected={selectedFsId === item.id}
          isRenaming={renamingId === item.id}
          onSelect={handleFsSelect}
          onOpen={handleOpenFsItem}
          onRenameStart={handleRenameStart}
          onRenameConfirm={handleRenameConfirm}
          onRenameCancel={handleRenameCancel}
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

      <Taskbar />
    </div>
  )
}
```

- [ ] **Step 3: Verify in browser**

Start the dev server: `npm run dev` in `portfolio-3d/`.

- Right-click desktop → "Nouveau" → "Dossier" → icône dossier apparaît en mode renommage → taper un nom → Entrée ✓
- Right-click desktop → "Nouveau" → "Fichier texte" → icône 📄 apparaît en mode renommage ✓
- Clic simple sur une icône → sélection (fond bleu translucide) ✓
- Double-clic sur un dossier → fenêtre explorateur s'ouvre avec barre d'adresse ✓
- Double-clic sur un .txt → fenêtre Notepad s'ouvre, textarea éditable ✓
- F2 sur une icône sélectionnée → mode renommage ✓
- Echap pendant renommage → annule ✓
- Clic sur le bureau → désélectionne tout ✓

- [ ] **Step 4: Commit**

```bash
git add src/components/OS/Desktop.jsx
git commit -m "feat: wire file/folder creation, DynamicIcon, FileExplorer and Notepad into Desktop"
```

---

## Done

Toutes les fonctionnalités sont implémentées :
- **Création** de dossiers et fichiers `.txt` depuis le menu contextuel
- **Renommage** inline — à la création, double-clic lent, ou F2
- **FileExplorer** — ouvre les dossiers dans une fenêtre Win95 avec barre d'adresse
- **Notepad** — édite les fichiers `.txt`, sauvegarde en temps réel dans fsStore
- **Éphémère** — le store Zustand se réinitialise au reboot/shutdown
