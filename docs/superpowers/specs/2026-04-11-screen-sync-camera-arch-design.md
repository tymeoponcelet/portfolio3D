# Design : Screen Sync & Camera Arch — Portfolio 3D

**Date :** 2026-04-11  
**Statut :** Approuvé

---

## Contexte

Portfolio 3D interactif inspiré de Henry Heffernan. Modèle Commodore 64 (vintage_pc.glb) chargé via `useGLTF`. Deux bugs bloquants identifiés après analyse complète du code source.

---

## Bug 1 — Screen sync cassé (double-transformation)

### Cause racine

`ScreenContent` est rendu comme enfant de `<PresentationControls>` (via `VintagePC` → `Scene.jsx`).

Dans `ScreenContent.useFrame`, on lit la `worldPosition` de `Object_19` (qui inclut déjà la rotation de PresentationControls), puis on la copie dans `groupRef.current.position`. Ce group est lui-même enfant de PresentationControls → la rotation est appliquée **deux fois**. L'overlay HTML dérive dès que l'utilisateur tourne le modèle.

### Fix

Déplacer `<ScreenContent>` **en dehors** de `<PresentationControls>` dans `Scene.jsx`. Le retirer de `VintagePC.jsx`. Le tracking useFrame (worldPosition + worldQuaternion + scale calculé depuis la bbox de Object_19) reste inchangé — il s'applique maintenant correctement en espace monde sans double-transformation.

### Hiérarchie cible

```
Canvas
  PresentationControls
    VintagePC          ← primitive + détection screenRef uniquement
  ScreenContent        ← DEHORS de PresentationControls
  CameraControls
```

### Fichiers modifiés

- `src/components/Scene/VintagePC.jsx` : supprimer `<ScreenContent>` et son import
- `src/components/Scene/Scene.jsx` : importer et placer `<ScreenContent isFocused={isFocused} />` comme sibling de `<PresentationControls>`

---

## Bug 2 — Caméra traverse le clavier (interpolation linéaire)

### Cause racine

`CameraControls.setLookAt(cx, cy, cz + FOCUS_DISTANCE, cx, cy, cz, true)` interpole en ligne droite dans l'espace position. Le clavier (z ≈ 0.46u world) se trouve dans le volume traversé par la trajectoire linéaire.

### Fix

Composant `CameraRig` ajouté **à l'intérieur du Canvas**, sibling de PresentationControls.

**Fonctionnement :**
1. Expose une ref `cameraRigRef` avec une méthode `animateTo(endPos, lookAt, onComplete?)`.
2. Au déclenchement, construit une `THREE.QuadraticBezierCurve3` :
   - `P0` = `camera.position.clone()` (position courante)
   - `P1` = point de contrôle : `{ x: (P0.x + P2.x)/2, y: max(P0.y, P2.y) + ARCH_HEIGHT, z: (P0.z + P2.z)/2 }`
   - `P2` = `endPos`
3. `useFrame` avance `t` de 0 → 1 sur `TRANSITION_DURATION` secondes avec easing `smoothstep(t)`
4. À chaque frame : `camera.position.copy(curve.getPoint(t))` + `camera.lookAt(lookAt)`
5. En fin d'animation : `animating.current = false`, appel du callback `onComplete()`

**Gestion de isFocused et CameraControls :**
- `CameraControls` a `enabled={!isFocused && !isAnimating}` (nouveau flag `isAnimating`)
- Zoom IN : `isAnimating = true` → animation → `isAnimating = false`, `isFocused = true`
- Zoom OUT : `isAnimating = true` → animation → `isAnimating = false`, `isFocused = false`
- CameraControls reste désactivé pendant TOUTE animation (zoom IN et OUT)

**Constantes :**
- `ARCH_HEIGHT = 0.8` (unités world, suffisant pour passer au-dessus du clavier à y≈0.04)
- `TRANSITION_DURATION = 1.4` s (déjà défini dans Scene.jsx)

### Interface de la ref

```typescript
interface CameraRigHandle {
  animateTo: (endPos: Vector3, lookAt: Vector3, onComplete?: () => void) => void
}
```

### Fichiers modifiés

- `src/components/Scene/Scene.jsx` :
  - Ajouter `CameraRig` (composant interne, défini dans le même fichier)
  - Remplacer les appels `cc.setLookAt(...)` par `cameraRigRef.current.animateTo(...)`
  - Ajouter state `isAnimating` (useState)
  - `CameraControls` passe à `enabled={!isFocused && !isAnimating}`

---

## Ce qui NE change PAS

- Architecture du store Zustand (`windowStore.js`) : inchangée
- Détection du mesh écran dans `VintagePC.jsx` : inchangée
- `constants/screen.js` : inchangé
- Les composants OS, Desktop, Taskbar, Window : inchangés
- `CameraControls` reste présent (gère l'orbite quand non focalisé)

---

## Critères de succès

1. Rotation via PresentationControls → l'OS reste parfaitement collé à l'écran 3D
2. Clic sur le modèle → la caméra effectue un arc au-dessus du clavier sans collision visible
3. Touche Escape / bouton Retour → la caméra revient en position overview via le même type d'arc
4. Curseur pointer au survol du modèle (comportement actuel conservé)
