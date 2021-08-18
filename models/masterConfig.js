class MasterConfig {
  constructor(tracks, masterTrack, masterHz, syncing, syncTrack, noteValues, currentTrack, copying, universalNoteValueOn) {
    this.tracks = tracks,
      this.masterTrack = masterTrack,
      this.masterHz = masterHz,
      this.syncing = syncing,
      this.syncTrack = syncTrack,
      this.noteValues = noteValues,
      this.currentTrack = currentTrack,
      this.copying = copying,
      this.universalNoteValueOn = universalNoteValueOn
  }

  updateCurrentTrack(newCurrentTrack) {
    this.currentTrack = newCurrentTrack
  }

  assignMasterTrack(newMasterTrack) {
    this.masterTrack = newMasterTrack
    this.universalNoteValue = this.masterTrack.noteValue
  }
}

module.exports = MasterConfig