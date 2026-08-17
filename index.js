import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderDiagnose, renderDiff, renderDiscover, renderInspect, renderKnowledge, renderSummarize } from './lib/card.js'
import { discover } from './lib/discover.js'
import { rolloutDiff } from './lib/diff.js'
import { inspectFrames } from './lib/inspect.js'
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
      'Open a world-model run directory: read optional wm.yaml or heuristics, then return layout, pred/gt/log/metrics, frame counts, and warnings. Call this before summarizing, diffing, or inspecting.',
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
      'Summarize a world-model run for the next experiment: log tail, metrics JSON keys, last loss / NaN / early-stop, and three testable hypotheses. No GPU.',
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
      'Score pred vs GT (frames or video) with pure-JS luminance SSIM and MSE. Returns mean/min SSIM, a curve, the worst frames, and a one-line diagnosis. Videos need ffmpeg.',
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
    name: 'wm_inspect',
    description:
      'Look at a world-model strip: sample first/mid/last or named indices from a run, frame dir, image, or video. Writes a contact-sheet PNG and a luma sketch plus color/contrast look per tile. Use after wm_rollout_diff names the worst frames.',
    parameters: {
      path: { type: 'string', required: true, description: 'Run directory, frame directory, image, or video' },
      indices: { type: 'string', description: 'Comma list such as 0,3,7 or first,mid,last' },
      max_tiles: { type: 'number', description: 'Max tiles per strip (default 6)' },
      pair: { type: 'string', description: 'Optional GT strip to stack under pred' },
    },
    output: {
      schema: { type: 'object' },
      render: (_args, value) => {
        const blocks = [{ type: 'text', text: renderInspect(value) }]
        if (value?.sheet && existsSync(value.sheet)) {
          blocks.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: readFileSync(value.sheet).toString('base64'),
            },
          })
        }
        return blocks
      },
    },
    async execute(args) {
      return inspectFrames(args.path, {
        indices: args.indices,
        maxTiles: args.max_tiles ?? 6,
        pair: args.pair,
      })
    },
  }))

  ctx.tools.register(defineTool({
    name: 'wm_knowledge',
    description:
      'Open the built-in WM map. Empty query lists the catalog; id opens one card. Start with wm-routes (3D display, pixel / video-gen, latent prediction), then technique cards (chunk-AR, memory, KV, exposure bias, revisit, ablation, action following, cache eviction, RSI-in-Harness).',
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
      'Map a world-model symptom or paper claim (late collapse, forgotten room, “is Sora a simulator?”, one-seed win) to route/technique cards and the next DSH-WM step. Use before inventing a new architecture.',
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
