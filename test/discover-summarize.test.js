import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { discover } from '../lib/discover.js'
import { summarize } from '../lib/summarize.js'

const fixture = fileURLToPath(new URL('../fixtures/sunset', import.meta.url))

test('discover reads wm.yaml on the sunset fixture', () => {
  const result = discover(fixture)
  assert.equal(result.layout, 'wm.yaml')
  assert.equal(result.name, 'sunset-revisit')
  assert.ok(result.pred.endsWith('pred'))
  assert.ok(result.gt.endsWith('gt'))
  assert.equal(result.n_frames.pred, 8)
  assert.equal(result.n_frames.gt, 8)
  assert.ok(!result.warnings.some((w) => w.includes('not found')))
})

test('discover falls back to heuristics', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-wm-'))
  writeFileSync(join(dir, 'metrics.json'), '{"ssim":0.2}')
  const result = discover(dir)
  assert.equal(result.layout, 'heuristic')
  assert.ok(result.metrics.endsWith('metrics.json'))
  assert.ok(result.warnings.includes('no wm.yaml; used directory heuristics'))
})

test('summarize emits metrics and three hypotheses', () => {
  const result = summarize(fixture)
  assert.equal(result.last_step, 200)
  assert.equal(result.loss_nan, false)
  assert.equal(result.early_stop, false)
  assert.ok(result.metrics_rows.some((r) => r.key === 'revisit_ssim'))
  assert.equal(result.hypotheses.length, 3)
  assert.ok(result.hypotheses.some((h) => /revisit|SSIM|Flicker|diff/i.test(h)))
})
