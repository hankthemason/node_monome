//returns two x coordinates that refer to the actual indexes (e.g. untranslated) that the current page starts and ends at
const calculateLimits = (track) => {
  const pageStart = track.page * 16
  //calculate the page on which the upperLimit occurs
  const pageOfLimit = Math.floor((track.upperLimit - 1) / 16)

  const pageEnd = track.page === pageOfLimit ? pageStart + (track.upperLimit - pageStart) : pageStart + 16
  return [pageStart, pageEnd]
}

module.exports = calculateLimits