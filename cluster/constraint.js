class BalanceConstraint {
  constructor(name, value, weight) {
    this.name = name
    this.value = value
    this.weight = weight
    this.personScores = {}
    this.personGroups = {}
    this.totalScore = 0
  }

  loadPerson(person, key) {
    if (!this.personGroups[key]) {
      this.personGroups[key] = []
    }
    this.personGroups[key].push(person)
    var value = this.value({Person: person})
    this.personScores[person.wcaUserId] = value
    this.totalScore += +value
  }

  valueFor(person) {
    return this.personScores[person.wcaUserId]
  }

  score(assignments, cluster, key) {
    var expectedTotal = this.totalScore / Object.keys(assignments).length
    var totals = {}
    for (const [clusterName, persons] of Object.entries(assignments)) {
      var clusterTotal = 0
      for (const person of persons) {
        clusterTotal += this.personScores[person.wcaUserId]
      }
      totals[clusterName] = clusterTotal
    }
    for (const person of this.personGroups[key]) {
      totals[cluster] += this.personScores[person.wcaUserId]
    }
    var totalAssigned = 0
    for (const total of Object.values(totals)) {
      totalAssigned += total
    }
    var remainder = this.totalScore - totalAssigned
    var score = 0
    for (const [clusterName, total] of Object.entries(totals)) {
      var needed = expectedTotal - total
      if (remainder > 0) {
        score -= (Math.pow((needed / remainder) - (1 / Object.keys(assignments).length), 2))

      } else {
        score -= (Math.pow((total / this.totalScore) - (1 / Object.keys(assignments).length), 2))
      }
    }
    return score * this.weight
  }
}

class LimitConstraint {
  constructor(name, value, min, weight) {
    this.name = name
    this.value = value
    this.weight = weight
    this.min = min
    this.personScores = {}
    this.personGroups = {}
    this.totalScore = 0
  }

  loadPerson(person, key) {
    if (!this.personGroups[key]) {
      this.personGroups[key] = []
    }
    this.personGroups[key].push(person)
    var value = this.value({Person: person})
    this.personScores[person.wcaUserId] = value
    this.totalScore += +value
  }

  valueFor(person) {
    return this.personScores[person.wcaUserId]
  }

  score(assignments, cluster, key) {
    var expectedTotal = this.totalScore / Object.keys(assignments).length
    var totals = {}
    for (const [clusterName, persons] of Object.entries(assignments)) {
      var clusterTotal = 0
      for (const person of persons) {
        clusterTotal += this.personScores[person.wcaUserId]
      }
      totals[clusterName] = clusterTotal
    }
    for (const person of this.personGroups[key]) {
      totals[cluster] += this.personScores[person.wcaUserId]
    }
    var totalAssigned = 0
    var totalNeeded = 0
    for (const total of Object.values(totals)) {
      totalAssigned += total
      if (total < this.min) {
        totalNeeded += (this.min - total)
      }
    }
    var remainder = this.totalScore - totalAssigned
    if (totalNeeded === 0) {
      return 1
    } else if (totalNeeded > remainder) {
      return -1000
    }
    return Math.pow(1 - totalNeeded / remainder, 2) * this.weight
  }
}

class SpecificAssignmentScore {
  constructor(name, personProperty, clusterProperty, score) {
    this.name = name
    this.personProperty = personProperty
    this.clusterProperty = clusterProperty
    this.scoreValue = score
    this.personCache = {}
    this.clusterCache = {}
    this.personGroups = {}
  }

  loadPerson(person, key) {
    if (!this.personGroups[key]) {
      this.personGroups[key] = []
    }
    this.personGroups[key].push(person)
    this.getPerson(person)
  }

  getPerson(person) {
    if (!(person.wcaUserId in this.personCache)) {
      this.personCache[person.wcaUserId] = this.personProperty({Person: person})
    }
    return this.personCache[person.wcaUserId]
  }

  getCluster(cluster) {
    if (!(cluster in this.clusterCache)) {
      this.clusterCache[cluster] = this.clusterProperty({Number: cluster})
    }
    return this.clusterCache[cluster]
  }

  valueFor(person) {
    return this.getPerson(person)
  }

  score(assignments, cluster, key) {
    if (!this.getCluster(cluster)) {
      return 0
    }
    out = 0
    for (const person of this.personGroups[key]) {
      if (this.getPerson(person)) {
        out += this.scoreValue
      }
    }
    return out
  }
}

module.exports = {
  BalanceConstraint: BalanceConstraint,
  LimitConstraint: LimitConstraint,
  SpecificAssignmentScore: SpecificAssignmentScore,
}
