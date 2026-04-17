# Visual Redesign Henry-style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all ShowcaseExplorer sections to look like a clean website — white backgrounds, blue `#000080` headings and links, good typography — while keeping the sidebar navigation intact.

**Architecture:** Pure CSS + JSX markup changes. No logic changes. Each app component (BioNotepad, ProjectsExplorer, SkillsApp, ContactApp) gets its own CSS class namespace (`win95-bio`, `win95-projects`, etc.) and loses the Win95 Explorer chrome (address bar, status bar). ShowcaseExplorer HOME and sidebar get updated CSS values.

**Tech Stack:** React 19, CSS (win95.css), Vite 8

---

## File Map

| File | Action | What changes |
|---|---|---|
| `src/styles/win95.css` | Modify | HOME bigger title, sidebar white bg, add bio/projects/skills/contact classes |
| `src/components/OS/apps/BioNotepad.jsx` | Modify | Remove addr bar + statusbar, new class names, section title heading |
| `src/components/OS/apps/ProjectsExplorer.jsx` | Modify | Remove addr bar + statusbar, new class names |
| `src/components/OS/apps/SkillsApp.jsx` | Modify | Remove addr bar + statusbar, new class names |
| `src/components/OS/apps/ContactApp.jsx` | Modify | Remove addr bar + statusbar, new class names |

---

### Task 1: CSS — Redesign HOME + Sidebar + add section classes

**Files:**
- Modify: `src/styles/win95.css` (lines 1058–1186)

- [ ] **Step 1: Replace the entire SHOWCASE EXPLORER CSS block**

Find the block starting at `/* ═══ SHOWCASE EXPLORER` (line ~1058) and replace everything up to and including `.win95-showcase-panel { ... }` with the new block below.

The full replacement for lines 1058–1186:

