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

// La scène 3D est minuscule (écran ≈ 0,29 unité de large) → les matrices CSS
// matrix3d avaient des facteurs d'échelle ≈ 0,0003. Chrome calcule le
// hit-testing souris avec moins de précision que l'affichage : le haut de
// l'iframe n'était plus cliquable (barre de titre des fenêtres !). On rend
// donc la couche CSS avec une scène ET une caméra agrandies ×1000 : image
// strictement identique (perspective invariante), matrices « normales »
// comme sur le site de Henry Heffernan.
const CSS_WORLD_SCALE = 1000
const _cssCam = new THREE.PerspectiveCamera()

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
  const { gl, camera, scene, invalidate } = useThree()
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
    // Plus de classe `jitter` : l'animation infinie (< 0.25 px, invisible une
    // fois l'écran mis à l'échelle) forçait le navigateur à recomposer en
    // continu l'iframe 1280×906 transformée en 3D — coûteux sur petit GPU.
    iframe.title               = 'Portfolio OS'

    // Forwarding clavier (postMessage iframe → parent) : permet à Échap de
    // quitter l'écran même quand le focus clavier est dans l'OS.
    iframe.onload = () => {
      const handler = (event) => {
        if (event.source !== iframe.contentWindow) return
        const type = event.data?.type
        if (type !== 'keydown' && type !== 'keyup') return
        const customEvt = new CustomEvent(type, { bubbles: true, cancelable: false })
        customEvt.inComputer = true
        customEvt.key = event.data.key
        iframe.dispatchEvent(customEvt)
      }
      if (msgHandler.current) window.removeEventListener('message', msgHandler.current)
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
    obj.scale.setScalar(CSS3D_SCALE * CSS3D_SCALE_BOOST * CSS_WORLD_SCALE)
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
      invalidate()   // rendu en pause (mode écran) → redessiner une image
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [gl, invalidate])

  // ── Interaction : la VRAIE souris va directement dans l'iframe ───
  // Technique Henry Heffernan : en mode écran, le canvas WebGL passe en
  // pointer-events:none → la souris traverse le canvas et atteint l'iframe
  // (placée dessous par CSS3DRenderer). Le navigateur gère lui-même la
  // projection 3D : clics, glisser, survol, clic droit, molette et clavier
  // marchent nativement, sans aucun événement simulé.
  // Hors mode écran : l'inverse, le canvas reçoit la souris (survol, caméra).
  useEffect(() => {
    const iframe = iframeRef.current
    const canvas = gl.domElement
    if (!iframe) return

    if (!isFocused) {
      iframe.style.pointerEvents = 'none'
      canvas.style.pointerEvents = 'auto'
      return
    }

    iframe.style.pointerEvents = 'auto'
    canvas.style.pointerEvents = 'none'
    // Les DIV d'enveloppe du <Canvas> R3F aussi : vers le haut de l'écran
    // (moniteur incliné), Chrome considère ces DIV « devant » l'iframe et
    // leur donnait le clic → barre de titre inutilisable. L'élément CSS3D de
    // l'iframe garde pointer-events:auto (posé par three.js) et reste cliquable.
    const wrappers = [canvas.parentElement, canvas.parentElement?.parentElement].filter(Boolean)
    const prevPE   = wrappers.map((w) => w.style.pointerEvents)
    wrappers.forEach((w) => { w.style.pointerEvents = 'none' })

    // Dézoom si la souris s'éloigne franchement de l'écran. Tant que le
    // curseur est sur l'iframe, la page parente ne reçoit aucun mousemove ;
    // on ne réagit donc qu'aux mouvements hors de l'écran (+ marge).
    const MARGIN = 80
    let missFrames = 0
    const onMove = (e) => {
      if (!onScreenLeave) return
      const r = iframe.getBoundingClientRect()
      const out = e.clientX < r.left - MARGIN || e.clientX > r.right  + MARGIN
               || e.clientY < r.top  - MARGIN || e.clientY > r.bottom + MARGIN
      if (!out) { missFrames = 0; return }
      if (++missFrames > 6) onScreenLeave()
    }
    window.addEventListener('mousemove', onMove)

    return () => {
      window.removeEventListener('mousemove', onMove)
      wrappers.forEach((w, i) => { w.style.pointerEvents = prevPE[i] })
      iframe.style.pointerEvents = 'none'
      canvas.style.pointerEvents = 'auto'
      // Rend le clavier à la page parente (Échap, etc.)
      if (document.activeElement === iframe) iframe.blur()
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
    cssObject.current.position.copy(_pos).addScaledVector(_normal, CSS3D_PUSH_BACK)
      .multiplyScalar(CSS_WORLD_SCALE)
    cssObject.current.quaternion.copy(_quat)

    // Masque profondeur : calqué sur la worldMatrix exacte du mesh-écran
    if (glassMask.current) {
      glassMask.current.matrix.copy(screenMesh.matrixWorld)
      glassMask.current.matrixWorldNeedsUpdate = true
    }

    // Occulteur arrondi : légèrement vers la caméra (perce le canvas alpha)
    if (occluder.current) {
      occluder.current.position.copy(_pos).addScaledVector(_normal, OCC_FRONT_Z)
      occluder.current.quaternion.copy(_quat)
    }

    // Caméra CSS = caméra 3D dont la position est multipliée par
    // CSS_WORLD_SCALE (même image, cf. constante en haut du fichier).
    _cssCam.copy(camera)
    _cssCam.position.multiplyScalar(CSS_WORLD_SCALE)
    _cssCam.updateMatrixWorld()
    cssRenderer.current.render(cssScene.current, _cssCam)
  })

  return null
}
