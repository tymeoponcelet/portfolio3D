# Portfolio 3D — Optimisation Performance / Responsive / SEO

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un framerate adaptatif (15/60 FPS), un fallback 2D si WebGL/mobile KO, un DPR clampé selon le device, Suspense sur les GLB non couverts, et un SEO complet sans casser l'esthétique Win95.

**Architecture:** Trois hooks purs (`useWebGLCheck`, `useDevicePixelRatio`) + un composant R3F interne (`AdaptiveRenderer`) + deux composants UI (`FallbackUI`, `SeoMeta`). `App.jsx` route entre `<Scene>` et `<FallbackUI>`. `Scene.jsx` monte `<AdaptiveRenderer>` à l'intérieur du Canvas. `index.html` reçoit les meta tags statiques.

**Tech Stack:** React 19, Three.js 0.183, @react-three/fiber 9.5, @react-three/drei 10.7, camera-controls 3.1, Tailwind CSS 4, Vite 8.

---

## Fichiers créés / modifiés

| Fichier | Action |
|---------|--------|
| `src/hooks/useWebGLCheck.js` | Créé |
| `src/hooks/useDevicePixelRatio.js` | Créé |
| `src/components/FallbackUI.jsx` | Créé |
| `src/components/SeoMeta.jsx` | Créé |
| `src/components/Scene/AdaptiveRenderer.jsx` | Créé |
| `src/App.jsx` | Modifié — routing WebGL + SeoMeta |
| `src/components/Scene/Scene.jsx` | Modifié — DPR, Suspense Moon, AdaptiveRenderer, ARIA |
| `index.html` | Modifié — meta tags OpenGraph / Twitter |

---

## Task 1 : `useWebGLCheck` — détection WebGL + breakpoint mobile

**Files:**
- Create: `src/hooks/useWebGLCheck.js`

- [ ] **Step 1 : Créer le fichier**

```javascript
// src/hooks/useWebGLCheck.js
import { useState } from 'react'

export function useWebGLCheck() {
  const [result] = useState(() => {
    if (window.innerWidth < 480) {
      return { supported: false, reason: 'size' }
    }
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('webgl2')
      if (!ctx) return { supported: false, reason: 'webgl' }
    } catch {
      return { supported: false, reason: 'webgl' }
    }
    return { supported: true, reason: null }
  })
  return result
}
```

> `useState(() => ...)` exécute l'initializer une seule fois et met en cache le résultat. Pas de re-render, pas d'effet asynchrone.

- [ ] **Step 2 : Vérification manuelle**

Ouvrir la console navigateur et tester :
```javascript
// Dans la console — simuler un petit écran
window.innerWidth  // doit retourner la largeur actuelle
document.createElement('canvas').getContext('webgl2')  // doit retourner un contexte non-null sur Chrome/Firefox récent
```

- [ ] **Step 3 : Commit**

```bash
git add src/hooks/useWebGLCheck.js
git commit -m "feat: add useWebGLCheck hook (WebGL2 + 480px breakpoint)"
```

---

## Task 2 : `useDevicePixelRatio` — DPR clampé selon le device

**Files:**
- Create: `src/hooks/useDevicePixelRatio.js`

- [ ] **Step 1 : Créer le fichier**

```javascript
// src/hooks/useDevicePixelRatio.js
export function useDevicePixelRatio() {
  const isMobile = window.matchMedia('(pointer: coarse)').matches
  const dpr = window.devicePixelRatio ?? 1
  return isMobile ? Math.min(1.5, dpr) : Math.min(2, dpr)
}
```

> Sur mobile avec `devicePixelRatio = 3`, retourne `1.5` — divise par 2 le coût de rendu GPU. Sur desktop avec `devicePixelRatio = 2`, retourne `2`. Pas de `useState` nécessaire : le DPR ne change pas pendant une session.

- [ ] **Step 2 : Vérification manuelle**

Console navigateur :
```javascript
window.matchMedia('(pointer: coarse)').matches  // true sur mobile/tablette tactile
window.devicePixelRatio  // 1, 1.5, 2 ou 3 selon le device
Math.min(1.5, window.devicePixelRatio)  // résultat attendu sur mobile
```

- [ ] **Step 3 : Commit**

