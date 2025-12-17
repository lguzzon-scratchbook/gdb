# Bundler Configuration

GenosDB uses dynamic imports with `import.meta.url` for loading optional modules. Some bundlers may require additional configuration to handle this correctly.

## Vite

If using Vite, add the following to your `vite.config.js`:

```js
import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    exclude: ['genosdb']
  }
})
```

This tells Vite to skip pre-bundling GenosDB, allowing the dynamic imports to resolve correctly at runtime.

## Webpack

No additional configuration is typically required for Webpack 5+.

## esbuild / Bun

### Bun Example ([bundler.ts](file:///Users/estebanrfp/.gemini/antigravity/playground/primal-triangulum/bundler.ts))

When using `Bun.build`, add a step to copy the assets after the build completes:

```js
async function build() {
    console.time("Build");
    const result = await Bun.build({
        entrypoints: ['./app.js'],
        outdir: './dist',
        target: 'browser',
    });
    console.timeEnd("Build");
}

await build();
```

No additional configuration required.

## CDN Usage

When loading GenosDB directly from a CDN, no bundler configuration is needed:

```html
<script type="module">
  import { gdb } from 'https://cdn.jsdelivr.net/npm/genosdb@latest/dist/index.js'
</script>
```