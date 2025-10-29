import { existsSync, mkdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { generate } from '@babel/generator';
import chalk from 'chalk';
import { AstParser } from './ast-parser.js';
import { DependencyAnalyzer } from './dependency-analyzer.js';
import { FileSplitter } from './file-splitter.js';
import { FileWriter } from './file-writer.js';
import { ImportRebaser } from './import-rebaser.js';
import { RenamingEngine } from './renaming-engine.js';
import { LLMApiClient } from './llm/api.js';

export class JsRefactorEngine {
  constructor(options = {}) {
    this.options = {
      verbose: options.verbose || false,
      dryRun: options.dryRun || false,
      strategy: options.strategy || 'hybrid',
      maxFileSize: options.maxFileSize || 50 * 1024,
      outputDir: options.outputDir || './output',
      force: options.force || false,
      ...options,
    };

    this.parser = new AstParser({ verbose: this.options.verbose });
    this.dependencyAnalyzer = new DependencyAnalyzer();
    this.fileSplitter = new FileSplitter({
      strategy: this.options.strategy,
      maxFileSize: this.options.maxFileSize,
    });
    this.importRebaser = new ImportRebaser();
    this.fileWriter = new FileWriter({ verbose: this.options.verbose });
    
    // Initialize LLM components if API key is provided
    if (this.options.openRouterApiKey) {
      const llmClient = new LLMApiClient(
        this.options.openRouterApiKey,
        this.options.llmModel,
        {
          maxRetries: this.options.llmMaxRetries || 3,
          retryDelay: this.options.llmRetryDelay || 1000,
          timeout: this.options.llmTimeout || 30000
        }
      );
      this.renamingEngine = new RenamingEngine(llmClient, {
        enableLLM: this.options.enableLLM !== false,
        confidenceThreshold: this.options.confidenceThreshold || 0.7,
        maxBatchSize: this.options.maxBatchSize || 10
      });
    }
  }

  async splitFile(inputPath) {
    try {
      if (this.options.verbose) {
        console.log(chalk.cyan(`📖 Reading file: ${inputPath}`));
      }

      const fileContent = await readFile(inputPath, 'utf-8');
      const ast = this.parser.parse(fileContent, inputPath);

      if (this.options.verbose) {
        console.log(chalk.cyan('🔍 Analyzing dependencies...'));
      }

      const dependencies = this.dependencyAnalyzer.analyze(ast);

      if (this.options.verbose) {
        console.log(chalk.cyan(`✂️  Splitting file using ${this.options.strategy} strategy...`));
      }

      const functions = this.parser.extractFunctions(ast);
      const classes = this.parser.extractClasses(ast);
      const variables = this.parser.extractVariables(ast);
      const imports = this.parser.extractImports(ast);
      const exports = this.parser.extractExports(ast);
      
      const splitPlan = this.fileSplitter.createSplitPlan({
        functions,
        classes,
        variables,
        imports,
        exports,
        dependencies
      });

      if (this.options.verbose) {
        console.log(chalk.cyan('🔄 Rebasing imports...'));
      }

      const rebasedModules = this.importRebaser.rebaseImports(splitPlan, inputPath);

      if (this.options.dryRun) {
        return this._createDryRunResult(rebasedModules, splitPlan);
      }

      if (this.options.verbose) {
        console.log(chalk.cyan(`📝 Writing files to ${this.options.outputDir}...`));
      }

      const outputDir = this._ensureOutputDirectory();
      const writeResults = await this.fileWriter.writeModules(rebasedModules, outputDir);

      return this._createSuccessResult(writeResults, splitPlan, outputDir);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: this.options.verbose ? error.stack : undefined,
      };
    }
  }

  async analyzeFile(inputPath) {
    try {
      const fileContent = await readFile(inputPath, 'utf-8');
      const ast = this.parser.parse(fileContent, inputPath);
      const dependencies = this.dependencyAnalyzer.analyze(ast);

      try {
        const analysis = {
          functions: this.parser.extractFunctions(ast),
          classes: this.parser.extractClasses(ast),
          variables: this.parser.extractVariables(ast),
          imports: this.parser.extractImports(ast),
          exports: this.parser.extractExports(ast),
          dependencies: dependencies,
          complexity: this.parser.calculateComplexity(ast),
        };

        return analysis;
      } catch (error) {
        console.error('Error during analysis:', error.message);
        console.error('Stack:', error.stack);
        throw error;
      }
    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  _ensureOutputDirectory() {
    if (!existsSync(this.options.outputDir)) {
      mkdirSync(this.options.outputDir, { recursive: true });
      if (this.options.verbose) {
        console.log(chalk.cyan(`📁 Created output directory: ${this.options.outputDir}`));
      }
    } else if (!this.options.force) {
      throw new Error(
        `Output directory '${this.options.outputDir}' already exists. Use --force to overwrite.`
      );
    }

    return this.options.outputDir;
  }

  _createDryRunResult(modules, splitPlan) {
    const summary = this._generateSummary(splitPlan);

    return {
      success: true,
      dryRun: true,
      filesCreated: modules.length,
      modules: modules.map((m) => ({
        name: m.name,
        size: m.content.length,
        exports: m.exports.length,
        imports: m.imports.length,
      })),
      summary,
      outputDir: this.options.outputDir,
    };
  }

  _createSuccessResult(writeResults, splitPlan, outputDir) {
    const summary = this._generateSummary(splitPlan);

    return {
      success: true,
      filesCreated: writeResults.length,
      outputDir,
      modules: writeResults,
      summary,
    };
  }

  _generateSummary(splitPlan) {
    return [
      { name: 'Functions', count: splitPlan.functions.length },
      { name: 'Classes', count: splitPlan.classes.length },
      { name: 'Variables', count: splitPlan.variables.length },
      { name: 'Modules', count: splitPlan.modules.length },
    ];
  }

  async suggestRenames(inputPath) {
    if (!this.renamingEngine) {
      throw new Error('LLM renaming engine not initialized. Please provide OpenRouter API key.');
    }

    try {
      if (this.options.verbose) {
        console.log(chalk.cyan(`🤖 Analyzing ${inputPath} for renaming suggestions...`));
      }

      const fileContent = await readFile(inputPath, 'utf-8');
      const ast = this.parser.parse(fileContent, inputPath);
      
      const contexts = await this.renamingEngine.analyzeFile(ast, inputPath);
      
      if (this.options.verbose) {
        console.log(chalk.cyan(`🧠 Generating ${contexts.length} renaming suggestions...`));
      }

      const suggestions = await this.renamingEngine.suggestRenames(contexts);
      
      return {
        success: true,
        file: inputPath,
        totalCandidates: contexts.length,
        suggestions: suggestions,
        appliedRenames: suggestions.filter(s => s.suggestedName !== s.originalName)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: this.options.verbose ? error.stack : undefined
      };
    }
  }

  async applyRenames(inputPath, outputPath = null) {
    if (!this.renamingEngine) {
      throw new Error('LLM renaming engine not initialized. Please provide OpenRouter API key.');
    }

    try {
      if (this.options.verbose) {
        console.log(chalk.cyan(`🔄 Processing ${inputPath} for smart renaming...`));
      }

      const fileContent = await readFile(inputPath, 'utf-8');
      const ast = this.parser.parse(fileContent, inputPath);
      
      // Get renaming suggestions
      const contexts = await this.renamingEngine.analyzeFile(ast, inputPath);
      const suggestions = await this.renamingEngine.suggestRenames(contexts);
      
      if (this.options.verbose) {
        console.log(chalk.cyan(`✏️  Applying ${suggestions.length} renames...`));
      }

      // Apply renames to AST
      const { ast: renamedAst, renameMap, appliedRenames } = await this.renamingEngine.applyRenames(ast, suggestions);
      
      // Generate new code
      const { code } = generate(renamedAst);
      
      // Write to file if output path specified, otherwise return the code
      if (outputPath) {
        await this.fileWriter._writeModule({
          name: 'renamed',
          content: code,
          fileName: outputPath
        }, dirname(outputPath));
        
        return {
          success: true,
          inputFile: inputPath,
          outputFile: outputPath,
          renameMap,
          appliedRenames: appliedRenames.length,
          totalRenames: suggestions.length
        };
      }
      
      return {
        success: true,
        inputFile: inputPath,
        code,
        renameMap,
        appliedRenames: appliedRenames.length,
        totalRenames: suggestions.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: this.options.verbose ? error.stack : undefined
      };
    }
  }
}
