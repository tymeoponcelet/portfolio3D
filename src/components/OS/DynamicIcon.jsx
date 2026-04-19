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
  const inputRef      = useRef(null)
  const clickTimerRef = useRef(null)

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

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
      onOpen(item)
      return
    }

    if (isSelected) {
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
