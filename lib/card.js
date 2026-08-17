function num(v, digits = 3) {
  if (v == null || Number.isNaN(v)) return 'n/a'
  if (!Number.isFinite(v)) return String(v)
  return Number(v).toFixed(digits)
}

export function renderDiscover(result) {
  const lines = [
    `# wm_discover  ${result.name}`,
    `layout: ${result.layout}`,
    `path:   ${result.path}`,
    `pred:   ${result.pred ?? '—'}  (${result.n_frames.pred} frames)`,
    `gt:     ${result.gt ?? '—'}  (${result.n_frames.gt} frames)`,
    `log:    ${result.log ?? '—'}`,
    `metrics:${result.metrics ?? '—'}`,
  ]
  if (result.warnings?.length) {
    lines.push('warnings:')
    for (const w of result.warnings) lines.push(`  - ${w}`)
  }
  return lines.join('\n')
}

export function renderSummarize(result) {
  const lines = [
    `# wm_summarize  ${result.name}`,
    `layout: ${result.layout}   last_step: ${result.last_step ?? '—'}   last_loss: ${num(result.last_loss, 4)}   nan: ${result.loss_nan}   early_stop: ${result.early_stop}`,
    '',
    'metrics:',
  ]
  if (!result.metrics_rows?.length) lines.push('  (none)')
  for (const row of result.metrics_rows.slice(0, 16)) {
    lines.push(`  ${row.key}: ${row.value}`)
  }
  lines.push('', 'hypotheses:')
  result.hypotheses.forEach((h, i) => lines.push(`  ${i + 1}. ${h}`))
  if (result.log_tail?.length) {
    lines.push('', 'log tail:')
    for (const line of result.log_tail) lines.push(`  ${line}`)
  }
  if (result.warnings?.length) {
    lines.push('', 'warnings:')
    for (const w of result.warnings) lines.push(`  - ${w}`)
  }
  return lines.join('\n')
}

export function renderDiff(result) {
  const lines = [
    '# wm_rollout_diff',
    `pred: ${result.pred}`,
    `gt:   ${result.gt}`,
    `n=${result.n}  mean_ssim=${num(result.mean_ssim)}  min_ssim=${num(result.min_ssim)}  mean_mse=${num(result.mean_mse, 1)}`,
    `first_half=${num(result.first_half_ssim)}  second_half=${num(result.second_half_ssim)}`,
    `diagnosis: ${result.diagnosis}`,
    '',
    'worst frames:',
  ]
  for (const w of result.worst) {
    lines.push(`  #${w.index}  ssim=${num(w.ssim)}  ${w.pred_name}`)
  }
  lines.push('', 'curve:')
  lines.push(`  ${result.curve.map((p) => `${p.index}:${p.ssim}`).join('  ')}`)
  if (result.warnings?.length) {
    lines.push('', 'warnings:')
    for (const w of result.warnings) lines.push(`  - ${w}`)
  }
  return lines.join('\n')
}
