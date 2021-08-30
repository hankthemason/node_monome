class Step {
  constructor(on, velocity, octave, prob, pitchProb, slide, noteEffect) {
    this.on = on;
    this.velocity = velocity;
    this.octave = octave;
    this.prob = prob;
    this.pitchProb = pitchProb;
    this.slide = slide;
    this.noteEffect = noteEffect;
  }
}

class MonoStep extends Step {
  constructor(on, pitch, velocity, octave, prob, pitchProb, slide, noteEffect) {
    super(on, velocity, octave, prob, pitchProb, slide, noteEffect)
    this.pitch = pitch
  }
}

class PolyStep extends Step {
  constructor(on, pitches, velocity, octave, prob, pitchProb, slide, noteEffect) {
    super(on, velocity, octave, prob, pitchProb, slide, noteEffect)
    this.pitches = pitches
  }
}

module.exports = {
  Step,
  PolyStep,
  MonoStep
}