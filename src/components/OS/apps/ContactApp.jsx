import { useState, useEffect } from 'react'

const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const INPUT_STYLE = {
  marginTop: 4, marginBottom: 14, padding: '4px 8px',
  boxSizing: 'border-box', border: 'none',
  boxShadow: 'var(--border-field)',
  fontFamily: 'Millennium, serif', fontSize: 15, width: '100%',
}

export function ContactApp() {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [message, setMessage] = useState('')
  const [valid,   setValid]   = useState(false)

  useEffect(() => {
    setValid(name.length > 0 && validateEmail(email) && message.length > 0)
  }, [name, email, message])

  const handleSubmit = () => {
    const subject = encodeURIComponent(`Contact Portfolio — ${name}`)
    const body    = encodeURIComponent(`De : ${name}\nEmail : ${email}\n\n${message}`)
    window.location.href = `mailto:tymeo.poncelet@gmail.com?subject=${subject}&body=${body}`
  }

  return (
    <div className="site-page-content">

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <h1>Contact</h1>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <a
            href="https://github.com/tymeoponcelet"
            target="_blank" rel="noreferrer"
            className="big-button-container"
            style={{ padding: '8px 12px', fontSize: 20, textDecoration: 'none' }}
          >
            🐙
          </a>
          <a
            href="https://www.linkedin.com/in/tyméo-poncelet-83b667383"
            target="_blank" rel="noreferrer"
            className="big-button-container"
            style={{ padding: '8px 12px', fontSize: 20, textDecoration: 'none' }}
          >
            💼
          </a>
        </div>
      </div>

      <div className="text-block">
        <p>
          Je suis disponible pour un stage en administration systèmes,
          réseaux ou cybersécurité. N'hésitez pas à me contacter !
        </p>
        <br />
        <p>
          <b>Email : </b>
          <a href="mailto:tymeo.poncelet@gmail.com" style={{ color: '#000080' }}>
            tymeo.poncelet@gmail.com
          </a>
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>

        <label>
          <p>{!name && <span style={{ color: 'red', paddingRight: 4 }}>*</span>}<b>Votre nom :</b></p>
        </label>
        <input
          style={INPUT_STYLE}
          type="text" placeholder="Nom"
          value={name} onChange={(e) => setName(e.target.value)}
        />

        <label>
          <p>{!validateEmail(email) && <span style={{ color: 'red', paddingRight: 4 }}>*</span>}<b>Email :</b></p>
        </label>
        <input
          style={INPUT_STYLE}
          type="email" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)}
        />

        <label>
          <p>{!message && <span style={{ color: 'red', paddingRight: 4 }}>*</span>}<b>Message :</b></p>
        </label>
        <textarea
          style={{ ...INPUT_STYLE, height: 120, resize: 'none' }}
          placeholder="Message"
          value={message} onChange={(e) => setMessage(e.target.value)}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="site-button" disabled={!valid} onMouseDown={handleSubmit}>
            Envoyer
          </button>
          <p style={{ fontSize: 12, color: '#777', textAlign: 'right' }}>
            {!valid
              ? <span><b style={{ color: 'red' }}>*</b> = requis</span>
              : '\xa0'}
          </p>
        </div>

      </div>
    </div>
  )
}
