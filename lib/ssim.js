const C1 = (0.01 * 255) ** 2
const C2 = (0.03 * 255) ** 2
const BLOCK = 8

/** ITU-R BT.601 luma. */
export function luma(rgb) {
  const n = rgb.length / 3
  const y = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    y[i] = 0.299 * rgb[i * 3] + 0.587 * rgb[i * 3 + 1] + 0.114 * rgb[i * 3 + 2]
  }
  return y
}

function cropRgb(rgb, width, height, tw, th) {
  if (width === tw && height === th) return rgb
  const out = new Uint8Array(tw * th * 3)
  const ox = Math.floor((width - tw) / 2)
  const oy = Math.floor((height - th) / 2)
  for (let y = 0; y < th; y++) {
    const src = ((y + oy) * width + ox) * 3
    out.set(rgb.subarray(src, src + tw * 3), y * tw * 3)
  }
  return out
}

function blockStats(a, b, width, x0, y0, bw, bh) {
  let n = 0
  let sa = 0
  let sb = 0
  let saa = 0
  let sbb = 0
  let sab = 0
  for (let y = y0; y < y0 + bh; y++) {
    const row = y * width
    for (let x = x0; x < x0 + bw; x++) {
      const va = a[row + x]
      const vb = b[row + x]
      sa += va
      sb += vb
      saa += va * va
      sbb += vb * vb
      sab += va * vb
      n++
    }
  }
  const muA = sa / n
  const muB = sb / n
  const varA = saa / n - muA * muA
  const varB = sbb / n - muB * muB
  const cov = sab / n - muA * muB
  return ((2 * muA * muB + C1) * (2 * cov + C2)) /
    ((muA * muA + muB * muB + C1) * (varA + varB + C2))
}

/**
 * Mean 8x8-block SSIM and per-pixel MSE on two RGB buffers.
 * Images are center-cropped to the shared minimum size.
 */
export function compareRgb(a, aw, ah, b, bw, bh) {
  const w = Math.min(aw, bw)
  const h = Math.min(ah, bh)
  if (w < 1 || h < 1) throw new Error('empty image')
  const ar = cropRgb(a, aw, ah, w, h)
  const br = cropRgb(b, bw, bh, w, h)
  const ya = luma(ar)
  const yb = luma(br)
  let mse = 0
  for (let i = 0; i < ya.length; i++) {
    const d = ya[i] - yb[i]
    mse += d * d
  }
  mse /= ya.length
  const scores = []
  const bhMax = Math.max(1, Math.floor(h / BLOCK))
  const bwMax = Math.max(1, Math.floor(w / BLOCK))
  if (w < BLOCK || h < BLOCK) {
    scores.push(blockStats(ya, yb, w, 0, 0, w, h))
  } else {
    for (let by = 0; by < bhMax; by++) {
      for (let bx = 0; bx < bwMax; bx++) {
        scores.push(blockStats(ya, yb, w, bx * BLOCK, by * BLOCK, BLOCK, BLOCK))
      }
    }
  }
  const ssim = scores.reduce((s, v) => s + v, 0) / scores.length
  return { ssim, mse, width: w, height: h }
}

export function mean(values) {
  if (!values.length) return 0
  return values.reduce((s, v) => s + v, 0) / values.length
}

export function minOf(values) {
  if (!values.length) return 0
  return Math.min(...values)
}
