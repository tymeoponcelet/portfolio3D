// src/App.jsx
import { Scene } from './components/Scene/Scene'
import { FallbackUI } from './components/FallbackUI'
import { useWebGLCheck } from './hooks/useWebGLCheck'

export default function App() {
  const { supported, reason } = useWebGLCheck()
  return supported ? <Scene /> : <FallbackUI reason={reason} />
}
