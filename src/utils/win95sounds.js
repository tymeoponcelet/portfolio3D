// src/utils/win95sounds.js
let _ctx = null

function ctx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

function tone(freq, dur, type = 'square', vol = 0.25) {
  try {
    const c = ctx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(vol, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + dur)
  } catch (_) {}
}

export const win95sounds = {
  click:    () => tone(800, 0.05, 'sine', 0.12),
  open:     () => { tone(600, 0.08, 'sine', 0.18); setTimeout(() => tone(900, 0.06, 'sine', 0.14), 60) },
  close:    () => { tone(900, 0.06, 'sine', 0.18); setTimeout(() => tone(600, 0.08, 'sine', 0.13), 50) },
  minimize: () => { tone(700, 0.06, 'sine', 0.12); setTimeout(() => tone(500, 0.07, 'sine', 0.10), 50) },
  error:    () => { tone(300, 0.15, 'square', 0.3); setTimeout(() => tone(250, 0.2, 'square', 0.25), 170) },
  bsod:     () => tone(180, 1.0, 'square', 0.35),
  startup:  () => {
    try {
      const a = new Audio('/sounds/startup.mp3')
      a.volume = 0.6
      a.play().catch(() => {})
    } catch (_) {}
  },
}
