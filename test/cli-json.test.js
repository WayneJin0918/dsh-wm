import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const cli = fileURLToPath(new URL('../cli.js', import.meta.url))
const fixture = fileURLToPath(new URL('../fixtures/sunset', import.meta.url))

test('diff --json emits the structured sunset score', () => {
  const run = spawnSync(
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
      '--json',
    ],
    { encoding: 'utf8' },
  )

  assert.equal(run.status, 0, run.stderr)
  const result = JSON.parse(run.stdout)
  assert.equal(result.n, 8)
  assert.ok(Number.isFinite(result.mean_ssim))
  assert.ok(Number.isFinite(result.min_ssim))
  assert.deepEqual(
    result.worst.map((item) => item.index),
    [4, 5, 6],
  )
  assert.deepEqual(result.warnings, [])
})
