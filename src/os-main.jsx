// Point d'entrée standalone de l'OS rétro — servi dans l'iframe CSS3DScreen.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { OS } from './components/OS/OS'
import { useOSStore } from './stores/osStore'
import { IS_LOW_END } from './utils/perf'
import './styles/win95.css'

// Transmet les dimensions réelles de l'iframe au store → centrage fenêtres correct
useOSStore.getState().setScreenSize(window.innerWidth, window.innerHeight)

// Click sound : joué directement dans l'iframe (zéro latence, pas de postMessage)
const _clickCtx = new (window.AudioContext || window.webkitAudioContext)()
let   _clickBuf = null
fetch(`${import.meta.env.BASE_URL}sounds/mouse.ogg`)
  .then(r => r.arrayBuffer())
  .then(ab => _clickCtx.decodeAudioData(ab))
  .then(buf => { _clickBuf = buf })
  .catch(() => {})

window.addEventListener('mousedown', () => {
  if (!_clickBuf) return
  if (_clickCtx.state === 'suspended') _clickCtx.resume()
  const src = _clickCtx.createBufferSource()
  src.buffer = _clickBuf
  src.connect(_clickCtx.destination)
  src.start()
})

// Forwarding clavier vers le parent (Échap pour quitter l'écran quand le
// focus est dans l'OS). La souris n'est plus renvoyée : personne ne
// l'écoutait et cela coûtait un postMessage par mouvement.
;['keydown', 'keyup'].forEach((type) => {
  window.addEventListener(type, (e) => {
    window.parent?.postMessage({ type, key: e.key }, window.location.origin)
  })
})

// Machine modeste → effets CSS coûteux désactivés (voir win95.css)
if (IS_LOW_END) document.documentElement.dataset.perf = 'low'

const style = document.createElement('style')
style.textContent = `
  *, *::before, *::after { box-sizing: border-box }
  body, html, #os-root {
    margin: 0; padding: 0;
    width: 100%; height: 100%;
    overflow: hidden;
    background: #000;
  }
`
document.head.appendChild(style)

createRoot(document.getElementById('os-root')).render(
  <StrictMode>
    <OS />
  </StrictMode>,
)
