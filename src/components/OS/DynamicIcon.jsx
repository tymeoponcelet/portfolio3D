import { useRef, useEffect, useCallback } from 'react'
import { icons } from '../../assets/icons'

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
      committedRef.current = false
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  useEffect(() => () => { if (clickTimerRef.current) clearTimeout(clickTimerRef.current) }, [])

  const handleMouseDown = useCallback((e) => {
    e.stopPropagation()
    if (isRenaming || e.button !== 0) return

    const rect = e.currentTarget.getBoundingClientRect()
    const offX = e.clientX - rect.left
    const offY = e.clientY - rect.top
    let dragging  = false
    let lastX     = e.clientX
    let lastY     = e.clientY

    const cleanup = () => {
      clearTimeout(holdTimer)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }

    // Drag démarre après 180ms de maintien — sans bouger
    const holdTimer = setTimeout(() => {
      dragging = true
      if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null }
      onDragStart?.(item, offX, offY, lastX, lastY)
    }, 180)

    const onMove = (me) => {
      lastX = me.clientX
      lastY = me.clientY
    }

    const onUp = () => {
      cleanup()
      if (dragging) return   // drop géré par le parent
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
        clickTimerRef.current = null
        onOpen(item)
      } else {
        onSelect(item.id)
        clickTimerRef.current = setTimeout(() => { clickTimerRef.current = null }, 200)
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }, [isRenaming, item, onSelect, onOpen, onDragStart])

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

  const iconSrc = item.type === 'folder' ? icons.folder : icons.txtfile

  return (
    <button
      className={`win95-shortcut${isSelected ? ' selected' : ''}${isDropTarget ? ' drop-target' : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
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
