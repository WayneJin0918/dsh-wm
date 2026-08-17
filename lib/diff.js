import { basename } from 'node:path'
import { decodeImage, resolveFrames } from './frames.js'
import { compareRgb, mean, minOf } from './ssim.js'

function diagnose(curve) {
  if (!curve.length) return 'no overlapping frames to compare'
  const ssims = curve.map((r) => r.ssim)
  const avg = mean(ssims)
  const lo = minOf(ssims)
  const mid = Math.floor(ssims.length / 2)
  const first = mean(ssims.slice(0, Math.max(1, mid)))
  const second = mean(ssims.slice(mid))
  const parts = []
  if (ssims.length >= 4 && first - second >= 0.08) parts.push('late-horizon collapse (second half SSIM drop)')
  else if (ssims.length >= 4 && second - first >= 0.08) parts.push('early mismatch that later recovers')
  if (avg - lo >= 0.12) parts.push('single-frame flash (min far below mean)')
  if (avg < 0.7) parts.push('overall blur / identity drift')
  else if (avg >= 0.92 && !parts.length) parts.push('pred stays close to GT')
  if (!parts.length) parts.push('mild drift without a single dominant failure mode')
  return parts.join('; ')
}

/**
 * Pair pred/gt frames and compute per-frame SSIM + MSE.
 */
export function rolloutDiff(predPath, gtPath, { maxFrames = 64 } = {}) {
  const predFrames = resolveFrames(predPath, maxFrames)
  const gtFrames = resolveFrames(gtPath, maxFrames)
  const n = Math.min(predFrames.length, gtFrames.length)
  const warnings = []
  if (predFrames.length !== gtFrames.length) {
    warnings.push(`frame count mismatch pred=${predFrames.length} gt=${gtFrames.length}; using first ${n}`)
  }
  const curve = []
  for (let i = 0; i < n; i++) {
    const pred = decodeImage(predFrames[i])
    const gt = decodeImage(gtFrames[i])
    const stats = compareRgb(pred.rgb, pred.width, pred.height, gt.rgb, gt.width, gt.height)
    curve.push({
      index: i,
      pred: predFrames[i],
      gt: gtFrames[i],
      ssim: stats.ssim,
      mse: stats.mse,
    })
  }
  const ssims = curve.map((r) => r.ssim)
  const worst = [...curve].sort((a, b) => a.ssim - b.ssim).slice(0, 3)
  const mid = Math.floor(ssims.length / 2)
  return {
    pred: predPath,
    gt: gtPath,
    n,
    mean_ssim: mean(ssims),
    min_ssim: minOf(ssims),
    mean_mse: mean(curve.map((r) => r.mse)),
    first_half_ssim: mean(ssims.slice(0, Math.max(1, mid))),
    second_half_ssim: mean(ssims.slice(mid)),
    worst: worst.map((r) => ({
      index: r.index,
      ssim: r.ssim,
      pred: r.pred,
      gt: r.gt,
      pred_name: basename(r.pred),
    })),
    curve: curve.map((r) => ({ index: r.index, ssim: Number(r.ssim.toFixed(4)), mse: Number(r.mse.toFixed(2)) })),
    diagnosis: diagnose(curve),
    warnings,
  }
}
