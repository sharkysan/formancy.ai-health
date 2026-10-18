// The page's composition root: the stylesheets in their order, the build's
// modules, the language the browser prefers, and the page.
//
// formancy's workbench first, the panes and controls formancy's tools are
// drawn with, as @formancy/themes 0.5.0 ships it, light; then Blueprint,
// which dresses the form on its sheet; then the faces, from this build.
// Imported, never copied (0002, 0012): the page's own stylesheet states
// no colour and declares no variable, and wears formancy.ai's room the day
// a formancy release ships room.css, as one import here and a version in
// the manifest. styles.test.ts holds the order and the rest.
import '@formancy/themes/workbench.css'
import '@formancy/themes/blueprint.css'
import './styles/fonts.css'
import './styles/demo.css'
import { fromBase64Binary } from '@formancy/health-core'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import facts from 'virtual:formancy-health-demo/facts'
import letter from 'virtual:formancy-health-demo/letter'
import sample from 'virtual:formancy-health-demo/sample'
import { Demo } from './demo.js'
import { askForEveryFace } from './faces.js'
import { firstLanguage } from './words/index.js'

const root = document.getElementById('root')
if (root === null) throw new Error('index.html has no #root to render into')

// Every face now, so that nothing shown or typed later asks for one.
void askForEveryFace(document.fonts)

// An error the page's boundary catches is said on the page and logged
// nowhere: what it says may quote what was typed.
createRoot(root, { onCaughtError: () => undefined }).render(
  <StrictMode>
    <Demo sample={sample} pdf={fromBase64Binary(letter, 'letter')} facts={facts} language={firstLanguage(navigator.languages)} />
  </StrictMode>,
)
