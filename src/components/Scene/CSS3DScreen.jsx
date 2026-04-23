// CSS3DScreen — technique Henry Heffernan (reproduction complète) :
//
//   COUCHE 1 — CSS3DRenderer (derrière le canvas WebGL)
//     → iframe /os.html dans un CSS3DObject synchronisé chaque frame
//
//   COUCHE 2 — Masque en profondeur (colorWrite=false)  ← technique Henry
//     → mesh calqué sur la géométrie réelle de l'écran (Object_19)
//     → renderOrder=998 : écrit les valeurs Z AVANT l'occulteur
//     → si la vitre est bombée, ses bords sont plus proches de la caméra
//       → l'occulteur échoue au depth test là → canvas reste opaque → CSS3D masqué
//
//   COUCHE 3 — Occulteur (NoBlending, opacity=0, coins arrondis)
//     → renderOrder=999 : perce un trou ARRONDI dans le canvas alpha=true
//     → révèle la CSS3D exactement sous la face du tube CRT

import { useEffect, useRef }    from 'react'
import { useThree, useFrame }   from '@react-three/fiber'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import * as THREE               from 'three'

// ── Dimensions ────────────────────────────────────────────────────
const MESH_W   = 3.06   // Blender units (largeur face écran Object_19)
const MESH_H   = 2.24   // Blender units (hauteur face écran Object_19)
const PC_SCALE = 0.1    // scale de la <primitive>

const WORLD_W = MESH_W * PC_SCALE   // 0.288
const WORLD_H = MESH_H * PC_SCALE   // 0.204

export const SCREEN_DOM_W = 1280
export const SCREEN_DOM_H = Math.round(SCREEN_DOM_W * MESH_H / MESH_W)  // ≈ 906

const CSS3D_SCALE = WORLD_W / SCREEN_DOM_W

// CSS3DObject : reculé dans le modèle pour que le cadre plastique masque les bords
const CSS3D_PUSH_BACK = -0.015          // vers l'intérieur du modèle (négatif)
const CSS3D_SCALE_BOOST = 1.10          // 10 % plus grand → déborde sous le cadre

// Occulteur : légèrement vers la caméra (perce le canvas sans z-fighting)
const OCC_FRONT_Z = 0.004

// Rayon des coins arrondis (≈ 5% de la largeur → réaliste pour un vieux CRT)
const CORNER_R  = WORLD_W * 0.055

// ── Temporaires pré-alloués ───────────────────────────────────────
const _pos    = new THREE.Vector3()
const _quat   = new THREE.Quaternion()
const _normal = new THREE.Vector3()

// ── Géométrie occulteur avec coins arrondis ───────────────────────
// ShapeGeometry avec quadratic bezier aux 4 coins → épouse le bezel CRT
function createRoundedRectGeometry(w, h, r) {
  const shape = new THREE.Shape()
  const hw = w / 2, hh = h / 2
  shape.moveTo(-hw + r,  -hh)
  shape.lineTo( hw - r,  -hh)
  shape.quadraticCurveTo( hw, -hh,  hw, -hh + r)
  shape.lineTo( hw,  hh - r)
  shape.quadraticCurveTo( hw,  hh,  hw - r,  hh)
  shape.lineTo(-hw + r,  hh)
  shape.quadraticCurveTo(-hw,  hh, -hw,  hh - r)
  shape.lineTo(-hw, -hh + r)
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh)
  return new THREE.ShapeGeometry(shape, 6)
}

