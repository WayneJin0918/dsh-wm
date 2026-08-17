import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { rolloutDiff } from '../lib/diff.js'

const fixture = fileURLToPath(new URL('../fixtures/sunset', import.meta.url))

test('sunset fixture second half is worse than the first', () => {
  const result = rolloutDiff(`${fixture}/pred`, `${fixture}/gt`)
  assert.equal(result.n, 8)
  assert.ok(result.mean_ssim < 0.95)
  assert.ok(result.second_half_ssim < result.first_half_ssim - 0.05)
  assert.match(result.diagnosis, /late-horizon|blur|flash|drift/i)
  assert.ok(result.worst[0].index >= 4)
})
