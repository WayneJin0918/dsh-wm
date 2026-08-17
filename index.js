import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderDiagnose, renderDiff, renderDiscover, renderKnowledge, renderSummarize } from './lib/card.js'
import { discover } from './lib/discover.js'
import { rolloutDiff } from './lib/diff.js'
import { diagnoseProblem, lookupKnowledge } from './lib/knowledge.js'
import { summarize } from './lib/summarize.js'

const here = dirname(fileURLToPath(import.meta.url))

export const name = 'dsh-wm'
export const inject = ['tools', 'skills']

function parseSkill(dir) {
  const text = readFileSync(join(dir, 'SKILL.md'), 'utf8')
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) throw new Error(`SKILL.md missing frontmatter: ${dir}`)
  const meta = {}
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':')
    if (colon < 1) continue
    const key = line.slice(0, colon).trim()
    let value = line.slice(colon + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    meta[key] = value
  }
  return {
    name: meta.name,
    description: meta.description,
    whenToUse: meta.whenToUse ?? meta.description,
    body: match[2].trim(),
  }
}

function loadSkills() {
  const root = join(here, 'skills')
  return readdirSync(root, { withFileTypes: true })
    .filter((ent) => ent.isDirectory())
    .map((ent) => parseSkill(join(root, ent.name)))
}

export function apply(ctx) {
  if (!defineToolRef) {
    throw new Error('dsh-wm needs @deepseek-ai/dsh-tools in the Harness profile (peerDependency).')
  }
  const defineTool = defineToolRef

  ctx.tools.register(defineTool({
    name: 'wm_discover',
    description:
      'Inspect a world-model run directory. Reads optional wm.yaml, otherwise uses heuristics. Call this before summarizing or diffing.',
    parameters: {
      path: { type: 'string', required: true, description: 'Run directory or repo root' },
    },
    output: {
      schema: { type: 'object' },
      render: (_args, value) => [{ type: 'text', text: renderDiscover(value) }],
    },
    async execute(args) {
      return discover(args.path)
    },
  }))

  ctx.tools.register(defineTool({
    name: 'wm_summarize',
    description:
      'Summarize a world-model run: log tail, metrics JSON keys, last loss / NaN / early-stop, and three testable failure hypotheses. Does not call a GPU.',
    parameters: {
      path: { type: 'string', required: true, description: 'Run directory' },
      tail_lines: { type: 'number', description: 'Log lines to read from the end (default 80)' },
    },
    output: {
      schema: { type: 'object' },
      render: (_args, value) => [{ type: 'text', text: renderSummarize(value) }],
    },
    async execute(args) {
      return summarize(args.path, { tailLines: args.tail_lines ?? 80 })
    },
  }))

  ctx.tools.register(defineTool({
    name: 'wm_rollout_diff',
    description:
      'Compare pred vs GT frame directories or videos with pure-JS luminance SSIM and MSE. Returns mean/min SSIM, a curve, the worst frames, and a one-line diagnosis. Videos need ffmpeg. This release has no LPIPS.',
    parameters: {
      pred: { type: 'string', required: true, description: 'Prediction frames directory, image, or video' },
      gt: { type: 'string', required: true, description: 'Ground-truth frames directory, image, or video' },
      max_frames: { type: 'number', description: 'Max paired frames (default 64)' },
    },
    output: {
      schema: { type: 'object' },
      render: (_args, value) => [{ type: 'text', text: renderDiff(value) }],
    },
    async execute(args) {
      return rolloutDiff(args.pred, args.gt, { maxFrames: args.max_frames ?? 64 })
    },
  }))

  ctx.tools.register(defineTool({
    name: 'wm_knowledge',
    description:
      'Look up built-in world-model technique cards: chunk-AR, memory types, KV memory, exposure bias, revisit eval, ablation, action following, cache eviction, RSI-in-Harness. Empty query lists the catalog; id opens one card.',
    parameters: {
      query: { type: 'string', description: 'Free-text search (memory, revisit, RSI, KV, …)' },
      id: { type: 'string', description: 'Exact card id, e.g. chunk-ar, rsi-harness' },
    },
    output: {
      schema: { type: 'object' },
      render: (_args, value) => [{ type: 'text', text: renderKnowledge(value) }],
    },
    async execute(args) {
      return lookupKnowledge({ query: args.query, id: args.id })
    },
  }))

  ctx.tools.register(defineTool({
    name: 'wm_diagnose',
    description:
      'Map a world-model symptom (late collapse, forgotten room, ignored action, one-seed win, …) to knowledge cards and the next DSH-WM / RSI step. Use before inventing a new architecture.',
    parameters: {
      symptom: { type: 'string', required: true, description: 'What you observed in the run or the paper claim' },
    },
    output: {
      schema: { type: 'object' },
      render: (_args, value) => [{ type: 'text', text: renderDiagnose(value) }],
    },
    async execute(args) {
      return diagnoseProblem(args.symptom)
    },
  }))

  for (const skill of loadSkills()) {
    ctx.skills.register(skill)
  }
}

let defineToolRef = null
try {
  const mod = await import('@deepseek-ai/dsh-tools')
  defineToolRef = mod.defineTool
} catch {
  defineToolRef = null
}
