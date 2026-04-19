import { useState, useCallback } from 'react'
import { useFsStore }  from '../../../stores/fsStore'
import { useOSStore }  from '../../../stores/osStore'
import { DynamicIcon } from '../DynamicIcon'
import { Notepad }     from './Notepad'

export function FileExplorer({ folderId, folderName }) {
  const allItems   = useFsStore((s) => s.items)
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

  const handleSelect      = useCallback((id) => setSelectedId(id), [])
  const handleRenameStart = useCallback((id) => setRenamingId(id), [])

  const handleRenameConfirm = useCallback((id, name) => {
    renameItem(id, name)
    setRenamingId(null)
  }, [renameItem])

  const handleRenameCancel = useCallback(() => setRenamingId(null), [])

  return (
    <div
      className="win95-fileexplorer"
    >
      <div className="win95-fileexplorer-addressbar">
        📁 C:\Bureau\{folderName}
      </div>
      <div
        className="win95-fileexplorer-body"
        onClick={(e) => { e.stopPropagation(); setSelectedId(null); setRenamingId(null) }}
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
