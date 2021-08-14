const { buildAllRows } = require('../utils/buildRow')


const ledHandler = (x, y, led, currentTrack) => {
  led = buildAllRows(led, currentTrack)
  return led
}

module.exports = ledHandler