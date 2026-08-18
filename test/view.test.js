import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { loadActions, normalizeAction } from '../lib/actions.js'
import { absDiffHeatmap } from '../lib/compare.js'
import { discover } from '../lib/discover.js'
import { diagnoseProblem } from '../lib/knowledge.js'
import { decodePng } from '../lib/png.js'
import { writeViewPage } from '../lib/view.js'

const fixture = fileURLToPath(new URL('../fixtures/sunset', import.meta.url))

test('normalizeAction reads dx dy yaw and followed', () => {
  const a = normalizeAction({ name: 'follow-sun', dx: 1, dy: 0.15, yaw: 22, followed: false }, 4)
  assert.equal(a.label, 'follow-sun')
  assert.equal(a.dx, 1)
  assert.equal(a.followed, false)
})

test('discover sunset finds actions.json', () => {
  const result = discover(fixture)
  assert.ok(result.actions && result.actions.endsWith('actions.json'))
  const actions = loadActions(result.actions, 8)
  assert.equal(actions.length, 8)
  assert.equal(actions[0].followed, true)
  assert.equal(actions[7].followed, false)
})

test('absDiffHeatmap lights up a wiped pred', () => {
  const a = Buffer.from([10, 10, 10, 10, 10, 10])
  const b = Buffer.from([200, 20, 20, 200, 20, 20])
  const heat = absDiffHeatmap(a, 1, 2, b, 1, 2)
  assert.equal(heat.width, 1)
  assert.ok(heat.rgb[0] > 100)
})

test('writeViewPage emits HTML with swipe + action HUD and a compare sheet', () => {
  const out = join(tmpdir(), `dsh-wm-view-test-${Date.now()}.html`)
  const result = writeViewPage(fixture, { out })
  assert.ok(existsSync(result.page))
  assert.ok(existsSync(result.sheet))
  const html = readFileSync(result.page, 'utf8')
  assert.match(html, /Side by side/)
  assert.match(html, /Swipe/)
  assert.match(html, /follow-sun/)
  assert.match(html, /action dropped|followed/)
  assert.equal(result.n, 8)
  assert.equal(result.actions, 8)
  const png = decodePng(readFileSync(result.sheet))
  assert.equal(png.width, result.sheet_size.width)
  assert.ok(png.height > 20)
})

test('diagnose compare / 可视化 points at wm_view', () => {
  const result = diagnoseProblem('want a swipe compare page to watch the action')
  assert.ok(result.next.includes('wm_view'))
})
