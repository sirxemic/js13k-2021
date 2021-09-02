import { classNames } from './classNames.js'
import { currentPuzzle } from './globals.js'

// <dev-only>
for (let key in classNames) {
  classNames[key] = key
}
// </dev-only>

function getElement (name) {
  return document.querySelector('.' + name)
}

export function updateUI () {
  const connected = currentPuzzle.connectedTileCount - currentPuzzle.centerTiles.length
  const total = currentPuzzle.width * currentPuzzle.height - currentPuzzle.centerTiles.length
  getElement(classNames.progress).textContent = `${connected} of ${total} connected`
}

function processMonetization () {
  // TODO
}

if (document['monetization']) {
  document['monetization'].addEventListener('monetizationstart', processMonetization)
}
