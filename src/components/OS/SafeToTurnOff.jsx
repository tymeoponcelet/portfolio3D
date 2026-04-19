// src/components/OS/SafeToTurnOff.jsx
import { useEffect } from 'react'

export function SafeToTurnOff({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 999998,
      background: '#000000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#008080', color: '#ffffff',
        fontFamily: '"MS Sans Serif", Tahoma, Arial, sans-serif',
        fontSize: 14, padding: '20px 40px',
        border: '2px solid #ffffff', textAlign: 'center',
      }}>
        Il est maintenant possible d'éteindre votre ordinateur.
      </div>
    </div>
  )
}
