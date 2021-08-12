const syncOnHandler = (masterConfig, currentTrack) => {
  masterConfig.syncing = true
  masterConfig.syncTrack = currentTrack 
  return masterConfig
}

const syncOffHandler = masterConfig => {

}

module.exports = { syncOnHandler, syncOffHandler }