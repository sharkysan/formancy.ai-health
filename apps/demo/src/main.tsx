// The page's composition root: the stylesheets in their order, the build's
// modules, the language the browser prefers, and the page.
//
// formancy's workbench first, the panes and controls formancy's tools are
// drawn with, light as it ships; then formancy.ai's room, the admin's dark
// bench, which sets the workbench's colours to its own and must come
// after it, since both say :root; then Blueprint, which dresses the form
// on its paper, as the admin's previews are; then the faces, from this
// build. Each as @formancy/themes ships it at the release the manifest
// pins, imported, never copied (0002, 0012, 0015): the page's own
// stylesheet states no colour and declares no variable. styles.test.ts
// holds the order and the rest, and the browser gate the room as the
// browser computes it.
import '@formancy/themes/workbench.css'
import '@formancy/themes/room.css'
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
