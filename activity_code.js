const events = require('./events')

class ActivityCode {
  constructor(eventId, roundNumber, groupName, attemptNumber) {
    this.eventId = eventId
    this.roundNumber = roundNumber
    this.groupName = groupName
    this.attemptNumber = attemptNumber
  }

  round(roundNumber) {
    return ActivityCode(this.eventId, roundNumber, this.groupName, this.attemptNumber)
  }

  group(groupName) {
    return ActivityCode(this.eventId, this.roundNumber, groupName, this.attemptNumber)
  }

  attempt(attemptNumber) {
    return ActivityCode(this.eventId, this.roundNumber, this.groupName, attemptNumber)
  }

  toString() {
    out = [events.idToName[this.eventId]]
    if (this.roundNumber) {
      out.push('Round ' + this.roundNumber)
    }
    if (this.groupName) {
      out.push('Group ' + this.groupName)
    }
    if (this.attemptNumber) {
      out.push('Attempt ' + this.attemptNumber)
    }
    return out.join(' ')
  }
  isActivity() {
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
    return new OtherActivity(codeSplit[1])
  }
  var eventId = codeSplit[0]
  if (!events.idToName[eventId]) {
    console.log('Invalid ActivityCode ' + code)
    return null
  }
  var roundNumber = null
  var groupName = null
  var attemptNumber = null
  for (var i = 1; i < codeSplit.length; i++) {
    if (codeSplit[i].startsWith('r')) {
      roundNumber = codeSplit[i].slice(1)
    } else if (codeSplit[i].startsWith('g')) {
      groupName = codeSplit[i].slice(1)
    } else if (codeSplit[i].startsWith('a')) {
      attemptNumber = codeSplit[i].slice(1)
    } else {
      console.log('Invalid ActivityCode ' + code)
      return null
    }
  }
  return new ActivityCode(eventId, roundNumber, groupName, attemptNumber)
}

module.exports = {
  parse: parse
}
