const maxApi = require('max-api')
const getMsPerNote = require('../utils/getMsPerNote')
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
      currentTrack.noteValue = x - 6
      currentTrack.msPerNote = getMsPerNote(masterConfig.masterHz, currentTrack)
      maxApi.outlet('changeNoteValue', noteValues[currentTrack.noteValue].coeff, currentTrack.track)
    }
    //switch current page on view
    else if (x > 11) {
      if ((x - 12) < currentTrack.numPages) {
        currentTrack.page = x - 12
      }
    }
  } else if ( y === 1) {
    //change currentTrack's view
    if (x < 5) {
      currentTrack.view = x
    } 
    else if (x > 11) {
      let t = currentTrack
      const prevNumPages = t.numPages
      t.numPages = x - 11
      t.upperLimit = 16 * t.numPages

      const diff = Math.abs(t.numPages - prevNumPages)
      //numPages increased
      if (prevNumPages < t.numPages) {
        for (let x = 0; x < 16 * diff; x++) {
          //mapping instrument
          if (t.instrumentConfig.mapping) {
            t.sequence.push(new PolyStep(false, new Array(t.instrumentConfig.mapping.length), 0, 0, 0, 0, false))
          }
          //mono
          if (!t.poly) {
            t.sequence.push(new MonoStep(false, null, 0, 0, 0, 0, false))
          }
        }
      } 
      //if numPages decreased, don't do anything: keep the extra sequence parts in memory
      else if (prevNumPages > t.numPages && t.page >= t.numPages) {
        if (t.page >= t.numPages) {
          t.page = t.numPages - 1
        }
        t.step = (t.step % 16) + (t.page * 16)
      }
    }
  } else if (y == 2) {
    let [pageStart, pageEnd] = calculateLimits(currentTrack)
    //change upperLimit
    if (x + 1 !== pageEnd % 16) {
      currentTrack.upperLimit = (currentTrack.page * 16) + x + 1
      //case where the playhead is beyond the new upperLimit
      //differentiation here because I don't want to refresh all rows if I don't have to
      if (currentTrack.upperLimit <= currentTrack.step) {
        let prevStep = currentTrack.step - 1
        currentTrack.step = 0
      }
    }
  } else if (y === 6) {
    if (currentTrack.sequence[x].on) {
      currentTrack.sequence[x].slide = !currentTrack.sequence[x].slide
    }
  } else if (y === 7) {
    currentTrack.sequence[x].on = !currentTrack.sequence[x].on
  }
  
  return currentTrack
}

module.exports = currentTrackHandler