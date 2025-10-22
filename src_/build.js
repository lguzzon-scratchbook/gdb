// Build script for GenosDB
// Transforms source code to minified distributions

import { build } from 'esbuild';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const isProduction = process.argv.includes('--production');

async function buildProject() {
    console.log('Building GenosDB...');
    
    // Ensure dist directory exists
    await mkdir('dist', { recursive: true });
    
    // Configuration for different builds
    const builds = [
        // Main index.js bundle
        {
            entryPoints: ['src/index.js'],
            bundle: true,
            platform: 'browser',
            format: 'esm',
            minify: isProduction,
            sourcemap: !isProduction,
            treeShaking: true,
            outfile: 'dist/index.js',
            external: [],
            define: {
                'process.env.NODE_ENV': `"${isProduction ? 'production' : 'development'}"`
            }
        },
        
        // Individual module builds
        {
            entryPoints: [
                'src/gdb.js',
                'src/genosrtc.js',
                'src/security-manager.js',
                'src/radix-index.js',
                'src/geo-index.js',
                'src/nlq-module.js'
            ],
            bundle: false,
            platform: 'browser',
            format: 'esm',
            minify: isProduction,
            sourcemap: !isProduction,
            outdir: 'dist',
            entryNames: '[name].min.js'
        }
    ];
    
    // Execute builds
    for (const config of builds) {
        try {
            console.log(`Building: ${config.outfile || config.entryPoints.join(', ')}`);
            await build(config);
        } catch (error) {
            console.error(`Build failed for ${config.outfile || config.entryPoints}:`, error);
            process.exit(1);
        }
    }
    
    // Create package manifest
    await createManifest();
    
    console.log('Build completed successfully!');
}

async function createManifest() {
    const manifest = {
        name: 'genosdb',
        version: '0.11.9',
        type: 'module',
        main: 'index.js',
        exports: {
            '.': './index.js',
            './gdb': './gdb.min.js',
            './genosrtc': './genosrtc.min.js',
            './sm': './sm.min.js',
            './radix-index': './radixIndex.min.js',
            './geo-index': './Geo.min.js',
            './nlq': './nlq.min.js'
        },
        files: [
            '*.js',
            '*.js.gz'
        ],
        dependencies: {
            '@msgpack/msgpack': '^3.1.2',
            'ethers': '^6.15.0',
            'pako': '^2.1.0'
        }
    };
    
    await writeFile(
        join('dist', 'package.json'),
        JSON.stringify(manifest, null, 2)
    );
}

// Run build
buildProject().catch(console.error);
