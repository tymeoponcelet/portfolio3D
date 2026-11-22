// src/utils/perf.js
//
// Détection « PC peu puissant » partagée entre la scène 3D (page parente)
// et l'OS (iframe). Évaluée une seule fois au chargement.
//
// Forçage manuel possible via l'URL :  ?quality=low  ou  ?quality=high
// (l'iframe lit l'URL de la page parente, même origine).

function readQualityParam() {
  try {
    const search = window.parent !== window
      ? window.parent.location.search
      : window.location.search
    return new URLSearchParams(search).get('quality')
  } catch {
    return null
  }
}

function detectLowEnd() {
  const forced = readQualityParam()
  if (forced === 'low')  return true
  if (forced === 'high') return false

  try {
    const cores  = navigator.hardwareConcurrency || 4
    const memory = navigator.deviceMemory || 8          // Chrome/Edge uniquement
    const coarse = window.matchMedia('(pointer: coarse)').matches
    return cores <= 4 || memory <= 4 || coarse
  } catch {
    return false
  }
}

export const IS_LOW_END = detectLowEnd()
