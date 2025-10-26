export class Logger {
  constructor(verbose = false) {
    this.verbose = verbose
    this.indentLevel = 0
  }

  setVerbose(verbose) {
    this.verbose = verbose
  }

  log(message, level = 'info') {
    if (!this.verbose && level === 'debug') return
    const indent = '  '.repeat(this.indentLevel)
    console.log(`${indent}${message}`)
  }

  debug(message) {
    this.log(`[DEBUG] ${message}`, 'debug')
  }

  info(message) {
    this.log(`[INFO] ${message}`, 'info')
  }

  warn(message) {
    const indent = '  '.repeat(this.indentLevel)
    console.warn(`${indent}[WARN] ${message}`)
  }

  error(message) {
    const indent = '  '.repeat(this.indentLevel)
    console.error(`${indent}[ERROR] ${message}`)
  }

  section(title) {
    if (!this.verbose) return
    this.log(`\n▶ ${title}`)
    this.indentLevel++
  }

  endSection() {
    if (!this.verbose) return
    this.indentLevel = Math.max(0, this.indentLevel - 1)
  }

  step(message, details = '') {
    if (!this.verbose) return
    const detailsStr = details ? ` [${details}]` : ''
    this.log(`✓ ${message}${detailsStr}`)
  }

  startStep(message) {
    if (!this.verbose) return
    this.log(`⟳ ${message}...`)
    this.indentLevel++
  }

  endStep(message = '') {
    if (!this.verbose) return
    this.indentLevel = Math.max(0, this.indentLevel - 1)
    if (message) {
      this.log(`✓ ${message}`)
    }
  }

  listItem(item, level = 1) {
    if (!this.verbose) return
    const indent = '  '.repeat(this.indentLevel + level - 1)
    console.log(`${indent}• ${item}`)
  }

  table(headers, rows) {
    if (!this.verbose) return
    const colWidths = headers.map((h, i) =>
      Math.max(h.length, ...rows.map((r) => String(r[i] || '').length))
    )
    const indent = '  '.repeat(this.indentLevel)

    const headerStr = headers.map((h, i) => h.padEnd(colWidths[i])).join(' | ')
    console.log(`${indent}${headerStr}`)
    console.log(`${indent}${colWidths.map((w) => '-'.repeat(w)).join('-+-')}`)

    for (const row of rows) {
      const rowStr = row
        .map((r, i) => String(r || '').padEnd(colWidths[i]))
        .join(' | ')
      console.log(`${indent}${rowStr}`)
    }
  }
}

export default Logger
