// src/components/FallbackUI.jsx

const s = {
  desktop: {
    background: '#008080',
    minHeight: '100vh',
    padding: '16px',
    fontFamily: '"MS Sans Serif", Arial, sans-serif',
    fontSize: '13px',
    color: '#000000',
  },
  window: {
    background: '#c0c0c0',
    border: '2px solid',
    borderColor: '#ffffff #404040 #404040 #ffffff',
    boxShadow: '1px 1px 0 #000000',
    maxWidth: '640px',
    margin: '0 auto 16px auto',
  },
  titlebar: {
    background: '#000080',
    color: '#ffffff',
    padding: '3px 6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  body: { padding: '12px 16px' },
  h1: { fontSize: '18px', margin: '0 0 4px 0' },
  subtitle: { color: '#000080', marginBottom: '8px' },
  alert: {
    background: '#ffffe1',
    border: '1px solid #808080',
    padding: '6px 10px',
    fontSize: '11px',
    marginBottom: '0',
  },
  h2: {
    fontSize: '13px',
    fontWeight: 'bold',
    borderBottom: '1px solid #808080',
    paddingBottom: '4px',
    marginBottom: '8px',
    marginTop: '0',
  },
  list: { listStyle: 'none', padding: 0, margin: 0 },
  listItem: { padding: '2px 0' },
  tag: {
    display: 'inline-block',
    background: '#000080',
    color: '#ffffff',
    padding: '1px 6px',
    fontSize: '11px',
    border: '1px solid #404040',
    marginRight: '4px',
    marginBottom: '4px',
  },
  link: { color: '#000080' },
}

const SKILLS = [
  'React', 'Three.js', 'JavaScript', 'TypeScript',
  'Node.js', 'CSS', 'Tailwind CSS', 'Git', 'Vite',
]

export function FallbackUI({ reason }) {
  const message =
    reason === 'size'
      ? "Pour l'experience 3D complete, ouvre sur un ecran plus large (> 480px)."
      : "Ton navigateur ne supporte pas WebGL 2. Essaie Chrome ou Firefox a jour."

  return (
    <main style={s.desktop}>

      <div style={s.window} role="banner">
        <div style={s.titlebar}>
          <span>Poncelet Tymeo - Portfolio</span>
          <span aria-hidden="true">[=]</span>
        </div>
        <div style={s.body}>
          <h1 style={s.h1}>Poncelet Tymeo</h1>
          <p style={s.subtitle}>Developpeur Web Full Stack</p>
          <p style={s.alert}>{message}</p>
        </div>
      </div>

      <div style={s.window}>
        <div style={s.titlebar}><span>A propos</span></div>
        <div style={s.body}>
          <p>
            Developpeur passionne par les interfaces creatives, la 3D web
            et l'experience utilisateur. Ce portfolio simule un environnement
            Windows 95 interactif en trois dimensions.
          </p>
        </div>
      </div>

      <nav style={s.window} aria-label="Projets">
        <div style={s.titlebar}><span>Projets</span></div>
        <div style={s.body}>
          <h2 style={s.h2}>Projets selectionnes</h2>
          <ul style={s.list}>
            <li style={s.listItem}>Portfolio 3D Windows 95 — Three.js, React, CSS3DRenderer</li>
          </ul>
        </div>
      </nav>

      <section style={s.window} aria-label="Competences">
        <div style={s.titlebar}><span>Competences</span></div>
        <div style={s.body}>
          <h2 style={s.h2}>Stack technique</h2>
          {SKILLS.map((skill) => (
            <span key={skill} style={s.tag}>{skill}</span>
          ))}
        </div>
      </section>

      <footer style={s.window}>
        <div style={s.titlebar}><span>Contact</span></div>
        <div style={s.body}>
          <p>
            Email :{' '}
            <a href="mailto:tymeo.poncelet@gmail.com" style={s.link}>
              tymeo.poncelet@gmail.com
            </a>
          </p>
        </div>
      </footer>

    </main>
  )
}
