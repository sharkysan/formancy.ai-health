// The headers every response of the demo carries (0012), decided once, as
// a function of the address the page is served at: the deploy writes them
// for https://formancy.ai/health/ into the `_headers` file Cloudflare's
// static assets read, `vite preview` serves `pnpm demo` with them for its
// own address (apps/demo/vite.config.ts), and the browser gate serves the
// page under them for the address it serves it at. The policies differ in
// that address and in nothing else, which scripts/demo.test.mjs holds.
//
// What the policy holds is the page's one promise about what a visitor
// types: the page sends it nowhere. `connect-src 'none'` refuses every
// fetch, XHR, WebSocket and beacon, so the letter's bytes are a module of
// the build and never a file the page fetches; `form-action 'none'` refuses
// a form that posts. Scripts, styles and faces are the build's own files,
// from its assets directory and nowhere else, and none is inline: Vite
// writes none, and React's `style` prop goes through the CSSOM, which the
// policy does not govern. Not `'self'`, which admits whatever the same
// origin serves: Cloudflare serves the scripts of the features it injects
// from `/cdn-cgi/` of the same origin, and a review measured on 18 October
// 2026 that such a script, admitted, sent what was typed to the origin
// through an image or a face. Under the build's own directory it is
// refused, and the gate plants one to watch it refused. `no-transform`
// asks Cloudflare to inject nothing in the first place.
//
// Trusted Types: no script of the page may hand a string to a sink that
// parses it as markup or code -- `innerHTML`, React's
// `dangerouslySetInnerHTML`, a script's text -- and no policy may be made
// to let one through. The page uses none, which the gate measures over its
// whole journey in every language; an injection that reached such a sink
// is refused there.
//
// `img-src data:` is for two things the page draws from no file: the
// `data:,` icon index.html names so that no load asks for /favicon.ico, and
// the calendar @formancy/themes' blueprint.css draws in a date field on iOS
// as a `data:` SVG. No image comes from a file of the build, or from the
// origin: an image is a request, and its address can carry what was typed.
//
// A header joined from two rules of `_headers` is merged into one value, so
// there is one rule, `/*`, which every file the Worker serves takes.

/** The directory the build's scripts, styles and faces are written to, as Vite names it by default (`build.assetsDir`). */
export const ASSETS = 'assets/'

/**
 * The headers, name to value, in the order `_headers` lists them, for the
 * page at `page`: an absolute http or https address of a directory, ending
 * in `/`, as the page's own relative files resolve against it. Anything
 * else is refused, since the policy would admit what it names.
 */
export function headersFor(page) {
  const url = URL.canParse(page) ? new URL(page) : undefined
  if (url === undefined || !['http:', 'https:'].includes(url.protocol) || url.href !== page || !url.pathname.endsWith('/') || url.search !== '' || url.hash !== '' || url.username !== '') {
    throw new Error(`the demo's headers are for the address of the directory its page is served from, written as a browser writes it and ending in /, not ${JSON.stringify(page)}`)
  }
  const assets = `${page}${ASSETS}`
  return Object.freeze({
    'Content-Security-Policy': [
      "default-src 'none'",
      `script-src ${assets}`,
      `style-src ${assets}`,
      `font-src ${assets}`,
      'img-src data:',
      "connect-src 'none'",
      "form-action 'none'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "worker-src 'none'",
      "manifest-src 'none'",
      "require-trusted-types-for 'script'",
      "trusted-types 'none'",
    ].join('; '),
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex',
    // The page asks for no device: @formancy/react ships a scanner widget,
    // which the demo's form does not use, and nothing else asks.
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cache-Control': 'public, max-age=0, must-revalidate, no-transform',
  })
}
