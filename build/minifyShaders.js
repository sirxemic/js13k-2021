export function minifyShaders (code) {
  return code.replace(/"\/\*glsl\*\/([\s\S]+?)"/g, shaderCode => {
    const s = JSON.parse(shaderCode)
    return JSON.stringify(
      s.substr(8)
        .replace(/\s+/g, ' ')
        .replace(/^\s+|\s+$/g, '')
        .replace(/\/\/.+/g, '')
        .replace(/\/\*[\s\S]+?\*\//g, '')
        .replace(/\b0(\.\d+)\b/g, (_, g1) => g1)
        .replace(/\b(\d+\.)0\b/g, (_, g1) => g1)
        .replace(/(\W) /g, (_, g1) => g1)
        .replace(/ (\W)/g, (_, g1) => g1)
    )
  })
}
