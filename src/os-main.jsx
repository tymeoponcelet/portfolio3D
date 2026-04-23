// Point d'entrée standalone de l'OS rétro — servi dans l'iframe CSS3DScreen.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { OS } from './components/OS/OS'
import { useOSStore } from './stores/osStore'
import './styles/win95.css'

// Transmet les dimensions réelles de l'iframe au store → centrage fenêtres correct
useOSStore.getState().setScreenSize(window.innerWidth, window.innerHeight)

// Click sound : joué directement dans l'iframe (zéro latence, pas de postMessage)
const _clickCtx = new (window.AudioContext || window.webkitAudioContext)()
let   _clickBuf = null
fetch(`${import.meta.env.BASE_URL}sounds/mouse.mp3`)
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

// Forwarding des événements vers le parent (technique Henry Heffernan) :
// l'iframe ne peut pas propager ses events au canvas WebGL directement,
// donc on les envoie via postMessage pour que CSS3DScreen les reçoive.
;['mousemove', 'mousedown', 'mouseup'].forEach((type) => {
  window.addEventListener(type, (e) => {
    window.parent?.postMessage({ type, clientX: e.clientX, clientY: e.clientY }, '*')
  })
})
;['keydown', 'keyup'].forEach((type) => {
  window.addEventListener(type, (e) => {
    window.parent?.postMessage({ type, key: e.key }, '*')
  })
})

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