```css
/* ═══════════════════════════════════════════════════════════════
   SHOWCASE EXPLORER — HOME splash + sidebar layout
   ═══════════════════════════════════════════════════════════════ */

/* HOME — plein écran centré, fond blanc */
.win95-showcase-home {
  display:         flex;
  align-items:     center;
  justify-content: center;
  height:          100%;
  background:      #ffffff;
}

.win95-showcase-home-content {
  display:        flex;
  flex-direction: column;
  align-items:    center;
  gap:            10px;
  text-align:     center;
}

.win95-showcase-home-title {
  font-family: var(--w-font);
  font-size:   32px;
  font-weight: bold;
  color:       #000080;
  margin:      0;
}

.win95-showcase-home-role {
  font-family: var(--w-font);
  font-size:   16px;
  color:       #555;
  margin:      0;
}

.win95-showcase-home-sub {
  font-family: var(--w-font);
  font-size:   13px;
  color:       #777;
  margin:      0 0 10px 0;
}

.win95-showcase-home-nav {
  display:         flex;
  gap:             20px;
  justify-content: center;
}

.win95-showcase-home-link {
  font-family:     var(--w-font);
  font-size:       12px;
  color:           #000080;
  text-decoration: underline;
  background:      none;
  border:          none;
  cursor:          pointer;
  padding:         0;
}

.win95-showcase-home-link:hover { color: #000; }

/* Layout avec sidebar */
.win95-showcase {
  display:  flex;
  height:   100%;
  overflow: hidden;
}

.win95-showcase-sidebar {
  width:           130px;
  flex-shrink:     0;
  border-right:    1px solid #d0d0d0;
  background:      #ffffff;
  display:         flex;
  flex-direction:  column;
  padding:         8px 0 0 0;
  overflow-y:      auto;
}

.win95-showcase-sidebar-header {
  padding:       0 10px 8px 10px;
  border-bottom: 1px solid #d0d0d0;
  margin-bottom: 4px;
}

.win95-showcase-sidebar-name {
  font-family:  var(--w-font);
  font-size:    13px;
  font-weight:  bold;
  color:        var(--w-black);
  margin:       0;
  line-height:  1.4;
}

.win95-showcase-sidebar-brand {
  font-family: var(--w-font);
  font-size:   10px;
  color:       #777;
  margin:      2px 0 0 0;
}

.win95-showcase-sidebar-nav {
  display:        flex;
  flex-direction: column;
}

.win95-showcase-nav-item {
  font-family:     var(--w-font);
  font-size:       11px;
  color:           var(--w-black);
  text-align:      left;
  background:      none;
  border:          none;
  cursor:          pointer;
  padding:         6px 10px;
  text-decoration: none;
}

.win95-showcase-nav-item:hover  { background: #f0f4ff; }
.win95-showcase-nav-item.active {
  color:           #000080;
  text-decoration: underline;
  font-weight:     bold;
}

/* Panel droit — contient le composant enfant */
.win95-showcase-panel {
  flex:           1;
  display:        flex;
  flex-direction: column;
  overflow:       hidden;
}

/* ─── BioNotepad ─────────────────────────────────────────────── */

.win95-bio {
  display:        flex;
  flex-direction: column;
  height:         100%;
  background:     #ffffff;
}

.win95-bio-body {
  display:  flex;
  flex:     1;
  overflow: hidden;
}

.win95-bio-sidebar {
  width:          110px;
  flex-shrink:    0;
  border-right:   1px solid #d0d0d0;
  display:        flex;
  flex-direction: column;
  padding-top:    4px;
  overflow-y:     auto;
}

.win95-bio-tab {
  font-family:     var(--w-font);
  font-size:       11px;
  color:           var(--w-black);
  text-align:      left;
  background:      none;
  border:          none;
  border-left:     2px solid transparent;
  cursor:          pointer;
  padding:         6px 8px 6px 8px;
  text-decoration: none;
}

.win95-bio-tab:hover  { background: #f0f4ff; }
.win95-bio-tab.active {
  color:       #000080;
  font-weight: bold;
  border-left: 2px solid #000080;
}

.win95-bio-panel {
  flex:       1;
  overflow-y: auto;
  padding:    16px;
}

.win95-bio-section-title {
  font-family:   var(--w-font);
  font-size:     14px;
  font-weight:   bold;
  color:         #000080;
  margin:        0 0 10px 0;
}

/* ─── ProjectsExplorer ───────────────────────────────────────── */

.win95-projects {
  display:        flex;
  flex-direction: column;
  height:         100%;
  background:     #ffffff;
}

.win95-projects-body {
  display:  flex;
  flex:     1;
  overflow: hidden;
}

.win95-projects-sidebar {
  width:          110px;
  flex-shrink:    0;
  border-right:   1px solid #d0d0d0;
  display:        flex;
  flex-direction: column;
  padding-top:    4px;
  overflow-y:     auto;
}

.win95-projects-tab {
  font-family:     var(--w-font);
  font-size:       11px;
  color:           var(--w-black);
  text-align:      left;
  background:      none;
  border:          none;
  border-left:     2px solid transparent;
  cursor:          pointer;
  padding:         6px 8px;
  text-decoration: none;
}

.win95-projects-tab:hover  { background: #f0f4ff; }
.win95-projects-tab.active {
  color:       #000080;
  font-weight: bold;
  border-left: 2px solid #000080;
}

.win95-projects-panel {
  flex:       1;
  overflow-y: auto;
  padding:    16px;
}

.win95-projects-file-row {
  display:     flex;
  align-items: center;
  gap:         8px;
  padding:     4px 2px;
  cursor:      pointer;
  font-family: var(--w-font);
  font-size:   11px;
}

.win95-projects-file-row:hover         { background: #f0f4ff; }
.win95-projects-file-row.selected      { background: #d0d8ff; }

.win95-projects-detail { display: flex; flex-direction: column; gap: 8px; }

.win95-projects-title {
  font-family: var(--w-font);
  font-size:   14px;
  font-weight: bold;
  color:       #000080;
}

/* ─── SkillsApp ──────────────────────────────────────────────── */

.win95-skills {
  display:        flex;
  flex-direction: column;
  height:         100%;
  background:     #ffffff;
}

.win95-skills-body {
  display:  flex;
  flex:     1;
  overflow: hidden;
}

.win95-skills-sidebar {
  width:          110px;
  flex-shrink:    0;
  border-right:   1px solid #d0d0d0;
  display:        flex;
  flex-direction: column;
  padding-top:    4px;
  overflow-y:     auto;
}

.win95-skills-tab {
  font-family:     var(--w-font);
  font-size:       11px;
  color:           var(--w-black);
  text-align:      left;
  background:      none;
  border:          none;
  border-left:     2px solid transparent;
  cursor:          pointer;
  padding:         6px 8px;
  text-decoration: none;
}

.win95-skills-tab:hover  { background: #f0f4ff; }
.win95-skills-tab.active {
  color:       #000080;
  font-weight: bold;
  border-left: 2px solid #000080;
}

.win95-skills-panel {
  flex:       1;
  overflow-y: auto;
  padding:    16px;
}

.win95-skills-title {
  font-family:   var(--w-font);
  font-size:     14px;
  font-weight:   bold;
  color:         #000080;
  margin:        0 0 12px 0;
}

/* ─── ContactApp ─────────────────────────────────────────────── */

.win95-contact {
  display:        flex;
  flex-direction: column;
  height:         100%;
  background:     #ffffff;
}

.win95-contact-body {
  display:  flex;
  flex:     1;
  overflow: hidden;
}

.win95-contact-sidebar {
  width:          110px;
  flex-shrink:    0;
  border-right:   1px solid #d0d0d0;
  display:        flex;
  flex-direction: column;
  padding-top:    4px;
  overflow-y:     auto;
}

.win95-contact-tab {
  font-family:     var(--w-font);
  font-size:       11px;
  color:           var(--w-black);
  text-align:      left;
  background:      none;
  border:          none;
  border-left:     2px solid transparent;
  cursor:          pointer;
  padding:         6px 8px;
  text-decoration: none;
}

.win95-contact-tab:hover  { background: #f0f4ff; }
.win95-contact-tab.active {
  color:       #000080;
  font-weight: bold;
  border-left: 2px solid #000080;
}

.win95-contact-panel {
  flex:       1;
  overflow-y: auto;
  padding:    16px;
}

.win95-contact-header {
  display:       flex;
  align-items:   center;
  gap:           10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #d0d0d0;
  margin-bottom: 12px;
}
```

