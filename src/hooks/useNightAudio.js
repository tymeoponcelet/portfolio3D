import { useEffect, useRef, useCallback } from 'react'

const FADE    = 4      // secondes de crossfade entry→ambient et entre les boucles
const AMB_VOL = 0.6

export function useNightAudio() {
  const ctxRef  = useRef(null)
  const bufsRef = useRef({})

  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ctxRef.current = ctx

    const load = (url) =>
      fetch(url).then(r => r.arrayBuffer()).then(ab => ctx.decodeAudioData(ab))

    Promise.all([
      load(`${import.meta.env.BASE_URL}sounds/entry.wav`),
      load(`${import.meta.env.BASE_URL}sounds/ambient.mp3`),
    ]).then(([entry, ambient]) => {
      bufsRef.current = { entry, ambient }
    }).catch(() => {})

    return () => ctx.close().catch(() => {})
  }, [])

  // ── Boucle ambient : un passage avec fade-in, fade-out FADE s avant la fin,
  //    puis prochain passage qui démarre au moment du fade-out (crossfade).
  const scheduleAmbLoop = useCallback((startAt, fadeIn) => {
    const ctx = ctxRef.current
    const buf = bufsRef.current.ambient
    if (!ctx || !buf) {
      // Buffers pas encore prêts → réessai
      setTimeout(() => scheduleAmbLoop(startAt, fadeIn), 200)
      return
    }

    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0, startAt)
    if (fadeIn > 0) gain.gain.linearRampToValueAtTime(AMB_VOL, startAt + fadeIn)
    else            gain.gain.setValueAtTime(AMB_VOL, startAt)

    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(gain)
    src.start(startAt)

    const endAt   = startAt + buf.duration
    const xfadeAt = Math.max(startAt + 0.1, endAt - FADE)

    gain.gain.setValueAtTime(AMB_VOL, xfadeAt)
    gain.gain.linearRampToValueAtTime(0, endAt)

    // Planifie le prochain passage (commence au moment du xfade → chevauchement)
    const msUntilXfade = (xfadeAt - ctx.currentTime) * 1000
    setTimeout(() => {
      scheduleAmbLoop(ctxRef.current.currentTime, FADE)
    }, Math.max(0, msUntilXfade))
  }, [])

  // ── play() : appelé après le clic OK (geste utilisateur garanti) ──
  const play = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume()

    const entryBuf = bufsRef.current.entry
    if (!entryBuf) {
      setTimeout(() => play(), 200)
      return
    }

    const entryGain = ctx.createGain()
    entryGain.connect(ctx.destination)
    entryGain.gain.setValueAtTime(1, ctx.currentTime)

    const entrySrc = ctx.createBufferSource()
    entrySrc.buffer = entryBuf
    entrySrc.connect(entryGain)
    entrySrc.start()

    // Fade out de l'entry FADE s avant sa fin
    const entryEnd  = ctx.currentTime + entryBuf.duration
    const xfadeAt   = Math.max(ctx.currentTime + 0.1, entryEnd - FADE)
    entryGain.gain.setValueAtTime(1, xfadeAt)
    entryGain.gain.linearRampToValueAtTime(0, entryEnd)

    // Ambient démarre au moment du xfade, avec un fade-in de FADE s
    const msUntilXfade = (xfadeAt - ctx.currentTime) * 1000
    setTimeout(() => {
      scheduleAmbLoop(ctxRef.current.currentTime, FADE)
    }, Math.max(0, msUntilXfade))
  }, [scheduleAmbLoop])

  return { play }
}
