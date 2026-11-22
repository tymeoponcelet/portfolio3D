// src/hooks/useDevicePixelRatio.js

// Not a stateful hook — reads DPR synchronously at mount.
// DPR changes during a session are impractical for a portfolio use case.
// If reactivity is needed, add a matchMedia 'change' listener + useState.
export function useDevicePixelRatio() {
  const isMobile = window.matchMedia('(pointer: coarse)').matches
  const dpr = window.devicePixelRatio ?? 1
  return isMobile ? Math.min(1.5, dpr) : Math.min(2, dpr)
}
