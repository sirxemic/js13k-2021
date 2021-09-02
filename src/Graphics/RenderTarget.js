import { gl } from '../Graphics.js'
import { Texture } from './Texture.js'

export class RenderTarget extends Texture {
  constructor (width, height) {
    super({ width, height })

    this.framebuffer = gl.createFramebuffer()

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0)
    // <dev-only>
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('incomplete framebuffer')
    }
    // </dev-only>

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  resize (width, height) {
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  }

  bind() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
  }

  static unbind() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }
}
