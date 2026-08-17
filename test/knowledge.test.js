import assert from 'node:assert/strict'
import { test } from 'node:test'
import { diagnoseProblem, loadCards, lookupKnowledge } from '../lib/knowledge.js'

test('catalog lists built-in technique cards', () => {
  const ids = loadCards().map((c) => c.id)
  for (const id of [
    'chunk-ar',
    'kv-memory',
    'memory-types',
    'exposure-bias',
    'revisit-eval',
    'ablation-protocol',
    'action-following',
    'cache-eviction',
    'rsi-harness',
    'diagnosis-map',
    'wm-routes',
    'display-3d',
    'pixel-wm',
    'latent-wm',
  ]) {
    assert.ok(ids.includes(id), `missing ${id}`)
  }
})

test('search finds RSI and KV cards', () => {
  const rsi = lookupKnowledge({ query: 'creator trajectory evolve skill' })
  assert.ok(rsi.matches.some((c) => c.id === 'rsi-harness'))
  const kv = lookupKnowledge({ id: 'kv-memory' })
  assert.equal(kv.matches[0].id, 'kv-memory')
  assert.match(kv.matches[0].body, /denoising/)
})

test('diagnose maps late collapse to exposure bias and diff', () => {
  const result = diagnoseProblem('late horizon collapse after the first chunk, pred drifted')
  assert.ok(result.knowledge_ids.includes('exposure-bias') || result.knowledge_ids.includes('chunk-ar'))
  assert.ok(result.next.includes('wm_rollout_diff'))
})

test('search and diagnose name the three WM routes', () => {
  const routes = lookupKnowledge({ id: 'wm-routes' })
  assert.equal(routes.matches[0].id, 'wm-routes')
  assert.match(routes.matches[0].body, /pixel-wm/)
  const sora = diagnoseProblem('is Sora a world simulator or just video gen')
  assert.ok(sora.knowledge_ids.includes('pixel-wm'))
  assert.ok(sora.knowledge_ids.includes('wm-routes'))
  const geom = diagnoseProblem('Gaussian explorable 3D display occupancy')
  assert.ok(geom.knowledge_ids.includes('display-3d'))
  const jepa = diagnoseProblem('JEPA latent prediction Dreamer RSSM')
  assert.ok(jepa.knowledge_ids.includes('latent-wm'))
})
