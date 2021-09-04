let element

let index = 0

const queue = []

export function debug (...stuff) {
// <dev-only>
  if (!element) {
    element = document.createElement('div')
    element.style.position = 'fixed'
    element.style.left = '0'
    element.style.top = '0'
    element.style.zIndex = '10000'
    element.style.background = '#000'
    element.style.color = '#fff'
    element.style.whiteSpace = 'pre-wrap'
    document.body.appendChild(element)
  }

  queue.push(`${index++}: ${stuff.map(x => String(x)).join(';')}`)
  if (queue.length === 11) {
    queue.shift()
  }

  element.textContent = queue.join('\n')
// </dev-only>
}
