export let TheAudioContext = new window.AudioContext({ sampleRate: 22050 }) // Set explicit lower samplerate to speed up sound generation
export let TheAudioDestination = TheAudioContext.createDynamicsCompressor()

TheAudioDestination.connect(TheAudioContext.destination)

export let TheReverbDestination

export function setReverbDestination (reverb) {
  TheReverbDestination = TheAudioContext.createGain()
  TheReverbDestination.gain.value = 0.7
  TheReverbDestination.connect(reverb)
  reverb.connect(TheAudioDestination)
}

export let contextSampleRate = TheAudioContext.sampleRate
