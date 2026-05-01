// src/hooks/useDevicePixelRatio.js
export function useDevicePixelRatio() {
  const isMobile = window.matchMedia('(pointer: coarse)').matches
  const dpr = window.devicePixelRatio ?? 1
  return isMobile ? Math.min(1.5, dpr) : Math.min(2, dpr)
}
