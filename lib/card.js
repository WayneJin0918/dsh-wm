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
    `actions:${result.actions ?? '—'}`,
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

export function renderKnowledge(result) {
  const lines = [`# wm_knowledge  ${result.mode}  ${result.query || '(catalog)'}`]
  if (result.mode === 'catalog') {
    for (const c of result.matches) {
      lines.push(`- ${c.id}  ${c.title}  [${(c.tags || []).join(', ')}]`)
      if (c.summary) lines.push(`    ${c.summary}`)
    }
    return lines.join('\n')
  }
  if (!result.matches?.length) {
    lines.push('no match. catalog:')
    for (const c of result.catalog || []) lines.push(`- ${c.id}  ${c.title}`)
    return lines.join('\n')
  }
  for (const c of result.matches) {
    lines.push('', `## ${c.id} — ${c.title}`, `tags: ${(c.tags || []).join(', ')}`)
    if (c.summary) lines.push(c.summary)
    if (c.body) lines.push('', c.body)
  }
  return lines.join('\n')
}

export function renderDiagnose(result) {
  const lines = [
    '# wm_diagnose',
    `symptom: ${result.symptom}`,
    `knowledge: ${(result.knowledge_ids || []).join(', ') || '—'}`,
    `next: ${(result.next || []).join(' → ')}`,
  ]
  for (const c of result.matches || []) {
    lines.push('', `## ${c.id} — ${c.title}`)
    if (c.summary) lines.push(c.summary)
  }
  return lines.join('\n')
}

export function renderInspect(result) {
  const lines = [
    '# wm_inspect',
    `path: ${result.path}`,
    `n=${result.n}  picked=${(result.picked || []).join(',')}`,
    `sheet: ${result.sheet}`,
  ]
  if (result.run) lines.push(`run:  ${result.run}`)
  lines.push('', 'tiles:')
  for (const t of result.tiles || []) {
    lines.push(
      `  ${t.role} #${t.index}  ${t.width}x${t.height}  luma=${t.luma}  contrast=${t.contrast}  ${t.look}  ${t.name}`,
    )
    for (const row of t.sketch || []) lines.push(`    ${row}`)
  }
  if (result.warnings?.length) {
    lines.push('', 'warnings:')
    for (const w of result.warnings) lines.push(`  - ${w}`)
  }
  return lines.join('\n')
}

export function renderView(result) {
  const lines = [
    '# wm_view',
    `page:  ${result.page}`,
    `sheet: ${result.sheet}`,
    `n=${result.n}  mean_ssim=${num(result.mean_ssim)}  min_ssim=${num(result.min_ssim)}  actions=${result.actions}`,
    `diagnosis: ${result.diagnosis}`,
    `picked compare rows: ${(result.picked || []).join(',')}`,
  ]
  if (result.worst?.length) {
    lines.push('worst frames:')
    for (const w of result.worst) {
      lines.push(`  #${w.index}  ssim=${num(w.ssim)}`)
    }
  }
  lines.push('', 'open the HTML page for side-by-side / swipe / diff heat and the action HUD.')
  if (result.warnings?.length) {
    lines.push('', 'warnings:')
    for (const w of result.warnings) lines.push(`  - ${w}`)
  }
  return lines.join('\n')
}
