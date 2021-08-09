const { Step, PolyStep } = require('./step')

class Track {
  constructor(track, noteValue, instrumentConfig) {
    this.track = track,
    this.noteValue = noteValue
    this.page = 0
    this.step = 0
    this.upperLimit = 15
    this.sequence = new Array(this.upperLimit + 1)
    this.isMaster = 0
    //specifies which view a track has currently selected(pitch, velocity, pitchProb, prob, anything)
    this.view = 0
    this.numPages = 1
    this.instrumentConfig = instrumentConfig

    for (let x = 0; x < this.sequence.length; x++) {
      this.sequence[x] = new Step(false, 0, 0, 0, 0, 0, 0)
    }
  }

  incrementStep = () => {
    if (this.step === 15) {
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
  }
}

//a track for an instrument that has an arbitrary pitch-mapping
//e.g. a drum machine whose pads are mapped to arbitrary pitches
class MappedTrack extends PolyTrack {
  constructor(track, noteValue, instrumentConfig) {
    super(track, noteValue, instrumentConfig)

    for (let x = 0; x < this.sequence.length; x++) {
      this.sequence[x] = new PolyStep(false, new Array(this.instrumentConfig.mapping.length), 0, 0, 0, 0, 0)
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