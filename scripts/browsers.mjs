// The browsers this repository's gates run in (0012): Chromium alone, the
// one the demo's browser gate measures, as formancy.ai-report's
// scripts/browsers.mjs names it for its Studio's. formancy.ai-data's runs
// three, with a matrix leg each (its 0058); this keeps their names for the
// one, so a browser added here is one more entry and a leg of the `browser`
// job, not a new shape.
//
// The release report expects the demo's gate to have left results in every
// browser named here, and holds what it launched to the build Playwright
// pins for it, launched as LAUNCH_OPTIONS says. The gate itself launches
// Chromium by name; were a browser added here and not there, the report
// would say it left no results in it.
//
// It imports nothing: collect.mjs imports it, and collect runs in every job
// of the gates, whatever that job's install did (workflows.test.mjs follows
// the imports).

/** Every browser the gates run in, by Playwright's name for it. */
export const BROWSERS = Object.freeze(['chromium'])

/** Each browser as a reader knows it; one without a name here is shown by its own. */
const NAMES = Object.freeze({ chromium: 'Chromium', firefox: 'Firefox', webkit: 'WebKit' })

export const browserName = (browser) => NAMES[browser] ?? String(browser)

/** The options the browser gate launches a browser with. */
export const LAUNCH_OPTIONS = Object.freeze({ headless: true })

/**
 * The build of Playwright's browsers.json each browser of BROWSERS starts
 * with LAUNCH_OPTIONS. Chromium launched headless starts the headless shell,
 * which Playwright pins beside the full browser at the same version, so the
 * version alone does not tell the two apart (formancy.ai-data's
 * launchedBuild, which reads Playwright's choice of executable): the report
 * holds a launch to `headless` as well.
 */
export const PINNED_AS = Object.freeze({ chromium: LAUNCH_OPTIONS.headless ? 'chromium-headless-shell' : 'chromium' })

/**
 * What a gate records of the browser it launched with `options`: the name and
 * version the browser gives, and whether it ran headless, which is
 * Playwright's default when `options` does not say.
 */
export const launchedAs = (instance, options) => ({ name: instance.browserType().name(), version: instance.version(), headless: options.headless ?? true })
