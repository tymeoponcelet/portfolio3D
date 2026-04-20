# Henry-Style Showcase Redesign — Spec

**Date:** 2026-04-17
**Goal:** Restructure the ShowcaseExplorer and all its sub-components to match Henry Heffernan's portfolio visual design (henryheffernan.com), adapted with Tyméo Poncelet's real content.

---

## Reference

Source analyzed: `C:/Users/TYM/Desktop/henry site/source-henry`
Key files: `ShowcaseExplorer.tsx`, `VerticalNavbar.tsx`, `Home.tsx`, `About.tsx`, `Experience.tsx`, `Projects.tsx`, `Contact.tsx`, `index.css`

---

## Architecture

Pure CSS + JSX change. No logic architecture changes (state-based nav, no React Router). The ShowcaseExplorer already manages `section` state — we keep that. All sub-components are rewritten as pure presentational components.

**File structure after this change:**

| File | Action |
|---|---|
| `src/assets/fonts/Millennium.ttf` | Add (copy from Henry's source) |
| `src/assets/fonts/Millennium-Bold.ttf` | Add (copy from Henry's source) |
| `src/styles/win95.css` | Add Henry's CSS classes (`.site-page`, `.site-page-content`, `.text-block`, `.big-button-container`, `.site-button`, font-face declarations) |
| `src/components/OS/apps/ShowcaseExplorer.jsx` | Rewrite — new layout, 5 sections |
| `src/components/OS/apps/BioNotepad.jsx` | Rewrite → becomes AboutSection |
| `src/components/OS/apps/ProjectsExplorer.jsx` | Rewrite → becomes ProjectsSection |
| `src/components/OS/apps/SkillsApp.jsx` | Rewrite → becomes ExperienceSection |
| `src/components/OS/apps/ContactApp.jsx` | Rewrite → becomes ContactSection |

---

## Layout

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (200px fixed)  │  Content (.site-page-content) │
│                         │                               │
│  Tyméo                  │  <scrollable content>         │
│  Poncelet               │                               │
│  Portfolio '26          │                               │
│                         │                               │
│  HOME                   │                               │
│  ABOUT                  │                               │
│  EXPERIENCE             │                               │
│  PROJECTS               │                               │
│  CONTACT                │                               │
└─────────────────────────────────────────────────────┘
```

- `.site-page`: `display: flex; height: 100%; overflow: hidden;`
- Sidebar: `width: 200px; flex-shrink: 0; padding: 32px; flex-direction: column; overflow: hidden;`
- `.site-page-content`: `margin-left: 200px; padding: 32px; padding-top: 24px; flex-direction: column; overflow-y: scroll; flex: 1;`
- Sidebar is hidden (returns `null`) when `section === 'home'`

---

## Typography

```css
@font-face { font-family: Millennium; src: url('../assets/fonts/Millennium.ttf'); }
@font-face { font-family: MillenniumBold; src: url('../assets/fonts/Millennium-Bold.ttf'); }

/* Scoped to .site-page — does NOT affect the OS chrome */
.site-page h1 { font-family: MillenniumBold, serif; font-size: 48px; margin: 0; line-height: 1; }
.site-page h2 { font-family: MillenniumBold, serif; font-size: 28px; margin: 0; }
.site-page h3 { font-family: MillenniumBold, serif; font-size: 20px; margin: 0; }
.site-page p  { font-family: Millennium, serif; font-size: 15px; }
.site-page li { font-family: Millennium, serif; font-size: 15px; margin-bottom: 12px; }
```

---

## Sections

### Home
- Full-screen centered (existing `win95-showcase-home` classes, already correct)
- h1 "Tyméo Poncelet", h2 "Étudiant BTS SIO SISR", 4 nav link buttons
- No sidebar

### About (`AboutSection.jsx`)
Content in `.site-page-content`:
- `<h1>Welcome</h1>`
- `<h3>Je suis Tyméo Poncelet</h3>`
- `.text-block`: intro paragraph (étudiant BTS SIO SISR, Pôle Sup DE LA SALLE, recherche stage systèmes/réseaux/cyber)
- `.text-block` "Formation":
  - `<h3>Formation</h3>`
  - BTS SIO SISR — Pôle Sup DE LA SALLE — 2025-2026
  - Baccalauréat Maths/AMC, Mention AB — Lycée Jean Brito — 2023-2024
- `.text-block` "Compétences":
  - `<h3>Compétences</h3>`
  - Liste texte : Windows Server/AD · Cisco/Packet Tracer · pfSense/VyOS · Kali Linux · Wireshark · Zabbix/Grafana · Debian/Ubuntu

### Experience (`ExperienceSection.jsx`)
Two entries, each with the Henry header pattern:
```
<h1>McDonald's</h1>          <h4>(Bain de Bretagne)</h4>
<h3>Équipier</h3>            <b>Juil. 2024 – Août 2025</b>
```
Followed by `.text-block` with `<ul>` bullet list.

Entry 1 — McDonald's / Équipier / Juillet–Août 2024 · Février–Août 2025:
- Travail en équipe et coordination avec collègues
- Rigueur et respect des procédures opérationnelles
- Application des normes d'hygiène et sécurité alimentaire

Entry 2 — Cabinet Kaliame / Stagiaire / Février 2023 (3 jours):
- Tri, classement et vérification de documents comptables
- Organisation et rigueur administrative

### Projects (`ProjectsSection.jsx`)
```
<h1>Projets</h1>
<h3>& Infrastructure</h3>
<p>Cliquez sur un projet pour voir les détails.</p>
```
3 `big-button-container` blocks. Click sets `activeProject` state to show detail view below (or replaces the list). Each block:
- Icon (emoji, no GIF needed): 🖧 / 🔥 / 📊
- Title h1 (smaller: 32px) + subtitle h3

Detail view (below the list, like Henry's sub-pages):
- Project name h1, tech stack h3, full description in `.text-block` `<ul>`

Projects data:
1. **Active Directory** — 🖧 — Windows Server · Active Directory · DNS · GPO · PowerShell — description with objectives and result
2. **pfSense Firewall** — 🔥 — pfSense · VyOS · NAT · Firewall · VirtualBox — description with objectives and result
3. **Zabbix Supervision** — 📊 — Zabbix 7.4 · Grafana · Ubuntu Server · MySQL · ICMP/SNMP — description with objectives and result

### Contact (`ContactSection.jsx`)
```
<h1>Contact</h1>   [GitHub icon] [LinkedIn icon]
```
`.text-block`:
- "Je suis disponible pour un stage en administration systèmes, réseaux ou cybersécurité."
- `<b>Email:</b>` tymeo.poncelet@gmail.com (link)
- `<b>Téléphone:</b>` 06 10 25 32 34

Contact form (like Henry's):
- Inputs: Nom, Email, Message (textarea)
- Button `site-button` "Envoyer" — on click: `window.location.href = \`mailto:tymeo.poncelet@gmail.com?subject=Contact - ${name}&body=De: ${name}%0AEmail: ${email}%0A%0A${message}\``
- Required field validation (disable button if name/email/message empty)

Social icons: GitHub (🐙 emoji or inline SVG) + LinkedIn (💼) — `<a>` tags opening in `_blank`

---

## CSS additions to win95.css

```css
/* Henry-style showcase classes — scoped to .site-page where possible */

.site-page { display: flex; position: absolute; inset: 0; overflow: hidden; }

.site-page-content {
  display: flex;
  flex-direction: column;
  margin-left: 200px;
  padding: 32px;
  padding-top: 24px;
  overflow-y: scroll;
  flex: 1;
}

.text-block {
  margin-top: 16px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
}

.big-button-container {
  box-shadow: var(--border-raised-outer), var(--border-raised-inner);
  padding: 20px 24px;
  cursor: pointer;
  margin-bottom: 16px;
  align-items: center;
  gap: 16px;
}

.big-button-container:hover { background-color: #e9e9e9; }
.big-button-container:active { background-color: #c0c0c0; }

.site-button {
  background: #e9e9e9;
  box-shadow: var(--border-raised-outer), var(--border-raised-inner);
  border: none;
  padding: 4px 16px;
  font-family: Millennium, serif;
  font-size: 16px;
  cursor: pointer;
  min-width: 160px;
  height: 28px;
}

.site-button:disabled { cursor: not-allowed; background: #c0c0c0; }
```

The `--border-raised-outer` and `--border-raised-inner` CSS variables are already defined in win95.css (they're used by Henry's index.css too).

---

## Sidebar CSS

```css
.showcase-navbar {
  width: 200px;
  flex-shrink: 0;
  padding: 32px 24px;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  border-right: 1px solid #d0d0d0;
}

.showcase-navbar-header { flex-direction: column; margin-bottom: 48px; }

.showcase-navbar-name {
  font-family: MillenniumBold, serif;
  font-size: 28px;
  line-height: 1;
  margin: 0;
}

.showcase-navbar-sub {
  font-family: Millennium, serif;
  font-size: 14px;
  margin-top: 8px;
  color: #555;
}

.showcase-navbar-links { flex-direction: column; }

.showcase-nav-link {
  font-family: MillenniumBold, serif;
  font-size: 13px;
  letter-spacing: 1px;
  margin-bottom: 24px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  padding: 0;
  color: #000;
  text-decoration: none;
}

.showcase-nav-link:hover { text-decoration: underline; }
.showcase-nav-link.active { text-decoration: underline; }
```

---

## Experience header CSS (matching Henry's `headerRow` pattern)

```css
.experience-header { flex-direction: column; width: 100%; margin-bottom: 8px; }
.experience-header-row { justify-content: space-between; align-items: flex-end; margin-bottom: 4px; }
```

---

## Constraints

- No React Router (state-based navigation, already in place)
- No external API for contact form — use `mailto:` 
- No GIF assets for projects — use emoji icons
- Fonts copied from Henry's local repo (already on machine at `C:/Users/TYM/Desktop/henry site/source-henry/src/assets/fonts/`)
- The `--border-raised-outer` / `--border-raised-inner` CSS variables must exist in win95.css before the new classes — verify or add them
