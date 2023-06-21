class PerfLogger {
  constructor() {
    this.totalTimes = {}
    this.calls = {}
    this.totalCalls = 0
    this.active = {}
    this.firstLog = null
    this.lastLog = null
    this.enabled = false
  }

  start(ref) {
    this.active[ref] = (new Date()).getTime()
    if (this.lastLog === null) {
      this.firstLog = this.active[ref]
      this.lastLog = this.active[ref]
    }
  }

  stop(ref) {
    var stop = (new Date()).getTime()
    var start = this.active[ref]
    delete this.active[ref]
    var time = (stop - start)
    if (this.totalTimes[ref] === undefined) {
      this.totalTimes[ref] = 0
      this.calls[ref] = 0
    }
    this.totalTimes[ref] += time
    this.calls[ref] += 1
    this.totalCalls += 1

    if (stop - this.lastLog > 5000) {
      this.log()
    }
  }

  log() {
    this.lastLog = (new Date()).getTime()
    if (this.enabled) {
      console.log('Total time: ' + (this.lastLog - this.firstLog) / 1000)
      console.log('Calls: ')
      Object.entries(this.totalTimes).sort((a, b) => b[1] - a[1]).forEach((entry) => {
        console.log(entry[0] + ': ' + (entry[1] / 1000) + ' (' + this.calls[entry[0]] + ')')
      })
      console.log('')
    }
  }
}

module.exports = { PerfLogger }
