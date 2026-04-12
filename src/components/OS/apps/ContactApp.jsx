// src/components/OS/apps/ContactApp.jsx

const CONTACTS = [
  { icon: '📧', label: 'E-mail',    value: 'tymeo.poncelet@gmail.com',                       href: 'mailto:tymeo.poncelet@gmail.com' },
  { icon: '📱', label: 'Téléphone', value: '06 10 25 32 34',                                 href: 'tel:+33610253234' },
  { icon: '💼', label: 'LinkedIn',  value: 'linkedin.com/in/tyméo-poncelet-83b667383',        href: 'https://www.linkedin.com/in/tyméo-poncelet-83b667383' },
  { icon: '🐙', label: 'GitHub',    value: 'github.com/tymeoponcelet',                        href: 'https://github.com/tymeoponcelet' },
]

export function ContactApp() {
  return (
    <div className="win95-about">
      <div className="win95-about-header">
        <div className="win95-about-icon">📬</div>
        <div>
          <div className="win95-about-title">Poncelet Tyméo</div>
          <div className="win95-about-sub">Étudiant BTS SIO SISR — Recherche stage</div>
        </div>
      </div>
      {CONTACTS.map((c) => (
        <div key={c.label} className="win95-about-field">
          <span style={{ fontSize: 14, width: 18, flexShrink: 0 }}>{c.icon}</span>
          <span className="win95-about-key">{c.label} :</span>
          <a
            href={c.href}
            target="_blank"
            rel="noreferrer"
            className="win95-about-val"
            style={{ color: '#000080', textDecoration: 'underline', cursor: 'pointer' }}
            onClick={(e) => e.stopPropagation()}
          >
            {c.value}
          </a>
        </div>
      ))}
      <hr className="win95-hr" />
      <div style={{ fontSize: 10, color: '#555', lineHeight: 1.5 }}>
        Disponible pour un stage en administration systèmes,<br />
        réseaux ou cybersécurité. N'hésitez pas à me contacter.
      </div>
    </div>
  )
}
