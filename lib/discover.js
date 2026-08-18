import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { findActionsFile } from './actions.js'
import { countFrames, isVideoPath, listImages } from './frames.js'
import { parseSimpleYaml } from './yaml.js'

const PRED_NAMES = ['pred', 'preds', 'prediction', 'predictions', 'recon', 'recons', 'output', 'outputs']
const GT_NAMES = ['gt', 'gts', 'target', 'targets', 'label', 'labels', 'ref', 'reference']
const LOG_NAMES = ['train.log', 'training.log', 'run.log']
const METRIC_EXACT = ['metrics.json', 'metric.json', 'eval.json', 'results.json']

function isDir(path) {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

function isFile(path) {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

function firstExisting(root, rels) {
  for (const rel of rels) {
    const path = join(root, rel)
    if (existsSync(path)) return path
  }
  return null
}

function findNamedDir(root, names) {
  const hit = firstExisting(root, names)
  if (hit && (isDir(hit) || isVideoPath(hit))) return hit
  try {
    for (const name of readdirSync(root)) {
      const lower = name.toLowerCase()
      if (!names.some((n) => lower === n || lower.startsWith(`${n}.`))) continue
      const path = join(root, name)
      if (isDir(path) || isVideoPath(path)) return path
    }
  } catch {
    /* empty */
  }
  return null
}

function findLog(root) {
  const direct = firstExisting(root, LOG_NAMES)
  if (direct) return direct
  const logsDir = join(root, 'logs')
  if (isDir(logsDir)) {
    const nested = firstExisting(logsDir, LOG_NAMES)
    if (nested) return nested
    try {
      const logs = readdirSync(logsDir)
        .filter((n) => n.endsWith('.log'))
        .map((n) => join(logsDir, n))
      if (logs.length) return logs.sort()[0]
    } catch {
      /* empty */
    }
  }
  try {
    const logs = readdirSync(root).filter((n) => n.endsWith('.log'))
    if (logs.length) return join(root, logs.sort()[0])
  } catch {
    /* empty */
  }
  return null
}

function findMetrics(root) {
  const exact = firstExisting(root, METRIC_EXACT)
  if (exact) return exact
  try {
    const names = readdirSync(root).filter((n) => /eval|metric|result/i.test(n) && n.endsWith('.json'))
    if (names.length) return join(root, names.sort()[0])
  } catch {
    /* empty */
  }
  return null
}

function loadManifest(root) {
  const path = join(root, 'wm.yaml')
  if (!isFile(path)) return { manifest: null, source: 'heuristic' }
  const parsed = parseSimpleYaml(readFileSync(path, 'utf8'))
  const resolveMaybe = (rel) => {
    if (rel == null || rel === '') return null
    const abs = resolve(root, String(rel))
    return existsSync(abs) ? abs : abs
  }
  return {
    source: 'wm.yaml',
    manifest: {
      name: parsed.name ?? basename(root),
      pred: resolveMaybe(parsed.pred),
      gt: resolveMaybe(parsed.gt),
      log: resolveMaybe(parsed.log),
      metrics: resolveMaybe(parsed.metrics),
      actions: resolveMaybe(parsed.actions),
    },
    missing: ['pred', 'gt', 'log', 'metrics', 'actions']
      .filter((key) => parsed[key] && !existsSync(resolve(root, String(parsed[key]))))
      .map((key) => `${key}=${parsed[key]}`),
  }
}

/**
 * Discover a world-model run directory.
 * @param {string} path run root or repo root
 */
export function discover(path) {
  const root = resolve(path)
  if (!existsSync(root)) {
    return {
      path: root,
      layout: 'missing',
      name: basename(root),
      pred: null,
      gt: null,
      log: null,
      metrics: null,
      actions: null,
      n_frames: { pred: 0, gt: 0 },
      warnings: [`path does not exist: ${root}`],
    }
  }

  const loaded = loadManifest(root)
  const pred = loaded.manifest?.pred ?? findNamedDir(root, PRED_NAMES)
  const gt = loaded.manifest?.gt ?? findNamedDir(root, GT_NAMES)
  const log = loaded.manifest?.log ?? findLog(root)
  const metrics = loaded.manifest?.metrics ?? findMetrics(root)
  const actions = findActionsFile(root, loaded.manifest?.actions)
  const warnings = [...(loaded.missing ?? [])]
  if (loaded.source === 'heuristic') {
    warnings.push('no wm.yaml; used directory heuristics')
  }
  if (!pred) warnings.push('pred not found')
  if (!gt) warnings.push('gt not found')
  if (!log) warnings.push('log not found')
  if (!metrics) warnings.push('metrics not found')

  const nPred = pred ? countFrames(pred) : 0
  const nGt = gt ? countFrames(gt) : 0
  if (pred && nPred === 0) warnings.push(`pred has no frames: ${pred}`)
  if (gt && nGt === 0) warnings.push(`gt has no frames: ${gt}`)

  let layout = loaded.source
  if (!pred && !gt && !log && !metrics) layout = 'unknown'

  return {
    path: root,
    layout,
    name: loaded.manifest?.name ?? basename(root),
    pred,
    gt,
    log,
    metrics,
    actions,
    n_frames: { pred: nPred, gt: nGt },
    candidates: {
      images: isDir(root) ? listImages(root).slice(0, 8) : [],
    },
    warnings,
  }
}
