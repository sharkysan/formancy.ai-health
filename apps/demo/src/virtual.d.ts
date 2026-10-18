/** The modules the build hands the page (src/build/plugin.ts). */
declare module 'virtual:formancy-health-demo/sample' {
  /** The corpus's demo referral: scripts/validator/demo-referral.mjs's data. */
  const sample: import('./exports.js').Sample
  export default sample
}

declare module 'virtual:formancy-health-demo/letter' {
  /** The letter's PDF, as canonical base64: the bytes docs/release/letter.json registers. */
  const letter: string
  export default letter
}

declare module 'virtual:formancy-health-demo/facts' {
  const facts: import('./facts.js').Facts
  export default facts
}
