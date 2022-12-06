function parseTime(time) {
  var centiseconds = time % 100
  time = (time - centiseconds) / 100
  var seconds = time % 60
  time = (time - seconds) / 60
  var minutes = time % 60
  var hours = (time - minutes) / 60
  return {
    hours: hours,
    minutes: minutes,
    seconds: seconds,
    centiseconds: centiseconds,
  }
}

function pad(num) {
  if (num < 10) {
    return '0' + num.toString()
  } else {
    return num.toString()
  }
}

function formatTime(time) {
  var parsed = parseTime(time)
  if (parsed.hours > 0) {
    return parsed.hours + ':' + pad(parsed.minutes) + ':' + pad(parsed.seconds)
  }
  if (parsed.minutes >= 10) {
    return parsed.minutes + ':' + pad(parsed.seconds)
  }
  if (parsed.minutes > 0) {
    return parsed.minutes + ':' + pad(parsed.seconds) + '.' + pad(parsed.centiseconds)
  }
  return parsed.seconds + '.' + pad(parsed.centiseconds)
}

class AttemptResult {
  constructor(value, eventId) {
    this.value = value
    this.eventId = eventId
  }

  toString() {
    if (this.value == -1) {
      return 'DNF'
    }
    if (this.value == -2) {
      return 'DNS'
    }
    if (this.value == 0) {
      return ''
    }
    if (this.eventId == '333fm') {
      if (this.value < 1000) {
        return this.value.toString()
      } else {
        return (this.value / 100).toFixed(2)
      }
    }
    if (this.eventId == '333mbf') {
      var missed = this.value % 100
      var res = (this.value - missed) / 100
      var timeInSeconds = res % 1e5
      res = (res - timeInSeconds) / 1e5
      var delta = 99 - res
      var solved = missed + delta
      var attempted = solved + missed
      if (timeInSeconds == 0) {
        return delta + ' points'
      } else {
        return solved + '/' + attempted + ' ' + formatTime(timeInSeconds * 100)
      }
    }
    return formatTime(this.value)
  }

  valueOf() {
    if (this.value == -1) {
      return Number.MAX_SAFE_INTEGER
    }
    if (this.value == 0) {
      return Number.MAX_SAFE_INTEGER - 1
    }
    return this.value
  }
}

function parseString(str) {
  if (str == 'DNF') {
    return new AttemptResult(-1, '333')
  }
  if (str == 'DNS') {
    return new AttemptResult(-2, '333')
  }
  if (str.endsWith('p')) {
    return new AttemptResult((99 - +(str.replace('p', ''))) * 1e7, '333mbf')
  }
  if (str.endsWith('m')) {
    if (str.indexOf('.') == -1) {
      return new AttemptResult(+(str.replace('m', '')) * 100, '333fm')
    } else {
      return new AttemptResult(+(str.replace('m', '')), '333fm')
    }
  }
  if (str.endsWith('s')) {
    str = str.replace('s', '')
    value = 0
    if (str.indexOf(':') != -1) {
      value += 6000 * +(str.substr(0, str.indexOf(':')))
      str = str.substr(str.indexOf(':' + 1))
    }
    if (str.indexOf(':') != -1) {
      value = value * 60 + 6000 * +(str.substr(0, str.indexOf(':')))
      str = str.substr(str.indexOf(':' + 1))
    }
    value += 100 * +str
    return new AttemptResult(value, '333')
  }
}

module.exports = {
  AttemptResult: AttemptResult,
  parseString: parseString,
}
