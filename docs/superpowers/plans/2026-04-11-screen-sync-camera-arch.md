# Screen Sync & Camera Arch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger la double-transformation qui désynchronise l'overlay HTML de l'écran 3D, et remplacer l'interpolation linéaire de caméra par une trajectoire en arche Bézier qui évite de traverser le clavier.

**Architecture:** `ScreenContent` est sorti de `<PresentationControls>` dans `Scene.jsx` pour éliminer la double-transformation. Un composant `CameraRig` (via `forwardRef`/`useImperativeHandle`) est ajouté à l'intérieur du Canvas ; il anime la caméra via `THREE.QuadraticBezierCurve3` + `useFrame` et expose une méthode `animateTo(endPos, lookAt, onComplete)` utilisée par `zoomToScreen` et `zoomOut`.

**Tech Stack:** React 19, React Three Fiber v9, @react-three/drei v10, Three.js v0.183, Zustand v5

---

## File Map

| Fichier | Action | Responsabilité |
|---|---|---|
| `src/components/Scene/VintagePC.jsx` | Modifier | Supprimer `ScreenContent` (import + JSX) |
| `src/components/Scene/Scene.jsx` | Modifier | Ajouter `ScreenContent` hors PC, ajouter `CameraRig`, refactorer zoom |

Aucun autre fichier n'est touché.

---

## Task 1 : Retirer ScreenContent de VintagePC

**Files:**
- Modify: `src/components/Scene/VintagePC.jsx`

- [ ] **Step 1.1 — Supprimer l'import de ScreenContent**

Dans `src/components/Scene/VintagePC.jsx`, ligne 6 environ, supprimer la ligne qui importe `OS` et celle qui importe `ScreenContent` si elle existe, puis vérifier qu'aucun autre import ne vient de `../OS/OS` dans ce fichier.

Le haut du fichier doit ressembler à :

```jsx
import { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useWindowStore } from '../../stores/windowStore'
import {
  SCREEN_MESH_NAME,
  PC_MODEL_SCALE,
  DEBUG_HIGHLIGHT_SCREEN,
} from '../../constants/screen'
```

> `Html`, `useFrame`, `DOM_W`, `DOM_H`, `SCALE_FACTOR`, `SCREEN_WORLD_W`, `SCREEN_WORLD_H` et `SCREEN_LOCAL_OFFSET` ne sont plus nécessaires dans ce fichier — les retirer si présents.

- [ ] **Step 1.2 — Supprimer ScreenContent du JSX de VintagePC**

Dans la fonction `VintagePC`, retirer `<ScreenContent isFocused={isFocused} />` du return.
Retirer aussi le prop `isFocused` de la signature puisqu'il n'est plus utilisé ici.

Le composant doit ressembler à :

```jsx
export function VintagePC({ onMonitorClick }) {
  const { scene } = useGLTF('/models/vintage_pc.glb')
  const fallbackRef  = useRef()
  const setScreenRef = useWindowStore((s) => s.setScreenRef)

  useEffect(() => {
    const screenMesh = detectScreenMesh(scene)

    if (screenMesh) {
      console.log(`[VintagePC] ✓ Mesh-écran : "${screenMesh.name}"`)
      setScreenRef(screenMesh)

      const mat = screenMesh.material
      if (mat && !mat._crtLit) {
        mat.emissive          = new THREE.Color('#003355')
        mat.emissiveIntensity = 3.0
        mat.needsUpdate       = true
        mat._crtLit           = true
      }
      if (DEBUG_HIGHLIGHT_SCREEN) {
        mat.emissive.set('#00ff44'); mat.needsUpdate = true
        setTimeout(() => { mat.emissive.set('#003355'); mat.needsUpdate = true }, 3000)
      }
    } else {
      if (fallbackRef.current) setScreenRef(fallbackRef.current)
    }

    return () => setScreenRef(null)
  }, [scene, setScreenRef])

  return (
    <>
      <primitive
        object={scene}
        scale={PC_MODEL_SCALE}
        onClick={(e) => { e.stopPropagation(); onMonitorClick?.() }}
        onPointerOver={() => { document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = 'auto' }}
      />
      <mesh ref={fallbackRef} position={[0, 0.80, 0.271]} visible={false}>
        <planeGeometry args={[0.64, 0.48]} />
        <meshBasicMaterial />
      </mesh>
    </>
  )
}
```