- [ ] **Step 2: Also update progress bar fill color to blue**

Find `.win95-progress-fill` in win95.css and ensure its background is `#000080`:

```css
.win95-progress-fill {
  height:     100%;
  background: #000080;
}
```

- [ ] **Step 3: Verify dev server runs without CSS errors**

```bash
cd "C:/Users/TYM/Desktop/site old pc - Copie/portfolio-3d"
npm run dev
```

Expected: No build errors in terminal. Browser opens and shows Win95 OS.

- [ ] **Step 4: Commit**

```bash
git add src/styles/win95.css
git commit -m "style: henry-style CSS — white bg, blue headings, section classes"
```

---

### Task 2: BioNotepad — Remove Explorer chrome, new classes

**Files:**
- Modify: `src/components/OS/apps/BioNotepad.jsx`

- [ ] **Step 1: Replace full BioNotepad.jsx content**

```jsx
// src/components/OS/apps/BioNotepad.jsx
import { useState } from 'react'

const SECTIONS = [
  {
    id:    'formation',
    label: 'Formation',
    title: 'Formation',
    content: (
      <div style={{ fontFamily: 'var(--w-font)', fontSize: 11, lineHeight: 1.7, color: '#222' }}>
        <p style={{ margin: '0 0 8px' }}>
          <strong>BTS SIO — Services Informatiques aux Organisations</strong><br />
          Spécialisation SISR (Systèmes, Réseaux &amp; Cybersécurité)<br />
          Pôle Sup DE LA SALLE — Promotion 2025-2026
        </p>
        <p style={{ margin: 0 }}>
          <strong>Baccalauréat — Spécialité Maths/AMC</strong><br />
          Mention Assez Bien — Lycée Jean Brito<br />
          Promotion 2023-2024
        </p>
      </div>
    ),
  },
  {
    id:    'objectif',
    label: 'Objectif',
    title: 'Objectif',
    content: (
      <div style={{ fontFamily: 'var(--w-font)', fontSize: 11, lineHeight: 1.7, color: '#222' }}>
        <p style={{ margin: '0 0 8px' }}>
          Étudiant passionné par les infrastructures réseau et la cybersécurité.
          Je recherche activement un stage dans les domaines suivants :
        </p>
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          <li>Administration systèmes &amp; réseaux</li>
          <li>Cybersécurité offensive / défensive</li>
          <li>Supervision et monitoring</li>
        </ul>
      </div>
    ),
  },
  {
    id:    'experience',
    label: 'Expérience',
    title: 'Expérience',
    content: (
      <div style={{ fontFamily: 'var(--w-font)', fontSize: 11, lineHeight: 1.7, color: '#222' }}>
        <p style={{ margin: '0 0 10px' }}>
          <strong>Équipier — McDonald's, Bain de Bretagne</strong><br />
          Juillet–Août 2024 · Février–Août 2025<br />
          Travail en équipe, coordination, rigueur, hygiène alimentaire
        </p>
        <p style={{ margin: 0 }}>
          <strong>Stage — Cabinet Kaliame (expert-comptable)</strong><br />
          Février 2023 — 3 jours<br />
          Tri, classement et vérification de documents comptables
        </p>
      </div>
    ),
  },
  {
    id:    'contact',
    label: 'Contact',
    title: 'Contact',
    content: (
      <div style={{ fontFamily: 'var(--w-font)', fontSize: 11, lineHeight: 1.9, color: '#222' }}>
        <div>
          <span style={{ color: '#555', display: 'inline-block', minWidth: 70 }}>Email :</span>
          <a href="mailto:tymeo.poncelet@gmail.com" style={{ color: '#000080', textDecoration: 'underline' }}>
            tymeo.poncelet@gmail.com
          </a>
        </div>
        <div>
          <span style={{ color: '#555', display: 'inline-block', minWidth: 70 }}>Téléphone :</span>
          <a href="tel:+33610253234" style={{ color: '#000080', textDecoration: 'underline' }}>
            06 10 25 32 34
          </a>
        </div>
        <div>
          <span style={{ color: '#555', display: 'inline-block', minWidth: 70 }}>LinkedIn :</span>
          <a href="https://www.linkedin.com/in/tyméo-poncelet-83b667383" target="_blank" rel="noreferrer"
            style={{ color: '#000080', textDecoration: 'underline' }}>
            linkedin.com/in/tyméo-poncelet-83b667383
          </a>
        </div>
        <div>
          <span style={{ color: '#555', display: 'inline-block', minWidth: 70 }}>GitHub :</span>
          <a href="https://github.com/tymeoponcelet" target="_blank" rel="noreferrer"
            style={{ color: '#000080', textDecoration: 'underline' }}>
            github.com/tymeoponcelet
          </a>
        </div>
      </div>
    ),
  },
]

export function BioNotepad() {
  const [active, setActive] = useState(SECTIONS[0])

  return (
    <div className="win95-bio">
      <div className="win95-bio-body">

        {/* Sidebar onglets */}
        <div className="win95-bio-sidebar">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`win95-bio-tab${active.id === s.id ? ' active' : ''}`}
              onClick={() => setActive(s)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Panel contenu */}
        <div className="win95-bio-panel">
          <h2 className="win95-bio-section-title">{active.title}</h2>
          {active.content}
        </div>

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Run `npm run dev`, open ShowcaseExplorer → BIOGRAPHIE. Confirm:
- No address bar visible
- No status bar visible
- White background
- Blue heading (Formation / Objectif / Expérience / Contact)
- Sidebar tabs with blue active + border-left

- [ ] **Step 3: Commit**

```bash
git add src/components/OS/apps/BioNotepad.jsx
git commit -m "style(BioNotepad): white bg, blue headings, no explorer chrome"
```

---

### Task 3: ProjectsExplorer — Remove Explorer chrome, new classes

**Files:**
- Modify: `src/components/OS/apps/ProjectsExplorer.jsx`

- [ ] **Step 1: Replace full ProjectsExplorer.jsx content**

```jsx
// src/components/OS/apps/ProjectsExplorer.jsx
import { useState } from 'react'