```bash
git add src/hooks/useDevicePixelRatio.js
git commit -m "feat: add useDevicePixelRatio hook (clamped DPR per device type)"
```

---

## Task 3 : `FallbackUI` — version 2D Win95 si WebGL/mobile KO

**Files:**
- Create: `src/components/FallbackUI.jsx`

- [ ] **Step 1 : Créer le fichier**

```jsx
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
            Windows 95 interactif en three dimensions.
          </p>
        </div>
      </div>

      <nav style={s.window} aria-label="Projets">
        <div style={s.titlebar}><span>Projets</span></div>
        <div style={s.body}>
          <h2 style={s.h2}>Projets selectionnes</h2>
          <ul style={s.list}>
            <li style={s.listItem}>Portfolio 3D Windows 95 — Three.js, React, CSS3DRenderer</li>
            {/* Ajouter ici les autres projets depuis ProjectsExplorer.jsx */}
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
          <p>
            {/* Remplacer [pseudo] par ton nom GitHub */}
            GitHub :{' '}
            <a
              href="https://github.com/[pseudo]"
              style={s.link}
              target="_blank"
              rel="noreferrer"
            >
              github.com/[pseudo]
            </a>
          </p>
        </div>
      </footer>

    </main>
  )
}
```

> Contenu a completer depuis `src/components/OS/apps/ProjectsExplorer.jsx` (projets) et `SkillsApp.jsx` (competences). Les caracteres accentues sont retires des strings pour eviter des problemes d'encodage dans le fichier plan.

- [ ] **Step 2 : Vérification — ouvrir l'URL directement en forçant le fallback**

Dans `src/App.jsx` (temporairement) :
```jsx
// Forcer le fallback pour tester — à défaire après
import { FallbackUI } from './components/FallbackUI'
export default function App() { return <FallbackUI reason="size" /> }
```
Lancer `npm run dev` et vérifier : fond teal, fenêtres Win95 avec bordures biseautées, contenu lisible.

Tester aussi `reason="webgl"` pour vérifier le message.

**Attendu :** Interface Win95 2D propre, aucune erreur console, tous les textes lisibles.

- [ ] **Step 3 : Commit**

```bash
git add src/components/FallbackUI.jsx
git commit -m "feat: add FallbackUI — Win95 2D fallback for no-WebGL/small-screen"
```

---

## Task 4 : Câbler `App.jsx` — routing WebGL

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1 : Remplacer le contenu de `src/App.jsx`**

```jsx
// src/App.jsx
import { Scene } from './components/Scene/Scene'
import { FallbackUI } from './components/FallbackUI'
import { useWebGLCheck } from './hooks/useWebGLCheck'

export default function App() {
  const { supported, reason } = useWebGLCheck()
  return supported ? <Scene /> : <FallbackUI reason={reason} />
}
```

- [ ] **Step 2 : Vérification**

Lancer `npm run dev`. Sur un écran > 480px avec WebGL 2 : la scène 3D s'affiche normalement. Pour tester le fallback, ouvrir les DevTools → Responsive → passer à 400px de large → recharger. La FallbackUI doit s'afficher.

**Attendu :** La scène 3D s'affiche sur desktop. La FallbackUI s'affiche si écran < 480px (après rechargement).

- [ ] **Step 3 : Commit**

```bash
git add src/App.jsx
git commit -m "feat: route to FallbackUI when WebGL unavailable or screen < 480px"
```

---

## Task 5 : `AdaptiveRenderer` — framerate 15/60 FPS adaptatif

**Files:**
- Create: `src/components/Scene/AdaptiveRenderer.jsx`

- [ ] **Step 1 : Créer le fichier**