- [ ] **Step 1.3 — Vérifier dans le navigateur**

Ouvrir `http://localhost:5173`. La console ne doit PAS afficher d'erreur React. Le modèle 3D doit toujours s'afficher. L'OS a disparu (normal — il sera réinjecté en Task 2).

- [ ] **Step 1.4 — Commit**

```bash
cd "C:/Users/TYM/Desktop/site old pc - Copie/portfolio-3d"
git add src/components/Scene/VintagePC.jsx
git commit -m "refactor: remove ScreenContent from VintagePC (prep for double-transform fix)"
```

---

## Task 2 : Déplacer ScreenContent dans Scene (hors PresentationControls)

**Files:**
- Modify: `src/components/Scene/Scene.jsx`

> `ScreenContent` est défini dans `VintagePC.jsx`. Il doit rester là — on l'importe juste depuis `Scene.jsx` maintenant.

- [ ] **Step 2.1 — Exporter ScreenContent depuis VintagePC.jsx**

Dans `src/components/Scene/VintagePC.jsx`, ajouter le mot-clé `export` devant `function ScreenContent` :

```jsx
export function ScreenContent({ isFocused }) {
  // ... code inchangé
}
```

- [ ] **Step 2.2 — Importer ScreenContent dans Scene.jsx**

En haut de `src/components/Scene/Scene.jsx`, modifier l'import de VintagePC :

```jsx
import { VintagePC, ScreenContent } from './VintagePC'
```

- [ ] **Step 2.3 — Placer ScreenContent HORS de PresentationControls**

Dans le JSX du Canvas de `Scene.jsx`, positionner `<ScreenContent>` comme sibling de `<PresentationControls>` — pas dedans. Retirer le prop `isFocused` passé à `VintagePC` puisqu'il n'en a plus besoin.

```jsx
<Canvas
  camera={{ position: [4, 4, 9], fov: 48 }}
  shadows
  gl={{ antialias: true }}
  onCreated={handleCreated}
>
  <ambientLight intensity={0.5} />
  <directionalLight position={[4, 8, 4]} intensity={1.2} castShadow />
  <pointLight position={[0, 1.26, 0.4]} intensity={0.6} color="#44aaff" distance={3} />

  <PresentationControls
    global
    polar={[-0.15, 0.15]}
    azimuth={[-0.4, 0.4]}
    config={{ mass: 2, tension: 500 }}
    enabled={!isFocused}
    snap
  >
    <VintagePC onMonitorClick={zoomToScreen} />
  </PresentationControls>

  {/* ScreenContent HORS de PresentationControls — élimine la double-transformation */}
  <ScreenContent isFocused={isFocused} />

  <CameraControls
    ref={cameraControlsRef}
    enabled={!isFocused}
    makeDefault
    smoothTime={TRANSITION_DURATION}
    draggingSmoothTime={0.08}
    minDistance={1}
    maxDistance={15}
    maxPolarAngle={Math.PI / 2 - 0.02}
    minPolarAngle={0.05}
  />
</Canvas>
```

- [ ] **Step 2.4 — Vérifier dans le navigateur**

- L'OS doit réapparaître sur l'écran du modèle 3D
- Tourner le modèle avec la souris : l'OS doit rester collé à l'écran sans dériver
- Ouvrir la console : `[ScreenContent] ✓ worldW=...` doit apparaître avec des valeurs cohérentes

- [ ] **Step 2.5 — Commit**

```bash
git add src/components/Scene/VintagePC.jsx src/components/Scene/Scene.jsx
git commit -m "fix: move ScreenContent outside PresentationControls — eliminates double-transform"
```

---

## Task 3 : Ajouter le composant CameraRig avec Bézier

**Files:**
- Modify: `src/components/Scene/Scene.jsx`

- [ ] **Step 3.1 — Ajouter les imports nécessaires**

En haut de `src/components/Scene/Scene.jsx`, ajouter/compléter les imports :

```jsx
import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { CameraControls, PresentationControls } from '@react-three/drei'
```

- [ ] **Step 3.2 — Ajouter les constantes d'animation**

Après les constantes `CAMERA` et `FOCUS_DISTANCE` existantes dans `Scene.jsx`, ajouter :

