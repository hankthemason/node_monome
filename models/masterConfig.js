class MasterConfig {
  constructor(tracks, masterHz, syncing, syncTrack, noteValues, currentTrack) {
    this.tracks = tracks,
    this.masterHz = masterHz,
    this.syncing = syncing,
    this.syncTrack = syncTrack,
    this.noteValues = noteValues,
    this.currentTrack = currentTrack
  }

  updateCurrentTrack (newCurrentTrack) {
    this.currentTrack = newCurrentTrack
  }
}

module.exports = MasterConfig