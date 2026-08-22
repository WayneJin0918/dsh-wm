#!/usr/bin/env node
import { resolve } from 'node:path'
import { renderDiagnose, renderDiff, renderDiscover, renderInspect, renderKnowledge, renderSummarize, renderView } from './lib/card.js'
import { discover } from './lib/discover.js'
import { rolloutDiff } from './lib/diff.js'
import { inspectFrames } from './lib/inspect.js'
import { writeViewPage } from './lib/view.js'
import { diagnoseProblem, lookupKnowledge } from './lib/knowledge.js'
import { summarize } from './lib/summarize.js'

function flag(args, name, fallback) {
  const i = args.indexOf(name)
  if (i < 0 || i === args.length - 1) return fallback
  return args[i + 1]
}

function usage() {
  return `dsh-wm — playable world-model toolkit (DeepSeek Harness optional)

Try the sunset playground (no GPU):
  node cli.js inspect fixtures/sunset --indices first,mid,last
  node cli.js view fixtures/sunset
  node cli.js diff --pred fixtures/sunset/pred --gt fixtures/sunset/gt --json
  node cli.js diagnose "is Sora a world simulator"
  node cli.js knowledge --id wm-routes

Usage:
  node cli.js discover <run-dir>
  node cli.js summarize <run-dir> [--tail 80]
  node cli.js diff --pred <path> --gt <path> [--max-frames 64] [--json]
  node cli.js knowledge [query]
  node cli.js knowledge --id wm-routes
  node cli.js diagnose <symptom...>
  node cli.js inspect <path> [--indices first,mid,last] [--pair <gt>]
  node cli.js view <run-dir> [--out report.html] [--pair <gt>] [--max-frames 64]
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
  const result = rolloutDiff(resolve(pred), resolve(gt), { maxFrames })
  process.stdout.write(rest.includes('--json') ? `${JSON.stringify(result)}\n` : `${renderDiff(result)}\n`)
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
} else if (cmd === 'inspect') {
  const path = rest.find((a) => !a.startsWith('--'))
  if (!path) {
    process.stderr.write(usage())
    process.exit(1)
  }
  const indices = flag(rest, '--indices')
  const pair = flag(rest, '--pair')
  process.stdout.write(`${renderInspect(inspectFrames(resolve(path), { indices, pair }))}\n`)
} else if (cmd === 'view') {
  const path = rest.find((a) => !a.startsWith('--'))
  if (!path) {
    process.stderr.write(usage())
    process.exit(1)
  }
  const pair = flag(rest, '--pair')
  const out = flag(rest, '--out')
  const maxFrames = Number(flag(rest, '--max-frames', 64))
  process.stdout.write(`${renderView(writeViewPage(resolve(path), { pair, out, maxFrames }))}\n`)
} else {
  process.stderr.write(usage())
  process.exit(1)
}