```js
const ARCH_HEIGHT = 0.8   // unités world — élévation du point de contrôle Bézier
```

- [ ] **Step 3.3 — Ajouter la fonction smoothstep**

Après les constantes, ajouter la fonction d'easing (en dehors de tout composant) :

```js
function smoothstep(t) {
  return t * t * (3 - 2 * t)
}
```

- [ ] **Step 3.4 — Ajouter le composant CameraRig**

Après `smoothstep`, avant la fonction `Scene`, ajouter :

```jsx
// ── CameraRig ─────────────────────────────────────────────────────
// Anime la caméra le long d'une courbe de Bézier quadratique.
// Le point de contrôle est surélevé de ARCH_HEIGHT pour éviter
// de traverser le clavier pendant le zoom.
const CameraRig = forwardRef(function CameraRig(_, ref) {
  const { camera } = useThree()

  // État interne de l'animation (pas de state React — pas de re-render)
  const anim = useRef({
    active:     false,
    t:          0,
    curve:      null,
    lookAt:     null,
    onComplete: null,
  })

  useImperativeHandle(ref, () => ({
    animateTo(endPos, lookAt, onComplete) {
      const startPos = camera.position.clone()
      const ctrlX    = (startPos.x + endPos.x) / 2
      const ctrlY    = Math.max(startPos.y, endPos.y) + ARCH_HEIGHT
      const ctrlZ    = (startPos.z + endPos.z) / 2

      anim.current = {
        active:     true,
        t:          0,
        curve:      new THREE.QuadraticBezierCurve3(
          startPos,
          new THREE.Vector3(ctrlX, ctrlY, ctrlZ),
          endPos.clone(),
        ),
        lookAt:     lookAt.clone(),
        onComplete: onComplete ?? null,
      }
    },
  }))

  useFrame((_, delta) => {
    const s = anim.current
    if (!s.active) return

    s.t = Math.min(s.t + delta / TRANSITION_DURATION, 1)
    camera.position.copy(s.curve.getPoint(smoothstep(s.t)))
    camera.lookAt(s.lookAt)

    if (s.t >= 1) {
      s.active = false
      s.onComplete?.()
    }
  })

  return null
})
```

- [ ] **Step 3.5 — Ajouter CameraRig dans le JSX du Canvas**

Dans `Scene.jsx`, ajouter la ref et placer `<CameraRig>` dans le Canvas, **après** `<ScreenContent>` et **avant** `<CameraControls>` :

```jsx
const cameraRigRef = useRef(null)
```

```jsx
{/* ── CameraRig : animation Bézier sans collision ── */}
<CameraRig ref={cameraRigRef} />
```

- [ ] **Step 3.6 — Vérifier dans la console**

Ouvrir `http://localhost:5173`. Aucune erreur console. `CameraRig` est silencieux au démarrage — il n'anime que sur appel de `animateTo`.

- [ ] **Step 3.7 — Commit**

```bash
git add src/components/Scene/Scene.jsx
git commit -m "feat: add CameraRig with QuadraticBezierCurve3 arch animation"
```

---

## Task 4 : Brancher CameraRig sur zoomToScreen et zoomOut

**Files:**
- Modify: `src/components/Scene/Scene.jsx`

- [ ] **Step 4.1 — Ajouter le state isAnimating**

Dans la fonction `Scene`, ajouter `isAnimating` à côté de `isFocused` :

```jsx
const [isFocused,   setIsFocused]   = useState(false)
const [isAnimating, setIsAnimating] = useState(false)
const [isReady,     setIsReady]     = useState(false)
```

- [ ] **Step 4.2 — Remplacer zoomToScreen**

Remplacer la fonction `zoomToScreen` existante par :

