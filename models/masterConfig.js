class MasterConfig {
  constructor(tracks, masterHz, syncing, syncTrack, noteValues, currentTrack, copying) {
    this.tracks = tracks,
      this.masterHz = masterHz,
      this.syncing = syncing,
      this.syncTrack = syncTrack,
      this.noteValues = noteValues,
      this.currentTrack = currentTrack
    this.copying = copying
  }

  updateCurrentTrack(newCurrentTrack) {
    this.currentTrack = newCurrentTrack
  }
}

module.exports = MasterConfig