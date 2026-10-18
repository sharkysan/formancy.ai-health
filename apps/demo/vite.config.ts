import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { headersFor } from '../../scripts/demo-headers.mjs'
import { thirdPartyNotices } from '../../scripts/third-party-notices.mjs'
import { DEMO_MODULES, demoModules } from './src/build/plugin.ts'

/**
 * The demo, built with Vite and React, and handed the corpus's referral,
 * the letter's PDF and the facts it states by its own plugin
 * (src/build/plugin.ts), read in Node when the page is built.
 */
export default defineConfig({
  // Relative, so one build is right wherever it is served: at the root of
  // `vite preview` for `pnpm demo`, and under formancy.ai's /health/, where
  // the demo is (formancy.ai-report 0018 found Vite's default /assets/…
  // answered by formancy.ai's own site there). The dev server takes it as /.
  base: './',
  plugins: [
    react(),
    demoModules(),
    // dist/THIRD-PARTY-NOTICES.txt, which the page's footer links: every
    // package the build bundles, with the licence and notice files it
    // ships, each under a licence the repository's policy allows; a package
    // with no licence text or another licence, or code the plugin cannot
    // place, stops the build (formancy.ai-data 0046). The demo's modules are
    // the corpus's synthetic data and the facts, this repository's own.
    thirdPartyNotices({ ownModules: DEMO_MODULES }),
  ],
  // Fail rather than wander to the next free port: an address nobody was
  // told about is worse than an error. 4390 to 4393 are formancy.ai-data's
  // and 4394 formancy.ai-report's Studio, on a machine that runs them all.
  server: { port: 4395, strictPort: true },
  // `pnpm demo` serves the build under the headers the deploy writes for
  // formancy.ai, for the address `vite preview` serves it at instead: the
  // policy admits the build's scripts, styles and faces from that address
  // alone, so the page opened at another name of the same machine --
  // 127.0.0.1 -- runs no script. The dev server gets none: its client is
  // an inline script that opens a WebSocket, which the policy refuses.
  preview: { port: 4395, strictPort: true, headers: headersFor('http://localhost:4395/') },
  build: {
    // What @formancy/themes' README asks of a bundler: the first releases
    // with both :dir() and color-mix(), so Lightning CSS keeps every
    // :dir(rtl) as written rather than turning it into a list of languages.
    cssTarget: ['chrome120', 'edge120', 'firefox113', 'safari16.4', 'ios16.4'],
    // A face under Vite's 4 kB would become a data: URL, which the policy's
    // `font-src`, the build's assets alone, refuses: every asset is a file
    // of the build.
    assetsInlineLimit: 0,
    // Measured with `vite build` (Vite 8.3.4) on 2026-10-18, its source map
    // read for which package each byte came from, with the Questionnaire's
    // read-out (0013): the page is one chunk of 757.21 kB minified,
    // 224.00 kB gzipped, as Vite reports it -- react-dom 207.0 kB,
    // @formancy/spec 192.5 kB, the CEL interpreter 82.1 kB, formancy's
    // renderer, engine and expressions 102.3 kB, the four health packages
    // and health-corpus's documents 61.7 kB, and 89.5 kB of the page's
    // own, the letter's PDF as base64 among it. The limit is that with a
    // little room, so a dependency that grows still warns.
    chunkSizeWarningLimit: 760,
  },
})
