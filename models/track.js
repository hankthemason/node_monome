const { Step, PolyStep, MonoStep } = require('./step')
const noteValues = require('../configurations/noteValues')
const notePasses = require('../utils/notePasses.js')
const getRandomNote = require('../utils/getRandomNote')

const MIDI_MAX = 127
const VIEW_COLUMN_HEIGHT = 8
const SCALAR = MIDI_MAX / VIEW_COLUMN_HEIGHT

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

    for (let x = 0; x < 64; x++) {
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

  updateNoteValue = (newNoteValue) => {
    this.noteValue = newNoteValue
  }

  updateMsPerNote = (masterConfig) => {
    const hzToMs = (1 / masterConfig.masterHz) * 1000
    const msPerNote = hzToMs / masterConfig.noteValues[this.noteValue].value
    this.msPerNote = msPerNote
  }

  updatePage = (newPage) => {
    this.page = newPage
  }

  updateView = (newView) => {
    this.view = newView
  }

  updateUpperLimit = (newUpperLimit) => {
    this.upperLimit = (this.page * 16) + newUpperLimit + 1

    //case where the playhead is beyond the new upperLimit
    if (this.upperLimit <= this.step) {
      this.step = 0
    }

    this.numPages = Math.ceil(this.upperLimit / 16)
  }

  updateStepSlide = (step) => {
    if (this.sequence[step].on) {
      this.sequence[step].slide = !this.sequence[step].slide
    }
  }

  updateStepOn = (step) => {
    this.sequence[step].on = !this.sequence[step].on
  }

  updateNumPages = (newNumPages) => {
    const prevNumPages = this.numPages
    const prevEnd = this.upperLimit
    this.numPages = newNumPages
    this.upperLimit = 16 * this.numPages
    const diff = Math.abs(this.numPages - prevNumPages)

    //if numPages decreased, don't do anything: keep the extra sequence parts in memory
    if (prevNumPages > this.numPages && this.page >= this.numPages) {
      if (this.page >= this.numPages) {
        this.page = this.numPages - 1
      }
      this.step = (this.step % 16) + (this.page * 16)
    }
  }

  updateStepVelocity = (x, y) => {
    if (this.sequence[x].on) {
      this.sequence[x].velocity = 15 - (y - 1)
    }
  }

  updateStepProb = (x, y) => {
    if (this.sequence[x].on) {
      //turn off prob if prob is 1 and press 1
      if (this.sequence[x].prob === 1 && y === 15) {
        this.sequence[x].prob = 0
      } else {
        this.sequence[x].prob = 15 - (y - 1)
      }
    }
  }

  updatePitchProb = (x, y) => {
    if (this.sequence[x].on) {
      //turn off prob if prob is double clicked
      if (this.sequence[x].pitchProb === 15 - y + 1) {
        this.sequence[x].pitchProb = 0
      } else {
        this.sequence[x].pitchProb = 15 - (y - 1)
      }
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

    for (let x = 0; x < 64; x++) {
      this.sequence[x] = new MonoStep(false, null, 0, 0, 0, 0, false)
    }

  }

  updateStepPitch = (step, y) => {
    let note = this.rootNote + this.scale[(15 - y) % 7] + (this.sequence[step].octave * 12)
    //allow for octaves to be input
    if (y < 9) {
      note += 12
    }
    //check the input against the instrument's bounds
    if (note >= this.instrumentConfig.minNote && note <= this.instrumentConfig.maxNote) {
      this.sequence[step].pitch = note
      this.sequence[step].velocity = 8
      this.sequence[step].prob = 8
    }
  }

  updateStepOctave = (step, y) => {
    //this is the real # of possible octaves based on root note
    const calculatedOctaveSpan = Math.ceil((this.instrumentConfig.maxNote - this.rootNote) / 12)
    if ((15 - y) < calculatedOctaveSpan) {
      const prevOctave = this.sequence[step].octave
      this.sequence[step].octave = 15 - y
      const diff = Math.abs(prevOctave - this.sequence[step].octave)
      this.sequence[step].octave > prevOctave ? this.sequence[step].pitch += diff * 12 : this.sequence[step].pitch -= diff * 12
    }
  }

  getNotes = step => {
    const ms = this.msPerNote
    const msPerNote = this.sequence[step].slide ? ms + (ms * .25) : ms - (ms * .25)
    const velocity = this.sequence[step].velocity * SCALAR
    //if prob < 8, calculate whether or not the note passes
    let passNote = this.sequence[step].prob < 8 ? notePasses(this.sequence[step].prob) : true
    //use notePasses helper with pitchProb value to determine if we will get a new random pitch
    let noteIsRandom = notePasses(this.sequence[step].pitchProb)
    let randomNote

    if (noteIsRandom) {
      randomNote = getRandomNote(this)
      //console.log(randomNote)
    }

    if (this.sequence[step].on && passNote) {
      return [randomNote || this.sequence[step].pitch, velocity, msPerNote]
    } else {
      return [null, null]
    }
  }
}

//a track for an instrument that has an arbitrary pitch-mapping
//e.g. a drum machine whose pads are mapped to arbitrary pitches
class MappedTrack extends PolyTrack {
  constructor(track, noteValue, instrumentConfig) {
    super(track, noteValue, instrumentConfig)

    for (let x = 0; x < 64; x++) {
      this.sequence[x] = new PolyStep(false, new Array(this.instrumentConfig.mapping.length), 0, 0, 0, 0, false)
    }
  }

  updateStepPitch = (step, y) => {
    const yOffset = this.sequence[step].octave * 8
    const noteIdx = (15 - y)

    //turn note off if already selected
    if (this.sequence[step].pitches.includes(this.instrumentConfig.mapping[noteIdx])) {
      this.sequence[step].pitches[15 - y + yOffset] = null
    }
    //otherwise turn note on and make velocity, prob max (8)
    else {
      this.sequence[step].pitches[noteIdx] = this.instrumentConfig.mapping[noteIdx]
      this.sequence[step].velocity = 8
      this.sequence[step].prob = 8
    }
  }

  updateStepOctave = (step, y) => {
    if ((15 - y) < this.instrumentConfig.octaveSpan) {
      this.sequence[step].octave = 15 - y
    }
  }

  getNotes = step => {
    const ms = this.msPerNote
    const msPerNote = this.sequence[step].slide ? ms + (ms * .25) : ms - (ms * .25)
    const velocity = this.sequence[step].velocity * SCALAR

    if (this.sequence[step].on) {
      const notes = this.sequence[step].pitches
      return [notes, velocity, msPerNote]
    } else {
      return [null, null]
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