const TREE = [
  {
    id: 'reseau',
    label: 'Réseau & Infrastructure',
    files: [
      {
        id: 'ad', name: 'Active_Directory', ext: 'proj', icon: '🖧',
        size: '1 024 Ko', date: '03/2026',
        tech: 'Windows Server · Active Directory · DNS · GPO · PowerShell',
        desc: `Déploiement d'un domaine Windows Server complet.

Objectifs :
  • Installation et configuration de Windows Server 2022
  • Mise en place de l'Active Directory (AD DS)
  • Création d'utilisateurs, groupes et unités d'organisation
  • Configuration DNS, DHCP et GPO
  • Scripts PowerShell pour automatiser la création de comptes
  • Profils itinérants et montage de lecteurs réseau

Résultat : domaine fonctionnel avec 30+ comptes, montage
automatique des lecteurs et politiques de groupe appliquées.`,
      },
      {
        id: 'pfsense', name: 'pfSense_Firewall', ext: 'proj', icon: '🔥',
        size: '768 Ko', date: '02/2026',
        tech: 'pfSense · VyOS · NAT · Firewall · VirtualBox',
        desc: `Étude comparative VyOS vs pfSense.

Objectifs :
  • Configuration d'un pare-feu pfSense (FreeBSD)
  • Mise en place NAT et règles de filtrage
  • Routage statique inter-sous-réseaux
  • Tests de connectivité avec ping / traceroute

Résultat : deux sous-réseaux virtuels interconnectés avec
règles de filtrage et NAT opérationnels.`,
      },
    ],
  },
  {
    id: 'secu',
    label: 'Cybersécurité',
    files: [
      {
        id: 'audit', name: 'Audit_Secu', ext: 'proj', icon: '🔐',
        size: '512 Ko', date: '04/2026',
        tech: 'Kali Linux · Wireshark · Hashcat · Hydra',
        desc: `Initiation aux outils d'audit de sécurité réseau.

Outils utilisés :
  • Wireshark — capture et analyse de trames réseau
  • Hashcat — craquage de mots de passe (MD5, SHA-1)
  • Hydra — test de robustesse par force brute
  • Kali Linux comme environnement de travail

Contexte : TP encadrés en environnement isolé (VMs).`,
      },
    ],
  },
  {
    id: 'supervision',
    label: 'Supervision',
    files: [
      {
        id: 'zabbix', name: 'Zabbix_Grafana', ext: 'proj', icon: '📊',
        size: '2 048 Ko', date: '01/2026',
        tech: 'Zabbix 7.4 · Grafana · Ubuntu Server · MySQL · ICMP/SNMP',
        desc: `Supervision de la connectivité internet d'une organisation.

Infrastructure :
  • Ubuntu Server 22.04 comme hôte de supervision
  • Zabbix 7.4 avec base de données MySQL
  • Monitoring ICMP via fping
  • Intégration Grafana pour les dashboards temps réel

Résultat : tableau de bord Grafana avec alertes ICMP.`,
      },
    ],
  },
]

