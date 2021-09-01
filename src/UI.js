import { classNames } from './classNames'

// <dev-only>
for (let key in classNames) {
  classNames[key] = key
}
// </dev-only>

function getElement (name) {
  return document.querySelector('.' + name)
}

export function updateUI () {

}

function processMonetization () {
  // TODO
}

if (document['monetization']) {
  document['monetization'].addEventListener('monetizationstart', processMonetization)
}
