# ShowcaseExplorer — Design Spec

**Date :** 2026-04-17
**Auteur :** Tyméo Poncelet
**Statut :** Approuvé

---

## Contexte

Le portfolio `portfolio-3d` affiche un OS Win95 dans un canvas Three.js. Actuellement, 4 applications s'ouvrent dans 4 fenêtres séparées (BioNotepad, ProjectsExplorer, SkillsApp, ContactApp). L'objectif est de les regrouper dans une seule fenêtre **ShowcaseExplorer** avec navigation par sidebar — inspiré de Henry Heffernan (`os.henryheffernan.com`).

La scène 3D est **conservée**. Seul le contenu affiché dans l'OS change.

---

## Objectif

Remplacer les 4 fenêtres séparées par une unique fenêtre `ShowcaseExplorer` contenant :
- Une page **HOME** splash (plein écran dans la fenêtre)
- Une navigation **sidebar** persistante sur les autres sections
- 4 sections : Biographie · Projets · Compétences · Contact

---

## Architecture

```
Three.js scene (inchangée)
  └── <Html> → OS.jsx → Desktop.jsx
        ├── 1 icône desktop : "Portfolio"
        └── ShowcaseExplorer (Window.jsx)
              ├── HOME — splash plein écran
              ├── BIOGRAPHIE — BioNotepad (modifié)
              ├── PROJETS — ProjectsExplorer (inchangé)
              ├── COMPÉTENCES — SkillsApp (inchangé)
              └── CONTACT — ContactApp (inchangé)
```

---

## Fichiers touchés

| Action | Fichier |
|---|---|
| CREATE | `src/components/OS/apps/ShowcaseExplorer.jsx` |
| MODIFY | `src/components/OS/apps/BioNotepad.jsx` |
| MODIFY | `src/components/OS/Desktop.jsx` |
| MODIFY | `src/styles/win95.css` |

Fichiers **inchangés** : `ProjectsExplorer.jsx`, `SkillsApp.jsx`, `ContactApp.jsx`, `Window.jsx`, `Taskbar.jsx`, `OS.jsx`, `osStore.js`.

---

## Composant `ShowcaseExplorer`

### Layout HOME (section par défaut)

Plein écran dans la fenêtre, pas de sidebar. Centré verticalement et horizontalement :

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│              Tyméo Poncelet                         │
│                 Student                             │
│        BTS SIO SISR — Recherche stage               │
│                                                     │
│     BIOGRAPHIE  PROJETS  COMPÉTENCES  CONTACT       │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Titre : police Win95 (var(--w-font)), taille 24px bold
- Sous-titre : 14px, couleur `var(--w-darker)`
- Nav links : cliquables → naviguent vers la section correspondante

### Layout sections (Biographie / Projets / Compétences / Contact)

Sidebar gauche fixe + panel droit scrollable :

```
┌──────────────┬──────────────────────────────────────┐
│ Tyméo        │                                      │
│ Poncelet     │  [composant de la section active]    │
│ Portfolio    │                                      │
│              │                                      │
│ ○ HOME       │                                      │
│   BIOGRAPHIE │                                      │
│   PROJETS    │                                      │
│   COMPÉTENCES│                                      │
│   CONTACT    │                                      │
└──────────────┴──────────────────────────────────────┘
```

- Sidebar : 130px de large, fond `var(--w-surface)`, séparateur `var(--w-dark)`
- Item actif : préfixé par `○`, couleur `var(--w-blue)`
- Panel droit : `flex: 1`, `overflow: hidden` — le composant enfant gère son propre scroll

### State

```js
const [section, setSection] = useState('home')
// 'home' | 'bio' | 'projects' | 'skills' | 'contact'
```

Un simple `switch(section)` retourne le composant à afficher dans le panel.

---

## Modification `BioNotepad`

Ajouter un onglet **Expérience** avec les données du CV :

