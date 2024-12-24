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

module.exports = {
  ByMatchingValue: ByMatchingValue,
  ByFilters: ByFilters,
}
