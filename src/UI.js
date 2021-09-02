import { classNames } from './classNames.js'

// <dev-only>
for (let key in classNames) {
  classNames[key] = key
}
// </dev-only>

function getElement (name) {
  return document.querySelector('.' + name)
}

export function updateUI () {
  // TODO
  getElement(classNames.header).textContent = 'Easy puzzle'
}

function processMonetization () {
  // TODO
}

if (document['monetization']) {
  document['monetization'].addEventListener('monetizationstart', processMonetization)
}
