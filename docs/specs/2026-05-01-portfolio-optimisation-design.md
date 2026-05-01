# Optimisation Portfolio 3D Windows 95 — Design Spec

**Date:** 2026-05-01  
**Projet:** portfolio-3d (Three.js + R3F + CSS3DRenderer)  
**Piliers:** Performance / Responsive / SEO-Accessibilité

---

## Contexte

Portfolio interactif simulant un environnement Windows 95 dans une scène 3D. L'OS virtuel tourne dans une iframe CSS3DRenderer (technique Henry Heffernan). Stack : Vite 8, React 19, Three.js 0.183, R3F 9.5, Zustand 5, Tailwind 4.

**Problèmes actuels identifiés :**
- Aucun Suspense sur les `useGLTF()` (vintage_pc, moon, fenetre)
- Canvas avec antialiasing fixe, `pixelRatio` non adaptatif
- `useFrame` tourne à 60 FPS même quand la caméra est immobile et l'OS actif
- Pas de détection WebGL ni de fallback mobile
- Aucune meta tag OpenGraph/Twitter dans `index.html`
- Contenu portfolio (bio, projets, compétences) invisible aux crawlers (iframe)
- Aucun attribut ARIA sur la scène ou les interactions

---

## Architecture cible

```
src/
├── hooks/
│   ├── useNightAudio.js          (existant — inchangé)
│   ├── useWebGLCheck.js          (nouveau)
│   └── useDevicePixelRatio.js    (nouveau)
│
├── components/
│   ├── SeoMeta.jsx               (nouveau)
│   ├── FallbackUI.jsx            (nouveau)
│   └── Scene/
│       ├── AdaptiveRenderer.jsx  (nouveau — composant R3F interne au Canvas)
│       └── Scene.jsx             (modifié — consomme les hooks, ARIA)
│
└── index.html                    (modifié — meta tags statiques)
```

`App.jsx` route entre `<Scene>` et `<FallbackUI>` selon `useWebGLCheck()`. Aucun composant existant n'est réécrit.

---

## Pilier 1 — Performance

### `AdaptiveRenderer.jsx` (composant R3F, rendu à l'intérieur du `<Canvas>`)

Gère dynamiquement le framerate Three.js selon l'état de la caméra et la visibilité de l'onglet. Doit être un **composant** (pas un hook) car il utilise `useThree()` qui n'est accessible qu'à l'intérieur du `<Canvas>`.

**Logique :**

| État | Stratégie |
|------|-----------|
| Caméra en mouvement | `set({ frameloop: 'always' })` (60 FPS natif) |
| Caméra au repos > 500ms | `set({ frameloop: 'demand' })` + `setInterval` 15 FPS → `invalidate()` |
| Onglet masqué (`visibilitychange`) | `clearInterval` + `set({ frameloop: 'never' })` |
| Onglet redevient visible | Reprise selon état caméra |

**Implémentation :**
- Reçoit `cameraControlsRef` en prop depuis `Scene.jsx`
- Utilise `const { invalidate, set } = useThree()` pour contrôler le rendu
- S'abonne à l'event `rest` de `CameraControls` (camera-controls v3 natif) pour détecter l'arrêt
- S'abonne à l'event `update` pour détecter le redémarrage du mouvement
- S'abonne à `document.visibilitychange` pour les pauses onglet
- Nettoie intervals et listeners dans le `return` du `useEffect`
- Renvoie `null` (composant de comportement pur, aucun rendu)

### `useDevicePixelRatio()`

Retourne un DPR clampé pour passer au prop `dpr` du `<Canvas>`.

| Contexte | DPR retourné |
|----------|--------------|
| Mobile (pointer: coarse) | `min(1.5, devicePixelRatio)` |
| Desktop | `min(2, devicePixelRatio)` |

Détection via `window.matchMedia('(pointer: coarse)')`.

### Suspense sur les GLB

Les 3 modèles (`VintagePC`, `Moon`, fenêtre dans `Moon.jsx`) sont enveloppés dans `<Suspense fallback={null}>`. Les appels `useGLTF.preload()` existants sont conservés. Le `LoadingScreen` (basé sur `useProgress`) continue à gérer l'affichage — aucun changement visuel.

---

## Pilier 2 — Responsive & Fallback

### `useWebGLCheck()`

Vérifie au montage (une seule fois) :
1. Support WebGL 2 : `document.createElement('canvas').getContext('webgl2')`
2. Taille d'écran : `window.innerWidth < 480`

Retourne `{ supported: boolean, reason: 'webgl' | 'size' | null }`.

**Routing dans `App.jsx` :**
```jsx
const { supported, reason } = useWebGLCheck()
return supported ? <Scene /> : <FallbackUI reason={reason} />
```

