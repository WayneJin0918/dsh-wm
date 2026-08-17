import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { discover } from './discover.js'
import { decodeImage, isImagePath, isVideoPath, listImages, resolveFrames } from './frames.js'
import { encodePng } from './png.js'

const SKETCH_CHARS = ' .:-=+*#%@'

function isDirWithFrames(path) {
  try {
    return listImages(path).length > 0
  } catch {
    return false
  }
}

function isFrameSource(path) {
  try {
    if (isImagePath(path) || isVideoPath(path)) return true
    return isDirWithFrames(path)
  } catch {
    return false
  }
}

/**
 * Pick frame indices: explicit list, or first / mid / last plus even fills.
 * @param {number} n
 * @param {string|number[]|undefined} spec
 * @param {number} maxTiles
 */
export function pickIndices(n, spec, maxTiles = 6) {
  if (n <= 0) return []
  const cap = Math.max(1, Math.min(maxTiles, n))
  if (spec != null && String(spec).trim() !== '') {
    const out = []
    for (const tok of String(spec).split(/[,\s]+/).filter(Boolean)) {
      let i = -1
      if (tok === 'first') i = 0
      else if (tok === 'last') i = n - 1
      else if (tok === 'mid' || tok === 'middle') i = Math.floor((n - 1) / 2)
      else if (/^\d+$/.test(tok)) i = Number(tok)
      if (Number.isInteger(i) && i >= 0 && i < n) out.push(i)
    }
    return [...new Set(out)].slice(0, cap)
  }
  if (n <= cap) return Array.from({ length: n }, (_, i) => i)
  const set = new Set([0, Math.floor((n - 1) / 2), n - 1])
  for (let k = 0; set.size < cap; k++) {
    set.add(Math.round((k * (n - 1)) / (cap - 1)))
  }
  return [...set].sort((a, b) => a - b).slice(0, cap)
}

export function describeLook({ r, g, b, luma, contrast }) {
  const parts = []
  if (contrast < 8) parts.push('near-uniform')
  else if (contrast < 25) parts.push('low contrast')
  else if (contrast > 70) parts.push('high contrast')
  if (luma < 40) parts.push('dark')
  else if (luma > 200) parts.push('washed / bright')
  const spread = Math.max(r, g, b) - Math.min(r, g, b)
  if (spread < 12) parts.push('neutral gray')
  else if (r >= g && r >= b) parts.push(g >= b ? 'warm / orange' : 'red')
  else if (b >= r && b >= g) parts.push('cool / blue')
  else parts.push('green')
  return parts.join(', ')
}

function frameStats(rgb, width, height) {
  const n = width * height
  let r = 0
  let g = 0
  let b = 0
  let lumaSum = 0
  const lumas = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const R = rgb[i * 3]
    const G = rgb[i * 3 + 1]
    const B = rgb[i * 3 + 2]
    r += R
    g += G
    b += B
    const L = 0.299 * R + 0.587 * G + 0.114 * B
    lumas[i] = L
    lumaSum += L
  }
  r /= n
  g /= n
  b /= n
  const lumaMean = lumaSum / n
  let varL = 0
  for (let i = 0; i < n; i++) {
    const d = lumas[i] - lumaMean
    varL += d * d
  }
  const contrast = Math.sqrt(varL / n)
  const look = describeLook({ r, g, b, luma: lumaMean, contrast })
  return {
    width,
    height,
    mean_rgb: [Math.round(r), Math.round(g), Math.round(b)],
    luma: Number(lumaMean.toFixed(1)),
    contrast: Number(contrast.toFixed(1)),
    look,
  }
}

function lumaSketch(rgb, width, height, cols = 16, rows = 6) {
  const lines = []
  for (let y = 0; y < rows; y++) {
    let row = ''
    const y0 = Math.floor((y * height) / rows)
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * height) / rows))
    for (let x = 0; x < cols; x++) {
      const x0 = Math.floor((x * width) / cols)
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * width) / cols))
      let s = 0
      let c = 0
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * width + xx) * 3
          s += 0.299 * rgb[i] + 0.587 * rgb[i + 1] + 0.114 * rgb[i + 2]
          c++
        }
      }
      const v = s / c / 255
      row += SKETCH_CHARS[Math.min(SKETCH_CHARS.length - 1, Math.floor(v * SKETCH_CHARS.length))]
    }
    lines.push(row)
  }
  return lines
}

function nearestScale(rgb, sw, sh, tw, th) {
  const out = Buffer.alloc(tw * th * 3)
  for (let y = 0; y < th; y++) {
    const sy = Math.min(sh - 1, Math.floor(((y + 0.5) * sh) / th))
    for (let x = 0; x < tw; x++) {
      const sx = Math.min(sw - 1, Math.floor(((x + 0.5) * sw) / tw))
      const si = (sy * sw + sx) * 3
      const di = (y * tw + x) * 3
      out[di] = rgb[si]
      out[di + 1] = rgb[si + 1]
      out[di + 2] = rgb[si + 2]
    }
  }
  return out
}

