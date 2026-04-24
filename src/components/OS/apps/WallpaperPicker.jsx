import { useState }          from 'react'
import { useOSStore }        from '../../../stores/osStore'
import { WALLPAPERS, wallpaperToStyle } from '../../../utils/wallpaper'
import { win95sounds }       from '../../../utils/win95sounds'

export function WallpaperPicker() {
  const wallpaper          = useOSStore((s) => s.wallpaper)
  const setWallpaper       = useOSStore((s) => s.setWallpaper)
  const closeWindowByAppId = useOSStore((s) => s.closeWindowByAppId)

  const [pending, setPending] = useState(wallpaper)

  const previewStyle = wallpaperToStyle(pending)

  const isSelected = (wp) => {
    if (pending.type === 'pattern') return pending.value === wp.key
    return false
  }

  const handleSelect = (wp) => {
    win95sounds.click()
    setPending({ type: 'pattern', value: wp.key })
  }

  const handleOk = () => {
    win95sounds.click()
    setWallpaper(pending)
    closeWindowByAppId('wallpaper')
  }

  const handleCancel = () => {
    win95sounds.click()
    closeWindowByAppId('wallpaper')
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      fontFamily: 'var(--w-font)', fontSize: 11,
    }}>
      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', gap: 12, padding: 12, overflow: 'hidden', minHeight: 0 }}>

        {/* Preview column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span>Aperçu</span>
          <div className="win95-wallpaper-preview" style={previewStyle} />
        </div>

        {/* List column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden', minHeight: 0 }}>
          <span>Fond d'écran :</span>
          <div className="win95-wallpaper-list">
            {WALLPAPERS.map((wp) => (
              <div
                key={wp.key}
                className={`win95-wallpaper-item${isSelected(wp) ? ' sel' : ''}`}
                onMouseDown={() => handleSelect(wp)}
              >
                {wp.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 6,
        padding: '8px 12px',
        borderTop: '1px solid #808080',
        flexShrink: 0,
      }}>
        <button className="win95-toolbar-btn" onClick={handleOk}>OK</button>
        <button className="win95-toolbar-btn" onClick={handleCancel}>Annuler</button>
      </div>
    </div>
  )
}
