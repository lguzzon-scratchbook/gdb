#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { Command } from 'commander';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the main engine
const { JsRefactorEngine } = await import(join(__dirname, '../src/engine.js'));

const program = new Command();

program
  .name('jsrefactor')
  .description('Advanced JavaScript file splitting and modularization tool')
  .version('1.0.0');

program
  .command('split')
  .description('Split a JavaScript file into multiple modules')
  .argument('<input-file>', 'Input JavaScript file to process')
  .option('-o, --output <dir>', 'Output directory for split files', './output')
  .option(
    '-s, --strategy <type>',
    'Splitting strategy: functions, classes, features, hybrid',
    'hybrid'
  )
  .option('-m, --max-size <size>', 'Maximum file size in KB', '50')
  .option('-f, --force', 'Overwrite existing output directory', false)
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('--dry-run', 'Show what would be split without creating files', false)
  .action(async (inputFile, options) => {
    try {
      if (!existsSync(inputFile)) {
        console.error(chalk.red(`Error: Input file '${inputFile}' does not exist`));
        process.exit(1);
      }

      const engine = new JsRefactorEngine({
        verbose: options.verbose,
        dryRun: options.dryRun,
        strategy: options.strategy,
        maxFileSize: Number.parseInt(options.maxSize) * 1024,
        outputDir: options.output,
        force: options.force,
      });

      console.log(chalk.blue(`🔧 Processing ${inputFile}...`));

      const result = await engine.splitFile(inputFile);

      if (result.success) {
        console.log(chalk.green(`✅ Successfully split file into ${result.filesCreated} modules`));
        console.log(chalk.cyan(`📁 Output directory: ${result.outputDir}`));

        if (result.summary) {
          console.log(chalk.yellow('\n📊 Summary:'));
          result.summary.forEach((item) => {
            console.log(`  ${item.name}: ${item.count} items`);
          });
        }
      } else {
        console.error(chalk.red(`❌ Failed to split file: ${result.error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze a JavaScript file structure and dependencies')
  .argument('<input-file>', 'Input JavaScript file to analyze')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('--json', 'Output analysis in JSON format', false)
  .action(async (inputFile, options) => {
    try {
      if (!existsSync(inputFile)) {
        console.error(chalk.red(`Error: Input file '${inputFile}' does not exist`));
        process.exit(1);
      }

      const engine = new JsRefactorEngine({ verbose: options.verbose });

      console.log(chalk.blue(`🔍 Analyzing ${inputFile}...`));

      const analysis = await engine.analyzeFile(inputFile);

      if (options.json) {
        console.log(JSON.stringify(analysis, null, 2));
      } else {
        console.log(chalk.cyan('\n📊 Analysis Results:'));
        console.log(`  Functions: ${analysis.functions.length}`);
        console.log(`  Classes: ${analysis.classes.length}`);
        console.log(`  Variables: ${analysis.variables.length}`);
        console.log(`  Imports: ${analysis.imports.length}`);
        console.log(`  Exports: ${analysis.exports.length}`);
        console.log(`  Dependencies: ${analysis.dependencies.length}`);

        if (options.verbose && analysis.complexity) {
          console.log(chalk.yellow('\n🧠 Complexity Metrics:'));
          console.log(`  Cognitive Complexity: ${analysis.complexity.cognitive}`);
          console.log(`  Cyclomatic Complexity: ${analysis.complexity.cyclomatic}`);
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command('suggest')
  .description('Suggest intelligent renames using AI')
  .argument('<input-file>', 'Input JavaScript file to analyze')
  .option('-k, --api-key <key>', 'OpenRouter API key (or set OPENROUTER_API_KEY env var)')
  .option('-m, --model <model>', 'LLM model to use', 'z-ai/glm-4.6:exacto')
  .option('-c, --confidence <threshold>', 'Minimum confidence threshold (0.0-1.0)', '0.7')
  .option('-b, --batch-size <size>', 'Batch size for API requests', '10')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('--json', 'Output suggestions in JSON format', false)
  .action(async (inputFile, options) => {
    try {
      const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        console.error(chalk.red('Error: OpenRouter API key is required. Use --api-key or set OPENROUTER_API_KEY environment variable.'));
        process.exit(1);
      }

      if (!existsSync(inputFile)) {
        console.error(chalk.red(`Error: Input file '${inputFile}' does not exist`));
        process.exit(1);
      }

      const engine = new JsRefactorEngine({
        verbose: options.verbose,
        openRouterApiKey: apiKey,
        llmModel: options.model,
        confidenceThreshold: parseFloat(options.confidence),
        maxBatchSize: parseInt(options.batchSize)
      });

      console.log(chalk.blue(`🤖 Analyzing ${inputFile} for renaming suggestions...`));
      
      const result = await engine.suggestRenames(inputFile);
      
      if (result.success) {
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(chalk.green(`✅ Analysis complete! Found ${result.totalCandidates} candidates`));
          console.log(chalk.cyan(`📝 ${result.appliedRenames.length} renames suggested:`));
          
          result.suggestions.forEach((suggestion, index) => {
            if (suggestion.suggestedName !== suggestion.originalName) {
              console.log(chalk.yellow(`  ${index + 1}. ${suggestion.originalName} → ${suggestion.suggestedName}`));
              console.log(chalk.gray(`     Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`));
              console.log(chalk.gray(`     Reasoning: ${suggestion.reasoning}`));
              if (suggestion.alternatives.length > 0) {
                console.log(chalk.gray(`     Alternatives: ${suggestion.alternatives.join(', ')}`));
              }
              console.log();
            }
          });
        }
      } else {
        console.error(chalk.red(`❌ Failed to analyze file: ${result.error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command('rename')
  .description('Apply intelligent renames using AI')
  .argument('<input-file>', 'Input JavaScript file to rename')
  .option('-o, --output <file>', 'Output file path (overwrites original if not specified)')
  .option('-k, --api-key <key>', 'OpenRouter API key (or set OPENROUTER_API_KEY env var)')
  .option('-m, --model <model>', 'LLM model to use', 'z-ai/glm-4.6:exacto')
  .option('-c, --confidence <threshold>', 'Minimum confidence threshold (0.0-1.0)', '0.7')
  .option('-b, --batch-size <size>', 'Batch size for API requests', '10')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('--dry-run', 'Show what would be renamed without making changes', false)
  .action(async (inputFile, options) => {
    try {
      const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        console.error(chalk.red('Error: OpenRouter API key is required. Use --api-key or set OPENROUTER_API_KEY environment variable.'));
        process.exit(1);
      }

      if (!existsSync(inputFile)) {
        console.error(chalk.red(`Error: Input file '${inputFile}' does not exist`));
        process.exit(1);
      }

      const engine = new JsRefactorEngine({
        verbose: options.verbose,
        openRouterApiKey: apiKey,
        llmModel: options.model,
        confidenceThreshold: parseFloat(options.confidence),
        maxBatchSize: parseInt(options.batchSize)
      });

      console.log(chalk.blue(`🔄 Processing ${inputFile} for smart renaming...`));
      
      if (options.dryRun) {
        const result = await engine.suggestRenames(inputFile);
        
        if (result.success) {
          console.log(chalk.yellow(`🔍 DRY RUN - Would apply ${result.appliedRenames.length} renames:`));
          
          result.suggestions.forEach((suggestion, index) => {
            if (suggestion.suggestedName !== suggestion.originalName) {
              console.log(chalk.yellow(`  ${index + 1}. ${suggestion.originalName} → ${suggestion.suggestedName}`));
              console.log(chalk.gray(`     Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`));
            }
          });
        } else {
          console.error(chalk.red(`❌ Failed to analyze file: ${result.error}`));
          process.exit(1);
        }
      } else {
        const result = await engine.applyRenames(inputFile, options.output);
        
        if (result.success) {
          console.log(chalk.green(`✅ Successfully applied ${result.appliedRenames} renames!`));
          
          if (result.outputFile) {
            console.log(chalk.cyan(`📁 Output written to: ${result.outputFile}`));
          } else {
            console.log(chalk.yellow(`⚠️  Code returned to stdout (use --output to write to file)`));
            console.log(result.code);
          }
          
          console.log(chalk.cyan(`\n📊 Rename Summary:`));
          Object.entries(result.renameMap).forEach(([oldName, newName]) => {
            console.log(`  ${oldName} → ${newName}`);
          });
        } else {
          console.error(chalk.red(`❌ Failed to rename file: ${result.error}`));
          process.exit(1);
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program.parse();
