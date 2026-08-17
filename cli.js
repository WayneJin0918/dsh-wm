#!/usr/bin/env node
import { resolve } from 'node:path'
import { renderDiagnose, renderDiff, renderDiscover, renderKnowledge, renderSummarize } from './lib/card.js'
import { discover } from './lib/discover.js'
import { rolloutDiff } from './lib/diff.js'
import { diagnoseProblem, lookupKnowledge } from './lib/knowledge.js'
import { summarize } from './lib/summarize.js'

function flag(args, name, fallback) {
  const i = args.indexOf(name)
  if (i < 0 || i === args.length - 1) return fallback
  return args[i + 1]
}

function usage() {
  return `dsh-wm — world-model research tools (no DeepSeek Harness required)

Usage:
  node cli.js discover <run-dir>
  node cli.js summarize <run-dir> [--tail 80]
  node cli.js diff --pred <path> --gt <path> [--max-frames 64]
  node cli.js knowledge [query]
  node cli.js knowledge --id chunk-ar
  node cli.js diagnose <symptom...>
`
}

const [cmd, ...rest] = process.argv.slice(2)
if (!cmd || cmd === '-h' || cmd === '--help') {
  process.stdout.write(usage())
  process.exit(cmd ? 0 : 1)
}

if (cmd === 'discover') {
  const path = rest[0]
  if (!path) {
    process.stderr.write(usage())
    process.exit(1)
  }
  process.stdout.write(`${renderDiscover(discover(resolve(path)))}\n`)
} else if (cmd === 'summarize') {
  const path = rest.find((a) => !a.startsWith('--'))
  if (!path) {
    process.stderr.write(usage())
    process.exit(1)
  }
  const tail = Number(flag(rest, '--tail', 80))
  process.stdout.write(`${renderSummarize(summarize(resolve(path), { tailLines: tail }))}\n`)
} else if (cmd === 'diff') {
  const pred = flag(rest, '--pred')
  const gt = flag(rest, '--gt')
  if (!pred || !gt) {
    process.stderr.write(usage())
    process.exit(1)
  }
  const maxFrames = Number(flag(rest, '--max-frames', 64))
  process.stdout.write(`${renderDiff(rolloutDiff(resolve(pred), resolve(gt), { maxFrames }))}\n`)
} else if (cmd === 'knowledge') {
  const id = flag(rest, '--id')
  const query = rest.filter((a) => a !== '--id' && a !== id).join(' ')
  process.stdout.write(`${renderKnowledge(lookupKnowledge({ query, id }))}\n`)
} else if (cmd === 'diagnose') {
  const symptom = rest.join(' ')
  if (!symptom) {
    process.stderr.write(usage())
    process.exit(1)
  }
  process.stdout.write(`${renderDiagnose(diagnoseProblem(symptom))}\n`)
} else {
  process.stderr.write(usage())
  process.exit(1)
}
