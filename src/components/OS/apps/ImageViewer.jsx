import { useFsStore } from '../../../stores/fsStore'

export function ImageViewer({ fileId }) {
  const item = useFsStore((s) => s.items.find((i) => i.id === fileId))

  if (!item) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'var(--w-font)', fontSize: 11, color: '#808080' }}>
        Fichier introuvable.
      </div>
    )
  }

  if (!item.content || !item.content.startsWith('data:')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'var(--w-font)', fontSize: 11, color: '#808080' }}>
        Image vide ou invalide.
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto', background: '#808080', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img
        src={item.content}
        alt={item.name}
        style={{ maxWidth: '100%', maxHeight: '100%', imageRendering: 'pixelated', boxShadow: '2px 2px 0 #000' }}
      />
    </div>
  )
}
