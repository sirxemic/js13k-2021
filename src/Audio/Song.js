import { TheAudioContext, TheAudioDestination, TheReverbDestination } from './Context.js'

export class Song {
  constructor (channelConfigs, loop) {
    this.channelConfigs = channelConfigs
    this.playing = false
    this.loop = loop

    let master = TheAudioContext.createGain()

    this.channels = channelConfigs.map(config => {
      let gainNode = TheAudioContext.createGain()

      gainNode.connect(master)

      if (config.sendToReverb) {
        let gain = TheAudioContext.createGain()
        gain.gain.value = config.sendToReverb
        gainNode.connect(gain)
        gain.connect(TheReverbDestination)
      }

      return {
        buffer: config.buffer,
        sourceTarget: gainNode,
        volume: config.volume,
        volumeParam: gainNode.gain
      }
    })

    master.connect(TheAudioDestination)
  }

  tapeStop (time = 1) {
    this.playing = false
    this.channels.forEach(channel => {
      channel.source.playbackRate.setValueAtTime(1, TheAudioContext.currentTime)
      channel.source.playbackRate.linearRampToValueAtTime(0.001, TheAudioContext.currentTime + time)
    })
  }

  duckForABit () {
    this.channels.forEach(channel => {
      channel.volumeParam.linearRampToValueAtTime(0, TheAudioContext.currentTime + 0.02)
      channel.volumeParam.linearRampToValueAtTime(channel.volume, TheAudioContext.currentTime + 4)
    })
  }

  play () {
    this.playing = true
    this.channels.forEach(channel => {
      if (channel.source) {
        channel.source.disconnect()
      }

      const sourceNode = TheAudioContext.createBufferSource()
      sourceNode.loop = this.loop
      sourceNode.loopEnd = channel.buffer.duration
      sourceNode.buffer = channel.buffer
      sourceNode.connect(channel.sourceTarget)
      sourceNode.start()
      channel.source = sourceNode
      channel.volumeParam.value = channel.volume
    })
  }
}