import { readFileSync } from 'node:fs'
import { discover } from './discover.js'

const LOSS_RE = /loss(?:[_\s]*[:\/=]|)\s*([-+0-9.eE]+|nan|NaN|inf|Inf)/g
const STEP_RE = /\[?(?:step|iter|iteration|global_step)[\]_\s]*[=:]?\s*(\d+)/i
const EARLY_RE = /early.?stop|stopped early|keyboardinterrupt|nan detected|loss exploded/i

function tailLines(text, n) {
  const lines = String(text).split(/\r?\n/)
  return lines.slice(Math.max(0, lines.length - n))
}

function parseLosses(lines) {
  const losses = []
  for (const line of lines) {
    LOSS_RE.lastIndex = 0
    let m
    while ((m = LOSS_RE.exec(line))) {
      const raw = m[1]
      const value = /nan/i.test(raw) ? NaN : /inf/i.test(raw) ? Infinity : Number(raw)
      losses.push(value)
    }
  }
  return losses
}

function lastStep(lines) {
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = lines[i].match(STEP_RE)
    if (m) return Number(m[1])
  }
  return null
}

function flattenMetrics(value, prefix = '', out = [], depth = 0) {
  if (depth > 3) return out
  if (value == null) return out
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
    out.push({ key: prefix || 'value', value })
    return out
  }
  if (Array.isArray(value)) {
    out.push({ key: prefix || 'list', value: `list[${value.length}]` })
    if (value.length && typeof value[0] === 'object') flattenMetrics(value[0], `${prefix || 'item'}[0]`, out, depth + 1)
    return out
  }
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      const next = prefix ? `${prefix}.${k}` : k
      flattenMetrics(v, next, out, depth + 1)
    }
  }
  return out
}

function pickNumber(rows, pattern) {
  const row = rows.find((r) => pattern.test(r.key) && typeof r.value === 'number')
  return row ? { key: row.key, value: row.value } : null
}

function hypotheses({ losses, early, metricsRows, layout }) {
  const items = []
  const last = losses.at(-1)
  const hasNan = losses.some((v) => !Number.isFinite(v))
  const revisit = pickNumber(metricsRows, /revisit|loop|lvc|rm\b/i)
  const ssim = pickNumber(metricsRows, /ssim/i)
  const action = pickNumber(metricsRows, /action|acc|follow/i)
  const flicker = pickNumber(metricsRows, /flicker|flash|jitter/i)

  if (hasNan) {
    items.push('Loss contains NaN/Inf — inspect the last optimizer step and whether training actually finished.')
  } else if (typeof last === 'number' && losses.length >= 4) {
    const head = losses.slice(0, Math.ceil(losses.length / 2))
    const tail = losses.slice(Math.floor(losses.length / 2))
    const headMean = head.reduce((s, v) => s + v, 0) / head.length
    const tailMean = tail.reduce((s, v) => s + v, 0) / tail.length
    if (tailMean > headMean * 1.15) {
      items.push('Loss rose in the second half of the log tail — check LR, overflow, or a bad shard.')
    }
  }

  if (early) {
    items.push('Log mentions early stop / interrupt / explosion — treat metrics as incomplete until a full run exists.')
  }

  if (revisit && revisit.value < 0.5) {
    items.push(`Revisit/loop metric ${revisit.key}=${revisit.value} is weak — run wm_rollout_diff on first vs last (or pose-aligned) frames.`)
  }
  if (ssim && ssim.value < 0.75) {
    items.push(`SSIM ${ssim.key}=${ssim.value} is mid/low — diff pred vs GT and check whether the drop is late-horizon.`)
  }
  if (action && action.value < 0.8) {
    items.push(`Action-following ${action.key}=${action.value} is soft — compare action-conditioned windows, not a single still.`)
  }
  if (flicker && flicker.value > 0.03) {
    items.push(`Flicker ${flicker.key}=${flicker.value} is high — look at consecutive-frame diffs around chunk boundaries.`)
  }

  if (!items.length) {
    items.push('No obvious train-log failure — run wm_rollout_diff before claiming the run is good.')
  }
  if (layout === 'heuristic' || layout === 'unknown') {
    items.push('Layout was guessed without wm.yaml — confirm pred/gt/log paths before any ablation claim.')
  }
  while (items.length < 3) {
    items.push('Write three paired comparisons (same scene/protocol/seed) before changing memory or cache policy.')
  }
  return items.slice(0, 3)
}

/**
 * Summarize a run: log tail + metrics JSON + three testable hypotheses.
 */
export function summarize(path, { tailLines: n = 80 } = {}) {
  const layout = discover(path)
  let logTail = []
  let logText = ''
  if (layout.log) {
    logText = readFileSync(layout.log, 'utf8')
    logTail = tailLines(logText, n)
  }
  const losses = parseLosses(logTail)
  const early = EARLY_RE.test(logText)
  let metrics = null
  let metricsRows = []
  if (layout.metrics) {
    try {
      metrics = JSON.parse(readFileSync(layout.metrics, 'utf8'))
      metricsRows = flattenMetrics(metrics).slice(0, 40)
    } catch (err) {
      layout.warnings.push(`metrics JSON parse failed: ${err.message}`)
    }
  }
  const lastLoss = losses.at(-1) ?? null
  return {
    ...layout,
    last_step: lastStep(logTail),
    last_loss: lastLoss,
    loss_nan: losses.some((v) => !Number.isFinite(v)),
    early_stop: early,
    metrics_rows: metricsRows,
    hypotheses: hypotheses({
      losses,
      early,
      metricsRows,
      layout: layout.layout,
    }),
    log_tail: logTail.slice(-12),
  }
}
