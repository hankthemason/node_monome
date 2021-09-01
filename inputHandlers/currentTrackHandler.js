const calculateLimits = require('../utils/calculateLimits')
const _ = require('lodash')
const getNoteFromY = require('../utils/getNoteFromY')
const { prophet12 } = require('../configurations/instrumentConfigs')

const currentTrackHandler = (x, y, currentTrack) => {
  if (y === 0) {
    //switch note value
    if (x > 5 && x < 12) {
      currentTrack.updateNoteValue(x - 6)
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
    else if (x === 10) {
      currentTrack.updateNoteEffectType()
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
  } else if (y === 5) {
    currentTrack.updateNoteEffect(x)
  } else if (y === 6) {
    currentTrack.updateStepSlide(x)
  } else if (y === 7) {
    currentTrack.updateStepOn(x)
  } else if (y > 7 && x < currentTrack.upperLimit) {
    //this one is complicated 
    if (currentTrack.view === 0) {
      //a note press turns the step on
      if (!currentTrack.sequence[x].on) {
        currentTrack.updateStepOn(x)
        //if there are no pitches, update the pitch with the input one
        if (currentTrack.poly && !currentTrack.sequence[x].pitches.length ||
          !currentTrack.poly && !currentTrack.sequence[x].pitch) {
          currentTrack.updateStepPitch(x, y)
        }
        //for a polyTrack, if there are pitches but the input one is a new pitch, update with that pitch
        else if (currentTrack.poly) {
          if (currentTrack.instrumentConfig.mapping) {
            if (!currentTrack.sequence[x].pitches[(15 - y) + currentTrack.sequence[x].octave * 8]) {
              currentTrack.updateStepPitch(x, y)
            }
          } else {
            const note = getNoteFromY(currentTrack, x, y)
            if (!currentTrack.sequence[x].pitches.includes(note)) {
              currentTrack.updateStepPitch(x, y)
            }
          }
        } else if (!currentTrack.poly) {
          const note = getNoteFromY(currentTrack, x, y)
          if (note !== currentTrack.sequence[x].pitch) {
            currentTrack.updateStepPitch(x, y)
          }
        }

      } else {
        currentTrack.updateStepPitch(x, y)
      }
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