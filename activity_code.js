const events = require('./events')

class ActivityCode {
  constructor(eventId, roundNumber, groupNumber, attemptNumber) {
    this.eventId = eventId
    this.roundNumber = roundNumber
    this.groupNumber = groupNumber
    this.attemptNumber = attemptNumber
  }

  round(roundNumber) {
    return new ActivityCode(this.eventId, roundNumber, this.groupNumber, this.attemptNumber)
  }

  group(groupNumber) {
    return new ActivityCode(this.eventId, this.roundNumber, groupNumber, this.attemptNumber)
  }

  attempt(attemptNumber) {
    return new ActivityCode(this.eventId, this.roundNumber, this.groupNumber, attemptNumber)
  }

  toString() {
    var out = [events.idToName[this.eventId]]
    if (this.roundNumber) {
      out.push('Round ' + this.roundNumber)
    }
    if (this.groupNumber || this.groupNumber === 0) {
      out.push('Group ' + this.groupNumber)
    }
    if (this.attemptNumber) {
      out.push('Attempt ' + this.attemptNumber)
    }
    return out.join(' ')
  }

  toStringShort() {
    if (this.attemptNumber) {
      return 'A' + this.attemptNumber
    } else {
      return 'R' + this.roundNumber
    }
  }

  id() {
    var out = [this.eventId]
    if (this.roundNumber) {
      out.push('r' + this.roundNumber)
    }
    if (this.groupNumber || this.groupNumber === 0) {
      out.push('g' + this.groupNumber)
    }
    if (this.attemptNumber) {
      out.push('a' + this.attemptNumber)
    }
    return out.join('-')
  }

  isActivity() {
    return true
  }

  contains(other) {
    if (this.eventId !== other.eventId) {
      return false
    }
    if (this.roundNumber !== null && this.roundNumber !== other.roundNumber) {
      return false
    }
    if (this.groupNumber !== null && this.groupNumber !== other.groupNumber) {
      return false
    }
    if (this.activityNumber !== null && this.activityNumber !== other.activityNumber) {
      return false
    }
    return true
  }
}

class OtherActivity {
  constructor(code) {
    this.code = code
  }

  toString() {
    return this.code
  }

  isActivity() {
    return false
  }
}

function parse(code) {
  var codeSplit = code.split('-')
  if (codeSplit[0] == 'other') {
    return new OtherActivity(codeSplit.slice(1).join('-'))
  }
  var eventId = codeSplit[0]
  if (!events.idToName[eventId]) {
    console.log('Invalid ActivityCode ' + code)
    return null
  }
  var roundNumber = null
  var groupNumber = null
  var attemptNumber = null
  for (var i = 1; i < codeSplit.length; i++) {
    if (codeSplit[i].startsWith('r')) {
      roundNumber = +codeSplit[i].slice(1)
    } else if (codeSplit[i].startsWith('g')) {
      groupNumber = +codeSplit[i].slice(1)
    } else if (codeSplit[i].startsWith('a')) {
      attemptNumber = +codeSplit[i].slice(1)
    } else {
      console.log('Invalid ActivityCode ' + code)
      return null
    }
  }
  return new ActivityCode(eventId, roundNumber, groupNumber, attemptNumber)
}

module.exports = {
  parse: parse,
  ActivityCode: ActivityCode
}