function blit(dest, dw, rgb, w, h, x0, y0) {
  for (let y = 0; y < h; y++) {
    const dy = y0 + y
    if (dy < 0) continue
    for (let x = 0; x < w; x++) {
      const dx = x0 + x
      if (dx < 0) continue
      const di = (dy * dw + dx) * 3
      const si = (y * w + x) * 3
      dest[di] = rgb[si]
      dest[di + 1] = rgb[si + 1]
      dest[di + 2] = rgb[si + 2]
    }
  }
}

const ROLE_COLOR = {
  pred: [232, 140, 48],
  gt: [48, 180, 168],
  frames: [160, 160, 168],
}

function paintSheet(rows, tileW) {
  const pad = 4
  const bar = 4
  const scaled = rows.map((row) =>
    row.map((tile) => {
      const th = Math.max(1, Math.round((tile.height * tileW) / tile.width))
      return {
        ...tile,
        rgb: nearestScale(tile.rgb, tile.width, tile.height, tileW, th),
        tw: tileW,
        th,
      }
    }),
  )
  const tileH = Math.max(1, ...scaled.flat().map((t) => t.th))
  const cols = Math.max(1, ...scaled.map((row) => row.length))
  const width = pad + cols * (tileW + bar + pad)
  const height = pad + scaled.length * (tileH + pad)
  const canvas = Buffer.alloc(width * height * 3, 28)
  for (let r = 0; r < scaled.length; r++) {
    for (let c = 0; c < scaled[r].length; c++) {
      const tile = scaled[r][c]
      const x = pad + c * (tileW + bar + pad) + bar
      const y = pad + r * (tileH + pad) + Math.floor((tileH - tile.th) / 2)
      const color = ROLE_COLOR[tile.role] || ROLE_COLOR.frames
      for (let by = 0; by < tile.th; by++) {
        for (let bx = 0; bx < bar; bx++) {
          const di = ((y + by) * width + (x - bar + bx)) * 3
          canvas[di] = color[0]
          canvas[di + 1] = color[1]
          canvas[di + 2] = color[2]
        }
      }
      blit(canvas, width, tile.rgb, tile.tw, tile.th, x, y)
    }
  }
  return { rgb: canvas, width, height }
}

function resolveSources(path, pair) {
  const warnings = []
  if (pair) {
    return {
      sources: [
        { role: 'pred', frames: resolveFrames(path, 256) },
        { role: 'gt', frames: resolveFrames(pair, 256) },
      ],
      warnings,
    }
  }
  if (isFrameSource(path)) {
    return { sources: [{ role: 'frames', frames: resolveFrames(path, 256) }], warnings }
  }
  const layout = discover(path)
  warnings.push(...(layout.warnings || []).filter((w) => !w.includes('log not found') && !w.includes('metrics not found')))
  if (layout.pred && (isFrameSource(layout.pred) || isVideoPath(layout.pred))) {
    const sources = [{ role: 'pred', frames: resolveFrames(layout.pred, 256) }]
    if (layout.gt && (isFrameSource(layout.gt) || isVideoPath(layout.gt))) {
      sources.push({ role: 'gt', frames: resolveFrames(layout.gt, 256) })
    }
    return { sources, warnings, run: layout.path }
  }
  if (layout.candidates?.images?.length) {
    return { sources: [{ role: 'frames', frames: layout.candidates.images }], warnings }
  }
  throw new Error(`wm_inspect: no frames at ${path} (pass a PNG/PPM, a frame directory, a video, or a run with pred/)`)
}

/**
 * Look at frames: sample tiles, luma sketches, and a contact-sheet PNG.
 * @param {string} path image, frame dir, video, or run directory
 * @param {{ indices?: string, maxTiles?: number, pair?: string }} [opts]
 */
export function inspectFrames(path, { indices, maxTiles = 6, pair } = {}) {
  const { sources, warnings, run } = resolveSources(path, pair)
  const n = Math.min(...sources.map((s) => s.frames.length))
  if (sources.some((s) => s.frames.length !== n)) {
    warnings.push(`frame count mismatch; using first ${n} per strip`)
  }
  const picked = pickIndices(n, indices, maxTiles)
  if (!picked.length) throw new Error('wm_inspect: no frames to show')

  const tiles = []
  const sheetRows = []
  for (const src of sources) {
    const row = []
    for (const index of picked) {
      const file = src.frames[index]
      const decoded = decodeImage(file)
      const stats = frameStats(decoded.rgb, decoded.width, decoded.height)
      const tile = {
        role: src.role,
        index,
        path: file,
        name: basename(file),
        ...stats,
        sketch: lumaSketch(decoded.rgb, decoded.width, decoded.height),
      }
      tiles.push(tile)
      row.push({ role: src.role, rgb: decoded.rgb, width: decoded.width, height: decoded.height })
    }
    sheetRows.push(row)
  }

  const sheet = paintSheet(sheetRows, 160)
  const sheetPath = join(tmpdir(), `dsh-wm-inspect-${Date.now()}-${picked.join('-')}.png`)
  writeFileSync(sheetPath, encodePng(sheet.rgb, sheet.width, sheet.height))

  return {
    path,
    run: run ?? null,
    pair: pair ?? null,
    n,
    picked,
    tiles,
    sheet: sheetPath,
    sheet_size: { width: sheet.width, height: sheet.height },
    warnings,
  }
}
