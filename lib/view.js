import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { actionArrowDeg, findActionsFile, loadActions } from './actions.js'
import { absDiffHeatmap, paintCompareSheet } from './compare.js'
import { discover } from './discover.js'
import { rolloutDiff } from './diff.js'
import { decodeImage, resolveFrames } from './frames.js'
import { nearestScale, pickIndices } from './inspect.js'
import { encodePng } from './png.js'

function dataUriPng(rgb, width, height) {
  return `data:image/png;base64,${encodePng(rgb, width, height).toString('base64')}`
}

function downscale(decoded, maxW = 320) {
  if (decoded.width <= maxW) return decoded
  const th = Math.max(1, Math.round((decoded.height * maxW) / decoded.width))
  return {
    rgb: nearestScale(decoded.rgb, decoded.width, decoded.height, maxW, th),
    width: maxW,
    height: th,
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderHtml(payload) {
  const json = JSON.stringify(payload).replace(/</g, '\\u003c')
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(payload.name)} — DSH-WM view</title>
<style>
  :root {
    --bg: #12141a;
    --panel: #1b1f28;
    --ink: #e8e6e1;
    --muted: #8b9088;
    --pred: #e88c30;
    --gt: #30b4a8;
    --diff: #dc4840;
    --line: #2a3140;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; font: 14px/1.45 ui-sans-serif, system-ui, sans-serif;
    background: var(--bg); color: var(--ink);
  }
  header {
    padding: 16px 20px 12px; border-bottom: 1px solid var(--line);
    display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: baseline;
  }
  header h1 { margin: 0; font-size: 18px; font-weight: 650; }
  header .meta { color: var(--muted); }
  header .diag { color: var(--pred); }
  .wrap { max-width: 1100px; margin: 0 auto; padding: 16px 20px 40px; }
  .modes { display: flex; gap: 8px; margin: 0 0 12px; }
  .modes button, .nav button {
    background: var(--panel); color: var(--ink); border: 1px solid var(--line);
    border-radius: 8px; padding: 6px 12px; cursor: pointer;
  }
  .modes button.on, .nav button:hover { border-color: var(--gt); }
  .stage {
    background: var(--panel); border: 1px solid var(--line); border-radius: 12px;
    padding: 12px; position: relative;
  }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .pair figure, .swipe figure, .heat figure { margin: 0; }
  figcaption {
    font-size: 12px; color: var(--muted); margin-bottom: 6px;
    display: flex; justify-content: space-between;
  }
  figcaption .tag-pred { color: var(--pred); }
  figcaption .tag-gt { color: var(--gt); }
  figcaption .tag-diff { color: var(--diff); }
  .stage img { width: 100%; height: auto; image-rendering: pixelated; border-radius: 6px; display: block; background: #0c0e12; }
  .swipe .box { position: relative; }
  .swipe .over {
    position: absolute; left: 0; top: 0; bottom: 0; overflow: hidden; width: 50%;
  }
  .swipe .over img { height: 100%; width: auto; max-width: none; display: block; }
  .swipe input[type=range] {
    width: 100%; margin-top: 10px; accent-color: var(--gt);
  }
  .hud {
    margin-top: 12px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
    color: var(--muted);
  }
  .arrow {
    width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--line);
    display: grid; place-items: center; background: #141820;
  }
  .arrow span { display: block; width: 0; height: 0;
    border-left: 7px solid transparent; border-right: 7px solid transparent;
    border-bottom: 14px solid var(--gt); transform-origin: 50% 70%;
  }
  .chip {
    border-radius: 999px; padding: 2px 10px; border: 1px solid var(--line);
    font-size: 12px;
  }
  .chip.ok { color: var(--gt); border-color: #2a5c56; }
  .chip.miss { color: var(--diff); border-color: #6a3030; }
  .nav { display: flex; gap: 8px; align-items: center; margin: 14px 0; }
  .curve {
    display: flex; align-items: flex-end; gap: 3px; height: 56px; margin: 8px 0 4px;
  }
  .curve button {
    flex: 1; min-width: 0; height: var(--h, 20%); padding: 0; border: 0;
    background: #3a4254; cursor: pointer; border-radius: 2px 2px 0 0;
  }
  .curve button.worst { background: var(--diff); }
  .curve button.on { outline: 2px solid var(--gt); }
  .thumbs { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px; }
  .thumbs button {
    flex: 0 0 auto; padding: 0; border: 2px solid transparent; background: none;
    cursor: pointer; border-radius: 6px;
  }
  .thumbs button.on { border-color: var(--gt); }
  .thumbs img { width: 72px; height: auto; image-rendering: pixelated; display: block; border-radius: 4px; }
  .help { color: var(--muted); font-size: 12px; margin-top: 16px; }
  .hidden { display: none !important; }
</style>
</head>
<body>
<header>
  <h1>${escapeHtml(payload.name)}</h1>
  <div class="meta">n=${payload.n} · mean SSIM ${payload.mean_ssim ?? '—'} · min ${payload.min_ssim ?? '—'}${payload.action_acc != null ? ` · action_acc ${payload.action_acc}` : ''}</div>
  <div class="diag">${escapeHtml(payload.diagnosis || '')}</div>
</header>
<div class="wrap">
  <div class="modes">
    <button data-mode="side" class="on">Side by side</button>
    <button data-mode="swipe">Swipe</button>
    <button data-mode="diff">Diff heat</button>
  </div>
  <div class="stage">
    <div id="side" class="pair"></div>
    <div id="swipe" class="swipe hidden"></div>
    <div id="diff" class="heat hidden"></div>
    <div class="hud" id="hud"></div>
  </div>
  <div class="nav">
    <button id="prev">← prev</button>
    <button id="next">next →</button>
    <span id="idx" class="meta"></span>
  </div>
  <div class="curve" id="curve"></div>
  <div class="thumbs" id="thumbs"></div>
  <p class="help">Keys: ← → scrub · 1 side-by-side · 2 swipe · 3 diff. Orange = pred, teal = GT, red = abs-diff. Action arrow follows dx/dy or yaw.</p>
</div>
<script id="data" type="application/json">${json}</script>
<script>
const data = JSON.parse(document.getElementById('data').textContent)
let i = data.start || 0
let mode = 'side'
const worst = new Set(data.worst || [])

function el(html) {
  const d = document.createElement('div')
  d.innerHTML = html.trim()
  return d.firstElementChild
}

function render() {
  const f = data.frames[i]
  if (!f) return
  document.getElementById('idx').textContent = 'frame ' + f.index + ' / ' + (data.n - 1) + (f.ssim != null ? ' · SSIM ' + f.ssim : '')
  document.getElementById('side').innerHTML =
    '<figure><figcaption><span class="tag-pred">pred #' + f.index + '</span></figcaption><img alt="pred" src="' + f.pred + '"></figure>' +
    '<figure><figcaption><span class="tag-gt">gt #' + f.index + '</span></figcaption><img alt="gt" src="' + f.gt + '"></figure>'
  document.getElementById('swipe').innerHTML =
    '<figure><figcaption><span class="tag-gt">gt</span><span class="tag-pred">pred overlay</span></figcaption>' +
    '<div class="box"><img class="under" alt="gt" src="' + f.gt + '">' +
    '<div class="over"><img alt="pred" src="' + f.pred + '"></div></div></figure>' +
    '<input id="split" type="range" min="0" max="100" value="50">'
  document.getElementById('diff').innerHTML =
    '<figure><figcaption><span class="tag-diff">|pred − gt|</span><span>SSIM ' + (f.ssim ?? '—') + '</span></figcaption>' +
    '<img alt="diff" src="' + f.diff + '"></figure>'
  const split = document.getElementById('split')
  if (split) {
    const over = document.querySelector('#swipe .over')
    const box = document.querySelector('#swipe .box')
    const img = over.querySelector('img')
    const apply = () => {
      over.style.width = split.value + '%'
      img.style.width = box.clientWidth + 'px'
    }
    split.addEventListener('input', apply)
    apply()
  }
  const a = f.action
  const hud = document.getElementById('hud')
  if (a) {
    const deg = a.deg || 0
    const follow = a.followed == null ? '' : a.followed
      ? '<span class="chip ok">followed</span>'
      : '<span class="chip miss">action dropped</span>'
    hud.innerHTML =
      '<div class="arrow"><span style="transform:rotate(' + deg + 'deg)"></span></div>' +
      '<strong>' + a.label + '</strong>' +
      '<span>dx ' + a.dx + ' · dy ' + a.dy + (a.yaw != null ? ' · yaw ' + a.yaw : '') + '</span>' +
      follow
  } else {
    hud.innerHTML = '<span>no action track on this run</span>'
  }
  document.querySelectorAll('.modes button').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode))
  document.getElementById('side').classList.toggle('hidden', mode !== 'side')
  document.getElementById('swipe').classList.toggle('hidden', mode !== 'swipe')
  document.getElementById('diff').classList.toggle('hidden', mode !== 'diff')
  document.querySelectorAll('#curve button').forEach((b, k) => b.classList.toggle('on', k === i))
  document.querySelectorAll('#thumbs button').forEach((b, k) => b.classList.toggle('on', k === i))
}

function goto(n) {
  i = (n + data.frames.length) % data.frames.length
  render()
}

const curve = document.getElementById('curve')
data.frames.forEach((f, k) => {
  const h = f.ssim == null ? 40 : Math.max(8, Math.round(f.ssim * 100))
  const b = el('<button type="button" style="--h:' + h + '%"></button>')
  if (worst.has(f.index)) b.classList.add('worst')
  b.addEventListener('click', () => goto(k))
  curve.appendChild(b)
})
const thumbs = document.getElementById('thumbs')
data.frames.forEach((f, k) => {
  const b = el('<button type="button"><img alt="#' + f.index + '" src="' + f.pred + '"></button>')
  b.addEventListener('click', () => goto(k))
  thumbs.appendChild(b)
})
document.querySelectorAll('.modes button').forEach((b) => {
  b.addEventListener('click', () => { mode = b.dataset.mode; render() })
})
document.getElementById('prev').addEventListener('click', () => goto(i - 1))
document.getElementById('next').addEventListener('click', () => goto(i + 1))
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') goto(i - 1)
  if (e.key === 'ArrowRight') goto(i + 1)
  if (e.key === '1') { mode = 'side'; render() }
  if (e.key === '2') { mode = 'swipe'; render() }
  if (e.key === '3') { mode = 'diff'; render() }
})
render()
</script>
</body>
</html>
`
}

/**
 * Write a self-contained compare + action page for a run (or pred/gt pair).
 * @param {string} path run directory, or pred path when pair is set
 * @param {{ out?: string, maxFrames?: number, pair?: string, openWorst?: boolean }} [opts]
 */
export function writeViewPage(path, { out, maxFrames = 64, pair } = {}) {
  const warnings = []
  const layout = discover(path)
  warnings.push(...(layout.warnings || []).filter((w) => !w.includes('log not found') && !w.includes('metrics not found')))

  const predPath = pair ? path : layout.pred
  const gtPath = pair || layout.gt
  if (!predPath || !gtPath) {
    throw new Error('wm_view: need pred and gt (pass a run with both, or --pair / pair=)')
  }

  const predFrames = resolveFrames(predPath, maxFrames)
  const gtFrames = resolveFrames(gtPath, maxFrames)
  const n = Math.min(predFrames.length, gtFrames.length)
  if (predFrames.length !== gtFrames.length) {
    warnings.push(`frame count mismatch; using first ${n}`)
  }

  const scored = rolloutDiff(predPath, gtPath, { maxFrames })
  const actionPath = findActionsFile(layout.path, layout.actions)
  const actions = actionPath ? loadActions(actionPath, n) : []
  if (layout.actions && !actionPath) warnings.push(`actions missing: ${layout.actions}`)

  let actionAcc = null
  if (layout.metrics) {
    try {
      const metrics = JSON.parse(readFileSync(layout.metrics, 'utf8'))
      if (metrics && metrics.action_acc != null) actionAcc = metrics.action_acc
    } catch {
      /* leave null */
    }
  }

  const frames = []
  const sheetRows = []
  const picked = pickIndices(n, undefined, Math.min(6, n))
  for (let i = 0; i < n; i++) {
    const pred = downscale(decodeImage(predFrames[i]))
    const gt = downscale(decodeImage(gtFrames[i]))
    const heat = absDiffHeatmap(pred.rgb, pred.width, pred.height, gt.rgb, gt.width, gt.height)
    const point = scored.curve[i]
    const action = actions.find((a) => a.index === i) || actions[i] || null
    frames.push({
      index: i,
      pred: dataUriPng(pred.rgb, pred.width, pred.height),
      gt: dataUriPng(gt.rgb, gt.width, gt.height),
      diff: dataUriPng(heat.rgb, heat.width, heat.height),
      ssim: point ? point.ssim : null,
      mse: point ? point.mse : null,
      action: action
        ? {
            label: action.label,
            dx: action.dx,
            dy: action.dy,
            yaw: action.yaw,
            followed: action.followed,
            deg: Number(actionArrowDeg(action).toFixed(1)),
          }
        : null,
    })
    if (picked.includes(i)) {
      sheetRows.push({
        pred: { rgb: pred.rgb, width: pred.width, height: pred.height },
        gt: { rgb: gt.rgb, width: gt.width, height: gt.height },
        heat: { rgb: heat.rgb, width: heat.width, height: heat.height },
      })
    }
  }

  const sheet = paintCompareSheet(sheetRows, 140)
  const stamp = `${Date.now()}`
  const htmlPath = out
    ? resolve(out)
    : join(tmpdir(), `dsh-wm-view-${basename(layout.path || path)}-${stamp}.html`)
  mkdirSync(dirname(htmlPath), { recursive: true })
  const sheetPath = htmlPath.replace(/\.html$/i, '') + '-compare.png'
  const worst = (scored.worst || []).map((w) => w.index)
  const start = worst[0] ?? picked[picked.length - 1] ?? 0

  const payload = {
    name: layout.name || basename(path),
    n,
    mean_ssim: scored.mean_ssim != null ? Number(scored.mean_ssim.toFixed(3)) : null,
    min_ssim: scored.min_ssim != null ? Number(scored.min_ssim.toFixed(3)) : null,
    action_acc: actionAcc,
    diagnosis: scored.diagnosis,
    worst,
    start,
    frames,
  }
  writeFileSync(htmlPath, renderHtml(payload))
  writeFileSync(sheetPath, encodePng(sheet.rgb, sheet.width, sheet.height))

  return {
    path,
    run: layout.path,
    page: htmlPath,
    sheet: sheetPath,
    sheet_size: { width: sheet.width, height: sheet.height },
    n,
    actions: actions.length,
    action_file: actionPath,
    mean_ssim: payload.mean_ssim,
    min_ssim: payload.min_ssim,
    diagnosis: scored.diagnosis,
    worst: scored.worst,
    picked,
    warnings,
  }
}
