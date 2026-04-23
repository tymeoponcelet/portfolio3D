import { useState, useCallback, useEffect, useRef } from 'react'
import { icons }           from '../../../assets/icons'
import { useFsStore }      from '../../../stores/fsStore'
import { useOSStore }      from '../../../stores/osStore'
import { DynamicIcon }     from '../DynamicIcon'
import { IconContextMenu } from '../IconContextMenu'
import { Notepad }         from './Notepad'

// ── Helpers ────────────────────────────────────────────────────────────────

function buildPath(items, folderId) {
  if (folderId === null)    return 'C:\\Bureau'
  if (folderId === 'trash') return 'C:\\Corbeille'
  const parts = []
  let id = folderId
  while (id !== null && id !== 'trash') {
    const item = items.find((i) => i.id === id)
    if (!item) break
    parts.unshift(item.name)
    id = item.parentId
  }
  const prefix = id === 'trash' ? 'C:\\Corbeille' : 'C:\\Bureau'
  return prefix + (parts.length ? '\\' + parts.join('\\') : '')
}

function formatSize(item) {
  if (item.type === 'folder') return '—'
  const b = item.content?.length ?? 0
  if (b === 0)    return '0 octets'
  if (b < 1024)   return `${b} octets`
  return `${Math.round(b / 1024)} Ko`
}

function formatType(item) {
  return item.type === 'folder' ? 'Dossier' : 'Fichier texte'
}

function sortItems(items, key, dir) {
  return [...items].sort((a, b) => {
    let av, bv
    if (key === 'name') {
      av = a.name.toLowerCase(); bv = b.name.toLowerCase()
    } else if (key === 'type') {
      av = a.type; bv = b.type
    } else {
      av = a.type === 'file' ? (a.content?.length ?? 0) : -1
      bv = b.type === 'file' ? (b.content?.length ?? 0) : -1
    }
    if (av < bv) return dir === 'asc' ? -1 : 1
    if (av > bv) return dir === 'asc' ?  1 : -1
    return 0
  })
}

// ── Tree sidebar ──────────────────────────────────────────────────────────

