import ASTParser from './astParser.js'
import DependencyAnalyzer from './dependencyAnalyzer.js'
import ModuleGenerator from './moduleGenerator.js'
import Orchestrator from './orchestrator.js'
import ScopeAnalyzer from './scopeAnalyzer.js'
import Validator from './validator.js'

export class FunctionExtractor {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || 'extracted',
      includeOrchestrator: options.includeOrchestrator !== false,
      includeLazyLoad: options.includeLazyLoad || false,
      validate: options.validate !== false,
      ...options
    }

    this.parser = new ASTParser()
    this.dependencyAnalyzer = null
    this.scopeAnalyzer = null
    this.moduleGenerator = null
    this.orchestrator = null
    this.validator = new Validator()

    this.extractionResult = {
      functions: [],
      modules: [],
      dependencies: null,
      manifest: null,
      errors: [],
      warnings: []
    }
  }

  extract(sourceCode) {
    try {
      this.parser.parse(sourceCode)

      this.dependencyAnalyzer = new DependencyAnalyzer(this.parser)
      this.scopeAnalyzer = new ScopeAnalyzer(this.parser)

      const functions = this.parser.findAllFunctions()

      if (functions.length === 0) {
        throw new Error('No functions found in source code')
      }

      const dependencyGraph =
        this.dependencyAnalyzer.resolveDependencyGraph(functions)

      const circularDeps =
        this.dependencyAnalyzer.detectCircularDependencies(dependencyGraph)

      if (circularDeps.length > 0) {
        this.extractionResult.warnings.push(
          `Circular dependencies detected: ${circularDeps.map((c) => c.join(' -> ')).join(', ')}`
        )
      }

      const originalImports = this.parser.findImports()

      this.moduleGenerator = new ModuleGenerator(
        this.parser,
        this.dependencyAnalyzer,
        this.scopeAnalyzer
      )

      const modules = this.moduleGenerator.generateAllModules(
        functions,
        dependencyGraph,
        originalImports
      )

      this.orchestrator = new Orchestrator(dependencyGraph)

      const orchestratorCode = this.options.includeLazyLoad
        ? this.orchestrator.generateLazyLoadOrchestrator(modules, functions)
        : this.orchestrator.generateOrchestratorFile(modules, functions)

      const manifest = this.orchestrator.generateModuleManifest(modules)

      this.extractionResult = {
        functions: functions.map((f) => ({
          name: f.name,
          type: f.type,
          params: f.params,
          async: f.async,
          generator: f.generator
        })),
        modules: modules.map((m) => ({
          filename: m.filename,
          preview: m.code.substring(0, 200) + '...'
        })),
        orchestrator: {
          filename: 'index.js',
          code: orchestratorCode
        },
        dependencies: this.dependencyAnalyzer.resolveDependencyGraph(functions),
        manifest,
        errors: this.extractionResult.errors,
        warnings: [
          ...this.extractionResult.warnings,
          ...circularDeps.map((c) => `Circular dependency: ${c.join(' -> ')}`)
        ]
      }

      return this.extractionResult
    } catch (error) {
      this.extractionResult.errors.push(error.message)
      throw error
    }
  }

  async validate() {
    if (!this.options.validate) {
      return { isValid: true, results: [] }
    }

    const results = []

    for (const module of this.extractionResult.modules || []) {
      const validation = this.validator.validateModule(
        module.code,
        module.filename
      )
      if (validation.errors.length > 0 || validation.warnings.length > 0) {
        results.push({
          module: module.filename,
          ...validation
        })
      }
    }

    if (this.extractionResult.orchestrator) {
      const validation = this.validator.validateModule(
        this.extractionResult.orchestrator.code,
        'index.js'
      )
      if (validation.errors.length > 0 || validation.warnings.length > 0) {
        results.push({
          module: 'index.js',
          ...validation
        })
      }
    }

    return {
      isValid: results.every((r) => r.errors.length === 0),
      results
    }
  }

  getResult() {
    return this.extractionResult
  }

  generateDependencyGraph() {
    if (!this.orchestrator) {
      throw new Error('Must extract first')
    }
    return this.orchestrator.generateDependencyGraph()
  }
}

export default FunctionExtractor
