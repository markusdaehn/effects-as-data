const { curry } = require('ramda')
const run = curry(require('./run'))()

module.exports = {
  run
}
