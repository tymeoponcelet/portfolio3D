// Ces constantes DOIVENT être importées par VintagePC.jsx.
// Ne jamais les dupliquer — c'est ce qui aligne l'OS sur l'écran 3D.

// Résolution DOM de l'interface OS (pixels CSS dans le monde virtuel)
// 640×480 = résolution Win95 originale → cohérence maximale
export const DOM_W = 640
export const DOM_H = 480

// Dimensions de la face de l'écran en unités Three.js (1 unit = 1 mètre)
// Utilisées uniquement pour dériver SCALE_FACTOR ci-dessous.
export const SCREEN_WORLD_W = 0.30   // largeur estimée : ~30 cm (écran CRT vintage)
export const SCREEN_WORLD_H = 0.22   // hauteur estimée : ~22 cm (ratio 4:3)

// SCALE_FACTOR : converts DOM pixels → Three.js world units (valeur initiale)
// Math : on veut que DOM_W * scale = SCREEN_WORLD_W
// Donc scale = SCREEN_WORLD_W / DOM_W = 0.30 / 640 ≈ 0.000469
// VintagePC recalcule le scale réel depuis la géométrie à la première frame.
export const SCALE_FACTOR = SCREEN_WORLD_W / DOM_W  // ≈ 0.000469

// ── Configuration du modèle GLB ───────────────────────────────────
// Office Assets – Vintage PC desk scene (SeverDoes3D / Sketchfab CC-BY-4.0)
// vintage_pc.glb — scène bureau rétro avec ordinateur style Commodore era
// Mesh écran identifié : Object_16 (material: M_Computer_2048, y=0.91 → CRT surélevé)
// Positions clés en model space (unités = mètres, scale=1) :
//   Bureau (table)    Object_68 : y ≈ 0.006
//   Objets bureau     Object_10-16 : y ≈ 0.743
//   Écran CRT         Object_16 : [0.103, 0.91, 0.502]
//   Pinboard (mur)    z ≈ 2.26
//
// Commodore 64 Computer Full Pack (dark_igorek / Sketchfab CC-BY-4.0)
// vintage_pc.glb — C64 keyboard unit + CRT monitor + périphériques
// Unités natives ≈ 10× les mètres → PC_MODEL_SCALE = 0.1
//
// Positions clés en world space à scale=0.1 :
//   Keyboard  Object_5  center(-0.037, 0.067, 0.341)  top y≈0.115
//   Screen    Object_19 center( 0.000, 0.226,-0.035)  w≈0.306m  mat="monitor_screen"
//   Monitor   Object_17 center( 0.000, 0.187,-0.199)  mat="monitor_black"
//
// Bbox totale à scale=0.1 : x≈0.92m  y≈0.46m  z≈0.57m
export const PC_MODEL_SCALE = 0.1

export const DEBUG_HIGHLIGHT_SCREEN = true   // ← flash vert 3s au démarrage pour vérifier le mesh
