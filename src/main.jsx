// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/win95.css'

// Reset global indispensable
const style = document.createElement('style')
style.textContent = `*, *::before, *::after { box-sizing: border-box }
body, html, #root { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #1a1a2e }
canvas { cursor: auto !important; touch-action: none; user-select: none; -webkit-user-select: none }`
// touch-action/user-select : CameraControls retire ces styles quand il est
// désactivé (mode écran) → sans cette règle, un glisser sur l'écran pouvait
// déclencher sélection/défilement natif et interrompre le drag des fenêtres.
document.head.appendChild(style)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)