```jsx
// src/components/Scene/AdaptiveRenderer.jsx
import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'

// Composant R3F (pas un hook) — doit être monté à l'intérieur du <Canvas>
// afin d'accéder à useThree() (invalidate, set).
// Écoute les événements camera-controls v3 'wake'/'rest' + visibilitychange.
export function AdaptiveRenderer({ cameraControlsRef }) {
  const { invalidate, set } = useThree()
  const intervalRef = useRef(null)

  useEffect(() => {
    const controls = cameraControlsRef.current
    if (!controls) return

    const goActive = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      set({ frameloop: 'always' })
    }

    const goIdle = () => {
      set({ frameloop: 'demand' })
      // 15 FPS = 66.67 ms entre chaque frame
      intervalRef.current = setInterval(() => invalidate(), 67)
    }

    const onVisibility = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        set({ frameloop: 'never' })
      } else {
        // Reprend en mode idle — 'wake' upgreadera vers 'always' si la caméra bouge
        goIdle()
      }
    }

    // camera-controls v3 : 'wake' = caméra commence à bouger (user OU programmatique)
    //                       'rest' = vélocité proche de zéro
    controls.addEventListener('wake', goActive)
    controls.addEventListener('rest', goIdle)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      controls.removeEventListener('wake', goActive)
      controls.removeEventListener('rest', goIdle)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [cameraControlsRef, invalidate, set])

  return null
}
```

- [ ] **Step 2 : Vérification (après Task 6 — monté dans Scene)**

Après avoir câblé dans Scene.jsx (Task 6), ouvrir les DevTools Performance. Enregistrer 5 secondes :
- Bouger la caméra → les frames doivent tomber à ~60/s
- Laisser la caméra immobile 1s → les frames doivent tomber à ~15/s
- Masquer l'onglet (alt+tab) → render doit s'arrêter (0 frames/s)

- [ ] **Step 3 : Commit**

```bash
git add src/components/Scene/AdaptiveRenderer.jsx
git commit -m "feat: add AdaptiveRenderer — 15/60 FPS adaptive frameloop via camera-controls events"
```

---

## Task 6 : Modifier `Scene.jsx` — DPR, Suspense Moon, AdaptiveRenderer, ARIA

**Files:**
- Modify: `src/components/Scene/Scene.jsx`

> Contexte : `<Suspense fallback={null}>` est déjà présent autour de `<VintagePC>` (ligne 311). `<Moon>` utilise deux `useGLTF()` mais n'est pas encore enveloppé.

- [ ] **Step 1 : Ajouter les imports manquants**

En haut de `Scene.jsx`, après les imports existants (ligne 10), ajouter :

```jsx
import { useDevicePixelRatio } from '../../hooks/useDevicePixelRatio'
import { AdaptiveRenderer } from './AdaptiveRenderer'
```

- [ ] **Step 2 : Appeler `useDevicePixelRatio` dans le corps de `Scene()`**

Après la ligne `const { play: playAudio } = useNightAudio()` (ligne 260), ajouter :

```jsx
const dpr = useDevicePixelRatio()
```

- [ ] **Step 3 : Ajouter `role` + `aria-label` sur le div racine**

Remplacer (ligne 288) :
```jsx
<div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
```
Par :
```jsx
<div
  style={{ width: '100vw', height: '100vh', position: 'relative' }}
  role="application"
  aria-label="Portfolio 3D Poncelet Tymeo — scene Windows 95"
>
```

- [ ] **Step 4 : Ajouter `dpr` au Canvas**

Remplacer (lignes 292-297) :
```jsx
<Canvas
  camera={{ position: [0, 1.1, 4.2], fov: 50 }}
  shadows
  gl={{ antialias: true, alpha: true }}
  onCreated={handleCreated}
>
```
Par :
```jsx
<Canvas
  camera={{ position: [0, 1.1, 4.2], fov: 50 }}
  shadows
  gl={{ antialias: true, alpha: true }}
  dpr={dpr}
  onCreated={handleCreated}
>
```

- [ ] **Step 5 : Envelopper `<Moon />` dans Suspense**

Remplacer (ligne 306) :
```jsx
{/* ── Lune + cadre fenêtre + sol ── */}
<Moon />
```
Par :
```jsx
{/* ── Lune + cadre fenêtre + sol ── */}
<Suspense fallback={null}>
  <Moon />
</Suspense>
```

- [ ] **Step 6 : Ajouter `<AdaptiveRenderer>` après `<CameraControls>`**

Après `<CameraControls ... />` (ligne 336), ajouter :
```jsx
<AdaptiveRenderer cameraControlsRef={cameraControlsRef} />
```

- [ ] **Step 7 : Ajouter ARIA sur le hint et le bouton Retour**

