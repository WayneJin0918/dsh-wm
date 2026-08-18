import { blit, nearestScale } from './inspect.js'

/**
 * Per-pixel abs-diff heatmap (black → amber → red).
 * Crops to the overlapping top-left if sizes differ.
 */
export function absDiffHeatmap(predRgb, pw, ph, gtRgb, gw, gh) {
  const w = Math.min(pw, gw)
  const h = Math.min(ph, gh)
  const out = Buffer.alloc(w * h * 3)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pi = (y * pw + x) * 3
      const gi = (y * gw + x) * 3
      const dr = Math.abs(predRgb[pi] - gtRgb[gi])
      const dg = Math.abs(predRgb[pi + 1] - gtRgb[gi + 1])
      const db = Math.abs(predRgb[pi + 2] - gtRgb[gi + 2])
      const d = Math.max(dr, dg, db)
      const o = (y * w + x) * 3
      out[o] = Math.min(255, Math.round(d * 1.35))
      out[o + 1] = Math.min(255, Math.round(d * 0.45))
      out[o + 2] = Math.min(255, Math.round(d * 0.12))
    }
  }
  return { rgb: out, width: w, height: h }
}

const COL_COLOR = {
  pred: [232, 140, 48],
  gt: [48, 180, 168],
  diff: [220, 72, 64],
}

/**
 * Contact sheet: each picked frame is pred | gt | heatmap.
 * @param {{ pred: {rgb,width,height}, gt: {rgb,width,height}, heat: {rgb,width,height} }[]} rows
 */
export function paintCompareSheet(rows, tileW = 140) {
  const pad = 4
  const bar = 4
  const scaled = rows.map((row) => {
    const cells = [
      { role: 'pred', ...row.pred },
      { role: 'gt', ...row.gt },
      { role: 'diff', ...row.heat },
    ].map((cell) => {
      const th = Math.max(1, Math.round((cell.height * tileW) / cell.width))
      return {
        role: cell.role,
        rgb: nearestScale(cell.rgb, cell.width, cell.height, tileW, th),
        tw: tileW,
        th,
      }
    })
    return cells
  })
  const tileH = Math.max(1, ...scaled.flat().map((t) => t.th))
  const cols = 3
  const width = pad + cols * (tileW + bar + pad)
  const height = pad + scaled.length * (tileH + pad)
  const canvas = Buffer.alloc(width * height * 3, 28)
  for (let r = 0; r < scaled.length; r++) {
    for (let c = 0; c < scaled[r].length; c++) {
      const tile = scaled[r][c]
      const x = pad + c * (tileW + bar + pad) + bar
      const y = pad + r * (tileH + pad) + Math.floor((tileH - tile.th) / 2)
      const color = COL_COLOR[tile.role]
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
