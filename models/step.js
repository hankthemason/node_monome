class Step {
  constructor(on, pitch, velocity, octave, prob, pitchProb, slide) {
    this.on = on,
    this.velocity = velocity, 
    this.octave = octave,
    this.prob = prob,
    this.pitchProb = pitchProb,
    this.slide = slide
  }
}

class MonoStep extends Step {
  constructor(on, pitch, velocity, octave, prob, pitchProb, slide) {
    super(on, velocity, octave, prob, pitchProb, slide)
    this.pitch = pitch
  }
}

class PolyStep extends Step {
  constructor(on, pitches, velocity, octave, prob, pitchProb, slide) {
    super(on, velocity, octave, prob, pitchProb, slide)
    this.pitches = pitches
  }
}

module.exports = {
  Step,
  PolyStep,
  MonoStep
}