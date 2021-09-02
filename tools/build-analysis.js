import fs from 'fs'

const build = fs.readFileSync('dist/index.html', { encoding: 'utf-8' })

const words = {}
for (const match of build.matchAll(/\w{3,}/g)) {
  words[match[0]] = (words[match[0]] || 0) + 1
}

const sorted = Object.entries(words).sort((a, b) => a[1] - b[1])

for (const [word, count] of sorted) {
  console.log(word, count)
}