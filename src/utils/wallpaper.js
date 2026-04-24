export const WALLPAPERS = [
  {
    key:   'none',
    label: '(Aucun)',
    css:   { background: '#000000' },
  },
  {
    key:   'teal',
    label: 'Teal',
    css:   { background: '#008080' },
  },
  {
    key:   'dark',
    label: 'Nuit',
    css:   { background: '#1a1a2e' },
  },
  {
    key:   'checkerboard',
    label: 'Damier',
    css:   {
      backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, #c0c0c0 0% 50%)',
      backgroundSize:  '4px 4px',
    },
  },
  {
    key:   'bricks',
    label: 'Briques',
    css:   {
      backgroundColor: '#8b2222',
      backgroundImage: [
        'repeating-linear-gradient(0deg, transparent, transparent 13px, rgba(0,0,0,0.45) 13px, rgba(0,0,0,0.45) 14px)',
        'repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(0,0,0,0.45) 24px, rgba(0,0,0,0.45) 25px)',
      ].join(', '),
    },
  },
  {
    key:   'dots',
    label: 'Pluie de points',
    css:   {
      backgroundColor: '#000080',
      backgroundImage: 'radial-gradient(circle, #c0c0c0 1px, transparent 1px)',
      backgroundSize:  '6px 6px',
    },
  },
  {
    key:   'weave',
    label: 'Tissu',
    css:   {
      backgroundColor: '#000080',
      backgroundImage: [
        'repeating-linear-gradient(45deg,  rgba(255,255,255,0.12) 0, rgba(255,255,255,0.12) 1px, transparent 0, transparent 50%)',
        'repeating-linear-gradient(-45deg, rgba(255,255,255,0.12) 0, rgba(255,255,255,0.12) 1px, transparent 0, transparent 50%)',
      ].join(', '),
      backgroundSize: '4px 4px',
    },
  },
  {
    key:   'diagonal',
    label: 'Lignes diagonales',
    css:   {
      backgroundImage: 'repeating-linear-gradient(45deg, #008080, #008080 2px, #005f5f 2px, #005f5f 4px)',
    },
  },
]

export function wallpaperToStyle(wp) {
  if (wp.type === 'solid') return { background: wp.value }
  const entry = WALLPAPERS.find((w) => w.key === wp.value)
  return entry ? entry.css : { background: '#008080' }
}
