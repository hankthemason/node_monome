const { 
  buildRow, 
  buildAllRows, 
  buildViewRows, 
  buildLengthSelectorRow } = require('../utils/buildRow')
const { buildColumn } = require('../utils/buildColumn')
const insertCol = require('../utils/insertCol')
const calculateLimits = require('../utils/calculateLimits')

const ledHandler = (x, y, led, currentTrack) => {
  if (y === 0) {
    led = handleRow0(x, y, led, currentTrack)
  } else if (y === 1) {
    led = handleRow1(x, y, led, currentTrack)
  } else if (y === 2) {
    led = handleRow2(x, y, led, currentTrack)
  } else if (y === 6) {
    led = handleRow6(x, y, led, currentTrack)
  } else if (y === 7) {
    led = handleRow7(x, y, led, currentTrack)
  }
  return led
}

const handleRow0 = (x, y, led, currentTrack) => {
  if (x < 6 && x !== currentTrack.track) {
    led = buildAllRows(led, currentTrack)
  } 
  //switch note value
  else if (x > 5 && x < 12) {
    led[y] = buildRow(y, currentTrack)
  }
  //switch current page on view
  else if (x > 11) {
    if ((x - 12) < currentTrack.numPages) {
      led = buildAllRows(led, currentTrack)
    }
  }
  return led
}

const handleRow1 = (x, y, led, currentTrack) => {
  if (x < 5) {
    led[y] = buildRow(y, currentTrack)
    const viewRows = buildViewRows(currentTrack)
    led.splice(8, 8, ...viewRows)
  } 
  //numPages selector
  else if (x > 11) {
    led[y] = buildRow(y, currentTrack)
  }
  return led
}

const handleRow2 = (x, y, led, currentTrack) => {
  let [pageStart, pageEnd] = calculateLimits(currentTrack)
  //change upperLimit
  if (x + 1 !== pageEnd % 16) {
    //if reducing length, only rebuild the columns to the right of the new upper limit
    if (currentTrack.upperLimit <= currentTrack.step) {
      const col = buildColumn(prevStep, currentTrack)
      led = insertCol(led, col, prevStep % 16)
      led = refreshColumnArea(led, upperLimit,currentTrack)
      led = refreshRows(led, currentTrack)
    } else {
      led = buildAllRows(led, currentTrack)
    }
  }
  led[y] = buildLengthSelectorRow(currentTrack)
  return led
}

const handleRow6 = (x, y, led, currentTrack) => {
  led = buildRow(y, currentTrack)
  return led
}

const handleRow7 = (x, y, led, currentTrack) => {
  const col = buildColumn(x, currentTrack)
  led = insertCol(led, col, x % 16)
  led[y] = buildRow(y, currentTrack)
  return led
}


module.exports = ledHandler