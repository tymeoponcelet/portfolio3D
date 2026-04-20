# Henry-Style Showcase Full Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure ShowcaseExplorer and its 4 sub-components to match Henry Heffernan's portfolio layout — Millennium fonts, fixed 200px sidebar, 5 sections (Home, About, Experience, Projects, Contact) — with Tyméo Poncelet's real content.

**Architecture:** Pure CSS + JSX rewrite, no logic changes. State-based navigation (no React Router). Millennium.ttf + Millennium-Bold.ttf copied from Henry's local source. ShowcaseExplorer manages `section` state; sub-components are pure presentational. BioNotepad → About, SkillsApp → Experience, ProjectsExplorer → Projects, ContactApp → Contact (files rewritten in-place, export names unchanged).

**Tech Stack:** React 19, CSS (win95.css), Vite 8

---

## File Map

| File | Action |
|---|---|
| `src/assets/fonts/Millennium.ttf` | Create (copy from Henry's source) |
| `src/assets/fonts/Millennium-Bold.ttf` | Create (copy from Henry's source) |
| `src/styles/win95.css` | Modify — append Henry-style classes at end |
| `src/components/OS/apps/ShowcaseExplorer.jsx` | Rewrite |
| `src/components/OS/apps/BioNotepad.jsx` | Rewrite → About section |
| `src/components/OS/apps/SkillsApp.jsx` | Rewrite → Experience section |
| `src/components/OS/apps/ProjectsExplorer.jsx` | Rewrite → Projects section |
| `src/components/OS/apps/ContactApp.jsx` | Rewrite → Contact section |

Note: `--border-raised-outer` and `--border-raised-inner` are already defined in win95.css — no need to add them.

---

### Task 1: Fonts + CSS foundation

**Files:**
- Create: `src/assets/fonts/Millennium.ttf`
- Create: `src/assets/fonts/Millennium-Bold.ttf`
- Modify: `src/styles/win95.css` (append at end)

- [ ] **Step 1: Copy font files**

```bash
cp "C:/Users/TYM/Desktop/henry site/source-henry/src/assets/fonts/Millennium.ttf" \
   "C:/Users/TYM/Desktop/site old pc - Copie/portfolio-3d/src/assets/fonts/Millennium.ttf"
cp "C:/Users/TYM/Desktop/henry site/source-henry/src/assets/fonts/Millennium-Bold.ttf" \
   "C:/Users/TYM/Desktop/site old pc - Copie/portfolio-3d/src/assets/fonts/Millennium-Bold.ttf"
ls "C:/Users/TYM/Desktop/site old pc - Copie/portfolio-3d/src/assets/fonts/"
```

Expected: `Millennium.ttf` and `Millennium-Bold.ttf` listed.

- [ ] **Step 2: Append Henry-style CSS block at the end of `src/styles/win95.css`**

```css
/* ═══════════════════════════════════════════════════════════════
   HENRY-STYLE SHOWCASE — Layout, Typography, Components
   ═══════════════════════════════════════════════════════════════ */

@font-face {
  font-family: Millennium;
  src: url('../assets/fonts/Millennium.ttf') format('truetype');
  font-display: block;
}

@font-face {
  font-family: MillenniumBold;
  src: url('../assets/fonts/Millennium-Bold.ttf') format('truetype');
  font-display: block;
}

/* Root layout — fills the OS window content area */
.site-page {
  display:    flex;
  position:   absolute;
  inset:      0;
  overflow:   hidden;
  background: #ffffff;
}

/* Scoped typography — does NOT affect OS chrome outside .site-page */
.site-page h1 {
  font-family: MillenniumBold, 'Times New Roman', serif;
  font-size:   48px;
  margin:      0;
  line-height: 1;
}

.site-page h2 {
  font-family: MillenniumBold, 'Times New Roman', serif;
  font-size:   28px;
  margin:      0;
}

.site-page h3 {
  font-family: MillenniumBold, 'Times New Roman', serif;
  font-size:   20px;
  margin:      0;
}

.site-page h4 {
  font-family: MillenniumBold, 'Times New Roman', serif;
  font-size:   16px;
  margin:      0;
}

.site-page p {
  font-family: Millennium, 'Times New Roman', serif;
  font-size:   15px;
  margin:      0;
}

.site-page li {
  font-family:   Millennium, 'Times New Roman', serif;
  font-size:     15px;
  margin-bottom: 12px;
}

.site-page b,
.site-page strong {
  font-family: MillenniumBold, 'Times New Roman', serif;
}

/* Scrollable content panel (right of sidebar) */
.site-page-content {
  display:        flex;
  flex-direction: column;
  margin-left:    200px;
  padding:        24px 32px 48px 24px;
  overflow-y:     scroll;
  flex:           1;
}

/* Text block — paragraph grouping */
.text-block {
  margin-top:     16px;
  margin-bottom:  24px;
  display:        flex;
  flex-direction: column;
}

/* Big clickable button — Win95 raised border */
.big-button-container {
  display:       flex;
  align-items:   center;
  gap:           16px;
  box-shadow:    var(--border-raised-outer), var(--border-raised-inner);
  padding:       20px 24px;
  cursor:        pointer;
  margin-bottom: 16px;
  background:    var(--w-surface-h, #e9e9e9);
}

.big-button-container:hover  { background-color: #d4d4d4; }
.big-button-container:active { background-color: var(--w-surface, #c0c0c0); }

/* Win95-style form submit button */
.site-button {
  display:         flex;
  align-items:     center;
  justify-content: center;
  background:      var(--w-surface-h, #e9e9e9);
  box-shadow:      var(--border-raised-outer), var(--border-raised-inner);
  border:          none;
  padding:         4px 16px;
  font-family:     Millennium, serif;
  font-size:       15px;
  cursor:          pointer;
  min-width:       160px;
  height:          28px;
}

.site-button:disabled {
  cursor:     not-allowed;
  background: var(--w-surface, #c0c0c0);
  color:      #777;
}

/* ── Sidebar Navbar ───────────────────────────────────────────── */

.showcase-navbar {
  width:          200px;
  flex-shrink:    0;
  padding:        32px 24px;
  display:        flex;
  flex-direction: column;
  overflow:       hidden;
  box-sizing:     border-box;
  border-right:   1px solid #d0d0d0;
}

.showcase-navbar-header {
  display:        flex;
  flex-direction: column;
  margin-bottom:  48px;
}

.showcase-navbar-name {
  font-family: MillenniumBold, serif;
  font-size:   28px;
  line-height: 1.1;
  margin:      0;
}

.showcase-navbar-sub {
  font-family: Millennium, serif;
  font-size:   13px;
  margin:      8px 0 0 0;
  color:       #555;
}

.showcase-navbar-links {
  display:        flex;
  flex-direction: column;
}

.showcase-nav-link {
  font-family:    MillenniumBold, serif;
  font-size:      13px;
  letter-spacing: 1px;
  margin-bottom:  24px;
  background:     none;
  border:         none;
  cursor:         pointer;
  text-align:     left;
  padding:        0;
  color:          #000;
  text-decoration: none;
}

.showcase-nav-link:hover  { text-decoration: underline; }
.showcase-nav-link.active { text-decoration: underline; }

/* ── Home page ────────────────────────────────────────────────── */

.site-page-home {
  display:         flex;
  flex:            1;
  align-items:     center;
  justify-content: center;
}

.site-page-home-content {
  display:        flex;
  flex-direction: column;
  align-items:    center;
  text-align:     center;
  gap:            12px;
}

.site-page-home-title {
  font-family: MillenniumBold, 'Times New Roman', serif !important;
  font-size:   56px !important;
  line-height: 1 !important;
  margin:      0 0 8px 0 !important;
}

.site-page-home-role {
  font-family: MillenniumBold, 'Times New Roman', serif !important;
  font-size:   24px !important;
  margin:      0 !important;
}

.site-page-home-sub {
  font-family: Millennium, 'Times New Roman', serif !important;
  font-size:   15px !important;
  color:       #555 !important;
  margin:      0 0 16px 0 !important;
}

.site-page-home-nav {
  display: flex;
  gap:     32px;
}

/* ── Experience header rows ────────────────────────────────────── */

.experience-header {
  display:        flex;
  flex-direction: column;
  width:          100%;
  margin-top:     16px;
  margin-bottom:  4px;
}

.experience-header-row {
  display:         flex;
  justify-content: space-between;
  align-items:     flex-end;
  width:           100%;
  margin-bottom:   4px;
}
```

- [ ] **Step 3: Start dev server and verify no CSS errors**

```bash
cd "C:/Users/TYM/Desktop/site old pc - Copie/portfolio-3d" && npm run dev
```

Expected: No build errors in terminal.

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/TYM/Desktop/site old pc - Copie/portfolio-3d"
git add src/assets/fonts/Millennium.ttf src/assets/fonts/Millennium-Bold.ttf src/styles/win95.css
git commit -m "style: add Millennium fonts + Henry-style CSS foundation"
```

---

### Task 2: ShowcaseExplorer.jsx — new layout + sidebar

**Files:**
- Modify: `src/components/OS/apps/ShowcaseExplorer.jsx`

- [ ] **Step 1: Replace full ShowcaseExplorer.jsx content**

```jsx
// src/components/OS/apps/ShowcaseExplorer.jsx
import { useState } from 'react'
import { BioNotepad }       from './BioNotepad'
import { SkillsApp }        from './SkillsApp'
import { ProjectsExplorer } from './ProjectsExplorer'
import { ContactApp }       from './ContactApp'

const NAV = [
  { id: 'home',       label: 'HOME'       },
  { id: 'about',      label: 'ABOUT'      },
  { id: 'experience', label: 'EXPERIENCE' },
  { id: 'projects',   label: 'PROJECTS'   },
  { id: 'contact',    label: 'CONTACT'    },
]

function VerticalNavbar({ section, setSection }) {
  return (
    <div className="showcase-navbar">
      <div className="showcase-navbar-header">
        <p className="showcase-navbar-name">Tyméo<br />Poncelet</p>
        <p className="showcase-navbar-sub">Portfolio '26</p>
      </div>
      <div className="showcase-navbar-links">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`showcase-nav-link${section === n.id ? ' active' : ''}`}
            onClick={() => setSection(n.id)}
          >
            {n.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ShowcaseExplorer() {
  const [section, setSection] = useState('home')
  const isHome = section === 'home'

  return (
    <div className="site-page">
      {!isHome && <VerticalNavbar section={section} setSection={setSection} />}

      {isHome ? (
        <div className="site-page-home">
          <div className="site-page-home-content">
            <h1 className="site-page-home-title">Tyméo Poncelet</h1>
            <h2 className="site-page-home-role">Étudiant BTS SIO SISR</h2>
            <p className="site-page-home-sub">Pôle Sup DE LA SALLE — Recherche stage</p>
            <div className="site-page-home-nav">
              {NAV.filter((n) => n.id !== 'home').map((n) => (
                <button
                  key={n.id}
                  className="showcase-nav-link"
                  onClick={() => setSection(n.id)}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {section === 'about'      && <BioNotepad />}
          {section === 'experience' && <SkillsApp />}
          {section === 'projects'   && <ProjectsExplorer />}
          {section === 'contact'    && <ContactApp />}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Ouvre l'app → ShowcaseExplorer. Confirme :
- Home : grand titre centré "Tyméo Poncelet", sous-titre, 4 liens nav en ligne
- Clic ABOUT → sidebar apparaît à gauche (200px) : "Tyméo / Poncelet / Portfolio '26" + 5 liens
- Lien ABOUT souligné (actif)
- Clic HOME dans sidebar → retour home, sidebar disparaît

- [ ] **Step 3: Commit**

```bash
git add src/components/OS/apps/ShowcaseExplorer.jsx
git commit -m "feat(showcase): Henry layout — sidebar + 5-section state"
```

---

### Task 3: BioNotepad.jsx → About

**Files:**
- Modify: `src/components/OS/apps/BioNotepad.jsx`

- [ ] **Step 1: Replace full BioNotepad.jsx content**

```jsx
// src/components/OS/apps/BioNotepad.jsx
export function BioNotepad() {
  return (
    <div className="site-page-content">
      <h1 style={{ marginLeft: -16 }}>Welcome</h1>
      <h3>Je suis Tyméo Poncelet</h3>

      <div className="text-block">
        <p>
          Étudiant en BTS SIO option SISR (Systèmes, Réseaux &amp; Cybersécurité)
          au Pôle Sup DE LA SALLE, je suis passionné par les infrastructures réseau
          et la cybersécurité. Je recherche activement un stage dans ces domaines
          pour la période 2025-2026.
        </p>
      </div>

      <div className="text-block">
        <h3>Formation</h3>
        <br />
        <p><b>BTS SIO — Services Informatiques aux Organisations</b></p>
        <p>Spécialisation SISR &nbsp;·&nbsp; Pôle Sup DE LA SALLE &nbsp;·&nbsp; 2025-2026</p>
        <br />
        <p><b>Baccalauréat — Spécialité Maths / AMC</b></p>
        <p>Mention Assez Bien &nbsp;·&nbsp; Lycée Jean Brito &nbsp;·&nbsp; 2023-2024</p>
      </div>

      <div className="text-block">
        <h3>Compétences</h3>
        <br />
        <p><b>Infrastructure &amp; Réseaux</b></p>
        <p>Windows Server · Active Directory · Cisco / Packet Tracer · pfSense / VyOS · Adressage IP / VLSM · VirtualBox</p>
        <br />
        <p><b>Cybersécurité</b></p>
        <p>Kali Linux · Wireshark · Hashcat · Hydra · Chiffrement / Hachage</p>
        <br />
        <p><b>Systèmes Linux</b></p>
        <p>Debian / Ubuntu · Gestion des permissions · GLPI · Zabbix / Grafana · Scripts Bash</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Ouvre ABOUT. Confirme :
- h1 "Welcome" avec font MillenniumBold
- h3 "Je suis Tyméo Poncelet"
- 3 blocs : intro, Formation (BTS + Bac), Compétences (3 catégories)
- Fond blanc, texte serif Millennium
- Scroll fonctionne si le contenu dépasse

- [ ] **Step 3: Commit**

```bash
git add src/components/OS/apps/BioNotepad.jsx
git commit -m "feat(about): Welcome page with formation and competences"
```

---

### Task 4: SkillsApp.jsx → Experience

**Files:**
- Modify: `src/components/OS/apps/SkillsApp.jsx`

- [ ] **Step 1: Replace full SkillsApp.jsx content**

```jsx
// src/components/OS/apps/SkillsApp.jsx
export function SkillsApp() {
  return (
    <div className="site-page-content">

      <div className="experience-header">
        <div className="experience-header-row">
          <h1>McDonald's</h1>
          <h4>Bain de Bretagne</h4>
        </div>
        <div className="experience-header-row">
          <h3>Équipier</h3>
          <b><p>Juil. 2024 – Août 2025</p></b>
        </div>
      </div>
      <div className="text-block">
        <p>Travail en équipe dans un environnement cadencé à fort flux.</p>
        <br />
        <ul>
          <li><p>Coordination avec les collègues pour assurer un service efficace</p></li>
          <li><p>Rigueur et respect des procédures opérationnelles</p></li>
          <li><p>Application des normes d'hygiène et sécurité alimentaire</p></li>
        </ul>
      </div>

      <div className="experience-header">
        <div className="experience-header-row">
          <h1>Cabinet Kaliame</h1>
          <h4>Expert-comptable</h4>
        </div>
        <div className="experience-header-row">
          <h3>Stagiaire</h3>
          <b><p>Février 2023 — 3 jours</p></b>
        </div>
      </div>
      <div className="text-block">
        <p>Stage d'observation en cabinet d'expertise comptable.</p>
        <br />
        <ul>
          <li><p>Tri, classement et vérification de documents comptables</p></li>
          <li><p>Organisation et rigueur administrative</p></li>
        </ul>
      </div>

    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Ouvre EXPERIENCE. Confirme :
- "McDonald's" en h1 avec "Bain de Bretagne" h4 aligné à droite
- "Équipier" h3 avec la date en face
- Bullets en font Millennium
- Même pattern pour Cabinet Kaliame en dessous

- [ ] **Step 3: Commit**

```bash
git add src/components/OS/apps/SkillsApp.jsx
git commit -m "feat(experience): two entries with Henry header pattern"
```

---

### Task 5: ProjectsExplorer.jsx → Projects

**Files:**
- Modify: `src/components/OS/apps/ProjectsExplorer.jsx`

- [ ] **Step 1: Replace full ProjectsExplorer.jsx content**

```jsx
// src/components/OS/apps/ProjectsExplorer.jsx
import { useState } from 'react'

const PROJECTS = [
  {
    id:      'ad',
    icon:    '🖧',
    title:   'Active Directory',
    sub:     'DÉPLOIEMENT',
    tech:    'Windows Server · Active Directory · DNS · GPO · PowerShell',
    desc:    "Déploiement d'un domaine Windows Server complet avec Active Directory.",
    bullets: [
      'Installation et configuration de Windows Server 2022',
      "Mise en place de l'Active Directory (AD DS)",
      "Création d'utilisateurs, groupes et unités d'organisation",
      'Configuration DNS, DHCP et stratégies de groupe (GPO)',
      'Scripts PowerShell pour automatiser la création de comptes',
      'Profils itinérants et montage de lecteurs réseau',
    ],
    result: 'Domaine fonctionnel avec 30+ comptes, montage automatique des lecteurs et politiques de groupe appliquées.',
  },
  {
    id:      'pfsense',
    icon:    '🔥',
    title:   'pfSense Firewall',
    sub:     'CONFIGURATION',
    tech:    'pfSense · VyOS · NAT · Firewall · VirtualBox',
    desc:    'Étude comparative VyOS vs pfSense — mise en place d\'un pare-feu complet.',
    bullets: [
      'Configuration d\'un pare-feu pfSense (FreeBSD)',
      'Mise en place NAT et règles de filtrage',
      'Routage statique inter-sous-réseaux',
      'Tests de connectivité avec ping / traceroute',
    ],
    result: 'Deux sous-réseaux virtuels interconnectés avec règles de filtrage et NAT opérationnels.',
  },
  {
    id:      'zabbix',
    icon:    '📊',
    title:   'Zabbix Supervision',
    sub:     'MONITORING',
    tech:    'Zabbix 7.4 · Grafana · Ubuntu Server · MySQL · ICMP / SNMP',
    desc:    "Supervision de la connectivité internet d'une organisation via Zabbix et Grafana.",
    bullets: [
      'Ubuntu Server 22.04 comme hôte de supervision',
      'Zabbix 7.4 avec base de données MySQL',
      'Monitoring ICMP via fping',
      'Intégration Grafana pour dashboards temps réel',
    ],
    result: 'Tableau de bord Grafana opérationnel avec alertes ICMP configurées.',
  },
]

export function ProjectsExplorer() {
  const [active, setActive] = useState(null)

  if (active) {
    return (
      <div className="site-page-content">
        <button
          className="showcase-nav-link"
          style={{ marginBottom: 24, fontSize: 13 }}
          onClick={() => setActive(null)}
        >
          ← PROJETS
        </button>
        <h1>{active.title}</h1>
        <h3>{active.sub}</h3>
        <div className="text-block">
          <p><b>Technologies :</b> {active.tech}</p>
        </div>
        <div className="text-block">
          <p>{active.desc}</p>
          <br />
          <ul>
            {active.bullets.map((b) => <li key={b}><p>{b}</p></li>)}
          </ul>
          <br />
          <p><b>Résultat :</b> {active.result}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="site-page-content">
      <h1>Projets</h1>
      <h3>&amp; Infrastructure</h3>
      <br />
      <p>Cliquez sur un projet pour voir les détails.</p>
      <br />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {PROJECTS.map((p) => (
          <div
            key={p.id}
            className="big-button-container"
            onMouseDown={() => setActive(p)}
          >
            <span style={{ fontSize: 36 }}>{p.icon}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ fontSize: 32 }}>{p.title}</h1>
              <h3>{p.sub}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Ouvre PROJECTS. Confirme :
- h1 "Projets", h3 "& Infrastructure"
- 3 blocs Win95 raised-border cliquables : 🖧 Active Directory, 🔥 pfSense, 📊 Zabbix
- Clic sur un bloc → vue détail : "← PROJETS", h1 titre, h3 sous-titre, tech, description, bullets, résultat
- Clic "← PROJETS" → retour à la liste des 3 blocs

- [ ] **Step 3: Commit**

```bash
git add src/components/OS/apps/ProjectsExplorer.jsx
git commit -m "feat(projects): 3 big-button project cards with detail view"
```

---

### Task 6: ContactApp.jsx → Contact

**Files:**
- Modify: `src/components/OS/apps/ContactApp.jsx`

- [ ] **Step 1: Replace full ContactApp.jsx content**

```jsx
// src/components/OS/apps/ContactApp.jsx
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
        <p><b>Téléphone : </b>06 10 25 32 34</p>
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
```

- [ ] **Step 2: Verify in browser**

Ouvre CONTACT. Confirme :
- h1 "Contact" avec icônes 🐙 et 💼 en haut à droite (Win95 raised border)
- Email et téléphone en texte sous la description
- 3 champs : Nom, Email, Message — astérisque rouge si vide
- Bouton "Envoyer" désactivé (grisé) tant qu'un champ est vide ou email invalide
- Remplis les 3 champs → bouton s'active → clic ouvre `mailto:` avec sujet et corps pré-remplis
- Clic 🐙 ouvre github.com/tymeoponcelet dans nouvel onglet
- Clic 💼 ouvre linkedin.com/in/tyméo-poncelet dans nouvel onglet

- [ ] **Step 3: Final full visual check**

Navigue dans toutes les sections en ordre :
Home → ABOUT → EXPERIENCE → PROJECTS → (clic Active Directory) → (← PROJETS) → CONTACT

Confirme :
- Fonts Millennium bien chargées sur toutes les pages (serif distinctive vs pixel font Win95)
- Sidebar présente sur toutes les sections sauf Home
- Lien actif souligné dans la sidebar
- Home : aucune sidebar, grand titre centré
- Toutes les sections : margin-left 200px (pas de chevauchement avec la sidebar)

- [ ] **Step 4: Commit**

```bash
git add src/components/OS/apps/ContactApp.jsx
git commit -m "feat(contact): form with mailto, social icon links"
```
