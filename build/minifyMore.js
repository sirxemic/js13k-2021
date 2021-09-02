export function minifyMore (code) {
  return code
    .replace(/\["(\w+)"\]:/g, (g0, g1) => g1 + ':')
    .replace(/\[(\d+)\]:/g, (g0, g1) => g1 + ':')
    .replace(/window\.localStorage/g, 'localStorage')
}