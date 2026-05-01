// src/App.jsx
import { Scene } from './components/Scene/Scene'
import { FallbackUI } from './components/FallbackUI'
import { SeoMeta } from './components/SeoMeta'
import { useWebGLCheck } from './hooks/useWebGLCheck'

export default function App() {
  const { supported, reason } = useWebGLCheck()
  return (
    <>
      <SeoMeta />
      {supported ? <Scene /> : <FallbackUI reason={reason} />}
    </>
  )
}
