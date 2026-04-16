// src/components/Window/ResizeIndicator.jsx
// Overlay pointillés visible pendant le resize de la fenêtre.

export function ResizeIndicator({ visible }) {
  return (
    <div
      style={{
        position:      'absolute',
        inset:         0,
        pointerEvents: 'none',
        zIndex:        9999,
        border:        '2px dashed rgba(255, 255, 255, 0.65)',
        mixBlendMode:  'difference',
        opacity:       visible ? 1 : 0,
        transition:    'opacity 0.05s',
      }}
    />
  )
}
