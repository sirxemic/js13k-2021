export let TheAudioContext = new window.AudioContext()
export let TheAudioDestination = TheAudioContext.destination

export let TheReverbDestination

export function setReverbDestination (reverb) {
  TheReverbDestination = TheAudioContext.createGain()
  TheReverbDestination.gain.value = 0.7
  TheReverbDestination.connect(reverb)
  reverb.connect(TheAudioDestination)
}

export let contextSampleRate = TheAudioContext.sampleRate
