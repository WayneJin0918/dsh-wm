/**
 * Minimal YAML reader for the wm.yaml contract (flat key: value).
 * Nested maps and lists are out of scope for the flat wm.yaml contract.
 */

/**
 * @param {string} text
 * @returns {Record<string, string>}
 */
export function parseSimpleYaml(text) {
  return parseFlatYaml(text)
}

export function parseFlatYaml(text) {
  const out = {}
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, '').trim()
    if (!line || line.startsWith('#')) continue
    const sep = line.indexOf(':')
    if (sep <= 0) continue
    const key = line.slice(0, sep).trim()
    let value = line.slice(sep + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key) out[key] = value
  }
  return out
}
