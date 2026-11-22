// scripts/e2e-chrome.mjs — test de bout en bout dans un vrai Chrome (CDP).
//
//   node scripts/e2e-chrome.mjs <url> [--headful] [--shot out.png]
//                               [--expect-1k] [--min-fps N]
//
// Vérifie : START → intro → zoom au survol → fenêtre de l'OS déplacée à la
// souris → fermée via ✕ ; FPS en vue d'ensemble ; aucune requête vers un CDN
// Draco (gstatic) ; avec --expect-1k, qu'un atlas `_1k` est chargé.
// Utiliser --headful pour le rendu GPU réel (le headless est en logiciel).
// Code de sortie 0 = OK, 1 = échec (raison affichée).
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const argv = process.argv.slice(2)
const URL_TO_TEST = argv.find((a) => !a.startsWith('--')) || 'http://localhost:4173/'
const flag = (n) => argv.includes(n)
const opt  = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined }
const HEADFUL   = flag('--headful')
const SHOT      = opt('--shot')
const EXPECT_1K = flag('--expect-1k')
const MIN_FPS   = opt('--min-fps') ? Number(opt('--min-fps')) : null
const OV_SHOT   = opt('--overview-shot')
const BAKED     = flag('--baked')   // exige 0 lumière temps réel et ≤ 1 matériau éclairé
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9333, W = 1400, H = 900

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function run() {
  const profile = mkdtempSync(join(tmpdir(), 'e2e-chrome-'))
  const args = [`--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    `--window-size=${W},${H}`, '--no-first-run', '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required', 'about:blank']
  if (!HEADFUL) args.unshift('--headless=new', '--enable-unsafe-swiftshader')
  const chrome = spawn(CHROME, args, { stdio: 'ignore' })

  let ws, id = 0
  const pending = new Map()
  const requests = []
  const errors = []
  const cleanup = () => {
    try { ws?.close() } catch { /* */ }
    chrome.kill()
    setTimeout(() => { try { rmSync(profile, { recursive: true, force: true }) } catch { /* */ } }, 1500)
  }

  try {
    for (let i = 0; i < 60 && !ws; i++) {
      try {
        const page = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page')
        if (page) {
          ws = new WebSocket(page.webSocketDebuggerUrl)
          await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
        }
      } catch { ws = undefined }
      if (!ws) await sleep(200)
    }
    if (!ws) throw new Error('RETRY: CDP indisponible')
    ws.onclose = () => { for (const [, p] of pending) p.reject(new Error('RETRY: connexion CDP fermée')); pending.clear() }
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data)
      if (m.id && pending.has(m.id)) { pending.get(m.id).resolve(m); pending.delete(m.id) }
      else if (m.method === 'Network.requestWillBeSent') requests.push(m.params.request.url)
      else if (m.method === 'Runtime.exceptionThrown')
        errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)
    }
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const n = ++id; pending.set(n, { resolve, reject }); ws.send(JSON.stringify({ id: n, method, params }))
    })
    const evaluate = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
      return r.result?.exceptionDetails ? undefined : r.result?.result?.value
    }
    const mouse = (type, x, y, extra = {}) => send('Input.dispatchMouseEvent', { type, x, y, button: 'none', ...extra })
    const waitFor = async (expr, label, timeout = 90000) => {
      const t0 = Date.now()
      while (Date.now() - t0 < timeout) { if (await evaluate(expr)) return; await sleep(300) }
      throw new Error('timeout : ' + label)
    }
    const IFR = `document.getElementById('computer-screen')`

    await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable')
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false })
    await send('Page.navigate', { url: URL_TO_TEST })

    await waitFor(`[...document.querySelectorAll('button')].some(b => b.textContent.includes('START'))`, 'bouton START')
    await mouse('mouseMoved', 20, H - 20)
    await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('START')).click()`)
    // FPS pendant l'intro : la scène 3D y est rendue en continu (mode 'boost'),
    // c'est donc là que le coût de rendu se voit. Mesure sur 3 s.
    await sleep(1000)
    const fps = await evaluate(`new Promise(r => { let n = 0; const t0 = performance.now();
      const f = () => { n++; performance.now() - t0 < 3000 ? requestAnimationFrame(f) : r(n / ((performance.now() - t0) / 1000)) };
      requestAnimationFrame(f) })`)
    await waitFor(`document.body.innerText.includes('Survolez le moniteur')`, 'fin de l\'intro')
    if (OV_SHOT) {                       // capture de la vue d'ensemble
      await sleep(500)
      const s = await send('Page.captureScreenshot', { format: 'png' })
      writeFileSync(OV_SHOT, Buffer.from(s.result.data, 'base64'))
    }

    // Coût de rendu (ce qui pèse sur un PC modeste) — exige ?e2e dans l'URL
    // lights = lumières temps réel ; lit = matériaux qui calculent l'éclairage
    // par pixel ; calls/tris = dernière image rendue par R3F.
    const cost = await evaluate(`(() => { const t = window.__three; if (!t) return null;
      let lights = 0; const mats = new Set();
      t.scene.traverse(o => { if (o.isLight) lights++;
        if (o.isMesh && o.visible) [].concat(o.material).forEach(m => mats.add(m)) });
      const lit = [...mats].filter(m => m.isMeshStandardMaterial || m.isMeshPhongMaterial || m.isMeshLambertMaterial).length;
      return { lights, lit, calls: t.gl.info.render.calls, tris: t.gl.info.render.triangles } })()`)

    for (const [x, y] of [[W / 2, H / 2 - 60], [W / 2, H / 2 - 40], [W / 2 + 5, H / 2 - 50]]) { await mouse('mouseMoved', x, y); await sleep(150) }
    await waitFor(`[...document.querySelectorAll('button')].some(b => b.textContent.includes('Retour'))`, 'zoom écran', 30000)
    await waitFor(`${IFR}?.contentDocument?.querySelectorAll('.win95-window').length > 0`, 'fenêtre ouverte', 30000)
    await sleep(800)

    // Calibration page → pixels iframe via les mousemove reçus par l'OS
    await evaluate(`(() => { const d = ${IFR}.contentDocument; window.__mv = null;
      d.addEventListener('mousemove', e => { window.__mv = [e.clientX, e.clientY] }, true) })()`)
    const probe = async (x, y) => { await mouse('mouseMoved', x, y); await sleep(120); return evaluate('window.__mv') }
    const cx = W / 2, cy = H / 2
    const p0 = await probe(cx, cy), px = await probe(cx + 80, cy), py = await probe(cx, cy + 80)
    if (!p0 || !px || !py) throw new Error('la souris n\'atteint pas l\'OS')
    const ax = (px[0] - p0[0]) / 80, ay = (py[1] - p0[1]) / 80
    const toPage = (ix, iy) => [cx + (ix - p0[0]) / ax, cy + (iy - p0[1]) / ay]

    const winInfo = () => evaluate(`[...${IFR}.contentDocument.querySelectorAll('.win95-window')].map(w => {
      const tb = w.querySelector('.win95-titlebar').getBoundingClientRect(), cl = w.querySelector('.win95-ctrl-btn--close').getBoundingClientRect()
      return { tf: w.style.transform, tb: [tb.x, tb.y, tb.height], close: [cl.x + cl.width / 2, cl.y + cl.height / 2], z: +w.style.zIndex } })`)
    const topOf = (l) => l.reduce((a, b) => (a.z > b.z ? a : b))

    const before = topOf(await winInfo())
    const [sx, sy] = toPage(before.tb[0] + 40, before.tb[1] + before.tb[2] / 2)
    await mouse('mouseMoved', sx, sy); await sleep(80)
    await mouse('mousePressed', sx, sy, { button: 'left', buttons: 1, clickCount: 1 }); await sleep(80)
    for (let i = 1; i <= 10; i++) { await mouse('mouseMoved', sx + i * 8, sy + i * 4, { button: 'left', buttons: 1 }); await sleep(30) }
    await mouse('mouseReleased', sx + 80, sy + 40, { button: 'left', buttons: 0, clickCount: 1 }); await sleep(300)
    const moved = topOf(await winInfo())
    if (moved.tf === before.tf) throw new Error('la fenêtre ne s\'est pas déplacée')

    if (SHOT) {
      const s = await send('Page.captureScreenshot', { format: 'png' })
      writeFileSync(SHOT, Buffer.from(s.result.data, 'base64'))
    }

    const n0 = (await winInfo()).length
    const [qx, qy] = toPage(moved.close[0], moved.close[1])
    await mouse('mouseMoved', qx, qy); await sleep(80)
    await mouse('mousePressed', qx, qy, { button: 'left', buttons: 1, clickCount: 1 }); await sleep(60)
    await mouse('mouseReleased', qx, qy, { button: 'left', buttons: 0, clickCount: 1 }); await sleep(400)
    const n1 = (await winInfo()).length
    if (n1 !== n0 - 1) throw new Error(`fermeture : ${n0} → ${n1} fenêtres`)

    const fails = []
    const cdn = requests.filter((u) => u.includes('gstatic.com'))
    if (cdn.length) fails.push('requête CDN : ' + cdn[0])
    if (EXPECT_1K && !requests.some((u) => /_1k\.(webp|jpg|png)/.test(u))) fails.push('aucun atlas _1k chargé')
    if (MIN_FPS != null && fps < MIN_FPS) fails.push(`FPS ${fps.toFixed(1)} < ${MIN_FPS}`)
    if (BAKED) {
      if (!cost) fails.push('métriques indisponibles (ajouter ?e2e à l\'URL)')
      else {
        if (cost.lights > 0) fails.push(`${cost.lights} lumière(s) temps réel (attendu 0)`)
        if (cost.lit > 1)    fails.push(`${cost.lit} matériaux éclairés (attendu ≤ 1 : la lune)`)
      }
    }
    console.log(`E2E fps=${fps.toFixed(1)} cost=${JSON.stringify(cost)} drag=ok close=ok requests=${requests.length} errors=${errors.length}`)
    errors.slice(0, 5).forEach((e) => console.log('  page error:', e.split('\n')[0]))
    return fails
  } finally {
    cleanup()
  }
}

let fails
for (let attempt = 1; attempt <= 2; attempt++) {
  try { fails = await run(); break }
  catch (e) {
    if (attempt === 1 && String(e.message).startsWith('RETRY')) { console.log('réessai :', e.message); await sleep(2000); continue }
    fails = [e.message]; break
  }
}
if (fails.length) { fails.forEach((f) => console.log('E2E FAIL:', f)); process.exit(1) }
console.log('E2E PASS')
process.exit(0)
