import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { test } from 'node:test'

test('package.json declares an official dsh bundle', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.equal(pkg.name, 'dsh-wm')
  assert.equal(pkg.type, 'module')
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml')
  assert.ok(!pkg.scripts.prepare)
  assert.ok(pkg.keywords.includes('dsh-plugin'))
})

test('cordis.patch.yml inserts this package', () => {
  const text = readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
  assert.match(text, /name:\s*dsh-wm/)
  assert.match(text, /id:\s*dsh-wm/)
})

test('skills ship with name and description', () => {
  const names = readdirSync(new URL('../skills', import.meta.url))
  assert.deepEqual(names.sort(), [
    'wm-ablation',
    'wm-knowledge',
    'wm-revisit',
    'wm-rsi',
    'wm-run-triage',
  ])
  for (const name of names) {
    const text = readFileSync(new URL(`../skills/${name}/SKILL.md`, import.meta.url), 'utf8')
    assert.match(text, /^---\n/)
    assert.match(text, /name: /)
    assert.match(text, /description: /)
    assert.match(text, /whenToUse: /)
  }
})
