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
