const ledHandler = require('./ledHandler')
const currentTrackHandler = require('./currentTrackHandler')
const { syncOnHandler, syncOffHandler } = require('./syncHandler')

module.exports = {
  ledHandler,
  currentTrackHandler,
  syncOnHandler,
  syncOffHandler
}