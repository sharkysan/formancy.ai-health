import { defineConfig } from 'tsdown'

export default defineConfig({
  // `documents` is an entry of its own, the manifest's `./documents`: the
  // corpus's documents without its letter's renderer, which the demo
  // bundles into its page (0012). The index re-exports it, so both are
  // one module, and the page runs the code the validator gate ran.
  entry: ['src/index.ts', 'src/documents.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  // Nothing from node_modules is inlined (formancy.ai-data 0046): tsdown
  // inlines a package this one imports at run time without declaring it, and
  // the dist -- and an app's bundle or a tarball made from it -- would carry
  // that code as this repository's own, under its licence. With this list
  // empty, such a build fails instead, naming the package.
  deps: { onlyBundle: [] },
})
