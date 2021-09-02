import { TheAudioContext, setReverbDestination } from './Audio/Context.js'
import { createAudioBuffer } from './Audio/SoundGeneration.js'
import { createReverbIR } from './Audio/Samples/ReverbIR.js'
import { generateStarField } from './StarFieldGenerator.js'

export let StarFieldTexture

function createReverb () {
  const reverb = TheAudioContext.createConvolver()
  reverb.buffer = createAudioBuffer(createReverbIR())

  setReverbDestination(reverb)
}

export async function loadAssets () {
  StarFieldTexture = await generateStarField()

  createReverb()
}
