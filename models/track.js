const { Step, PolyStep, MonoStep } = require('./step')

class Track {
  constructor(track, noteValue, instrumentConfig) {
    this.track = track,
    this.noteValue = noteValue
    this.page = 0
    this.step = 0
    this.upperLimit = 16
    this.sequence = new Array(this.upperLimit)
    this.isMaster = false
    //specifies which view a track has currently selected(pitch, velocity, pitchProb, prob, anything)
    this.view = 0
    this.numPages = 1
    this.instrumentConfig = instrumentConfig
    this.rootNote = null
    this.scale = null
    this.msPerNote = null
    this.followMode = false

    for (let x = 0; x < this.sequence.length; x++) {
      this.sequence[x] = new Step(false, 0, 0, 0, 0, 0, false)
    }
  }

  incrementStep = () => {
    if (this.step === this.upperLimit - 1) {
      this.step = 0
    } else {
      this.step++
    }
  }
}

class PolyTrack extends Track {
  constructor(track, noteValue, instrumentConfig) {
    super(track, noteValue, instrumentConfig)
    this.poly = true
  }
}

class MonoTrack extends Track {
  constructor(track, noteValue, instrumentConfig) {
    super(track, noteValue, instrumentConfig)
    this.poly = false

    for (let x = 0; x < this.sequence.length; x++) {
      this.sequence[x] = new MonoStep(false, null, 0, 0, 0, 0, false)
    }
  }
}

//a track for an instrument that has an arbitrary pitch-mapping
//e.g. a drum machine whose pads are mapped to arbitrary pitches
class MappedTrack extends PolyTrack {
  constructor(track, noteValue, instrumentConfig) {
    super(track, noteValue, instrumentConfig)

    for (let x = 0; x < this.sequence.length; x++) {
      this.sequence[x] = new PolyStep(false, new Array(this.instrumentConfig.mapping.length), 0, 0, 0, 0, false)
    }
  }
  
}

//a track for an instrument with traditional pitch-mapping
//e.g. a keyboard
class ScalarMonoTrack extends MonoTrack {
  constructor(track, noteValue) {
    super(track, noteValue)
  }

}

class ScalarPolyTrack extends PolyTrack {
  constructor(track, noteValue) {
    super(track, noteValue)
    this.poly = true
  }
}

module.exports = {
  Track,
  MappedTrack,
  MonoTrack
}