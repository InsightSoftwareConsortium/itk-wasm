import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'

export default defineConfig({
  root: path.join('test', 'browser'),
  build: {
    outDir: '../../demo',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        "/shoelace/shoelace.js",
      ]
    },
  },
  plugins: [
    // put lazy loaded JavaScript and Wasm bundles in dist directory
    viteStaticCopy({
      targets: [
        { src: '../../dist/pipelines/*', dest: 'pipelines' },
        { src: '../../dist/web-workers/*', dest: 'web-workers' },
        { src: '../../node_modules/@shoelace-style/shoelace/dist/*', dest: 'shoelace/' },
      ],
    })
  ],
})
