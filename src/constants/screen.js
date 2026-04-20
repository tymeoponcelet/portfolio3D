// Ces constantes DOIVENT être importées par VintagePC.jsx.
// Ne jamais les dupliquer — c'est ce qui aligne l'OS sur l'écran 3D.

// Dimensions exactes du mesh Object_19 (monitor_screen) mesurées dans Blender :
//   Blender X = 3.06 m  →  Three.js X = largeur world à scale=1
//   Blender Z = 2.21 m  →  Three.js Y = hauteur world à scale=1
//   Blender Y = 0.298 m →  Three.js Z = profondeur (non utilisée pour le HTML)
export const SCREEN_WORLD_W = 3.06 * 0.1   // 0.306 m en world space (scale=0.1)
export const SCREEN_WORLD_H = 2.21 * 0.1   // 0.221 m en world space (scale=0.1)

// Résolution DOM de l'OS — calée sur le ratio exact du mesh 3D
export const DOM_W = 640
export const DOM_H = Math.round(DOM_W * SCREEN_WORLD_H / SCREEN_WORLD_W)  // 462

export const PC_MODEL_SCALE = 0.1

export const DEBUG_HIGHLIGHT_SCREEN = false
