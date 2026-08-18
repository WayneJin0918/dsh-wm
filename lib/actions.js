import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ACTION_FILES = [
  'actions.json',
  'action.json',
  'actions.jsonl',
  'control.json',
  'controls.json',
  'actions.csv',
]

function isFile(path) {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

function asNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function labelFrom(raw, index) {
  if (raw == null) return `a${index}`
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  if (typeof raw === 'number' && Number.isFinite(raw)) return `id ${raw}`
  if (typeof raw === 'object') {
    for (const key of ['name', 'action', 'label', 'cmd', 'type', 'id']) {
      if (raw[key] != null && String(raw[key]).trim() !== '') return String(raw[key])
    }
  }
  return `a${index}`
}

function vectorFrom(raw) {
  if (raw == null) return { dx: 0, dy: 0, yaw: null, steer: null }
  if (Array.isArray(raw)) {
    return { dx: asNumber(raw[0]) ?? 0, dy: asNumber(raw[1]) ?? 0, yaw: asNumber(raw[2]), steer: null }
  }
  if (typeof raw === 'number') return { dx: raw, dy: 0, yaw: null, steer: null }
  if (typeof raw !== 'object') return { dx: 0, dy: 0, yaw: null, steer: null }
  const dx = asNumber(raw.dx) ?? asNumber(raw.x) ?? asNumber(raw.forward) ?? 0
  const dy = asNumber(raw.dy) ?? asNumber(raw.y) ?? asNumber(raw.strafe) ?? 0
  const yaw = asNumber(raw.yaw) ?? asNumber(raw.heading) ?? asNumber(raw.camera_yaw)
  const steer = asNumber(raw.steer) ?? asNumber(raw.steering)
  return { dx, dy, yaw, steer }
}

/**
 * Normalize one action record to a HUD-friendly object.
 * @param {unknown} raw
 * @param {number} index
 */
export function normalizeAction(raw, index) {
  const vec = vectorFrom(raw)
  const followed =
    raw && typeof raw === 'object' && !Array.isArray(raw) && 'followed' in raw
      ? Boolean(raw.followed)
      : null
  return {
    index,
    label: labelFrom(raw, index),
    dx: vec.dx,
    dy: vec.dy,
    yaw: vec.yaw,
    steer: vec.steer,
    followed,
    raw: raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : { value: raw },
  }
}

function parseJsonish(text, path) {
  const trimmed = text.trim()
  if (!trimmed) return []
  if (path.endsWith('.jsonl')) {
    return trimmed
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line))
  }
  if (path.endsWith('.csv')) {
    const lines = trimmed.split(/\r?\n/).filter((line) => line.trim())
    const header = lines[0].split(',').map((s) => s.trim().toLowerCase())
    const rows = header.some((h) => /name|action|dx|dy|yaw/.test(h)) ? lines.slice(1) : lines
    const keys = header.some((h) => /name|action|dx|dy|yaw/.test(h))
      ? header
      : ['name', 'dx', 'dy', 'yaw']
    return rows.map((line) => {
      const cols = line.split(',').map((s) => s.trim())
      const obj = {}
      keys.forEach((k, i) => {
        obj[k] = cols[i]
      })
      return obj
    })
  }
  return JSON.parse(trimmed)
}

function toList(parsed) {
  if (Array.isArray(parsed)) return parsed
  if (parsed && typeof parsed === 'object') {
    for (const key of ['actions', 'action', 'controls', 'control', 'traj', 'trajectory']) {
      if (Array.isArray(parsed[key])) return parsed[key]
    }
  }
  return []
}

/**
 * Load actions from a JSON / JSONL / CSV file.
 * @param {string} path
 * @param {number} [n]
 */
export function loadActions(path, n) {
  const list = toList(parseJsonish(readFileSync(path, 'utf8'), path))
  const cap = n != null ? Math.min(n, list.length) : list.length
  return Array.from({ length: cap }, (_, i) => {
    const raw = list[i]
    const indexed =
      raw && typeof raw === 'object' && !Array.isArray(raw) && Number.isInteger(Number(raw.index))
        ? Number(raw.index)
        : i
    return normalizeAction(raw, indexed)
  })
}

export function findActionsFile(root, declared) {
  if (declared) {
    const abs = declared
    return isFile(abs) ? abs : null
  }
  for (const name of ACTION_FILES) {
    const path = join(root, name)
    if (existsSync(path) && isFile(path)) return path
  }
  return null
}

export function actionArrowDeg(action) {
  if (!action) return 0
  if (action.yaw != null) return action.yaw
  if (action.steer != null) return action.steer * 45
  if (action.dx === 0 && action.dy === 0) return 0
  return (Math.atan2(action.dy, action.dx) * 180) / Math.PI
}
