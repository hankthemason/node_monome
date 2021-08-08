class Track {
  constructor(track, noteValue) {
    this.track = track,
    this.noteValue = noteValue
    this.page = 0
    this.step = 0
    this.upperLimit = 15
    this.sequence = new Array(this.upperLimit)
  }

  incrementStep = () => {
    this.step += 1
    if (this.step > this.upperLimit) {
      this.step = 0
    }
  }
}

class PolyTrack extends Track {
  constructor(track, noteValue) {
    super(track, noteValue)
  }
}

class MonoTrack extends Track {
  constructor(track, noteValue) {
    super(track, noteValue)
  }
}

//a track for an instrument that has an arbitrary pitch-mapping
//e.g. a drum machine whose pads are mapped to arbitrary pitches
class MappedTrack extends PolyTrack {
  constructor(track, noteValue) {
    super(track, noteValue)
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
  }
}

module.exports = Track