import { TheAudioContext, setReverbDestination } from './Audio/Context.js'
import { createAudioBuffer } from './Audio/SoundGeneration.js'
import { createReverbIR } from './Audio/Samples/ReverbIR.js'
import { generateStarField } from './StarFieldGenerator.js'
import createMainSong from './Audio/MainSong.js'
import createVictorySong from './Audio/VictorySong.js'
import { createErrorSound } from './Audio/Samples/Error.js'
import { createPlaceSound } from './Audio/Samples/Place.js'
import { createLockSound } from './Audio/Samples/Lock.js'

export let MainSong
export let VictorySong
export let ErrorSound
export let PlaceSound
export let LockSound

export let StarFieldTexture

function createReverb () {
  const reverb = TheAudioContext.createConvolver()
  reverb.buffer = createAudioBuffer(createReverbIR())

  setReverbDestination(reverb)
}

export async function loadAssets () {
  StarFieldTexture = await generateStarField()

  ErrorSound = createAudioBuffer(await createErrorSound())
  PlaceSound = createAudioBuffer(await createPlaceSound())
  LockSound = createAudioBuffer(await createLockSound())

  createReverb()

  MainSong = await createMainSong()
  VictorySong = await createVictorySong()
}