export function ProjectsExplorer() {
  const [folder, setFolder] = useState(TREE[0])
  const [file,   setFile]   = useState(null)

  return (
    <div className="win95-projects">
      <div className="win95-projects-body">

        {/* Sidebar — catégories */}
        <div className="win95-projects-sidebar">
          {TREE.map((f) => (
            <button
              key={f.id}
              className={`win95-projects-tab${folder?.id === f.id ? ' active' : ''}`}
              onClick={() => { setFolder(f); setFile(null) }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Panneau droit */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Liste fichiers */}
          <div style={{ flex: file ? '0 0 40%' : '1', overflowY: 'auto', background: '#fff' }}>
            {folder?.files.map((f) => (
              <div
                key={f.id}
                className={`win95-projects-file-row${file?.id === f.id ? ' selected' : ''}`}
                onClick={() => setFile(f)}
              >
                <span style={{ fontSize: 16 }}>{f.icon}</span>
                <span style={{ flex: 1, fontWeight: file?.id === f.id ? 'bold' : 'normal' }}>
                  {f.name}.{f.ext}
                </span>
                <span style={{ fontSize: 10, color: '#777', minWidth: 50, textAlign: 'right' }}>{f.date}</span>
              </div>
            ))}
          </div>

          {/* Détail projet */}
          {file && (
            <div style={{ flex: 1, borderTop: '1px solid #d0d0d0', overflowY: 'auto', padding: '12px 16px', background: '#fff' }}>
              <div className="win95-projects-detail">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{file.icon}</span>
                  <span className="win95-projects-title">{file.name}.{file.ext}</span>
                </div>
                <div style={{ fontSize: 10, color: '#777', fontStyle: 'italic' }}>{file.tech}</div>
                <pre style={{
                  fontFamily: 'var(--w-font)', fontSize: 10,
                  lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0, color: '#222',
                }}>
                  {file.desc}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Open ShowcaseExplorer → PROJETS. Confirm:
- No address bar, no status bar
- White background
- Sidebar tabs with blue active + border-left
- File rows clickable, detail panel shows with blue title

- [ ] **Step 3: Commit**

```bash
git add src/components/OS/apps/ProjectsExplorer.jsx
git commit -m "style(ProjectsExplorer): white bg, blue title, no explorer chrome"
```

---

### Task 4: SkillsApp — Remove Explorer chrome, new classes

**Files:**
- Modify: `src/components/OS/apps/SkillsApp.jsx`

- [ ] **Step 1: Replace full SkillsApp.jsx content**

```jsx
// src/components/OS/apps/SkillsApp.jsx
import { useState } from 'react'

const CATEGORIES = [
  {
    id:    'infra',
    label: 'Infrastructure',
    items: [
      { name: 'Windows Server / AD',   level: 4, max: 5 },
      { name: 'Cisco / Packet Tracer', level: 3, max: 5 },
      { name: 'pfSense / VyOS',        level: 3, max: 5 },
      { name: 'Adressage IP / VLSM',   level: 4, max: 5 },
      { name: 'VirtualBox',            level: 4, max: 5 },
    ],
  },
  {
    id:    'secu',
    label: 'Cybersécurité',
    items: [
      { name: 'Kali Linux',        level: 3, max: 5 },
      { name: 'Wireshark',         level: 3, max: 5 },
      { name: 'Hashcat / Hydra',   level: 2, max: 5 },
      { name: 'Chiffrement',       level: 3, max: 5 },
    ],
  },
  {
    id:    'linux',
    label: 'Systèmes Linux',
    items: [
      { name: 'Debian / Ubuntu',   level: 4, max: 5 },
      { name: 'GLPI',              level: 3, max: 5 },
      { name: 'Zabbix + Grafana',  level: 3, max: 5 },
      { name: 'Bash / Scripts',    level: 3, max: 5 },
    ],
  },
]

function ProgressBar({ level, max }) {
  return (
    <div className="win95-progress-track">
      <div className="win95-progress-fill" style={{ width: `${(level / max) * 100}%` }} />
    </div>
  )
}

export function SkillsApp() {
  const [active, setActive] = useState(CATEGORIES[0])

  return (
    <div className="win95-skills">
      <div className="win95-skills-body">

        {/* Sidebar */}
        <div className="win95-skills-sidebar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`win95-skills-tab${active.id === cat.id ? ' active' : ''}`}
              onClick={() => setActive(cat)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="win95-skills-panel">
          <h2 className="win95-skills-title">{active.label}</h2>
          {active.items.map((item) => (
            <div key={item.name} className="win95-skill-row">
              <span className="win95-skill-name">{item.name}</span>
              <ProgressBar level={item.level} max={item.max} />
              <span style={{ minWidth: 28, textAlign: 'right', color: '#555', fontFamily: 'var(--w-font)', fontSize: 10 }}>
                {item.level}/{item.max}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Open ShowcaseExplorer → COMPÉTENCES. Confirm:
- No address bar, no status bar
- White background
- Blue category heading
- Progress bars filled in `#000080` blue
- Sidebar tabs with active style

- [ ] **Step 3: Commit**

```bash
git add src/components/OS/apps/SkillsApp.jsx
git commit -m "style(SkillsApp): white bg, blue heading, no explorer chrome"
```

---

### Task 5: ContactApp — Remove Explorer chrome, new classes

**Files:**
- Modify: `src/components/OS/apps/ContactApp.jsx`

- [ ] **Step 1: Replace full ContactApp.jsx content**

```jsx
// src/components/OS/apps/ContactApp.jsx
import { useState } from 'react'

const CONTACTS = [
  {
    id:    'email',
    icon:  '📧',
    label: 'E-mail',
    value: 'tymeo.poncelet@gmail.com',
    href:  'mailto:tymeo.poncelet@gmail.com',
    desc:  'Adresse de messagerie principale.',
  },
  {
    id:    'tel',
    icon:  '📱',
    label: 'Téléphone',
    value: '06 10 25 32 34',
    href:  'tel:+33610253234',
    desc:  'Disponible en semaine.',
  },
  {
    id:    'linkedin',
    icon:  '💼',
    label: 'LinkedIn',
    value: 'linkedin.com/in/tyméo-poncelet-83b667383',
    href:  'https://www.linkedin.com/in/tyméo-poncelet-83b667383',
    desc:  'Profil professionnel.',
  },
  {
    id:    'github',
    icon:  '🐙',
    label: 'GitHub',
    value: 'github.com/tymeoponcelet',
    href:  'https://github.com/tymeoponcelet',
    desc:  'Dépôts et projets personnels.',
  },
]

export function ContactApp() {
  const [active, setActive] = useState(CONTACTS[0])

  return (
    <div className="win95-contact">
      <div className="win95-contact-body">

        {/* Sidebar */}
        <div className="win95-contact-sidebar">
          {CONTACTS.map((c) => (
            <button
              key={c.id}
              className={`win95-contact-tab${active.id === c.id ? ' active' : ''}`}
              onClick={() => setActive(c)}
            >
              <span style={{ marginRight: 4 }}>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="win95-contact-panel">

          {/* Header */}
          <div className="win95-contact-header">
            <span style={{ fontSize: 32 }}>{active.icon}</span>
            <div>
              <div style={{ fontFamily: 'var(--w-font)', fontWeight: 'bold', fontSize: 13 }}>
                Poncelet Tyméo
              </div>
              <div style={{ fontFamily: 'var(--w-font)', color: '#555', fontSize: 10 }}>
                Étudiant BTS SIO SISR — Recherche stage
              </div>
            </div>
          </div>

          {/* Détail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--w-font)', color: '#555', minWidth: 70, fontSize: 11 }}>
                {active.label} :
              </span>
              <a
                href={active.href}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ color: '#000080', textDecoration: 'underline', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--w-font)' }}
              >
                {active.value}
              </a>
            </div>
            <div style={{ fontFamily: 'var(--w-font)', color: '#555', fontSize: 10, fontStyle: 'italic' }}>
              {active.desc}
            </div>
          </div>

          {/* Note */}
          <hr style={{ border: 'none', borderTop: '1px solid #d0d0d0', margin: '10px 0' }} />
          <div style={{ fontFamily: 'var(--w-font)', fontSize: 10, color: '#555', lineHeight: 1.6 }}>
            Disponible pour un stage en administration systèmes,<br />
            réseaux ou cybersécurité. N'hésitez pas à me contacter.
          </div>

        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Open ShowcaseExplorer → CONTACT. Confirm:
- No address bar, no status bar
- White background
- Sidebar tabs with blue active + border-left
- Contact links in blue underlined
- Header with icon + name

- [ ] **Step 3: Final full visual check**

Navigate through all sections: HOME → BIOGRAPHIE → PROJETS → COMPÉTENCES → CONTACT. Confirm:
- HOME: white bg, 32px blue title, underlined nav links
- Sidebar: white bg, bold name, nav items with hover and active states
- All sections: no Explorer chrome, white backgrounds, consistent typography

- [ ] **Step 4: Commit**

```bash
git add src/components/OS/apps/ContactApp.jsx
git commit -m "style(ContactApp): white bg, blue links, no explorer chrome"
```
