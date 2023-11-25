const extension = require('./../extension')
const lib = require('./../lib')

class PriorAssignmentScorer {
  constructor(staffingWeight, competingWeight) {
    this.staffingWeight = staffingWeight
    this.competingWeight = competingWeight
    this.caresAboutStations = false
    this.caresAboutJobs = false
    this.name = 'PriorAssignmentScorer'
  }

  Score(competition, person, group) {
    var groupsById = Object.fromEntries(lib.allGroups(competition).map((g) => [g.id, g]))
    var staffingHours = 0
    var competingHours = 0
    var startTime = lib.startTime(group, competition)
    for (const assignment of person.assignments) {
      var otherGroup = null
      if (assignment.activityId in groupsById) {
        otherGroup = groupsById[assignment.activityId]
      } else {
        otherGroup = miscActivityForId(assignment.activityId)
      }
      if (otherGroup !== null) {
        var otherStart = lib.startTime(otherGroup, competition)
        var otherEnd = lib.endTime(otherGroup, competition)
        if (otherStart < startTime) {
          var hours = otherEnd.diff(otherStart, 'hours').as('hours')
          if (assignment.assignmentCode.startsWith('staff-')) {
            staffingHours += hours
          } else {
            competingHours += hours
          }
        }
      }
    }
    return this.staffingWeight * staffingHours + this.competingHours * competingHours
  }
}

class PreferenceScorer {
  constructor(weight, prefix, prior, allJobs) {
    this.weight = weight
    this.prefix = prefix
    this.prior = prior
    this.allJobs = allJobs
    this.caresAboutStations = false
    this.caresAboutJobs = true
    this.name = 'PreferenceScorer'
  }

  Score(competition, person, group, job) {
    var ext = extension.getExtension(person, 'Person') || {}
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
    var matchingAssignments = allAssignments.filter((assignment) => assignment.assignmentCode === 'staff-' + job)
    if (allAssignments.length === 0) {
      return 0
    }
    var targetRatio = ratios[job]
    var actualRatio = matchingAssignments.length / allAssignments.length
    var decay = Math.min(allAssignments.length, this.prior) / this.prior
    return decay * this.weight * (targetRatio - actualRatio)
  }
}

function PrecedingAssignment(person, group, groupsById) {
  var assignmentsFiltered = person.assignments.filter((assignment) => {
    return groupsById[assignment.activityId] !== undefined &&
      +groupsById[assignment.activityId].endTime === +group.startTime
  })
  if (assignmentsFiltered.length) {
    return assignmentsFiltered[0]
  }
  return null
}

class PrecedingAssignmentsScorer {
  constructor(competition, center, posWeight, negWeight, assignmentFilter) {
    this.center = center
    this.posWeight = posWeight
    this.negWeight = negWeight
    this.assignmentFilter = assignmentFilter
    this.groupsById = Object.fromEntries(lib.allGroups(competition).map((g) => [g.wcif.id, g]))
    this.caresAboutStations = false
    this.caresAboutJobs = true
  }

  Score(competition, person, group, job, stationNumber) {
    var assignment = PrecedingAssignment(person, group, this.groupsById)
    if (assignment === null || !this.assignmentFilter(assignment, job)) {
      return 0
    }
    var mostRecentGroup = this.groupsById[assignment.activityId]
    var endTime = mostRecentGroup.endTime
    var startTime = mostRecentGroup.startTime
    while (assignment !== null && this.assignmentFilter(assignment, job)) {
      var nextGroup = this.groupsById[assignment.activityId]
      startTime = nextGroup.startTime
      assignment = PrecedingAssignment(person, nextGroup, this.groupsById)
    }
    var totalTime = endTime.diff(startTime, 'minutes').minutes
    //console.log('For person ' + person.name + ' ' + group.activityCode + ' ' + job + ' totalTime: ' + totalTime + ' center: ' + this.center)
    if (totalTime > this.center) {
      //console.log('over-score ' + (totalTime - this.center) / this.center * this.posWeight)
      return (totalTime - this.center) / this.center * this.posWeight
    } else {
      //console.log('under-score ' + (this.center - totalTime) / this.center * this.negWeight)
      return (this.center - totalTime) / this.center * this.negWeight
    }
  }
}

class MismatchedStationScorer {
  constructor(competition, weight) {
    this.groupsById = Object.fromEntries(lib.allGroups(competition).map((g) => [g.wcif.id, g]))
    this.caresAboutStations = true
    this.caresAboutJobs = true
    this.weight = weight
  }
  Score(competition, person, group, job, stationNumber) {
    var previousAssignment = PrecedingAssignment(person, group, this.groupsById)
    if (stationNumber !== null && previousAssignment !== null &&
        previousAssignment.stationNumber !== null &&
        'staff-' + job === previousAssignment.assignmentCode &&
        previousAssignment.stationNumber !== stationNumber) {
      return this.weight
    }
    return 0
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
    if (pr > this.maxTime || pr == null) {
      return 0
    }
    return -1 * this.weight * pr.value / this.maxTime
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

class FollowingGroupScorer {
  constructor(competition, weight) {
    this.groupToTime = Object.fromEntries(
        lib.allGroups(competition).map((group) => [group.wcif.id, group.startTime.toSeconds()]))
    this.weight = weight
    this.caresAboutStations = false
    this.caresAboutJobs = false
  }

  Score(competition, person, group) {
    if (person.assignments.filter((assignment) => assignment.assignmentCode === 'competitor')
        .map((assignment) => this.groupToTime[assignment.activityId])
        .includes(group.endTime.toSeconds())) {
      return this.weight
    } else {
      return 0
    }
  }
}

module.exports = {
  PriorAssignmentScorer: PriorAssignmentScorer,
  PreferenceScorer: PreferenceScorer,
  PrecedingAssignmentsScorer: PrecedingAssignmentsScorer,
  MismatchedStationScorer: MismatchedStationScorer,
  ScrambleSpeedScorer: ScrambleSpeedScorer,
  GroupScorer: GroupScorer,
  FollowingGroupScorer: FollowingGroupScorer,
}
