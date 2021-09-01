import { TheAudioContext, setReverbDestination } from './Audio/Context'
import { createAudioBuffer } from './Audio/SoundGeneration'
import { createReverbIR } from './Audio/Samples/ReverbIR'
import { generateStarField } from './StarFieldGenerator'

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
