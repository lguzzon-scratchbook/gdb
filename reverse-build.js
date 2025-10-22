// Reverse-engineer dist files to src
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const fileMapping = {
  'ai.min.js': 'ai-module.js',
  'audit.min.js': 'audit-module.js',
  'gdb.min.js': 'gdb.js',
  'genosrtc.min.js': 'genosrtc.js',
  'Geo.min.js': 'geo-index.js',
  'ii.min.js': 'ii-module.js',
  'index.js': 'index.js',
  'invertedIndex.min.js': 'inverted-index.js',
  'multirtc.min.js': 'multirtc.js',
  'nlq.min.js': 'nlq-module.js',
  'radixIndex.min.js': 'radix-index.js',
  'sm.min.js': 'security-manager.js',
  'sm-acls.min.js': 'acl-module.js',
  'sm-gov.min.js': 'gov-module.js'
};

async function reverseFile(distFile, srcFile) {
  try {
    console.log(`Processing: ${distFile} -> ${srcFile}`);
    
    const distPath = join('dist', distFile);
    const srcPath = join('src', srcFile);
    
    let content = await readFile(distPath, 'utf-8');
    
    // Just copy the content as-is for now
    await writeFile(srcPath, content);
    console.log(`✓ Created: ${srcPath}`);
  } catch (error) {
    console.error(`Error processing ${distFile}:`, error.message);
  }
}

async function main() {
  console.log('Reverse-engineering dist files to src...\n');
  
  await mkdir('src', { recursive: true });
  
  for (const [distFile, srcFile] of Object.entries(fileMapping)) {
    await reverseFile(distFile, srcFile);
  }
  
  console.log('\n✓ Reverse-engineering completed!');
  console.log('\nNote: Files are copied as-is from dist. Use a proper beautifier for formatting.');
}

main().catch(console.error);
