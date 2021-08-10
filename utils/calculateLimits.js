const calculateLimits = (track) => {
  const pageStart = track.page * 16
  //calculate the page on which the upperLimit occurs
  const pageOfLimit = Math.floor(track.upperLimit / 16) - 1
  
  const pageEnd = track.page === pageOfLimit ? pageStart + (track.upperLimit - pageStart) : pageStart + 16
  return [pageStart, pageEnd]
}

module.exports = calculateLimits