// src/hooks/useWebGLCheck.js
import { useState } from 'react'

const MIN_WIDTH = 480

export function useWebGLCheck() {
  const [result] = useState(() => {
    if (window.innerWidth < MIN_WIDTH) {
      return { supported: false, reason: 'size' }
    }
    try {
      const canvas = document.createElement('canvas')
      if (!canvas.getContext('webgl2')) return { supported: false, reason: 'webgl' }
    } catch {
      return { supported: false, reason: 'webgl' }
    }
    return { supported: true, reason: null }
  })
  return result
}
