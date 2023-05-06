const extension = require('./../extension')
const lib = require('./../lib')

class JobCountScorer {
  constructor(weight) {
    this.weight = weight
    this.caresAboutStations = false
    this.caresAboutJobs = false
    this.name = 'JobCountScorer'
  }

  Score(competition, person, group) {
    return this.weight * person.assignments.filter((assignment) => assignment.assignmentCode.startsWith('staff-')).length
  }
}

class PreferenceScorer {
  constructor(weight, prefix, prior) {
    this.weight = weight
    this.prefix = prefix
    this.prior = prior
    this.caresAboutStations = false
    this.caresAboutJobs = true
    this.name = 'PreferenceScorer'
  }

  subscore(vals, expected) {
    var totalVal = vals.reduce((s, e) => s + e[1], 0)
    return Object.entries(expected).map((e) => {
      var target = e[1]
      var actual = vals[e[0]] / totalVal
      return (target - actual) ** 2
    }).map((s, next) => s + next)
  }

  Score(competition, person, group, job) {
    var ext = extension.getExtension(person, 'Person')
    var prefs = Object.entries((ext.properties || {}))
                      .filter((e) => e[0].startsWith(this.prefix))
                      .map((e) => [e[0].slice(this.prefix.length), e[1]])
    var totalPrefs = prefs.reduce((s, e) => s + e[1], 0)
    if (totalPrefs === 0) {
      return 0
    }
    var ratios = Object.fromEntries(prefs.map((e) => [e[0], e[1] / totalPrefs]))
    if (!(job in ratios)) {
      return -100000
    }

    var allAssignments = person.assignments
                       .filter((assignment) => assignment.assignmentCode.startsWith('staff-'))
    var actual = {}
    allAssignments.forEach((assignment) => {
      var key = assignment.assignmentCode.slice('staff-'.length)
      if (actual[key] === undefined) {
        actual[key] = 0
      }
      actual[key] += 1
    })

    var currentAdjusted = Object.entries(actual).map((e) => [e[0], e[1] + ratios[e[0]] * this.prior])
    var newAdjusted = currentAdjusted.map((e) => [e[0], e[1] + (job === e[0] ? 1 : 0)])

    var oldScore = this.subscore(currentAdjusted, ratios)
    var newScore = this.subscore(newAdjusted, ratios)

    return this.weight * (newScore - oldScore)
  }
}

class AdjacentGroupScorer {
  constructor(competition, weight) {
    this.allGroups = lib.allGroups(competition)
    this.weight = weight
    this.caresAboutStations = true
    this.caresAboutJobs = true
    this.name = 'AdjacentGroupScorer'
  }

  Score(competition, person, group, job, stationNumber) {
    var sameRoom = this.allGroups.filter((otherGroup) => {
      return otherGroup.room.id == group.room.id
    })
    var allPrevious = sameRoom.filter((otherGroup) => {
      return otherGroup.endTime.toMillis() === group.startTime.toMillis()
    })
    var previousGroup = allPrevious.length ? allPrevious[0] : null

    var allNext = sameRoom.filter((otherGroup) => {
      return otherGroup.startTime.toMillis() === group.endTime.toMillis()
    })
    var nextGroup = allNext.length ? allNext[0] : null

    if (!previousGroup && !nextGroup) {
      return 0
    }
    return [previousGroup, nextGroup].filter((x) => !!x).map((group) => {
      var matchingAssignments = person.assignments.filter((assignment) => assignment.activityId == group.wcif.id)
      if (!matchingAssignments.length) {
        return 0
      }
      var assignment = matchingAssignments[0]
      if (!assignment.assignmentCode.startsWith('staff-')) {
        return 0
      }
      var code = assignment.assignmentCode.slice('staff-'.length)
      if (code !== job) {
        return 0
      }
      if (stationNumber && (stationNumber == assignment.stationNumber)) {
        return this.weight
      } else if (!stationNumber && !assignment.stationNumber) {
        return this.weight
      } else {
        return 0
      }
    }).reduce((s, subscore) => s + subscore)
  }
}

class ScrambleSpeedScorer {
  constructor(event, maxTime, weight) {
    this.event = event
    this.maxTime = maxTime
    this.weight = weight
    this.caresAboutStations = false
    this.caresAboutJobs = true
    this.name = 'ScrambleSpeedScorer'
  }

  Score(competition, person, group, job) {
    if (job !== 'scrambler') {
      return 0
    }
    var pr = lib.personalBest(person, this.event)
    if (pr > this.maxTime) {
      return 0
    }
    return this.weight * (this.maxTime.value - pr.value)
  }
}

class GroupScorer {
  constructor(condition, weight) {
    this.condition = condition
    this.weight = weight
    this.caresAboutStations = false
    this.caresAboutJobs = false
    this.name = 'GroupScorer'
  }

  Score(competition, person, group) {
    if (this.condition({Person: person, Group: group})) {
      return this.weight
    } else {
      return 0
    }
  }
}

module.exports = {
  JobCountScorer: JobCountScorer,
  PreferenceScorer: PreferenceScorer,
  AdjacentGroupScorer: AdjacentGroupScorer,
  ScrambleSpeedScorer: ScrambleSpeedScorer,
  GroupScorer: GroupScorer,
}
