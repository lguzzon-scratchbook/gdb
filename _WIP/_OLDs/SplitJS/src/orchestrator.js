import HashUtil from './hashUtil.js'

export class Orchestrator {
  constructor(dependencyGraph, nameMapping = {}) {
    this.dependencyGraph = dependencyGraph
    this.nameMapping = nameMapping
  }

  generateOrchestratorFile(modules, functions) {
    let code = ''

    code += '// Auto-generated orchestrator file\n'
    code += '// This file coordinates all extracted modules\n\n'

    const importedNames = new Set()
    const validImports = []

    for (const mod of modules) {
      const sanitizedName = this._extractModuleName(mod.filename)
      const originalName = this.nameMapping[sanitizedName] || sanitizedName
      const filename = mod.filename.replace(/\.js$/, '')

      // Validate that both the identifier and original name are valid
      if (this._isValidIdentifier(sanitizedName) && this._isValidIdentifier(originalName) && !importedNames.has(sanitizedName)) {
        importedNames.add(sanitizedName)
        validImports.push({ sanitized: sanitizedName, original: originalName, filename })
      }
    }

    for (const imp of validImports) {
      code += `import { ${imp.original} } from './${imp.filename}'\n`
    }

    code += '\n'
    code += '// Re-export all modules\n'

    for (const imp of validImports) {
      code += `export { ${imp.original} }\n`
    }

    code += '\n'
    code += this._generateModuleManifest(modules)

    return code
  }

  generateDependencyGraph() {
    const graph = {}

    for (const [funcName, deps] of this.dependencyGraph) {
      graph[funcName] = {
        internal: deps.internal || [],
        external: deps.external || []
      }
    }

    return graph
  }

  generateModuleManifest(modules) {
    const manifest = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      modules: modules.map((mod) => ({
        filename: mod.filename,
        dependencies: mod.dependencies,
        closures: mod.closures || []
      })),
      dependencyGraph: this.generateDependencyGraph()
    }

    return manifest
  }

  _generateModuleManifest(modules) {
    const manifest = this.generateModuleManifest(modules)
    return `export const __manifest__ = ${JSON.stringify(manifest, null, 2)}\n`
  }

  _extractModuleName(filename) {
    const baseName = HashUtil.extractNameFromFilename(filename)
    return baseName
      .split('-')
      .map((part, index) => {
        if (index === 0) return part
        return part.charAt(0).toUpperCase() + part.slice(1)
      })
      .join('')
  }

  generateLazyLoadOrchestrator(modules, functions) {
    let code = ''

    code += '// Lazy-loading orchestrator\n'
    code += '// Modules are dynamically imported on first use\n\n'

    code += 'const moduleCache = new Map()\n\n'

    code += 'async function lazyLoad(moduleName) {\n'
    code += '  if (moduleCache.has(moduleName)) {\n'
    code += '    return moduleCache.get(moduleName)\n'
    code += '  }\n\n'

    code += '  const module = await import(`./modules/${moduleName}.js`)\n'
    code += '  moduleCache.set(moduleName, module)\n'
    code += '  return module\n'
    code += '}\n\n'

    code += 'export const __loadModule = lazyLoad\n\n'

    for (const func of functions) {
      const originalName = func.name
      const sanitizedName = this._sanitizeForFilename(originalName)
      code += `export async function ${originalName}(...args) {\n`
      code += `  const mod = await lazyLoad('${sanitizedName}')\n`
      code += `  return mod.${originalName}(...args)\n`
      code += '}\n\n'
    }

    return code
  }

  _sanitizeForFilename(name) {
    if (!name) return 'anonymous'
    const sanitized = name
      .replace(/\$/g, 'dollar')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase()
    return sanitized || 'anonymous'
  }

  _isValidIdentifier(name) {
    if (!name || typeof name !== 'string') return false
    // JavaScript identifier rules: must start with letter, $, or _; can contain letters, digits, $, or _
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)
  }
}

export default Orchestrator
