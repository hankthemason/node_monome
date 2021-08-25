class Step {
  constructor(on, pitch, velocity, octave, prob, pitchProb, slide, noteRepeat) {
    this.on = on,
      this.velocity = velocity,
      this.octave = octave,
      this.prob = prob,
      this.pitchProb = pitchProb,
      this.slide = slide,
      this.noteRepeat = noteRepeat
  }
}

class MonoStep extends Step {
  constructor(on, pitch, velocity, octave, prob, pitchProb, slide, noteRepeat) {
    super(on, velocity, octave, prob, pitchProb, slide, noteRepeat)
    this.pitch = pitch
  }
}

class PolyStep extends Step {
  constructor(on, pitches, velocity, octave, prob, pitchProb, slide, noteRepeat) {
    super(on, velocity, octave, prob, pitchProb, slide, noteRepeat)
    this.pitches = pitches
  }
}

module.exports = {
  Step,
  PolyStep,
  MonoStep
}