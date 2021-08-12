const { buildRow, buildAllRows, buildViewRows } = require('../utils/buildRow')

const ledHandler = (x, y, led, currentTrack) => {
  if (y === 0) {
    led = handleRow0(x, y, led, currentTrack)
  } else if (y === 1) {
    led = handleRow1(x, y, led, currentTrack)
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


module.exports = ledHandler