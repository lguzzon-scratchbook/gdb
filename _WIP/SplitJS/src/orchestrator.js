export class Orchestrator {
  constructor(dependencyGraph) {
    this.dependencyGraph = dependencyGraph
  }

  generateOrchestratorFile(modules, functions) {
    let code = ''

    code += '// Auto-generated orchestrator file\n'
    code += '// This file coordinates all extracted modules\n\n'

    const imports = new Map()

    modules.forEach((mod) => {
      const moduleName = this._extractModuleName(mod.filename)
      const key = `${moduleName}:${mod.filename.replace(/\.js$/, '')}`
      if (!imports.has(key)) {
        imports.set(key, moduleName)
      }
    })

    imports.forEach((moduleName, _) => {
      const modPath = Array.from(modules).find(
        (m) => this._extractModuleName(m.filename) === moduleName
      )
      if (modPath) {
        code += `import ${moduleName} from './${modPath.filename.replace(/\.js$/, '')}'\n`
      }
    })

    code += '\n'
    code += '// Re-export all modules\n'

    const uniqueModules = new Set()
    modules.forEach((mod) => {
      const moduleName = this._extractModuleName(mod.filename)
      if (!uniqueModules.has(moduleName)) {
        code += `export { ${moduleName} }\n`
        uniqueModules.add(moduleName)
      }
    })

    code += '\n'
    code += this._generateModuleManifest(modules)

    return code
  }

  generateDependencyGraph() {
    const graph = {}

    this.dependencyGraph.forEach((deps, funcName) => {
      graph[funcName] = {
        internal: deps.internal || [],
        external: deps.external || []
      }
    })

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
    return filename
      .replace(/\.js$/, '')
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

    functions.forEach((func) => {
      const moduleName = this._extractModuleName(func.name.toLowerCase())
      code += `export async function ${func.name}(...args) {\n`
      code += `  const mod = await lazyLoad('${moduleName}')\n`
      code += `  return mod.${func.name}(...args)\n`
      code += '}\n\n'
    })

    return code
  }
}

export default Orchestrator
