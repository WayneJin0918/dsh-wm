import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { absDiffHeatmap, paintCompareSheet } from '../lib/compare.js'
import { decodeImage, resolveFrames } from '../lib/frames.js'
import { inspectFrames, nearestScale } from '../lib/inspect.js'
import { encodePng } from '../lib/png.js'
import { writeViewPage } from '../lib/view.js'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const fixture = join(root, 'fixtures', 'sunset')
const outDir = join(root, 'docs')
mkdirSync(outDir, { recursive: true })

function upscale(rgb, w, h, k = 2) {
  return {
    rgb: nearestScale(rgb, w, h, w * k, h * k),
    width: w * k,
    height: h * k,
  }
}

function writePng(name, rgb, width, height) {
  const path = join(outDir, name)
  writeFileSync(path, encodePng(rgb, width, height))
  return path
}

const inspected = inspectFrames(fixture, { indices: 'first,mid,last' })
const inspectPng = decodeImage(inspected.sheet)
const inspectHi = upscale(inspectPng.rgb, inspectPng.width, inspectPng.height, 2)
writePng('sunset-inspect.png', inspectHi.rgb, inspectHi.width, inspectHi.height)

const viewed = writeViewPage(fixture, { out: join(tmpdir(), `dsh-wm-docs-view-${Date.now()}.html`) })
copyFileSync(viewed.page, join(outDir, 'sunset-view.html'))
const comparePng = decodeImage(viewed.sheet)
const compareHi = upscale(comparePng.rgb, comparePng.width, comparePng.height, 2)
writePng('sunset-compare.png', compareHi.rgb, compareHi.width, compareHi.height)

const pred = resolveFrames(join(fixture, 'pred'), 8)
const gt = resolveFrames(join(fixture, 'gt'), 8)
const picks = [0, 3, 7]
const story = picks.map((i) => {
  const p = decodeImage(pred[i])
  const g = decodeImage(gt[i])
  const heat = absDiffHeatmap(p.rgb, p.width, p.height, g.rgb, g.width, g.height)
  return { pred: p, gt: g, heat }
})
const storySheet = paintCompareSheet(story, 220)
const storyHi = upscale(storySheet.rgb, storySheet.width, storySheet.height, 2)
writePng('sunset-story.png', storyHi.rgb, storyHi.width, storyHi.height)

const { rolloutDiff } = await import('../lib/diff.js')
const scored = rolloutDiff(join(fixture, 'pred'), join(fixture, 'gt'), { maxFrames: 8 })
const ssims = scored.curve.map((p) => p.ssim)
const worst = new Set(scored.worst.map((w) => w.index))
const cw = 480
const ch = 120
const canvas = Buffer.alloc(cw * ch * 3, 18)
const pad = 18
const floor = ch - 14
for (let x = pad; x < cw - pad; x++) {
  const di = (floor * cw + x) * 3
  canvas[di] = 42
  canvas[di + 1] = 48
  canvas[di + 2] = 58
}
const barGap = 8
const barW = Math.floor((cw - pad * 2 - barGap * 7) / 8)
for (let i = 0; i < 8; i++) {
  const h = Math.max(6, Math.round(ssims[i] * (floor - pad)))
  const x0 = pad + i * (barW + barGap)
  const y0 = floor - h
  const color = worst.has(i) ? [220, 72, 64] : [48, 180, 168]
  for (let y = y0; y < floor; y++) {
    for (let x = x0; x < x0 + barW; x++) {
      const di = (y * cw + x) * 3
      canvas[di] = color[0]
      canvas[di + 1] = color[1]
      canvas[di + 2] = color[2]
    }
  }
}
writePng('sunset-ssim.png', canvas, cw, ch)

process.stdout.write(`docs: inspect ${inspectHi.width}x${inspectHi.height}\n`)
process.stdout.write(`docs: compare ${compareHi.width}x${compareHi.height}\n`)
process.stdout.write(`docs: story ${storyHi.width}x${storyHi.height}\n`)
process.stdout.write(`docs: view ${viewed.page}\n`)
