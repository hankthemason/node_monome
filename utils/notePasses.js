const notePasses = (prob) => {
  const comparator = Math.floor(Math.random() * 8)

  return comparator < prob ? true : false
}

module.exports = notePasses