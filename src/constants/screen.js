// Ces constantes DOIVENT être importées par VintagePC.jsx ET CSS3DBridge.jsx
// Ne jamais les dupliquer — c'est ce qui aligne l'OS sur l'écran 3D.

// Dimensions de la face de l'écran en unités Three.js (1 unit = 1 mètre)
export const SCREEN_WORLD_W = 0.64   // largeur : 64 cm
export const SCREEN_WORLD_H = 0.48   // hauteur : 48 cm  (ratio 4:3, Win95 authentique)

// Résolution DOM de l'interface OS (pixels CSS dans le monde virtuel)
// 640×480 = résolution Win95 originale → cohérence maximale
export const DOM_W = 640
export const DOM_H = 480

// SCALE_FACTOR : converts DOM pixels → Three.js world units
// Math : on veut que DOM_W * scale = SCREEN_WORLD_W
// Donc scale = SCREEN_WORLD_W / DOM_W = 0.64 / 640 = 0.001
// (1 pixel CSS = 1 millimètre dans l'espace 3D)
export const SCALE_FACTOR = SCREEN_WORLD_W / DOM_W  // = 0.001

// ── Configuration du modèle GLB ───────────────────────────────────
// Nom exact du mesh "écran" (ex: 'Object_12').
// null = détection automatique par analyse géométrique.
// Object_19 détecté automatiquement (aspect 4:3 exact, mesh le plus plat)
export const SCREEN_MESH_NAME = 'Object_19'

// Scale = SCREEN_WORLD_W / screen_world_width_at_scale_1
// = 0.64 / 3.0575 ≈ 0.209
export const PC_MODEL_SCALE = 0.209

// Plus besoin du debug visuel maintenant que le mesh est identifié
export const DEBUG_HIGHLIGHT_SCREEN = false

// Position du groupe PC dans le monde 3D
export const PC_WORLD_POSITION = [0, 0.76, 0]

// Position locale de la face de l'écran DANS le groupe VintagePC
// Boîtier [0.82, 0.72, 0.52] → face avant z=0.26
// Biseau  [0.70, 0.60, 0.02] à z=0.26 → face avant biseau z=0.27
// Écran   légèrement devant le biseau : z=0.271, centré en y=0.04 (y biseau)
// Doit correspondre exactement à SCREEN_LOCAL dans VintagePC.jsx
export const SCREEN_LOCAL_OFFSET = [0, 0.04, 0.271]
