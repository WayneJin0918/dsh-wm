import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'knowledge')

function parseCard(text, file) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) throw new Error(`knowledge card missing frontmatter: ${file}`)
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
    if (key === 'tags') {
      value = value.split(',').map((t) => t.trim()).filter(Boolean)
    }
    meta[key] = value
  }
  return {
    id: meta.id || file.replace(/\.md$/, ''),
    title: meta.title || meta.id,
    tags: meta.tags || [],
    summary: meta.summary || '',
    body: match[2].trim(),
  }
}

let cache = null

export function loadCards() {
  if (cache) return cache
  cache = readdirSync(root)
    .filter((name) => name.endsWith('.md'))
    .map((name) => parseCard(readFileSync(join(root, name), 'utf8'), name))
    .sort((a, b) => a.id.localeCompare(b.id))
  return cache
}

function score(card, query) {
  const q = query.toLowerCase()
  const hay = [card.id, card.title, card.summary, card.tags.join(' '), card.body]
    .join('\n')
    .toLowerCase()
  if (card.id === q) return 100
  if (card.id.includes(q) || q.includes(card.id)) return 80
  let n = 0
  for (const token of q.split(/[\s,/|]+/).filter((t) => t.length > 1)) {
    if (hay.includes(token)) n += 1
  }
  return n
}

/**
 * List or retrieve built-in world-model knowledge cards.
 * @param {{ query?: string, id?: string }} opts
 */
export function lookupKnowledge({ query, id } = {}) {
  const cards = loadCards()
  if (id) {
    const hit = cards.find((c) => c.id === id)
    return {
      mode: 'card',
      query: id,
      matches: hit ? [hit] : [],
      catalog: cards.map((c) => ({ id: c.id, title: c.title, tags: c.tags })),
    }
  }
  if (!query || !String(query).trim()) {
    return {
      mode: 'catalog',
      query: '',
      matches: cards.map((c) => ({
        id: c.id,
        title: c.title,
        tags: c.tags,
        summary: c.summary,
      })),
      catalog: cards.map((c) => ({ id: c.id, title: c.title, tags: c.tags })),
    }
  }
  const ranked = cards
    .map((c) => ({ card: c, score: score(c, String(query)) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
  return {
    mode: 'search',
    query,
    matches: ranked.slice(0, 4).map((r) => r.card),
    catalog: cards.map((c) => ({ id: c.id, title: c.title, tags: c.tags })),
  }
}

/** Map a free-text symptom to knowledge ids and next tools. */
export function diagnoseProblem(symptom) {
  const found = lookupKnowledge({ query: symptom })
  const ids = found.matches.map((c) => c.id)
  const next = []
  const s = String(symptom).toLowerCase()
  if (/log|loss|nan|train|run/.test(s)) next.push('wm_summarize')
  if (/ssim|drift|blur|flash|pred|gt|rollout|collapse|horizon|melt|forget|漂|崩/.test(s)) {
    next.push('wm_rollout_diff')
  }
  if (/see|look|inspect|glance|worst frame|看图|看帧|最差帧/.test(s)) {
    next.push('wm_inspect')
  }
  if (/revisit|loop|return|回环/.test(s)) next.push('skill:wm-revisit')
  if (/ablat|seed|fair|消融/.test(s)) next.push('skill:wm-ablation')
  if (/rsi|evolv|harness|creator|skill|prompt/.test(s)) next.push('skill:wm-rsi')
  if (!next.length) next.push('wm_knowledge', 'skill:wm-knowledge')
  else next.unshift('wm_knowledge')
  return {
    symptom,
    knowledge_ids: ids,
    next,
    matches: found.matches,
  }
}
