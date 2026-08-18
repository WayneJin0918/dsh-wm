import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { encodePng } from '../lib/png.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'sunset')
const W = 64
const H = 36
const N = 8

function clamp(v) {
  return Math.max(0, Math.min(255, v | 0))
}

function gtFrame(t) {
  const rgb = new Uint8Array(W * H * 3)
  const sunX = 12 + t * 36
  const sunY = 10 + t * 4
  for (let y = 0; y < H; y++) {
    const v = y / (H - 1)
    for (let x = 0; x < W; x++) {
      const u = x / (W - 1)
      const r = 255 * (1 - v * 0.35) * (0.85 + 0.15 * u)
      const g = 90 + 80 * (1 - v) + 20 * t
      const b = 40 + 160 * v
      const dx = x - sunX
      const dy = y - sunY
      const sun = Math.max(0, 1 - Math.hypot(dx, dy) / 7)
      const i = (y * W + x) * 3
      rgb[i] = clamp(r + 80 * sun)
      rgb[i + 1] = clamp(g + 40 * sun)
      rgb[i + 2] = clamp(b - 20 * sun)
    }
  }
  return rgb
}

function blur(rgb, radius) {
  const out = new Uint8Array(rgb.length)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let r = 0
      let g = 0
      let b = 0
      let n = 0
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const xx = Math.min(W - 1, Math.max(0, x + dx))
          const yy = Math.min(H - 1, Math.max(0, y + dy))
          const i = (yy * W + xx) * 3
          r += rgb[i]
          g += rgb[i + 1]
          b += rgb[i + 2]
          n++
        }
      }
      const o = (y * W + x) * 3
      out[o] = r / n
      out[o + 1] = g / n
      out[o + 2] = b / n
    }
  }
  return out
}

function predFrame(gt, t) {
  if (t < 4) {
    const out = new Uint8Array(gt)
    for (let i = 0; i < out.length; i++) out[i] = clamp(out[i] + ((i * (t + 1)) % 5) - 2)
    return out
  }
  // Late frames: wipe identity (invert + wash + heavy blur) so second-half SSIM drops.
  const wiped = new Uint8Array(gt.length)
  for (let i = 0; i < gt.length; i += 3) {
    wiped[i] = clamp(40 + (t - 3) * 12)
    wiped[i + 1] = clamp(30 + ((i / 3) % 17))
    wiped[i + 2] = clamp(180 - gt[i] * 0.3)
  }
  return blur(wiped, 3 + (t - 4))
}

mkdirSync(join(root, 'pred'), { recursive: true })
mkdirSync(join(root, 'gt'), { recursive: true })
mkdirSync(join(root, 'logs'), { recursive: true })

for (let i = 0; i < N; i++) {
  const t = i / (N - 1)
  const gt = gtFrame(t)
  const pred = predFrame(gt, i)
  const name = `frame_${String(i).padStart(2, '0')}.png`
  writeFileSync(join(root, 'gt', name), encodePng(gt, W, H))
  writeFileSync(join(root, 'pred', name), encodePng(pred, W, H))
}

writeFileSync(
  join(root, 'wm.yaml'),
  [
    'name: sunset-revisit',
    'pred: pred',
    'gt: gt',
    'log: logs/train.log',
    'metrics: metrics.json',
    'actions: actions.json',
    '',
  ].join('\n'),
)

const actions = []
for (let i = 0; i < N; i++) {
  actions.push({
    index: i,
    name: 'follow-sun',
    dx: 1,
    dy: 0.15,
    yaw: 8 + i * 7,
    followed: i < 4,
  })
}
writeFileSync(join(root, 'actions.json'), `${JSON.stringify(actions, null, 2)}\n`)

writeFileSync(
  join(root, 'metrics.json'),
  `${JSON.stringify(
    {
      name: 'sunset-revisit',
      mean_ssim: 0.71,
      min_ssim: 0.42,
      action_acc: 0.754,
      revisit_ssim: 0.31,
      flicker: 0.048,
      failure: false,
    },
    null,
    2,
  )}\n`,
)

const log = []
log.push('DreamX-like smoke run — synthetic fixture, not a real trainer')
for (let step = 0; step <= 200; step += 20) {
  const loss = 0.42 - step * 0.0008 + (step >= 160 ? 0.06 : 0)
  log.push(`[step ${step}] loss=${loss.toFixed(4)} lr=1e-4 mem=sparse`)
}
log.push('[step 200] eval mean_ssim=0.71 revisit_ssim=0.31 flicker=0.048')
log.push('done')
writeFileSync(join(root, 'logs', 'train.log'), `${log.join('\n')}\n`)

process.stdout.write(`wrote ${N} pred/gt pairs under ${root}\n`)
