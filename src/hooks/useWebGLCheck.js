// src/hooks/useWebGLCheck.js
import { useState } from 'react'

export function useWebGLCheck() {
  const [result] = useState(() => {
    if (window.innerWidth < 480) {
      return { supported: false, reason: 'size' }
    }
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('webgl2')
      if (!ctx) return { supported: false, reason: 'webgl' }
    } catch {
      return { supported: false, reason: 'webgl' }
    }
    return { supported: true, reason: null }
  })
  return result
}
