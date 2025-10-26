import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import chalk from 'chalk';

export class FileWriter {
  constructor(options = {}) {
    this.options = {
      verbose: options.verbose || false,
      encoding: 'utf8',
      ...options,
    };
    this.writeResults = [];
  }

  async writeModules(modules, outputDir) {
    this.writeResults = [];

    if (this.options.verbose) {
      console.log(chalk.cyan(`📁 Writing ${modules.length} modules to ${outputDir}`));
    }

    for (const module of modules) {
      try {
        const result = await this._writeModule(module, outputDir);
        this.writeResults.push(result);

        if (this.options.verbose) {
          console.log(
            chalk.green(`✅ Wrote ${result.fileName} (${this._formatFileSize(result.size)})`)
          );
        }
      } catch (error) {
        const errorResult = {
          success: false,
          moduleName: module.name,
          fileName: module.fileName || `${module.name}.js`,
          error: error.message,
          size: 0,
        };

        this.writeResults.push(errorResult);

        if (this.options.verbose) {
          console.log(chalk.red(`❌ Failed to write ${errorResult.fileName}: ${error.message}`));
        }
      }
    }

    return this.writeResults;
  }

  async _writeModule(module, outputDir) {
    const fileName = module.fileName || `${module.name}.js`;
    const filePath = join(outputDir, fileName);

    // Ensure directory exists
    await this._ensureDirectoryExists(dirname(filePath));

    // Write the file
    await writeFile(filePath, module.content, {
      encoding: this.options.encoding,
    });

    return {
      success: true,
      moduleName: module.name,
      fileName,
      filePath,
      size: module.content.length,
      type: module.type,
      imports: module.imports ? module.imports.length : 0,
      exports: module.exports ? module.exports.length : 0,
    };
  }

  async _ensureDirectoryExists(dirPath) {
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }
  }

  async writeSummary(modules, outputDir) {
    const summary = this._generateSummary(modules);
    const summaryPath = join(outputDir, 'SPLIT_SUMMARY.md');

    await this._ensureDirectoryExists(outputDir);
    await writeFile(summaryPath, summary, { encoding: this.options.encoding });

    if (this.options.verbose) {
      console.log(chalk.cyan(`📊 Summary written to ${summaryPath}`));
    }

    return summaryPath;
  }

  _generateSummary(modules) {
    const lines = [
      '# JavaScript File Split Summary',
      '',
      `Generated on: ${new Date().toISOString()}`,
      '',
      '## Modules Created',
      '',
    ];

    modules.forEach((module) => {
      lines.push(`### ${module.name}`);
      lines.push(`- **File**: \`${module.fileName || `${module.name}.js`}\``);
      lines.push(`- **Type**: ${module.type}`);
      lines.push(`- **Size**: ${this._formatFileSize(module.content.length)}`);
      lines.push(`- **Imports**: ${module.imports ? module.imports.length : 0}`);
      lines.push(`- **Exports**: ${module.exports ? module.exports.length : 0}`);

      if (module.functions && module.functions.length > 0) {
        lines.push(`- **Functions**: ${module.functions.map((f) => f.name).join(', ')}`);
      }

      if (module.classes && module.classes.length > 0) {
        lines.push(`- **Classes**: ${module.classes.map((c) => c.name).join(', ')}`);
      }

      lines.push('');
    });

    // Add statistics
    const totalSize = modules.reduce((sum, m) => sum + m.content.length, 0);
    const totalFunctions = modules.reduce(
      (sum, m) => sum + (m.functions ? m.functions.length : 0),
      0
    );
    const totalClasses = modules.reduce((sum, m) => sum + (m.classes ? m.classes.length : 0), 0);
    const totalImports = modules.reduce((sum, m) => sum + (m.imports ? m.imports.length : 0), 0);
    const totalExports = modules.reduce((sum, m) => sum + (m.exports ? m.exports.length : 0), 0);

    lines.push('## Statistics');
    lines.push('');
    lines.push(`- **Total Modules**: ${modules.length}`);
    lines.push(`- **Total Size**: ${this._formatFileSize(totalSize)}`);
    lines.push(`- **Total Functions**: ${totalFunctions}`);
    lines.push(`- **Total Classes**: ${totalClasses}`);
    lines.push(`- **Total Imports**: ${totalImports}`);
    lines.push(`- **Total Exports**: ${totalExports}`);
    lines.push('');

    return lines.join('\n');
  }

  async writePackageJson(modules, outputDir, originalPackage = null) {
    const packageJson = this._generatePackageJson(modules, originalPackage);
    const packagePath = join(outputDir, 'package.json');

    await writeFile(packagePath, JSON.stringify(packageJson, null, 2), {
      encoding: this.options.encoding,
    });

    if (this.options.verbose) {
      console.log(chalk.cyan(`📦 Package.json written to ${packagePath}`));
    }

    return packagePath;
  }

  _generatePackageJson(modules, originalPackage) {
    const basePackage = originalPackage || {
      name: 'split-modules',
      version: '1.0.0',
      description: 'Split JavaScript modules',
      main: 'index.js',
      type: 'module',
    };

    // Generate exports map for better module resolution
    const exports = {};
    modules.forEach((module) => {
      const fileName = module.fileName || `${module.name}.js`;
      exports[`./${fileName}`] = `./${fileName}`;
    });

    // Add index export
    exports['.'] = './index.js';

    return {
      ...basePackage,
      exports,
      scripts: {
        ...basePackage.scripts,
        build: 'echo "Build completed"',
      },
    };
  }

  async createModuleMap(modules, outputDir) {
    const moduleMap = this._generateModuleMap(modules);
    const mapPath = join(outputDir, 'MODULE_MAP.json');

    await writeFile(mapPath, JSON.stringify(moduleMap, null, 2), {
      encoding: this.options.encoding,
    });

    if (this.options.verbose) {
      console.log(chalk.cyan(`🗺️  Module map written to ${mapPath}`));
    }

    return mapPath;
  }

  _generateModuleMap(modules) {
    const map = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      modules: {},
    };

    modules.forEach((module) => {
      map.modules[module.name] = {
        file: module.fileName || `${module.name}.js`,
        type: module.type,
        size: module.content.length,
        imports: module.imports ? module.imports.map((imp) => imp.source) : [],
        exports: module.exports ? module.exports.map((exp) => exp.name || exp.local) : [],
        functions: module.functions ? module.functions.map((f) => f.name) : [],
        classes: module.classes ? module.classes.map((c) => c.name) : [],
        dependencies: module.dependencies || [],
      };
    });

    return map;
  }

  async validateWrittenFiles(_outputDir) {
    const validation = {
      totalFiles: 0,
      validFiles: 0,
      invalidFiles: [],
      totalSize: 0,
    };

    for (const result of this.writeResults) {
      if (result.success) {
        validation.totalFiles++;
        validation.totalSize += result.size;

        try {
          // Basic validation - check if file exists and is readable
          const _stats = await import('node:fs').then((fs) => fs.promises.stat(result.filePath));
          validation.validFiles++;
        } catch (error) {
          validation.invalidFiles.push({
            file: result.fileName,
            error: error.message,
          });
        }
      }
    }

    return validation;
  }

  _formatFileSize(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  getWriteResults() {
    return this.writeResults;
  }

  getSuccessfulWrites() {
    return this.writeResults.filter((result) => result.success);
  }

  getFailedWrites() {
    return this.writeResults.filter((result) => !result.success);
  }
}
