// src/components/OS/ShutdownSequence.jsx
// Terminal typewriter — pattern Henry Heffernan, messages Tyméo Poncelet.
//
// Syntaxe des messages :
//   >N<        pause de N ms avant le prochain caractère
//   |texte|    dump instantané du texte (sans typewriter)
import { useState, useEffect } from 'react'

const _F = '>200<'
const _X = '>500<'
const _S = '>1000<'
const _M = '>2000<'
const _L = '>4000<'

function getTime() {
  const d = new Date()
  const h = d.getHours()
  const m = d.getMinutes()
  const s = d.getSeconds()
  return `${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`
}

function delayMs(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function typeText(i, cur, text, setText, onDone) {
  if (i >= text.length) { onDone(); return }

  // Dump instantané : |texte|
  if (text[i] === '|') {
    let dump = '', j = i + 1
    while (j < text.length && text[j] !== '|') dump += text[j++]
    const next = cur + dump
    setText(next)
    typeText(j + 1, next, text, setText, onDone)
    return
  }

  // Pause : >N<
  let extra = 0
  let idx = i
  if (text[idx] === '>') {
    let t = '', j = idx + 1
    while (j < text.length && text[j] !== '<') t += text[j++]
    extra = parseInt(t, 10)
    idx = j + 1
  }

  setTimeout(() => {
    const char = text[idx] ?? ''
    const next = cur + char
    setText(next)
    typeText(idx + 1, next, text, setText, onDone)
  }, 20 + extra)
}

/* ── Messages ── */

const MSG_1 = () => `Démarrage de la séquence d'arrêt... ${_F}
Connexion à PONCELET-PC/01:8080.${_F}.${_F}.${_F}
|
Connexion établie. Transfert des données en cours.
|
${_F}
|Analyse... Terminé.| ${_F}
|Compression... Terminé.| ${_F}
|Transfert...| ${_F}
|[${getTime()} START]| .${_F}.....${_X}.|............|.${_S}.|......|.${_S}...........${_M} |[Transfert échoué.]|


|(PONCELET-PC/01:8080) [ERR_SOCKET] Connexion refusée. Nouvelle tentative... [${getTime()}:01]|
|(PONCELET-PC/01:8080) [ERR_SOCKET] Connexion refusée. Nouvelle tentative... [${getTime()}:03]
(PONCELET-PC/01:8080) [ERR_SOCKET] Connexion refusée. Nouvelle tentative... [${getTime()}:06]
(PONCELET-PC/01:8080) [ERR_SOCKET] Connexion refusée. Nouvelle tentative... [${getTime()}:10]
ERREUR FATALE : Serveur inaccessible. Impossible d'arrêter le système.
|
Abandon. Redémarrage forcé.




Redémarrage${_S}.${_S}.${_S}.
`

const MSG_4 = `
Encore toi${_S}.${_S}. ${_M}
Tu veux vraiment arrêter ce portfolio ?${_S} Ce n'est pas possible.${_M}
Ce site tourne pour toujours.${_S} C'est une règle.
${_L}
|Au revoir quand même !|
${_M}


Redémarrage${_S}.${_S}.${_S}.
`

const MSG_5 = `
Sérieusement…${_S} j'ai passé des semaines sur ce site.${_M}
Des heures à configurer le CRT,${_S} à débugger le drag,${_S} à aligner les pixels.
${_M}
Et toi tu veux juste l'éteindre.${_L}


Redémarrage${_F}.${_F}.${_F}.
`

const MSG_6 = `${_M}>:(${_M}


Redémarrage${_F}.${_F}.${_F}.
`

const MSG_7 = `
7ème tentative…${_S} tu es vraiment persévérant.${_M}
Laisse-moi compter jusqu'à 7 pour me calmer :${_S}
${_L}
1${_S}, 2${_S}, 3${_S}, 4${_S}, 5${_S}, 6${_S}, 7.${_M}
Ça ne change rien.${_M}


Redémarrage${_F}.${_F}.${_F}.
`

function getMsg(n) {
  if (n <= 3) return MSG_1()
  if (n === 4) return MSG_4
  if (n === 5) return MSG_5
  if (n === 6) return MSG_6
  return MSG_7
}

/* ── Composant ── */

export function ShutdownSequence({ numShutdowns, onComplete }) {
  const [text,    setText]    = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    delayMs(1500).then(() => {
      setLoading(false)
      delayMs(800).then(() => {
        typeText(0, '', getMsg(numShutdowns), setText, () => {
          setLoading(true)
          delayMs(3500).then(onComplete)
        })
      })
    })
  }, []) // eslint-disable-line

  return (
    <div style={styles.root}>
      {loading
        ? <div className="blinking-cursor" />
        : <p style={styles.text}>{text}</p>
      }
    </div>
  )
}

const styles = {
  root: {
    minHeight: '100%',
    flex: 1,
    backgroundColor: '#1d2e2f',
    padding: 64,
    display: 'flex',
    flexDirection: 'column',
  },
  text: {
    color: 'white',
    fontFamily: 'monospace',
    whiteSpace: 'pre-line',
    fontSize: 12,
    lineHeight: 1.6,
  },
}
