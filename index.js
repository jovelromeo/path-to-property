const sQuote = '\''
const dQuote = '"'
const lBracket = '['
const rBracket = ']'

/**
 * Function for getting a desired property using a 'path string'.
 * @param {The original object with the desired property} object
 * @param {The path string (see README.md for available possibilities)} path
 */
function pathToProperty (object, path) {
  const curatedSteps = extractSteps(path)
  return findPropertyRecursive(object, curatedSteps)
}

function extractSteps (path) {
  const rawSteps = path.split('.')

  const steps = rawSteps.reduce((prev, curr, origArray) => {
    if (prev.startingStep) {
      if (prev.startingStep.startsWith(lBracket)) {
        prev.startingStep += '.' + curr
        if (curr.substring(curr.length - 1, curr.length) !== rBracket) {
          return prev
        } else {
          prev.curatedSteps.push(prev.startingStep)
          prev.startingStep = null
          return prev
        }
      }
      prev.curatedSteps.push(prev.startingStep.substring(1) + '.' + curr.substring(0, curr.length - 1))
      prev.startingStep = null
      return prev
    }
    if (curr.startsWith(sQuote) && curr.endsWith(sQuote)) {
      prev.curatedSteps.push(curr.substring(1, curr.length - 1))
      return prev
    }
    if (curr.startsWith(dQuote) && curr.endsWith(dQuote)) {
      prev.curatedSteps.push(curr.substring(1, curr.length - 1))
      return prev
    }
    if (curr.startsWith(sQuote) || curr.startsWith(dQuote) || (curr.startsWith(lBracket) && !curr.endsWith(rBracket))) {
      prev.startingStep = curr
      return prev
    }
    prev.curatedSteps.push(curr)
    return prev
  }, { curatedSteps: [], startingStep: null })
  return steps.curatedSteps
}

function findPropertyRecursive (data, steps) {
  let value
  const step = steps.shift()
  try {
    if (step.startsWith('[')) {
      const [filterProp, filterValue] = step
        .split('[')[1]
        .split(']')[0]
        .split(':')
      const dottedKey = filterProp.startsWith(dQuote) || filterProp.startsWith(sQuote)
      const filterProps = dottedKey ? [filterProp.substring(1, filterProp.length - 1)] : filterProp.split('.')
      let mappedForFilter = Array.apply([], data)
      for (const filterStep of filterProps) {
        mappedForFilter = mappedForFilter.map(x => x && x[filterStep])
      }
      mappedForFilter = mappedForFilter.map(x => '' + x)
      const itemIndex = mappedForFilter.indexOf(filterValue)
      value = data[itemIndex]
    } else {
      value = data[step]
    }
    if (steps.length > 0) {
      return findPropertyRecursive(value, steps)
    } else {
      return value
    }
  } catch (e) {
    throw new Error('Error in prop url with step: ' + steps + '. E: ' + e.toString())
  }
}
module.exports = pathToProperty
