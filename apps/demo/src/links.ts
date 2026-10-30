/**
 * Every address the page links to, and nothing else: the repository, its
 * licence, the register of warnings the validator gate accepts, and the
 * formancy.ai's legal notice and privacy notice, which the footer links, the
 * notices of what the page bundles, the one file of its own build it links
 * to, which scripts/third-party-notices.mjs writes beside index.html and
 * names NOTICES_FILE (src/build/plugin.test.ts holds the two the same). The
 * page fetches none of them; a visitor follows them.
 */
const REPOSITORY = 'https://github.com/sharkysan/formancy.ai-health'

export const LINKS = Object.freeze({
  repository: REPOSITORY,
  licence: `${REPOSITORY}/blob/main/LICENSE.md`,
  warnings: `${REPOSITORY}/blob/main/scripts/validator/warnings.json`,
  legal: 'https://formancy.ai/legal/',
  privacy: 'https://formancy.ai/privacy/',
  notices: 'THIRD-PARTY-NOTICES.txt',
})
