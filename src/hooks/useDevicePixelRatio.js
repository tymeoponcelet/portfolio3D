// src/hooks/useDevicePixelRatio.js
import { IS_LOW_END } from '../utils/perf'

// Not a stateful hook — reads DPR synchronously at mount.
// Le coût GPU croît avec le carré du DPR : DPR 2 = 4× plus de pixels à
// calculer qu'en DPR 1. On plafonne donc à 1.5 (net, et ~45 % de pixels en
// moins qu'à 2), et à 1 sur les machines modestes.
export function useDevicePixelRatio() {
  const dpr = window.devicePixelRatio ?? 1
  return IS_LOW_END ? 1 : Math.min(1.5, dpr)
}