Le chunk `three-*.js` de Vite ne s'exécute pas dans le chemin fallback.

### `FallbackUI.jsx`

Version 2D statique avec l'esthétique Win95 (biseaux, police Millennium, couleurs exactes du thème). Contenu :
- En-tête avec nom + titre professionnel
- Sections : bio, projets (liste), compétences (tags), contact (liens)
- Message contextuel selon `reason` :
  - `size` → "Pour l'expérience 3D complète, ouvre sur un écran plus grand"
  - `webgl` → "Ton navigateur ne supporte pas WebGL 2"
- Entièrement sémantique : `<main>`, `<nav>`, `<section>`, `<footer>`, `<h1>`/`<h2>`
- Styled avec Tailwind CSS uniquement

### Canvas responsive

Le `<Canvas>` conserve `100vw × 100vh`. La résolution de l'iframe OS (640×462px) reste fixe — contrainte par le ratio du mesh CRT, toute modification casserait le CSS3DRenderer. Sur mobile passant le check WebGL (480px–768px), la scène s'affiche avec DPR réduit.

---

## Pilier 3 — SEO & Accessibilité

### `index.html` — meta tags statiques

Ajoutés dans `<head>` directement (Vite sert ce fichier statiquement, pas besoin de react-helmet) :

```html
<!-- SEO de base -->
<meta name="description" content="Portfolio interactif de Poncelet Tyméo, développeur web — simulant un environnement Windows 95 en 3D." />
<link rel="canonical" href="https://[username].github.io/portfolio3D/" />

<!-- OpenGraph -->
<meta property="og:type" content="website" />
<meta property="og:title" content="Poncelet Tyméo — Portfolio 3D Windows 95" />
<meta property="og:description" content="Portfolio interactif simulant un environnement Windows 95 en 3D. Projets, compétences et contact." />
<meta property="og:url" content="https://[username].github.io/portfolio3D/" />
<meta property="og:image" content="https://[username].github.io/portfolio3D/og-preview.png" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Poncelet Tyméo — Portfolio 3D Windows 95" />
<meta name="twitter:description" content="Portfolio interactif simulant un environnement Windows 95 en 3D." />
<meta name="twitter:image" content="https://[username].github.io/portfolio3D/og-preview.png" />
```

Une image `og-preview.png` (1200×630px, capture de la scène) est à placer dans `public/`.

### `SeoMeta.jsx` — contenu DOM indexable

Monté dans `App.jsx`. Rendu dans le DOM principal (hors iframe), caché visuellement avec le pattern screen-reader safe (non pénalisé Google) :

```css
position: absolute; width: 1px; height: 1px; 
overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap;
```

Structure :
```jsx
<div aria-hidden="true" style={srOnly}>
  <h1>Poncelet Tyméo — Développeur Web / Portfolio</h1>
  <p>[description générale]</p>
  <section><h2>Projets</h2><ul>[liste des projets]</ul></section>
  <section><h2>Compétences</h2><ul>[liste des stacks]</ul></section>
  <section><h2>Contact</h2><p>[email, liens]</p></section>
</div>
```

### ARIA dans la scène 3D

| Élément | Attribut |
|---------|----------|
| `<Canvas>` | `role="application"` + `aria-label="Scène 3D interactive — portfolio Windows 95"` |
| Zone hover moniteur | `<div role="button" aria-label="Cliquer pour accéder au bureau Windows 95">` |
| Texte hint "Survolez le moniteur" | Converti en `<Html>` Drei (DOM réel) + `aria-live="polite"` |
| `FallbackUI` | Entièrement sémantique, aucun attribut ARIA supplémentaire nécessaire |

---

## Contraintes respectées

- Esthétique Windows 95 inchangée (biseaux, pixel art, couleurs, CRT jitter/flicker)
- `win95.css` non modifié
- CSS3DRenderer + ratio iframe non touchés
- Aucune dépendance nouvelle (pas de react-helmet, react-query, etc.)
- Chunks Vite existants (`three`, `r3f`) conservés

---

## Fichiers modifiés / créés

| Fichier | Action |
|---------|--------|
| `src/components/Scene/AdaptiveRenderer.jsx` | Créé |
| `src/hooks/useWebGLCheck.js` | Créé |
| `src/hooks/useDevicePixelRatio.js` | Créé |
| `src/components/SeoMeta.jsx` | Créé |
| `src/components/FallbackUI.jsx` | Créé |
| `src/components/Scene/Scene.jsx` | Modifié (consomme hooks, Canvas props, ARIA, monte AdaptiveRenderer) |
| `src/App.jsx` | Modifié (routing WebGL, SeoMeta) |
| `index.html` | Modifié (meta tags statiques) |
| `public/og-preview.png` | À créer manuellement (capture 1200×630) |

**Aucun fichier existant supprimé.**