Remplacer le bloc hint (lignes 340-354) :
```jsx
{isReady && !isFocused && !isAnimating && (
  <div
    aria-live="polite"
    aria-label="Instruction : survolez le moniteur pour demarrer l'OS"
    style={{
      position:      'absolute',
      bottom:        32,
      left:          '50%',
      transform:     'translateX(-50%)',
      color:         'rgba(255,255,255,0.45)',
      fontFamily:    'MS Sans Serif, Arial, sans-serif',
      fontSize:      13,
      pointerEvents: 'none',
      letterSpacing: '0.05em',
    }}>
    Survolez le moniteur pour démarrer
  </div>
)}
```

Remplacer le bouton Retour (lignes 357-377) :
```jsx
{isFocused && !isAnimating && (
  <button
    onClick={zoomOut}
    aria-label="Retour a la vue d'ensemble 3D"
    style={{
      position:    'absolute',
      top:         16,
      left:        16,
      zIndex:      1000,
      background:  '#c0c0c0',
      border:      '2px solid',
      borderColor: '#ffffff #404040 #404040 #ffffff',
      fontFamily:  'MS Sans Serif, Arial, sans-serif',
      fontSize:    12,
      padding:     '4px 14px',
      cursor:      'pointer',
      boxShadow:   '1px 1px 0 #000',
    }}
  >
    ← Retour
  </button>
)}
```

- [ ] **Step 8 : Vérification**

Lancer `npm run dev`. Vérifier :
1. La scène se charge normalement
2. Ouvrir DevTools → Performance → enregistrer 10s en bougeant puis laissant la caméra : le framerate doit passer à ~15 FPS après immobilité
3. Inspecter le DOM : le `<div>` racine doit avoir `role="application"`
4. Inspecter le `<canvas>` : vérifier qu'il n'y a pas d'erreur console liée à `dpr`

**Attendu :** Aucune régression visuelle, framerate adaptatif fonctionnel, ARIA présent dans le DOM.

- [ ] **Step 9 : Commit**

```bash
git add src/components/Scene/Scene.jsx
git commit -m "feat: wire AdaptiveRenderer, adaptive DPR, Suspense on Moon, ARIA in Scene"
```

---

## Task 7 : `SeoMeta` — contenu DOM indexable + câblage App.jsx

**Files:**
- Create: `src/components/SeoMeta.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1 : Créer `src/components/SeoMeta.jsx`**

```jsx
// src/components/SeoMeta.jsx

// Pattern screen-reader-safe : non pénalisé Google, invisible visuellement.
// Contient le texte du portfolio pour indexation par les crawlers
// (le contenu OS dans l'iframe est invisible aux robots).
const srOnly = {
  position:   'absolute',
  width:      '1px',
  height:     '1px',
  padding:    0,
  margin:     '-1px',
  overflow:   'hidden',
  clip:       'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border:     0,
}

export function SeoMeta() {
  return (
    <div aria-hidden="true" style={srOnly}>
      <h1>Poncelet Tymeo — Developpeur Web Full Stack</h1>
      <p>
        Portfolio interactif simulant un environnement Windows 95 en 3D.
        Developpeur passionne par les interfaces creatives, la 3D web
        et l'experience utilisateur.
      </p>
      <section>
        <h2>Projets</h2>
        <ul>
          <li>Portfolio 3D Windows 95 — Three.js, React Three Fiber, CSS3DRenderer</li>
          {/* Copier ici les titres et descriptions depuis ProjectsExplorer.jsx */}
        </ul>
      </section>
      <section>
        <h2>Competences techniques</h2>
        <ul>
          <li>React, Three.js, JavaScript, TypeScript, Node.js, CSS, Tailwind CSS, Git, Vite</li>
          {/* Copier ici les stacks depuis SkillsApp.jsx */}
        </ul>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Email : tymeo.poncelet@gmail.com</p>
        {/* Ajouter GitHub, LinkedIn si souhaité */}
      </section>
    </div>
  )
}
```

- [ ] **Step 2 : Mettre à jour `src/App.jsx`**

```jsx
// src/App.jsx
import { Scene } from './components/Scene/Scene'
import { FallbackUI } from './components/FallbackUI'
import { SeoMeta } from './components/SeoMeta'
import { useWebGLCheck } from './hooks/useWebGLCheck'