| Onglet | Contenu |
|---|---|
| Formation | BTS SIO SISR — Pôle Sup DE LA SALLE (2025-2026) / Bac Maths/AMC mention AB — Lycée Jean Brito (2023-2024) |
| Objectif | Recherche stage systèmes/réseaux/cybersécurité |
| Expérience | Équipier McDonald's — Bain de Bretagne (juil-août 2024, fév-août 2025) / Stage cabinet Kaliame (fév 2023) |
| Contact | tymeo.poncelet@gmail.com / 06 10 25 32 34 / LinkedIn |

Supprimer l'onglet **Compétences** (section dédiée dans la sidebar).

---

## Modification `Desktop.jsx`

- Supprimer les 3 icônes : `projects`, `skills`, `contact`
- Garder (ou renommer) l'icône `bio` → `showcase`, label "Portfolio", icône `showcaseIcon`
- `window` config : `appId: 'showcase'`, `title: 'Portfolio — Tyméo Poncelet'`, `width: 640`, `height: 480`, `content: <ShowcaseExplorer />`
- **Auto-ouverture au boot** : le ShowcaseExplorer s'ouvre automatiquement après le boot screen (même pattern que Henry — `shortcut.onOpen()` appelé dans le `useEffect` initial)

---

## CSS à ajouter (`win95.css`)

Styles pour la sidebar ShowcaseExplorer et la page HOME :

```css
/* ShowcaseExplorer sidebar */
.win95-showcase-sidebar { ... }
.win95-showcase-nav-item { ... }
.win95-showcase-nav-item.active { ... }

/* ShowcaseExplorer HOME */
.win95-showcase-home { ... }
.win95-showcase-home-title { ... }
.win95-showcase-home-nav { ... }
```

---

## Données Tyméo Poncelet (issues du CV)

```
Nom          : Tyméo Poncelet
Rôle         : Student
Formation    : BTS SIO SISR — Pôle Sup DE LA SALLE (2025-2026)
Bac          : Maths/AMC mention Assez Bien — Lycée Jean Brito (2023-2024)
Email        : tymeo.poncelet@gmail.com
Téléphone    : 06 10 25 32 34
Localisation : La Bosse de Bretagne (35320)
LinkedIn     : linkedin.com/in/tyméo-poncelet-83b667383
GitHub       : github.com/tymeoponcelet

Expérience :
  - Équipier McDonald's, Bain de Bretagne (juil-août 2024 + fév-août 2025)
    Travail en équipe, coordination, rigueur, hygiène alimentaire
  - Stage 3j, Cabinet Kaliame (fév 2023)
    Tri, classement et vérification de documents comptables

Compétences Sys/Réseau :
  Cisco Packet Tracer, Active Directory, GLPI, Zabbix, Linux,
  Debian, Ubuntu, VirtualBox, Adressage IP, VLSM, IP route

Compétences Cybersécurité :
  Hashcat, Hydra, Kali Linux, Chiffrement, Hachage,
  Wireshark, Attaque FTP, Three-way handshake

Centres d'intérêt : Jeux vidéo, Anime/Manga, Automobile, Musique
Langues : Anglais
Permis : B
```

---

## Critères de succès

- [ ] La scène 3D est inchangée
- [ ] 1 seule icône sur le bureau ouvre ShowcaseExplorer
- [ ] La page HOME s'affiche en premier avec nom + "Student"
- [ ] Cliquer un lien HOME navigue vers la bonne section
- [ ] La sidebar s'affiche correctement sur toutes les sections hors HOME
- [ ] L'onglet actif est préfixé `○` dans la sidebar
- [ ] BioNotepad a 4 onglets dont Expérience (données CV)
- [ ] BioNotepad n'a plus d'onglet Compétences
- [ ] ProjectsExplorer, SkillsApp, ContactApp sont inchangés
- [ ] Aucune régression visuelle sur Window, Taskbar, ShutdownSequence
