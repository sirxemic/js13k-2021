import fs from 'fs'

const build = fs.readFileSync('dist/index.html', { encoding: 'utf-8' })

const words = new Map()
for (const match of build.matchAll(/\w{3,}/g)) {
  if (!words.has(match[0])) {
    words.set(match[0], 0)
  }
  words.set(match[0], words.get(match[0]) + 1)
}

const sorted = [...words.entries()].sort((a, b) => a[1] - b[1])

for (const [word, count] of sorted) {
  console.log(word, count)
}