export default function App() {
  const { supported, reason } = useWebGLCheck()
  return (
    <>
      <SeoMeta />
      {supported ? <Scene /> : <FallbackUI reason={reason} />}
    </>
  )
}
```

- [ ] **Step 3 : Vérification**

Lancer `npm run dev`. Ouvrir DevTools → Elements. Chercher le `div[aria-hidden="true"]` avec `style="position:absolute;width:1px..."`. Vérifier que `<h1>`, `<h2>`, `<p>`, `<ul>` sont bien présents dans le DOM principal (pas dans l'iframe).

**Attendu :** Le contenu textuel est dans le DOM principal, invisible visuellement, lisible par les crawlers.

- [ ] **Step 4 : Commit**

```bash
git add src/components/SeoMeta.jsx src/App.jsx
git commit -m "feat: add SeoMeta with screen-reader-safe crawlable content"
```

---

## Task 8 : Mettre à jour `index.html` — meta tags OpenGraph / Twitter

**Files:**
- Modify: `index.html` (racine du projet)

> Avant de modifier : remplacer `[your-github-username]` par ton pseudo GitHub réel dans les URLs. L'image `og-preview.png` (1200×630px, capture de la scène) est à placer dans `public/` manuellement.

- [ ] **Step 1 : Remplacer le contenu de `<head>` dans `index.html`**

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <!-- SEO de base -->
    <title>Poncelet Tyméo — Portfolio 3D Windows 95</title>
    <meta name="description" content="Portfolio interactif de Poncelet Tyméo, développeur web full stack — simulant un environnement Windows 95 en 3D avec Three.js et React." />
    <link rel="canonical" href="https://[your-github-username].github.io/portfolio3D/" />

    <!-- OpenGraph (LinkedIn, Facebook, Discord) -->
    <meta property="og:type"        content="website" />
    <meta property="og:title"       content="Poncelet Tyméo — Portfolio 3D Windows 95" />
    <meta property="og:description" content="Portfolio interactif simulant un environnement Windows 95 en 3D. Projets, compétences et contact." />
    <meta property="og:url"         content="https://[your-github-username].github.io/portfolio3D/" />
    <meta property="og:image"       content="https://[your-github-username].github.io/portfolio3D/og-preview.png" />
    <meta property="og:locale"      content="fr_FR" />

    <!-- Twitter Card -->
    <meta name="twitter:card"        content="summary_large_image" />
    <meta name="twitter:title"       content="Poncelet Tyméo — Portfolio 3D Windows 95" />
    <meta name="twitter:description" content="Portfolio interactif simulant un environnement Windows 95 en 3D." />
    <meta name="twitter:image"       content="https://[your-github-username].github.io/portfolio3D/og-preview.png" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 2 : Créer `public/og-preview.png`**

Lancer `npm run dev`, aller sur la scène, faire une capture d'écran 1200×630px montrant le moniteur CRT avec l'OS allumé. Sauvegarder dans `public/og-preview.png`.

Tester l'OpenGraph avec : https://www.opengraph.xyz (coller l'URL GitHub Pages après déploiement).

- [ ] **Step 3 : Vérification**

```bash
curl -s http://localhost:5173/ | grep -E "(og:|twitter:|description|canonical)"
```

**Attendu :** Toutes les balises meta apparaissent dans la réponse HTML brute.

- [ ] **Step 4 : Commit**

```bash
git add index.html
git commit -m "feat: add OpenGraph, Twitter Card and canonical meta tags to index.html"
```

---

## Checklist finale de vérification

Avant de considérer l'implémentation terminée :

- [ ] `npm run build` réussit sans erreur ni warning TypeScript/ESLint
- [ ] La scène 3D charge et l'intro s'anime normalement (aucune régression)
- [ ] DevTools Performance : framerate ~15 FPS en idle, ~60 FPS en mouvement
- [ ] DevTools Elements : `div[aria-hidden]` avec contenu textuel dans le DOM principal
- [ ] DevTools Elements : `<div role="application" aria-label="Portfolio 3D...">` présent
- [ ] Responsive DevTools : passer à 400px → recharger → FallbackUI s'affiche
- [ ] `curl http://localhost:5173/ | grep og:title` retourne la balise
- [ ] Les effets CRT (jitter, flicker, scanlines) sont inchangés visuellement
