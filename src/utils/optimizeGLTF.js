// src/utils/optimizeGLTF.js
//
// Allège les matériaux/textures d'une scène GLTF déjà chargée.
// Idempotent : peut être appelé plusieurs fois sur la même scène.

const TEXTURE_KEYS = [
  'map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap',
  'aoMap', 'alphaMap', 'bumpMap', 'lightMap',
  'clearcoatMap', 'clearcoatNormalMap', 'clearcoatRoughnessMap',
  'transmissionMap', 'thicknessMap',
]

// GLTFLoader peut partager une même image entre plusieurs textures :
// on ne la réduit qu'une fois.
const _scaled = new WeakMap()

// Redimensionne une texture trop grande via un <canvas>.
// 2048² → 1024² = 4× moins de mémoire GPU (≈ 21 Mo → 5 Mo par texture).
function downscaleTexture(tex, maxSize) {
  if (!tex || tex.userData.__downscaled) return
  const img = tex.image
  if (!img || !img.width || !img.height) return
  if (img.width <= maxSize && img.height <= maxSize) return

  let canvas = _scaled.get(img)
  if (!canvas) {
    const ratio = maxSize / Math.max(img.width, img.height)
    canvas = document.createElement('canvas')
    canvas.width  = Math.max(1, Math.round(img.width  * ratio))
    canvas.height = Math.max(1, Math.round(img.height * ratio))
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    _scaled.set(img, canvas)
  }

  tex.image = canvas
  tex.userData.__downscaled = true
  tex.needsUpdate = true
}

/**
 * @param {THREE.Object3D} root
 * @param {object}  opts
 * @param {number}  [opts.maxTextureSize]  — si défini, réduit les textures plus grandes
 * @param {boolean} [opts.dropClearcoat]   — supprime la couche clearcoat (shader plus léger)
 */
export function optimizeGLTF(root, { maxTextureSize, dropClearcoat = false } = {}) {
  root.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]

    mats.forEach((mat) => {
      if (mat.userData.__optimized) return
      mat.userData.__optimized = true

      // KHR_materials_transmission : Three.js doit rendre TOUTE la scène une
      // seconde fois dans une texture à chaque image pour simuler la
      // réfraction. Pour une vitre de fenêtre au fond de la pièce, une simple
      // transparence donne visuellement la même chose pour une fraction du coût.
      if (mat.transmission > 0) {
        mat.transmission = 0
        mat.transparent  = true
        mat.opacity      = Math.min(mat.opacity ?? 1, 0.25)
        mat.depthWrite   = false
        mat.needsUpdate  = true
      }

      if (dropClearcoat && mat.clearcoat > 0) {
        mat.clearcoat   = 0
        mat.needsUpdate = true
      }

      if (maxTextureSize) {
        TEXTURE_KEYS.forEach((key) => downscaleTexture(mat[key], maxTextureSize))
      }
    })
  })
}
