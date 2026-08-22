import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const cli = fileURLToPath(new URL('../cli.js', import.meta.url))
const fixture = fileURLToPath(new URL('../fixtures/sunset', import.meta.url))

function runDiff(...extraArgs) {
  return spawnSync(
    process.execPath,
    [
      cli,
      'diff',
      '--pred',
      join(fixture, 'pred'),
      '--gt',
      join(fixture, 'gt'),
      '--max-frames',
      '8',
      ...extraArgs,
    ],
    { encoding: 'utf8' },
  )
}

test('diff --json emits the structured sunset score', () => {
  const run = runDiff('--json')

  assert.equal(run.status, 0, run.stderr)
  const result = JSON.parse(run.stdout)
  assert.equal(result.n, 8)
  assert.ok(Number.isFinite(result.mean_ssim))
  assert.ok(Number.isFinite(result.min_ssim))
  assert.ok(Number.isFinite(result.first_half_ssim))
  assert.ok(Number.isFinite(result.second_half_ssim))
  assert.ok(result.second_half_ssim < result.first_half_ssim - 0.05)
  assert.deepEqual(
    result.worst.map((item) => item.index),
    [4, 5, 6],
  )
  assert.deepEqual(result.warnings, [])
})

test('diff preserves the human-readable card by default', () => {
  const run = runDiff()

  assert.equal(run.status, 0, run.stderr)
  assert.match(run.stdout, /^# wm_rollout_diff\r?\n/)
})