function FolderTreeNode({ folder, allItems, depth, currentFolderId, expandedIds, onToggle, onNavigate }) {
  const children    = allItems.filter((i) => i.type === 'folder' && i.parentId === folder.id)
  const isExpanded  = expandedIds.has(folder.id)
  const isActive    = currentFolderId === folder.id
  const isTrash     = folder.id === 'trash'
  const trashFull   = isTrash && allItems.some((i) => i.parentId === 'trash')
  const iconSrc     = isTrash ? (trashFull ? icons.trashFull : icons.trashEmpty) : icons.folder

  return (
    <>
      <div
        className={`win95-tree-node${isActive ? ' active' : ''}`}
        style={{ paddingLeft: 4 + depth * 12 }}
        onClick={() => onNavigate(folder.id)}
      >
        <span
          className="win95-tree-toggle"
          onClick={children.length > 0
            ? (e) => { e.stopPropagation(); onToggle(folder.id) }
            : undefined}
        >
          {children.length > 0 ? (isExpanded ? '▼' : '▶') : ''}
        </span>
        <img src={iconSrc} alt="" className="win95-tree-icon" />
        <span style={{ marginLeft: 3 }}>{folder.name}</span>
      </div>
      {isExpanded && children.map((child) => (
        <FolderTreeNode
          key={child.id}
          folder={child}
          allItems={allItems}
          depth={depth + 1}
          currentFolderId={currentFolderId}
          expandedIds={expandedIds}
          onToggle={onToggle}
          onNavigate={onNavigate}
        />
      ))}
    </>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function FileExplorer({ folderId }) {
  const allItems    = useFsStore((s) => s.items)
  const renameItem  = useFsStore((s) => s.renameItem)
  const openWindow  = useOSStore((s) => s.openWindow)

  const [currentFolderId, setCurrentFolderId] = useState(folderId ?? null)
  const [viewMode,        setViewMode]        = useState('icons')
  const [sortKey,         setSortKey]         = useState('name')
  const [sortDir,         setSortDir]         = useState('asc')
  const [selectedId,      setSelectedId]      = useState(null)
  const [renamingId,      setRenamingId]      = useState(null)
  const [drag,            setDrag]            = useState(null)
  const [iconContextMenu, setIconContextMenu] = useState(null)
  const [expandedIds,     setExpandedIds]     = useState(() => new Set())

  const containerRef = useRef(null)

  const isInTrash     = currentFolderId === 'trash'
  const currentItem   = allItems.find((i) => i.id === currentFolderId)
  const parentId      = currentItem?.parentId ?? null
  const canGoUp       = currentFolderId !== null && currentFolderId !== 'trash'
  const addressPath   = buildPath(allItems, currentFolderId)
  const rawItems      = allItems.filter((i) => i.parentId === currentFolderId)
  const displayItems  = sortItems(rawItems, sortKey, sortDir)
  const rootFolders   = allItems.filter((i) => i.type === 'folder' && i.parentId === null)

  // ── Drag-and-drop ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!drag) return
    const { id } = drag

    const onMove = (e) => {
      const el    = document.elementFromPoint(e.clientX, e.clientY)
      const btn   = el?.closest('[data-itemid]')
      const tid   = btn?.dataset.itemid
      const tItem = tid ? useFsStore.getState().items.find((i) => i.id === tid) : null
      const drop  = (tItem?.type === 'folder' && tid !== id) ? tid : null
      setDrag((d) => d ? { ...d, clientX: e.clientX, clientY: e.clientY, dropTarget: drop } : null)
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

  // ── Callbacks ──────────────────────────────────────────────────────────
  const handleNavigate = useCallback((id) => {
    setCurrentFolderId(id)
    setSelectedId(null)
    setRenamingId(null)
    setExpandedIds((prev) => { const next = new Set(prev); next.add(id); return next })
  }, [])

  const handleGoUp = useCallback(() => {
    setCurrentFolderId(parentId)
    setSelectedId(null)
  }, [parentId])

  const handleToggleExpand = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const handleOpenItem = useCallback((item) => {
    if (item.type === 'folder') {
      handleNavigate(item.id)
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
  }, [openWindow, handleNavigate])

  const handleSelect         = useCallback((id) => setSelectedId(id), [])
  const handleRenameStart    = useCallback((id) => setRenamingId(id), [])
  const handleRenameConfirm  = useCallback((id, name) => { renameItem(id, name); setRenamingId(null) }, [renameItem])
  const handleRenameCancel   = useCallback(() => setRenamingId(null), [])
  const handleDragStart      = useCallback((item, offX, offY, cx, cy) => {
    setSelectedId(item.id)
    setDrag({ id: item.id, offsetX: offX, offsetY: offY, clientX: cx, clientY: cy, dropTarget: null })
  }, [])
  const handleIconContextMenu = useCallback((item, cx, cy) => {
    setSelectedId(item.id)
    setIconContextMenu({ item, clientX: cx, clientY: cy })
  }, [])
  const handleBodyClick = useCallback((e) => {
    e.stopPropagation()
    setSelectedId(null)
    setRenamingId(null)
    setIconContextMenu(null)
  }, [])

  const handleSortClick = useCallback((key) => {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }, [sortKey])

  const draggedItem = drag ? allItems.find((i) => i.id === drag.id) : null

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="win95-fileexplorer-layout" ref={containerRef}>

      {/* ── Toolbar ── */}
      <div className="win95-fileexplorer-toolbar">
        <button
          className="win95-toolbar-btn"
          disabled={!canGoUp}
          onClick={handleGoUp}
          title="Dossier parent"
        >
          ↑ Parent
        </button>
        <div className="win95-addr-bar">{addressPath}</div>
      </div>

      {/* ── Split (sidebar + main) ── */}
      <div className="win95-fileexplorer-split">

        {/* Sidebar */}
        <div className="win95-fileexplorer-sidebar">
          {rootFolders.map((folder) => (
            <FolderTreeNode
              key={folder.id}
              folder={folder}
              allItems={allItems}
              depth={0}
              currentFolderId={currentFolderId}
              expandedIds={expandedIds}
              onToggle={handleToggleExpand}
              onNavigate={handleNavigate}
            />
          ))}
        </div>

        {/* Main view */}
        <div className="win95-fileexplorer-main" onClick={handleBodyClick}>
          {displayItems.length === 0 && (
            <p style={{ color: '#808080', fontSize: 11, padding: 16, fontFamily: 'var(--w-font)' }}>
              Ce dossier est vide.
            </p>
          )}

          {viewMode === 'icons' && displayItems.map((item, index) => (
            <DynamicIcon
              key={item.id}
              item={item}
              style={{
                position: 'absolute',
                top:      8 + Math.floor(index / 3) * 80,
                left:     8 + (index % 3) * 80,
                opacity:  drag?.id === item.id ? 0.3 : 1,
              }}
              isSelected={selectedId === item.id}
              isRenaming={renamingId === item.id}
              isDropTarget={drag?.dropTarget === item.id}
              onSelect={handleSelect}
              onOpen={handleOpenItem}
              onRenameStart={handleRenameStart}
              onRenameConfirm={handleRenameConfirm}
              onRenameCancel={handleRenameCancel}
              onDragStart={handleDragStart}
              onContextMenu={handleIconContextMenu}
            />
          ))}

          {viewMode === 'details' && (
            <table className="win95-details-table">
              <thead>
                <tr>
                  <th className="win95-details-th" onClick={() => handleSortClick('name')}>
                    Nom {sortKey === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="win95-details-th" onClick={() => handleSortClick('type')}>
                    Type {sortKey === 'type' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="win95-details-th" onClick={() => handleSortClick('size')}>
                    Taille {sortKey === 'size' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`win95-details-row${selectedId === item.id ? ' selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); handleSelect(item.id) }}
                    onDoubleClick={() => handleOpenItem(item)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleIconContextMenu(item, e.clientX, e.clientY)
                    }}
                  >
                    <td className="win95-details-td">
                      <img
                        src={item.type === 'folder' ? icons.folder : icons.txtfile}
                        alt=""
                        className="win95-details-icon"
                      />
                      {item.name}
                    </td>
                    <td className="win95-details-td">{formatType(item)}</td>
                    <td className="win95-details-td">{formatSize(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Statusbar ── */}
      <div className="win95-fileexplorer-statusbar">
        <div className="win95-view-toggle">
          <button
            className={`win95-view-btn${viewMode === 'icons' ? ' active' : ''}`}
            onClick={() => setViewMode('icons')}
            title="Grandes icônes"
          >
            ⊞
          </button>
          <button
            className={`win95-view-btn${viewMode === 'details' ? ' active' : ''}`}
            onClick={() => setViewMode('details')}
            title="Détails"
          >
            ☰
          </button>
        </div>
        <span>{displayItems.length} élément{displayItems.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Drag ghost ── */}
      {drag && draggedItem && (
        <div
          className="win95-drag-ghost"
          style={{ left: drag.clientX - drag.offsetX, top: drag.clientY - drag.offsetY }}
        >
          <img src={draggedItem.type === 'folder' ? icons.folder : icons.txtfile} alt="" />
          <span>{draggedItem.name}</span>
        </div>
      )}

      {/* ── Context menu ── */}
      {iconContextMenu && (
        <IconContextMenu
          clientX={iconContextMenu.clientX}
          clientY={iconContextMenu.clientY}
          item={iconContextMenu.item}
          context={isInTrash ? 'trash' : 'normal'}
          onRename={(id) => { setRenamingId(id); setSelectedId(id) }}
          onOpen={handleOpenItem}
          onClose={() => setIconContextMenu(null)}
        />
      )}
    </div>
  )
}
