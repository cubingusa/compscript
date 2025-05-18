const lib = require('./../lib')

class ByMatchingValue {
  constructor(value, score, limit) {
    this.value = value
    this.score = score
    this.limit = limit
    this.cachedValues = {}
  }

  getValue(person) {
    if (!(person.wcaUserId in this.cachedValues)) {
      this.cachedValues[person.wcaUserId] = this.value({Person: person})
    }
    return this.cachedValues[person.wcaUserId]
  }

  getScore(person, group, otherPeople) {
    var val = this.getValue(person)
    var matching = otherPeople.filter((p) => this.getValue(p) == val).length
    if (this.limit !== null && matching > this.limit) {
      matching = this.limit
    }
    return matching * this.score
  }
}

class ByFilters {
  constructor(personFilter, groupFilter, score) {
    this.personFilter = personFilter
    this.groupFilter = groupFilter
    this.personCache = {}
    this.groupCache = {}
    this.score = score
  }

  getScore(person, group, otherPeople) {
    if (!(person.wcaUserId in this.personCache)) {
      this.personCache[person.wcaUserId] = this.personFilter({Person: person})
    }
    if (!this.personCache[person.wcaUserId]) {
      return 0
    }
    if (!(group.activityCode in this.groupCache)) {
      this.groupCache[group.wcif.id] = this.groupFilter({Group: group})
    }
    if (!this.groupCache[group.wcif.id]) {
      return 0
    }
    return this.score
  }
}

class RecentlyCompeted {
  constructor(competition, groupFilter, otherGroupFilter, scoreFn) {
    this.groupFilter = groupFilter
    this.scoreFn = scoreFn
    this.otherGroups = Object.fromEntries(
      lib.allGroups(competition).filter((group) => otherGroupFilter({Group: group})).map((group) => [group.wcif.id, group]))
    this.groupCache = {}
  }

  getScore(person, group, otherPeople) {
    if (!(group.activityCode in this.groupCache)) {
      this.groupCache[group.wcif.id] = this.groupFilter({Group: group})
    }
    if (!this.groupCache[group.wcif.id]) {
      return 0
    }
    var groupEndTimes = person.assignments.filter((assignment) => (assignment.activityId in this.otherGroups))
                                          .filter((assignment) => (assignment.assignmentCode == 'competitor'))
                                          .map((assignment) => this.otherGroups[assignment.activityId].endTime)
                                          .filter((t) => t <= group.startTime)

    if (groupEndTimes.length == 0) {
      return 0
    }
    var mostRecent = groupEndTimes.reduce((a, b) => b > a ? b : a)
    var timeSince = group.startTime.diff(mostRecent, 'minutes').minutes
    return this.scoreFn({Number: timeSince})
  }
}

module.exports = {
  ByMatchingValue: ByMatchingValue,
  ByFilters: ByFilters,
  RecentlyCompeted: RecentlyCompeted,
}
