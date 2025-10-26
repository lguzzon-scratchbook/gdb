#!/usr/bin/env bun

import fs from 'fs'
import path from 'path'
import FunctionExtractor from '../src/extractor.js'
import FileWriter from '../src/fileWriter.js'

function printHelp() {
  console.log(`
splitjs - Advanced JavaScript Function Extractor and Module Splitter

Usage:
  splitjs <inputFile> [options]

Options:
  --output, -o <dir>      Output directory (default: extracted)
  --lazy                   Generate lazy-loading orchestrator
  --no-validate            Skip validation checks
  --help, -h               Show this help message
  --version, -v            Show version

Examples:
  splitjs myfile.js
  splitjs myfile.js --output ./modules
  splitjs myfile.js --output ./modules --lazy
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

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--output' || args[i] === '-o') {
      if (i + 1 < args.length) {
        outputDir = args[++i]
      }
    } else if (args[i] === '--lazy') {
      includeLazyLoad = true
    } else if (args[i] === '--no-validate') {
      validate = false
    }
  }

  try {
    console.log(`\n📦 Extracting functions from: ${inputFile}`)

    const sourceCode = fs.readFileSync(inputFile, 'utf-8')

    const extractor = new FunctionExtractor({
      outputDir,
      includeLazyLoad,
      validate
    })

    const result = extractor.extract(sourceCode)

    console.log(`\n✅ Extraction completed successfully!`)
    console.log(`   Functions found: ${result.functions.length}`)
    console.log(`   Modules generated: ${result.modules.length}`)

    if (result.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`)
      result.warnings.forEach((w) => console.log(`   - ${w}`))
    }

    if (validate) {
      console.log(`\n🔍 Validating generated modules...`)
      const validation = await extractor.validate()
      if (validation.isValid) {
        console.log(`   ✅ All modules passed validation`)
      } else {
        console.log(`   ⚠️  Some validation issues found:`)
        validation.results.forEach((res) => {
          if (res.errors.length > 0) {
            console.log(`   Module: ${res.module}`)
            res.errors.forEach((e) => console.log(`     - ${e}`))
          }
        })
      }
    }

    const fileWriter = new FileWriter(outputDir)
    fileWriter.ensureOutputDir()

    console.log(`\n📝 Writing output files...`)

    const modules = Array.from(extractor.moduleGenerator.modules.values())
    modules.forEach((mod) => {
      const modulesDir = path.join(outputDir, 'modules')
      if (!fs.existsSync(modulesDir)) {
        fs.mkdirSync(modulesDir, { recursive: true })
      }
      fs.writeFileSync(path.join(modulesDir, mod.filename), mod.code, 'utf-8')
    })

    if (result.orchestrator) {
      fileWriter.writeOrchestrator(result.orchestrator.code, 'index.js')
    }

    fileWriter.writeManifest(result.manifest)
    fileWriter.writeDependencyGraph(result.dependencies)
    fileWriter.writeExtractionReport(result)
    fileWriter.writePackageJson(outputDir)

    console.log(`\n📁 Output directory: ${path.resolve(outputDir)}`)
    console.log(`   ├── modules/           (extracted function modules)`)
    console.log(`   ├── index.js           (orchestrator/entry point)`)
    console.log(`   ├── manifest.json      (module metadata)`)
    console.log(`   ├── dependencies.json  (dependency graph)`)
    console.log(`   ├── report.json        (extraction report)`)
    console.log(`   └── package.json       (package metadata)`)

    console.log(`\n🎉 All done! Your modules are ready to use.\n`)
  } catch (error) {
    console.error(`\n❌ Error during extraction:`)
    console.error(`   ${error.message}`)
    if (process.env.DEBUG) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

main()
