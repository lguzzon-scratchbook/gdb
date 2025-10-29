#!/usr/bin/env bun

import fs from 'node:fs'
import path from 'node:path'
import FunctionExtractor from '../src/extractor.js'
import FileWriter from '../src/fileWriter.js'
import Logger from '../src/logger.js'

function printHelp() {
  console.log(`
splitjs - Advanced JavaScript Function Extractor and Module Splitter

Usage:
  splitjs <inputFile> [options]

Options:
  --output, -o <dir>      Output directory (default: extracted)
  --lazy                   Generate lazy-loading orchestrator
  --no-validate            Skip validation checks
  --verbose, -V            Show all internal steps during execution
  --help, -h               Show this help message
  --version, -v            Show version

Examples:
  splitjs myfile.js
  splitjs myfile.js --output ./modules
  splitjs myfile.js --output ./modules --lazy
  splitjs myfile.js --verbose
  `)
}

function printVersion() {
  const pkg = JSON.parse(
    fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
  )
  console.log(`splitjs v${pkg.version}`)
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp()
    process.exit(0)
  }

  if (args.includes('--version') || args.includes('-v')) {
    printVersion()
    process.exit(0)
  }

  const inputFile = args[0]

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found: ${inputFile}`)
    process.exit(1)
  }

  let outputDir = 'extracted'
  let includeLazyLoad = false
  let validate = true
  let verbose = false

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--output' || args[i] === '-o') {
      if (i + 1 < args.length) {
        outputDir = args[++i]
      }
    } else if (args[i] === '--lazy') {
      includeLazyLoad = true
    } else if (args[i] === '--no-validate') {
      validate = false
    } else if (args[i] === '--verbose' || args[i] === '-V') {
      verbose = true
    }
  }

  const logger = new Logger(verbose)

  try {
    console.log(`\n📦 Extracting functions from: ${inputFile}`)

    logger.section('Reading Source File')
    const sourceCode = fs.readFileSync(inputFile, 'utf-8')
    logger.step(`Read ${sourceCode.length} characters from file`)
    logger.endSection()

    const extractor = new FunctionExtractor({
      outputDir,
      includeLazyLoad,
      validate,
      logger
    })

    const result = extractor.extract(sourceCode)

    console.log('\n✅ Extraction completed successfully!')
    console.log(`   Functions found: ${result.functions.length}`)
    console.log(`   Modules generated: ${result.modules.length}`)

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      for (const w of result.warnings) {
        console.log(`   - ${w}`)
      }
    }

    if (validate) {
      console.log('\n🔍 Validating generated modules...')
      const validation = await extractor.validate()
      if (validation.isValid) {
        console.log('   ✅ All modules passed validation')
      } else {
        console.log('   ⚠️  Some validation issues found:')
        for (const res of validation.results) {
          if (res.errors.length > 0) {
            console.log(`   Module: ${res.module}`)
            for (const e of res.errors) {
              console.log(`     - ${e}`)
            }
          }
        }
      }
    }

    logger.section('Writing Output Files')
    const fileWriter = new FileWriter(outputDir)
    fileWriter.ensureOutputDir()
    logger.step('Output directory created/verified')

    logger.startStep('Writing function modules')
    const modules = Array.from(extractor.moduleGenerator.modules.values())
    for (const mod of modules) {
      const modulesDir = path.join(outputDir, 'modules')
      if (!fs.existsSync(modulesDir)) {
        fs.mkdirSync(modulesDir, { recursive: true })
      }
      fs.writeFileSync(path.join(modulesDir, mod.filename), mod.code, 'utf-8')
      logger.debug(`Wrote ${mod.filename} (${mod.code.length} bytes)`)
    }
    logger.endStep(`Wrote ${modules.length} module files`)

    if (result.orchestrator) {
      logger.startStep('Writing orchestrator')
      fileWriter.writeOrchestrator(result.orchestrator.code, 'index.js')
      logger.endStep('Wrote index.js')
    }

    logger.startStep('Writing metadata files')
    fileWriter.writeManifest(result.manifest)
    logger.debug('Wrote manifest.json')
    fileWriter.writeDependencyGraph(result.dependencies)
    logger.debug('Wrote dependencies.json')
    fileWriter.writeExtractionReport(result)
    logger.debug('Wrote report.json')
    if (result.nameMapping) {
      fileWriter.writeNameMapping(result.nameMapping)
      logger.debug('Wrote nameMapping.json')
    }
    fileWriter.writePackageJson(outputDir)
    logger.debug('Wrote package.json')
    logger.endStep('All metadata files written')
    logger.endSection()

    console.log(`\n📁 Output directory: ${path.resolve(outputDir)}`)
    console.log('   ├── modules/           (extracted function modules)')
    console.log('   ├── index.js           (orchestrator/entry point)')
    console.log('   ├── manifest.json      (module metadata)')
    console.log('   ├── dependencies.json  (dependency graph)')
    console.log('   ├── nameMapping.json   (original name mapping)')
    console.log('   ├── report.json        (extraction report)')
    console.log('   └── package.json       (package metadata)')

    console.log('\n🎉 All done! Your modules are ready to use.\n')
  } catch (error) {
    console.error('\n❌ Error during extraction:')
    console.error(`   ${error.message}`)
    if (process.env.DEBUG) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

main()
