const maxApi = require('max-api')
const calculateLimits = require('../utils/calculateLimits')
const noteValues = require('../configurations/noteValues')
const { MonoStep, PolyStep } = require('../models/step')

const currentTrackHandler = (x, y, currentTrack, masterConfig) => {
  if (y === 0) {
    if (x < 6 && x !== currentTrack.track) {
      currentTrack = masterConfig.tracks[x]
      maxApi.outlet('changeTrack', x)
    } 
    //switch note value
    else if (x > 5 && x < 12) {
      currentTrack.updateNoteValue(x - 6, masterConfig)
      maxApi.outlet('changeNoteValue', noteValues[currentTrack.noteValue].coeff, currentTrack.track)
    }
    //switch current page on view
    else if (x > 11) {
      if ((x - 12) < currentTrack.numPages) {
        currentTrack.updatePage(x - 12)
      }
    }
  } else if ( y === 1) {
    //change currentTrack's view
    if (x < 5) {
      currentTrack.updateView(x)
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
      maxApi.post('current track handler')
      maxApi.post(x)
      maxApi.post(currentTrack.sequence[x].octave)
    }
  }
  
  return currentTrack
}

module.exports = currentTrackHandler