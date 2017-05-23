const Run = require('./run')

describe('runtime', () {
  const handlers = {
    'readFile': function (path) {
      return `Sam is reading from ${path}`
    },
    'writeFile': function(path, data) {
      console.log('path, data:', path, data)
      disk = {}
      disk[path] = data
    }
  }
  const run = Run(handlers)
  beforeEach(() => {
    disk = {}
  })
  describe('run()', co.wrap(function * () {
    const result = yield run(copyFile)
  }))
})


function * copyFile() {
  const readResult = yield readFile()
  const writeResult = yield writeFile(readResult)
}

function * readFile(path) {
  return {
    task: 'readFile',
    args: { path }
  }
}

function * writeFile(path, data) {
  return {
    task: 'writeFile',
    args: {
      data,
      path
    }
  }
}
