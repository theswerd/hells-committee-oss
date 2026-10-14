import { build } from 'esbuild'
import { writeFile } from 'node:fs/promises'

await build({
  entryPoints: ['worker/index.ts'],
  outfile: 'dist/client/_worker.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: true,
})

// Pages serves static assets directly and invokes the Worker for room API calls.
await writeFile('dist/client/_routes.json', JSON.stringify({ version: 1, include: ['/api/*'], exclude: [] }) + '\n')
console.log('Built the Cloudflare Pages room Worker.')