```jsx
const zoomToScreen = useCallback(() => {
  const rig = cameraRigRef.current
  if (!rig) return

  const { screenRef, screenCenter: sc } = useWindowStore.getState()
  let cx, cy, cz

  if (sc) {
    cx = sc.x; cy = sc.y; cz = sc.z
  } else if (screenRef) {
    screenRef.getWorldPosition(_screenPos)
    cx = _screenPos.x; cy = _screenPos.y; cz = _screenPos.z
  } else {
    // Fallback : position hardcodée si le mesh n'est pas encore détecté
    const { position: p, target: t } = CAMERA.focused
    cx = t[0]; cy = t[1]; cz = t[2]
  }

  const endPos  = new THREE.Vector3(cx, cy, cz + FOCUS_DISTANCE)
  const lookAt  = new THREE.Vector3(cx, cy, cz)

  setIsAnimating(true)
  rig.animateTo(endPos, lookAt, () => {
    // Synchroniser CameraControls sur la position finale (sans transition)
    // pour éviter un snap au relâchement
    const cc = cameraControlsRef.current
    if (cc) cc.setLookAt(endPos.x, endPos.y, endPos.z, cx, cy, cz, false)
    setIsAnimating(false)
    setIsFocused(true)
  })
}, [])
```

- [ ] **Step 4.3 — Remplacer zoomOut**

Remplacer la fonction `zoomOut` existante par :

```jsx
const zoomOut = useCallback(() => {
  const rig = cameraRigRef.current
  if (!rig) return

  const { position: p, target: t } = CAMERA.overview
  const endPos = new THREE.Vector3(p[0], p[1], p[2])
  const lookAt = new THREE.Vector3(t[0], t[1], t[2])

  setIsAnimating(true)
  rig.animateTo(endPos, lookAt, () => {
    const cc = cameraControlsRef.current
    if (cc) cc.setLookAt(p[0], p[1], p[2], t[0], t[1], t[2], false)
    setIsAnimating(false)
    setIsFocused(false)
  })
}, [])
```

- [ ] **Step 4.4 — Mettre à jour CameraControls : enabled**

Dans le JSX, mettre à jour le prop `enabled` de `<CameraControls>` :

```jsx
<CameraControls
  ref={cameraControlsRef}
  enabled={!isFocused && !isAnimating}
  makeDefault
  smoothTime={TRANSITION_DURATION}
  draggingSmoothTime={0.08}
  minDistance={1}
  maxDistance={15}
  maxPolarAngle={Math.PI / 2 - 0.02}
  minPolarAngle={0.05}
/>
```

- [ ] **Step 4.5 — Mettre à jour PresentationControls : enabled**

Même logique pour `PresentationControls` (ne pas permettre la rotation pendant le zoom) :

```jsx
<PresentationControls
  global
  polar={[-0.15, 0.15]}
  azimuth={[-0.4, 0.4]}
  config={{ mass: 2, tension: 500 }}
  enabled={!isFocused && !isAnimating}
  snap
>
```

- [ ] **Step 4.6 — Vérifier le comportement complet**

Séquence de test manuelle :

1. **Au chargement** : le modèle s'affiche, l'OS est collé à l'écran
2. **Survol** : curseur passe en pointeur
3. **Clic** : la caméra effectue une arche vers le haut puis redescend face à l'écran — aucune collision visible avec le clavier
4. **Mode focalisé** : l'OS est interactif, PresentationControls et CameraControls désactivés
5. **Touche Escape** : la caméra repart en arche vers la position overview
6. **Bouton "← Retour"** : même comportement qu'Escape
7. **Rotation** (mode non focalisé) : l'OS reste parfaitement aligné sur l'écran pendant toute la rotation

- [ ] **Step 4.7 — Commit final**

```bash
git add src/components/Scene/Scene.jsx
git commit -m "feat: Heffernan zoom — Bezier arch camera avoids keyboard collision"
```

---

## Self-Review

**Spec coverage :**
- [x] Bug 1 double-transform → Tasks 1 & 2
- [x] Bug 2 collision clavier → Tasks 3 & 4
- [x] `isAnimating` bloque CameraControls ET PresentationControls → Step 4.4 & 4.5
- [x] Sync CameraControls après animation → Steps 4.2 & 4.3 (appel `setLookAt(..., false)`)
- [x] Escape / bouton Retour → `zoomOut` déjà branché sur les deux dans le code existant
- [x] Curseur pointer → comportement inchangé sur `primitive`

**Type consistency :**
- `animateTo(endPos: Vector3, lookAt: Vector3, onComplete?: () => void)` — utilisé identiquement dans Steps 4.2, 4.3
- `cameraRigRef` déclaré Step 3.5, utilisé Steps 4.2 & 4.3 — cohérent

**Placeholders :** aucun TBD ni TODO.
