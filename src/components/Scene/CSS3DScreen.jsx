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

// Temporaires pour le forwarding d'événements (raycast → iframe)
const _hitPos   = new THREE.Vector3()
const _hitQuat  = new THREE.Quaternion()
const _right    = new THREE.Vector3()
const _upVec    = new THREE.Vector3()
const _delta    = new THREE.Vector3()

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
      invalidate()   // rendu en pause (mode écran) → redessiner une image
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [gl, invalidate])

  // ── Interaction : forwarding d'événements parent → iframe ─────────
  // Chrome/Safari ne délivrent PAS les événements souris à une iframe
  // placée sous une transformation CSS matrix3d (le rendu CSS3D). Seul
  // Firefox le fait → d'où « tout ne marche que sur Firefox ».
  // Solution : le canvas reçoit le pointeur réel, on intersecte le rayon
  // caméra avec le plan de l'iframe, on convertit le point en coordonnées
  // pixel de l'iframe, et on redispatche des événements synthétiques DANS
  // l'iframe (+ capture du pointeur, focus clavier, survol, clic droit).
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    // Le canvas reçoit toujours le pointeur ; l'iframe jamais en direct.
    iframe.style.pointerEvents = 'none'
    gl.domElement.style.pointerEvents = 'auto'
    if (cssRenderer.current)
      cssRenderer.current.domElement.style.pointerEvents = 'none'

    if (!isFocused || !screenMesh) return

    const canvas    = gl.domElement
    const raycaster = new THREE.Raycaster()
    const ndc       = new THREE.Vector2()
    const S         = CSS3D_SCALE * CSS3D_SCALE_BOOST
    // Zone cliquable = TOUTE l'iframe : l'OS est entièrement visible à l'écran
    // (barre de titre en haut, barre des tâches en bas). L'ancienne zone
    // réduite (vitre / marge de 10 %) excluait la barre de titre d'une fenêtre
    // collée en haut → impossible de la déplacer, réduire ou fermer.
    const HALF_VIS_W = SCREEN_DOM_W / 2
    const HALF_VIS_H = SCREEN_DOM_H / 2

    // Le moniteur est statique : on calcule une fois le plan de l'iframe
    // (même position/orientation que celles données au CSS3DObject).
    screenMesh.updateWorldMatrix(true, false)
    screenMesh.getWorldPosition(_hitPos)
    screenMesh.getWorldQuaternion(_hitQuat)
    _right.set(1, 0, 0).applyQuaternion(_hitQuat)
    _upVec.set(0, 1, 0).applyQuaternion(_hitQuat)
    const planeNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(_hitQuat)
    const planeOrigin = _hitPos.clone().addScaledVector(planeNormal, CSS3D_PUSH_BACK)
    const plane       = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, planeOrigin)
    const hit         = new THREE.Vector3()

    // Point écran (client px) → pixel dans le DOM de l'iframe.
    // Intersection rayon/plan analytique au lieu d'un raycast sur le mesh
    // (des milliers de triangles, 2 à 3 fois par mouvement de souris), et
    // sur le plan EXACT où l'iframe est affichée → visée plus précise.
    const toIframePx = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect()
      ndc.x =  ((clientX - rect.left) / rect.width)  * 2 - 1
      ndc.y = -((clientY - rect.top)  / rect.height) * 2 + 1
      raycaster.setFromCamera(ndc, camera)
      if (!raycaster.ray.intersectPlane(plane, hit)) return null
      _delta.copy(hit).sub(planeOrigin)
      const dx = _delta.dot(_right) / S
      const dy = _delta.dot(_upVec) / S
      return {
        px: SCREEN_DOM_W / 2 + dx,
        py: SCREEN_DOM_H / 2 - dy,
        inside: Math.abs(dx) <= HALF_VIS_W && Math.abs(dy) <= HALF_VIS_H,
      }
    }

    // Redispatche dans l'iframe, sur l'élément sous (px, py), une paire
    // d'événements pointer* + mouse* (un seul elementFromPoint par paire).
    let hoverTarget = null
    const dispatch = (types, px, py, button, buttons, target) => {
      const doc = iframe.contentDocument
      const win = iframe.contentWindow
      if (!doc || !win) return null
      const t = target || doc.elementFromPoint(px, py) || doc.body
      const base = {
        bubbles: true, cancelable: true, composed: true,
        clientX: px, clientY: py, screenX: px, screenY: py,
        view: win, button, buttons, detail: 1,
      }
      for (const type of types) {
        const isPointer = type.startsWith('pointer')
        const Ctor = isPointer ? (win.PointerEvent || win.MouseEvent) : win.MouseEvent
        const init = isPointer
          ? { ...base, pointerId: 1, pointerType: 'mouse', isPrimary: true }
          : base
        t.dispatchEvent(new Ctor(type, init))
      }
      return t
    }

    // Survol : mouseover/mouseout → onMouseEnter/onMouseLeave React marchent.
    const updateHover = (t, px, py) => {
      if (t === hoverTarget) return
      const prev = hoverTarget
      hoverTarget = t
      const win = iframe.contentWindow
      if (!win) return
      const init = { bubbles: true, cancelable: true, composed: true,
        clientX: px, clientY: py, view: win }
      if (prev?.isConnected) {
        prev.dispatchEvent(new (win.PointerEvent || win.MouseEvent)('pointerout', { ...init, relatedTarget: t, pointerId: 1, pointerType: 'mouse', isPrimary: true }))
        prev.dispatchEvent(new win.MouseEvent('mouseout', { ...init, relatedTarget: t }))
      }
      if (t) {
        t.dispatchEvent(new (win.PointerEvent || win.MouseEvent)('pointerover', { ...init, relatedTarget: prev, pointerId: 1, pointerType: 'mouse', isPrimary: true }))
        t.dispatchEvent(new win.MouseEvent('mouseover', { ...init, relatedTarget: prev }))
      }
    }

    // Les événements synthétiques ne donnent pas le focus : on le fait à la
    // main, sinon impossible de taper dans un champ de l'OS (contact, bloc-notes…)
    // et les raccourcis clavier de l'OS ne reçoivent rien.
    const FOCUSABLE = 'input, textarea, select, button, a[href], [contenteditable=""], [contenteditable="true"], [tabindex]'
    const focusTarget = (t) => {
      const doc = iframe.contentDocument
      const win = iframe.contentWindow
      if (!doc || !win || !t) return
      const f = t.closest?.(FOCUSABLE)
      if (f && typeof f.focus === 'function') {
        f.focus({ preventScroll: true })
      } else {
        if (doc.activeElement && doc.activeElement !== doc.body) doc.activeElement.blur()
        win.focus()
      }
    }

    let downButton      = -1     // -1 = aucun bouton enfoncé via l'écran
    let last            = null   // dernière position valide (px iframe)
    let lastClickTime   = 0
    let lastClickTarget = null
    let missFrames      = 0

    const buttonsFor = (b) => (b === 2 ? 2 : b === 1 ? 4 : 1)

    const onDown = (e) => {
      if (downButton !== -1) return
      const p = toIframePx(e.clientX, e.clientY)
      if (!p || !p.inside) return
      // Empêche sélection de texte / drag natif dans la page parente : sur
      // certains navigateurs (Safari, Chrome avec une sélection active), un
      // drag natif démarrait et coupait le flux de pointermove → la fenêtre
      // de l'OS ne bougeait plus.
      e.preventDefault()
      // Capture : on reçoit move/up même si le curseur sort du canvas ou
      // de la fenêtre du navigateur pendant le glisser.
      try { canvas.setPointerCapture(e.pointerId) } catch { /* ignore */ }

      downButton = e.button
      last = p
      const t = dispatch(['pointerdown', 'mousedown'], p.px, p.py, e.button, buttonsFor(e.button))
      focusTarget(t)
    }

    const onMove = (e) => {
      const p = toIframePx(e.clientX, e.clientY)
      const dragging = downButton !== -1

      // Dézoom si la souris s'éloigne franchement de l'écran
      if (!p || !p.inside) {
        if (!dragging && onScreenLeave && ++missFrames > 6) { onScreenLeave(); return }
        if (!dragging || !p) return
      } else {
        missFrames = 0
      }

      // Pendant un glisser, on continue d'envoyer les mouvements même hors de
      // la zone visible : la fenêtre suit le curseur jusqu'au bord.
      last = p
      const t = dispatch(['pointermove', 'mousemove'], p.px, p.py,
        dragging ? downButton : 0, dragging ? buttonsFor(downButton) : 0)
      if (!dragging) updateHover(t, p.px, p.py)
    }

    const release = (e, cancelled) => {
      if (downButton === -1) return
      const button = downButton
      downButton = -1
      try { canvas.releasePointerCapture(e.pointerId) } catch { /* ignore */ }

      const p  = cancelled ? null : toIframePx(e.clientX, e.clientY)
      // Relâché hors de l'écran : on envoie quand même pointerup/mouseup à la
      // dernière position connue — sinon le drag de fenêtre restait « collé ».
      const pt = p ?? last
      if (!pt) return
      const t = dispatch(['pointerup', 'mouseup'], pt.px, pt.py, button, 0)

      if (cancelled || button !== 0 || !p || !p.inside) return
      dispatch(['click'], pt.px, pt.py, 0, 0, t)
      const now = performance.now()
      if (now - lastClickTime < 400 && t === lastClickTarget) {
        dispatch(['dblclick'], pt.px, pt.py, 0, 0, t)
        lastClickTime = 0; lastClickTarget = null
      } else {
        lastClickTime = now; lastClickTarget = t
      }
    }
    const onUp     = (e) => release(e, false)
    const onCancel = (e) => release(e, true)

    // Clic droit → menus contextuels de l'OS (et pas celui du navigateur).
    const onContextMenu = (e) => {
      const p = toIframePx(e.clientX, e.clientY)
      if (!p || !p.inside) return
      e.preventDefault()
      dispatch(['contextmenu'], p.px, p.py, 2, 2)
    }

    canvas.addEventListener('pointerdown',  onDown)
    canvas.addEventListener('contextmenu',  onContextMenu)
    window.addEventListener('pointermove',  onMove)
    window.addEventListener('pointerup',    onUp)
    window.addEventListener('pointercancel', onCancel)

    return () => {
      canvas.removeEventListener('pointerdown',  onDown)
      canvas.removeEventListener('contextmenu',  onContextMenu)
      window.removeEventListener('pointermove',  onMove)
      window.removeEventListener('pointerup',    onUp)
      window.removeEventListener('pointercancel', onCancel)
      // Un glisser en cours ne doit pas rester bloqué dans l'OS
      if (downButton !== -1 && last) dispatch(['pointerup', 'mouseup'], last.px, last.py, downButton, 0)
      updateHover(null, 0, 0)
      // Rend le clavier à la page parente (Échap, etc.)
      if (document.activeElement === iframe) iframe.blur()
    }
  }, [isFocused, screenMesh, gl, camera, onScreenLeave])

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

    cssRenderer.current.render(cssScene.current, camera)
  })

  return null
}
