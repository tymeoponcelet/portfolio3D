// src/components/OS/BSOD.jsx
import { useEffect } from 'react'
import { win95sounds } from '../../utils/win95sounds'

const TEXT = `Un problème grave a été détecté et Windows a été arrêté pour éviter
tout dommage à votre ordinateur.

EXCEPTION_NOT_HANDLED

Si c'est la première fois que vous voyez cet écran, redémarrez
votre ordinateur. Si l'écran réapparaît, procédez comme suit :

Vérifiez que tout nouveau matériel ou logiciel est correctement
installé. Si c'est une nouvelle installation, demandez au fabricant
du matériel ou du logiciel les mises à jour Windows nécessaires.

Si les problèmes persistent, désactivez ou supprimez tout nouveau
matériel ou logiciel. Désactivez les options mémoire du BIOS telles
que la mise en cache ou la création d'ombres.

Informations techniques :

*** STOP: 0x0000000E (0xC0000005, 0xBFF7B4D2, 0x00000000, 0x00000002)

*** address BFF7B4D2 base at BFF70000, DateStamp 3640e7c7 — win32k.sys


Début du vidage de la mémoire physique
Vidage de la mémoire physique terminé.
Contactez votre administrateur système ou l'assistance technique.`

export function BSOD({ onRecover }) {
  useEffect(() => {
    win95sounds.bsod()
    let dismissed = false
    const dismiss = () => {
      if (dismissed) return
      dismissed = true
      clearTimeout(tid)
      onRecover()
    }
    const tid = setTimeout(dismiss, 8000)
    window.addEventListener('click',   dismiss, { once: true })
    window.addEventListener('keydown', dismiss, { once: true })
    return () => {
      clearTimeout(tid)
      window.removeEventListener('click',   dismiss)
      window.removeEventListener('keydown', dismiss)
    }
  }, [onRecover])

  return (
    <div role="alert" style={{
      position: 'absolute', inset: 0, zIndex: 999999,
      background: '#0000AA', color: '#ffffff',
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: 13, padding: '36px 48px',
      lineHeight: 1.65, cursor: 'wait',
    }}>
      <div style={{
        display: 'inline-block',
        background: '#aaaaaa', color: '#0000AA',
        padding: '1px 8px', marginBottom: 18,
        fontWeight: 'bold', fontSize: 13,
      }}>
        Windows
      </div>
      <pre style={{
        fontFamily: 'inherit', fontSize: 'inherit',
        whiteSpace: 'pre-wrap', margin: 0, color: '#ffffff',
      }}>
        {TEXT}
      </pre>
      <p style={{ marginTop: 24, fontSize: 12, opacity: 0.75 }}>
        Appuyez sur une touche ou cliquez pour redémarrer…
      </p>
    </div>
  )
}
