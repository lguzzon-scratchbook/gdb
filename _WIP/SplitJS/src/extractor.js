import ASTParser from './astParser.js'
import DependencyAnalyzer from './dependencyAnalyzer.js'
import Logger from './logger.js'
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

    this.logger = options.logger || new Logger(false)
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
      this.logger.section('Parsing Source Code')
      this.parser.parse(sourceCode)
      this.logger.step('Source code parsed successfully')
      this.logger.endSection()

      this.logger.section('Initializing Analyzers')
      this.dependencyAnalyzer = new DependencyAnalyzer(this.parser)
      this.scopeAnalyzer = new ScopeAnalyzer(this.parser)
      this.logger.step('Dependency and scope analyzers initialized')
      this.logger.endSection()

      this.logger.section('Finding Functions')
      const functions = this.parser.findAllFunctions()

      if (functions.length === 0) {
        throw new Error('No functions found in source code')
      }

      this.logger.step(`Found ${functions.length} functions`)
      for (const func of functions) {
        this.logger.listItem(
          `${func.type}: ${func.name}(${func.params.join(', ')})${func.async ? ' [async]' : ''}`,
          2
        )
      }
      this.logger.endSection()

      this.logger.section('Analyzing Dependencies')
      const dependencyGraph =
        this.dependencyAnalyzer.resolveDependencyGraph(functions)
      this.logger.step('Dependency graph resolved')
      this.logger.endSection()

      this.logger.section('Detecting Circular Dependencies')
      const circularDeps =
        this.dependencyAnalyzer.detectCircularDependencies(dependencyGraph)

      if (circularDeps.length > 0) {
        this.logger.warn(`Found ${circularDeps.length} circular dependencies`)
        for (const dep of circularDeps) {
          this.logger.listItem(`${dep.join(' -> ')}`, 2)
        }
        this.extractionResult.warnings.push(
          `Circular dependencies detected: ${circularDeps.map((c) => c.join(' -> ')).join(', ')}`
        )
      } else {
        this.logger.step('No circular dependencies detected')
      }
      this.logger.endSection()

      this.logger.section('Processing Imports')
      const originalImports = this.parser.findImports()
      this.logger.step(`Found ${originalImports.length} import statements`)
      for (const imp of originalImports) {
        this.logger.listItem(
          `from '${imp.source}': ${imp.specifiers.map((s) => s.local).join(', ')}`,
          2
        )
      }
      this.logger.endSection()

      this.logger.section('Generating Modules')
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
      this.logger.step(`Generated ${modules.length} modules`)
      for (const mod of modules) {
        this.logger.listItem(`${mod.filename} (${mod.code.length} bytes)`, 2)
      }
      this.logger.endSection()

      this.logger.section('Creating Orchestrator')
      const nameMapping = this.moduleGenerator.getNameMapping()
      this.orchestrator = new Orchestrator(dependencyGraph, nameMapping)

      const orchestratorCode = this.options.includeLazyLoad
        ? this.orchestrator.generateLazyLoadOrchestrator(modules, functions)
        : this.orchestrator.generateOrchestratorFile(modules, functions)
      this.logger.step(
        `Generated ${this.options.includeLazyLoad ? 'lazy-loading' : 'standard'} orchestrator`
      )
      this.logger.step(`Orchestrator code: ${orchestratorCode.length} bytes`)
      this.logger.endSection()

      this.logger.section('Generating Manifest')
      const manifest = this.orchestrator.generateModuleManifest(modules)
      this.logger.step('Manifest generated')
      this.logger.endSection()

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
          preview: `${m.code.substring(0, 200)}...`
        })),
        orchestrator: {
          filename: 'index.js',
          code: orchestratorCode
        },
        dependencies: this.dependencyAnalyzer.resolveDependencyGraph(functions),
        manifest,
        nameMapping,
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

    this.logger.section('Validating Generated Modules')
    const results = []

    this.logger.startStep('Validating function modules')
    for (const module of this.extractionResult.modules || []) {
      const validation = this.validator.validateModule(
        module.code,
        module.filename
      )
      this.logger.debug(
        `Module ${module.filename}: ${validation.errors.length} errors, ${validation.warnings.length} warnings`
      )
      if (validation.errors.length > 0 || validation.warnings.length > 0) {
        results.push({
          module: module.filename,
          ...validation
        })
      }
    }
    this.logger.endStep(
      `Validated ${this.extractionResult.modules.length} modules`
    )

    if (this.extractionResult.orchestrator) {
      this.logger.startStep('Validating orchestrator')
      const validation = this.validator.validateModule(
        this.extractionResult.orchestrator.code,
        'index.js'
      )
      this.logger.debug(
        `Orchestrator: ${validation.errors.length} errors, ${validation.warnings.length} warnings`
      )
      if (validation.errors.length > 0 || validation.warnings.length > 0) {
        results.push({
          module: 'index.js',
          ...validation
        })
      }
      this.logger.endStep('Orchestrator validation complete')
    }

    const isValid = results.every((r) => r.errors.length === 0)
    if (isValid) {
      this.logger.step('All modules passed validation')
    } else {
      this.logger.warn(`${results.length} module(s) with validation issues`)
    }
    this.logger.endSection()

    return {
      isValid,
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
