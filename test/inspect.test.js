import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { decodePng } from '../lib/png.js'
import { inspectFrames, pickIndices } from '../lib/inspect.js'
import { diagnoseProblem } from '../lib/knowledge.js'
import { readFileSync } from 'node:fs'

const fixture = fileURLToPath(new URL('../fixtures/sunset', import.meta.url))

test('pickIndices defaults to first mid last plus fills', () => {
  assert.deepEqual(pickIndices(8, undefined, 3), [0, 3, 7])
  assert.deepEqual(pickIndices(8, 'first,last', 6), [0, 7])
  assert.deepEqual(pickIndices(8, '0,7', 6), [0, 7])
})

test('inspect sunset pred writes a sheet and sketches late wipe', () => {
  const result = inspectFrames(`${fixture}/pred`, { indices: '0,7' })
  assert.equal(result.n, 8)
  assert.deepEqual(result.picked, [0, 7])
  assert.equal(result.tiles.length, 2)
  assert.ok(existsSync(result.sheet))
  const png = decodePng(readFileSync(result.sheet))
  assert.equal(png.width, result.sheet_size.width)
  assert.ok(result.tiles[0].look.includes('warm') || result.tiles[0].luma > result.tiles[1].luma)
  assert.match(result.tiles[1].look, /blue|uniform|washed|low contrast/)
  assert.equal(result.tiles[0].sketch.length, 6)
  assert.ok(result.tiles[0].sketch[0].length >= 8)
})

test('inspect run directory stacks pred over gt', () => {
  const result = inspectFrames(fixture, { indices: 'first,mid,last' })
  assert.equal(result.n, 8)
  assert.deepEqual(result.picked, [0, 3, 7])
  const roles = [...new Set(result.tiles.map((t) => t.role))]
  assert.deepEqual(roles.sort(), ['gt', 'pred'])
  assert.equal(result.tiles.length, 6)
})

test('diagnose see-the-frame points at wm_inspect', () => {
  const result = diagnoseProblem('need to see the worst frame')
  assert.ok(result.next.includes('wm_inspect'))
})