// ── Composant ─────────────────────────────────────────────────────
export function CSS3DScreen({ screenMesh, isFocused, onScreenLeave }) {
  const { gl, camera, scene } = useThree()
  const cssRenderer  = useRef(null)
  const cssScene     = useRef(new THREE.Scene())
  const cssObject    = useRef(null)
  const iframeRef    = useRef(null)
  const occluder     = useRef(null)
  const glassMask    = useRef(null)   // colorWrite=false — masque par profondeur
  const msgHandler   = useRef(null)
  // ── Setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!screenMesh) return

    // ── 1. CSS3DRenderer ─────────────────────────────────────────────
    const renderer = new CSS3DRenderer()
    renderer.setSize(gl.domElement.offsetWidth, gl.domElement.offsetHeight)
    Object.assign(renderer.domElement.style, {
      position:      'absolute',
      top:           '0',
      left:          '0',
      width:         '100%',
      height:        '100%',
      pointerEvents: 'none',
    })
    gl.domElement.parentElement.insertBefore(renderer.domElement, gl.domElement)
    cssRenderer.current = renderer

    // ── 2. Conteneur + iframe (technique Henry) ───────────────────────
    const container = document.createElement('div')
    Object.assign(container.style, {
      width:      SCREEN_DOM_W + 'px',
      height:     SCREEN_DOM_H + 'px',
      overflow:   'hidden',
      background: '#000',
    })

    const iframe = document.createElement('iframe')
    iframe.src                 = `${import.meta.env.BASE_URL}os.html`
    iframe.style.width         = '100%'
    iframe.style.height        = '100%'
    iframe.style.border        = 'none'
    iframe.style.pointerEvents = 'none'
    iframe.id                  = 'computer-screen'
    iframe.className           = 'jitter'   // micro-jitter CRT (Henry)
    iframe.title               = 'Portfolio OS'

    // Forwarding événements souris/clavier (postMessage → parent)
    iframe.onload = () => {
      const handler = (event) => {
        if (!event.data?.type) return
        const type     = event.data.type
        const customEvt = new CustomEvent(type, { bubbles: true, cancelable: false })
        customEvt.inComputer = true
        if (type === 'mousemove') {
          const r = iframe.getBoundingClientRect()
          customEvt.clientX = Math.round(event.data.clientX * (r.width  / SCREEN_DOM_W) + r.left)
          customEvt.clientY = Math.round(event.data.clientY * (r.height / SCREEN_DOM_H) + r.top)
        } else if (type === 'keydown' || type === 'keyup') {
          customEvt.key = event.data.key
        }
        iframe.dispatchEvent(customEvt)
      }
      msgHandler.current = handler
      window.addEventListener('message', handler)
    }

    iframeRef.current = iframe
    container.appendChild(iframe)

    // ── Overlays vitre CRT (par-dessus l'iframe, pointer-events: none) ──

    // Reflet : dégradé blanc diagonale haut-gauche → transparent, 8% opacité
    const glassReflect = document.createElement('div')
    Object.assign(glassReflect.style, {
      position:      'absolute',
      inset:         '0',
      pointerEvents: 'none',
      zIndex:        '10',
      background:    'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, transparent 65%)',
    })
    container.appendChild(glassReflect)

    // Assombrissement bords très léger
    const glassVignette = document.createElement('div')
    Object.assign(glassVignette.style, {
      position:      'absolute',
      inset:         '0',
      pointerEvents: 'none',
      zIndex:        '11',
      boxShadow:     'inset 0 0 30px 6px rgba(0,0,0,0.15)',
    })
    container.appendChild(glassVignette)

    // Scanlines : lignes horizontales très fines, 2% opacité
    const glassScanlines = document.createElement('div')
    Object.assign(glassScanlines.style, {
      position:       'absolute',
      inset:          '0',
      pointerEvents:  'none',
      zIndex:         '12',
      backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.02) 3px, rgba(0,0,0,0.02) 4px)',
      backgroundSize: '100% 4px',
    })
    container.appendChild(glassScanlines)

    // ── 3. CSS3DObject ────────────────────────────────────────────────
    const obj = new CSS3DObject(container)
    // 10 % plus grand : le HTML déborde sous le cadre plastique du Commodore
    obj.scale.setScalar(CSS3D_SCALE * CSS3D_SCALE_BOOST)
    cssScene.current.add(obj)
    cssObject.current = obj

    // ── 4. Masque profondeur — colorWrite=false (technique Henry) ─────
    // Utilise la géométrie RÉELLE de l'écran (Object_19).
    // Si la vitre est bombée (convexe), ses bords ont une profondeur plus
    // proche de la caméra → l'occulteur échoue au depth test là → CSS3D masqué.
    // renderOrder=998 : doit écrire les Z AVANT l'occulteur (999).
    const glassMat = new THREE.MeshBasicMaterial({
      colorWrite:  false,   // n'écrit PAS de couleur → mesh invisible
      depthWrite:  true,    // écrit BIEN dans le depth buffer → c'est le but
      depthTest:   true,
      side:        THREE.DoubleSide,
    })
    const glassMesh = new THREE.Mesh(screenMesh.geometry, glassMat)
    glassMesh.renderOrder      = 998
    glassMesh.matrixAutoUpdate = false  // on gère la matrix manuellement (useFrame)
    scene.add(glassMesh)
    glassMask.current = glassMesh

    // ── 5. Occulteur arrondi — perce le canvas alpha=true ─────────────
    // NoBlending + opacity=0 → écrit alpha=0 (transparent) là où le depth test passe.
    // ShapeGeometry avec coins arrondis → imite le bezel CRT arrondi.
    // renderOrder=999 : après le glassMask → le depth test reflète la géométrie réelle.
    const occGeo = createRoundedRectGeometry(WORLD_W, WORLD_H, CORNER_R)
    const occMat = new THREE.MeshBasicMaterial({
      opacity:     0,
      transparent: true,
      blending:    THREE.NoBlending,
      depthWrite:  true,
      side:        THREE.DoubleSide,
    })
    const occ = new THREE.Mesh(occGeo, occMat)
    occ.renderOrder = 999
    scene.add(occ)
    occluder.current = occ

    return () => {
      renderer.domElement.remove()
      if (msgHandler.current) window.removeEventListener('message', msgHandler.current)
      cssScene.current.remove(obj)
      scene.remove(glassMesh)
      scene.remove(occ)
      glassMat.dispose()
      occGeo.dispose()
      occMat.dispose()
    }
  }, [screenMesh, gl, scene])

  // ── Redimensionnement ─────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      if (cssRenderer.current)
        cssRenderer.current.setSize(gl.domElement.offsetWidth, gl.domElement.offsetHeight)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [gl])

  // ── Pointer events selon isFocused ────────────────────────────────
  useEffect(() => {
    if (!iframeRef.current) return
    iframeRef.current.style.pointerEvents             = isFocused ? 'auto' : 'none'
    gl.domElement.style.pointerEvents                 = isFocused ? 'none' : 'auto'
    if (cssRenderer.current)
      cssRenderer.current.domElement.style.pointerEvents = isFocused ? 'auto' : 'none'

    // Quand focused : dézoom si la souris s'éloigne suffisamment de l'iframe
    const LEAVE_MARGIN = 220   // px autour de l'iframe avant de déclencher le dezoom
    const iframe = iframeRef.current
    if (isFocused && onScreenLeave && iframe) {
      const handleMove = (e) => {
        const r = iframe.getBoundingClientRect()
        if (
          e.clientX < r.left   - LEAVE_MARGIN ||
          e.clientX > r.right  + LEAVE_MARGIN ||
          e.clientY < r.top    - LEAVE_MARGIN ||
          e.clientY > r.bottom + LEAVE_MARGIN
        ) onScreenLeave()
      }
      window.addEventListener('mousemove', handleMove)
      return () => window.removeEventListener('mousemove', handleMove)
    }
  }, [isFocused, gl, onScreenLeave])

  // ── Sync chaque frame ─────────────────────────────────────────────
  useFrame(() => {
    if (!cssObject.current || !screenMesh || !cssRenderer.current) return

    // Position/rotation du mesh-écran (world space)
    screenMesh.updateWorldMatrix(true, false)
    screenMesh.getWorldPosition(_pos)
    screenMesh.getWorldQuaternion(_quat)

    _normal.set(0, 0, 1).applyQuaternion(_quat)

    // CSS3DObject : reculé dans le modèle → le cadre plastique masque les bords HTML
    const cssPos = _pos.clone().addScaledVector(_normal, CSS3D_PUSH_BACK)
    cssObject.current.position.copy(cssPos)
    cssObject.current.quaternion.copy(_quat)

    // Masque profondeur : calqué sur la worldMatrix exacte du mesh-écran
    if (glassMask.current) {
      glassMask.current.matrix.copy(screenMesh.matrixWorld)
      glassMask.current.matrixWorldNeedsUpdate = true
    }

    // Occulteur arrondi : légèrement vers la caméra (perce le canvas alpha)
    if (occluder.current) {
      occluder.current.position.copy(_pos.clone().addScaledVector(_normal, OCC_FRONT_Z))
      occluder.current.quaternion.copy(_quat)
    }

    cssRenderer.current.render(cssScene.current, camera)
  })

  return null
}
