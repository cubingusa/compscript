const lib = require('./../lib')

class JobCountScorer {
  constructor(weight) {
    this.weight = weight
  }

  Score(competition, person, allGroups, groupIdx, job, stationNumber) {
    return this.weight * person.assignments.filter((assignment) => assignment.assignmentCode.startsWith('staff-')).length
  }
}

class PreferenceScorer {
  constructor(weight, prefix, prior) {
    this.weight = weight
    this.prefix = prefix
    this.prior = prior
  }

  #subscore(vals, expected) {
    var totalVal = vals.reduce((s, e) => s + e[1])
    return Object.entries(expected).forEach((e) => {
      var target = e[1]
      var actual = vals[e[0]] / totalVal
      return (target - actual) ** 2
    }).map((s, next) => s + next)
  }

  Score(competition, person, allGroups, groupIdx, job, stationNumber) {
    var ext = extension.getExtension(person, 'Person')
    var prefs = Object.entries((ext.properties || {}))
                      .filter((e) => e[0].startsWith(this.prefix))
                      .map((e) => [e[0].slice(this.prefix.length), e[1]])
    var totalPrefs = prefs.reduce((s, e) => s + e[1])
    if (totalPrefs === 0) {
      return 0
    }
    var ratios = Object.fromEntries(prefs.map((e) => [e[0], e[1] / totalPrefs]))
    if (!(job in ratios)) {
      return -100000
    }

    var actual = Object.entries(person.assignments
                       .filter((assignment) => assignment.assignmentCode.startsWith('staff-'))
                       .group((assignment) => assignment.assignmentCode.slice('staff-'.length)))
                       .map((e) => [e[0], e[1].length])
    var currentAdjusted = actual.map((e) => [e[0], e[1] + ratios[e[0]] * this.prior])
    var newAdjusted = currentAdjusted.map((e) => [e[0], e[1] + (job === e[0] ? 1 : 0)])

    var oldScore = this.subscore(Object.fromEntries(currentAdjusted), ratios)
    var newScore = this.subscore(Object.fromEntries(newAdjusted), ratios)

    return this.weight * (newScore - oldScore)
  }
}

class AdjacentGroupScorer {
  constructor(weight, previousGroup, nextGroup) {
    this.weight = weight
    this.previousGroupCode = previousGroup
    this.nextGroupCode = nextGroup
  }

  Score(competition, person, allGroups, groupIdx, job, stationNumber) {
    var previousGroup, nextGroup
    if (groupIdx == 0) {
      if (this.previousGroupCode !== null) {
        previousGroup = lib.activityByCode(this.previousGroupCode)
      }
    } else {
      previousGroup = allGroups[groupIdx - 1]
    }
    if (groupIdx == allGroups.length - 1) {
      if (this.nextGroupCode !== null) {
        nextGroup = lib.activityByCode(this.nextGroupCode)
      }
    } else {
      nextGroup = allGroups[groupIdx + 1]
    }
    if (!previousGroup && !nextGroup) {
      return 0
    }
    return [previousGroup, nextGroup].filter((x) => !!x).map((group) => {
      var matchingAssignments = person.assignments.filter((assignment) => assignment.activityId == group.id)
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

module.exports = {
  JobCountScorer: JobCountScorer,
  PreferenceScorer: PreferenceScorer,
  AdjacentGroupScorer: AdjacentGroupScorer,
}
