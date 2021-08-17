const maxApi = require('max-api')
const calculateLimits = require('../utils/calculateLimits')
const noteValues = require('../configurations/noteValues')
const { MonoStep, PolyStep } = require('../models/step')
const _ = require('lodash')

const currentTrackHandler = (x, y, currentTrack) => {
  if (y === 0) {
    //switch note value
    if (x > 5 && x < 12) {
      currentTrack.updateNoteValue(x - 6)
      maxApi.outlet('changeNoteValue', noteValues[currentTrack.noteValue].coeff, currentTrack.track)
    }
    //switch current page on view
    else if (x > 11) {
      if ((x - 12) < currentTrack.numPages) {
        currentTrack.updatePage(x - 12)
      }
    }
  } else if (y === 1) {
    //change currentTrack's view
    if (x < 6) {
      currentTrack.updateView(x)
    }
    //toggle follow mode
    else if (x === 6) {
      currentTrack.followMode = !currentTrack.followMode
    }
    //copy/paste
    else if (x > 7 && x < 10) {
      //copy
      if (x === 8) {
        let [pageStart, pageEnd] = calculateLimits(currentTrack)
        currentTrack.copyBuffer = _.cloneDeep(currentTrack.sequence.slice(pageStart, pageEnd))
      }
      //paste
      else if (currentTrack.copyBuffer) {
        let [pageStart, pageEnd] = calculateLimits(currentTrack)
        currentTrack.sequence.splice(pageStart, currentTrack.copyBuffer.length, ...currentTrack.copyBuffer)
        currentTrack.copyBuffer = []
      }
    }
    else if (x > 11) {
      currentTrack.updateNumPages(x - 11)
    }
  } else if (y == 2) {
    let [pageStart, pageEnd] = calculateLimits(currentTrack)
    //change upperLimit
    if (x + 1 !== pageEnd % 16) {
      currentTrack.updateUpperLimit(x)
    }
  } else if (y === 6) {
    currentTrack.updateStepSlide(x)
  } else if (y === 7) {
    currentTrack.updateStepOn(x)
  } else if (y > 7 && x < currentTrack.upperLimit) {
    if (currentTrack.view === 0) {
      if (!currentTrack.sequence[x].on) {
        currentTrack.updateStepOn(x)
      }
      currentTrack.updateStepPitch(x, y)
    } else if (currentTrack.view === 1) {
      currentTrack.updateStepOctave(x, y)
    } else if (currentTrack.view === 2) {
      currentTrack.updateStepVelocity(x, y)
    } else if (currentTrack.view === 3) {
      currentTrack.updateStepProb(x, y)
    } else if (currentTrack.view === 4) {
      currentTrack.updatePitchProb(x, y)
    }
  }

  return currentTrack
}

module.exports = currentTrackHandler