import assert from 'node:assert/strict'
import { test } from 'node:test'
import { decodePng, encodePng } from '../lib/png.js'
import { compareRgb } from '../lib/ssim.js'

function solid(w, h, r, g, b) {
  const rgb = new Uint8Array(w * h * 3)
  for (let i = 0; i < w * h; i++) {
    rgb[i * 3] = r
    rgb[i * 3 + 1] = g
    rgb[i * 3 + 2] = b
  }
  return rgb
}

test('PNG encode/decode roundtrip', () => {
  const rgb = solid(16, 12, 200, 40, 90)
  rgb[0] = 1
  rgb[1] = 2
  rgb[2] = 3
  const { rgb: back, width, height } = decodePng(encodePng(rgb, 16, 12))
  assert.equal(width, 16)
  assert.equal(height, 12)
  assert.deepEqual(Buffer.from(back), Buffer.from(rgb))
})

test('identical images have SSIM near 1', () => {
  const rgb = solid(32, 24, 120, 80, 40)
  const { ssim, mse } = compareRgb(rgb, 32, 24, rgb, 32, 24)
  assert.ok(ssim > 0.999)
  assert.equal(mse, 0)
})

test('inverted patterns have low SSIM', () => {
  const a = new Uint8Array(32 * 24 * 3)
  const b = new Uint8Array(32 * 24 * 3)
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 32; x++) {
      const i = (y * 32 + x) * 3
      a[i] = x * 8
      a[i + 1] = y * 10
      a[i + 2] = 128
      b[i] = 255 - x * 8
      b[i + 1] = 255 - y * 10
      b[i + 2] = 0
    }
  }
  const { ssim, mse } = compareRgb(a, 32, 24, b, 32, 24)
  assert.ok(ssim < 0.2)
  assert.ok(mse > 1000)
})
