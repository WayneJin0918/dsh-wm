#!/usr/bin/env node
import { resolve } from 'node:path'
import { renderDiff, renderDiscover, renderSummarize } from './lib/card.js'
import { discover } from './lib/discover.js'
import { rolloutDiff } from './lib/diff.js'
import { summarize } from './lib/summarize.js'

function flag(args, name, fallback) {
  const i = args.indexOf(name)
  if (i < 0 || i === args.length - 1) return fallback
  return args[i + 1]
}

function usage() {
  return `dsh-wm — world-model run tools (no DeepSeek Harness required)

Usage:
  node cli.js discover <run-dir>
  node cli.js summarize <run-dir> [--tail 80]
  node cli.js diff --pred <path> --gt <path> [--max-frames 64]
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
} else {
  process.stderr.write(usage())
  process.exit(1)
}
