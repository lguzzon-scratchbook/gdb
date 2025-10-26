import fs from 'node:fs'
import path from 'node:path'

export class FileWriter {
  constructor(outputDir) {
    this.outputDir = outputDir
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
  }

  writeModules(modules) {
    this.ensureOutputDir()

    const modulesDir = path.join(this.outputDir, 'modules')
    if (!fs.existsSync(modulesDir)) {
      fs.mkdirSync(modulesDir, { recursive: true })
    }

    for (const mod of modules) {
      const filePath = path.join(modulesDir, mod.filename)
      fs.writeFileSync(filePath, mod.code, 'utf-8')
    }

    return modulesDir
  }

  writeOrchestrator(orchestratorCode, filename = 'index.js') {
    this.ensureOutputDir()
    const filePath = path.join(this.outputDir, filename)
    fs.writeFileSync(filePath, orchestratorCode, 'utf-8')
    return filePath
  }

  writeManifest(manifest, filename = 'manifest.json') {
    this.ensureOutputDir()
    const filePath = path.join(this.outputDir, filename)
    fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2), 'utf-8')
    return filePath
  }

  writeDependencyGraph(graph, filename = 'dependencies.json') {
    this.ensureOutputDir()
    const filePath = path.join(this.outputDir, filename)

    const graphData = {}
    for (const [funcName, deps] of graph) {
      graphData[funcName] = deps
    }

    fs.writeFileSync(filePath, JSON.stringify(graphData, null, 2), 'utf-8')
    return filePath
  }

  writeExtractionReport(result, filename = 'report.json') {
    this.ensureOutputDir()
    const filePath = path.join(this.outputDir, filename)

    const report = {
      timestamp: new Date().toISOString(),
      totalFunctions: result.functions.length,
      totalModules: result.modules.length,
      functions: result.functions,
      modules: result.modules.map((m) => ({
        filename: m.filename,
        size: m.code ? m.code.length : 0
      })),
      errors: result.errors,
      warnings: result.warnings
    }

    fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8')
    return filePath
  }

  writePackageJson(outputDir = this.outputDir) {
    const packageJson = {
      name: 'extracted-modules',
      version: '1.0.0',
      type: 'module',
      main: 'index.js',
      exports: {
        '.': './index.js'
      }
    }

    const filePath = path.join(outputDir, 'package.json')
    fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2), 'utf-8')
    return filePath
  }

  getAllFiles() {
    const files = []
    const modulesDir = path.join(this.outputDir, 'modules')

    if (fs.existsSync(modulesDir)) {
      for (const file of fs.readdirSync(modulesDir)) {
        files.push({
          type: 'module',
          path: path.join(modulesDir, file),
          filename: file
        })
      }
    }

    const indexPath = path.join(this.outputDir, 'index.js')
    if (fs.existsSync(indexPath)) {
      files.push({
        type: 'orchestrator',
        path: indexPath,
        filename: 'index.js'
      })
    }

    return files
  }
}

export default FileWriter
