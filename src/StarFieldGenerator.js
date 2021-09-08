import { Texture } from './Graphics/Texture.js'
import { generateImage } from './utils.js'

export async function generateStarField () {
  const SIZE = 512
  const canvas = await generateImage(SIZE, SIZE, (ctx) => {
    const imageData = ctx.getImageData(0, 0, SIZE, SIZE)
    const data = imageData.data
    for (var i = 0; i < SIZE * SIZE; i++) {
      data[i * 4 + 0] = Math.random() < 0.005 ? 255 : 0
      data[i * 4 + 1] = (Math.random() ** 6) * 255
      data[i * 4 + 2] = (Math.random() ** 6) * 255
      data[i * 4 + 3] = 255
    }
    ctx.putImageData(imageData, 0, 0)
  })

  return new Texture({ source: canvas, repeat: true })
}
