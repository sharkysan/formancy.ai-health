// The report's "Tested on" (0011; formancy.ai-report 0014): what this run's
// jobs met, beside what the checkout says it is tested with.
//
// Pure over the run's results and testedOn()'s facts. Each runtime
// dependency and upstream package is shown as published, as the suites
// loaded it, as a consumer's clean `npm install` of the tarballs resolved
// it -- every version it resolved -- and, apart, as the guide's project
// resolved it; Node as every job ran it, and the install gate's npm; each
// browser a browser gate launched, beside the build Playwright pins for
// it, and the axe-core it put in the page; and the validator the gate pins
// beside the one it reported, the Java it ran on and what it loaded.
//
// A consumer's install is the install gate's projects that build no part
// of the guide: the tarballs alone, as install-hosts.mjs plans `node`. The
// guide's project installs Formancy Report's runtime and renderer beside
// them, which no published package depends on, so what it resolved is never
// shown as what a consumer's install of the tarballs brings -- the SBOM
// leaves them out for the same reason (verify-publish.mjs).

import { browserGatesOf, installOf, validatorOf } from './results.mjs'

const distinct = (values) => [...new Set(values)]

/**
 * Every browser the run's browser gates launched, by name, version and
 * how, each with the browser version Playwright pins for it (null for a
 * browser no gate here runs, which the report then says) and the gates
 * that launched it.
 */
function launchedIn(results, browser) {
  const seen = new Map()
  for (const { gate } of browserGatesOf(results)) {
    if (gate.browser == null) continue
    const { name, version, headless } = gate.browser
    const key = `${String(name)} ${String(version)} ${String(headless)}`
    seen.set(key, { name, version, headless, pin: browser.pins.find((pin) => pin.browser === name)?.browserVersion ?? null, by: distinct([...(seen.get(key)?.by ?? []), `the browser gate of ${gate.gate}`]) })
  }
  return [...seen.values()]
}

/** The install gate's projects, by whether they build the guide: `consumer` for those that do not, `guide` for those that do. */
const projectsOf = (install, which) => (install?.consumers ?? []).filter((project) => (which === 'guide') === (project.guide != null))

/**
 * Every version the `which` projects' clean installs resolved for `name`,
 * in the gate's order -- `[{ version }]`, empty when none reported it.
 * Health's gate records the @formancy/* packages each project resolved; a
 * third-party runtime dependency, of which no published package has one
 * today, would be "not reported" until it records those too.
 */
function freshFor(install, name, which = 'consumer') {
  const resolved = projectsOf(install, which).flatMap((project) => project.resolved ?? [])
  return distinct(resolved.filter((entry) => entry.name === name).map((entry) => entry.version)).map((version) => ({ version }))
}

/** The run's Tested on: dependencies range -> loaded -> fresh, upstream with the guide's project's too, Node, npm, pnpm, the browsers, the tools and the validator. */
export function testedOnInRun({ results, facts }) {
  const install = installOf(results)
  const gate = validatorOf(results)?.gate ?? null
  return {
    runtime: facts.runtime.map((entry) => ({ ...entry, fresh: freshFor(install, entry.name) })),
    upstream: facts.upstream.map((entry) => ({ ...entry, fresh: freshFor(install, entry.name), guide: freshFor(install, entry.name, 'guide') })),
    installedAt: install?.startedAt ?? null,
    node: {
      ...facts.node,
      ran: distinct(results.map((result) => result.runner?.node).filter((node) => node != null)).sort(),
      install: install?.node ?? null,
    },
    npm: install?.npm ?? null,
    packageManager: facts.packageManager,
    browser: facts.browser,
    browsers: launchedIn(results, facts.browser),
    // The axe-core each browser gate injected into the page, as the page reported it.
    axe: distinct(browserGatesOf(results).map(({ gate }) => gate.axe)).filter((version) => version != null),
    tooling: facts.tooling,
    fhir: facts.fhir,
    guides: facts.guides,
    validator: {
      pinned: facts.validator,
      ran: gate === null ? null : { reported: gate.validator?.reported ?? null, java: gate.validator?.java ?? null, loaded: gate.packages?.loaded?.length ?? null },
    },
    runners: [...new Map(results.map((result) => [`${result.runner?.image ?? ''} ${result.runner?.imageVersion ?? ''}`, { image: result.runner?.image ?? null, imageVersion: result.runner?.imageVersion ?? null }])).values()],
  }
}
