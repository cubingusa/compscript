class BalanceConstraint {
  constructor(name, value, decay, applyTo) {
    this.name = name
    this.value = value
    this.decay = decay
    this.applyTo = applyTo
  }

  populate(clusters, people, iter, model) {
    var clustersToUse = clusters.filter((cluster) => {
      return this.applyTo.length == 0 || this.applyTo.includes(cluster)
    })
    var values = people.map((person) => +this.value({Person: person}))
    var totalValue = values.reduce((partialSum, a) => partialSum + a)
    var targetValue = totalValue / clustersToUse.length
    var maxSize = Math.ceil(targetValue * (1 + this.decay * iter))
    var minSize = Math.floor(targetValue * (1 - this.decay - iter))
    clustersToUse.forEach((cluster) => {
      model.constraints[this.name + '|' + cluster.toString()] = {min: minSize, max: maxSize}
      for (var i = 0; i < people.length; i++) {
        model.variables[people[i].wcaUserId.toString() + '|' + cluster.toString()][this.name + '|' + cluster.toString()] = values[i]
      }
    })
  }
}

class LimitConstraint {
  constructor(name, value, min, max, applyTo) {
    this.name = name
    this.min = min
    this.max = max
    this.applyTo = applyTo
  }

  populate(clusters, people, iter, model) {
    var clustersToUse = clusters.filter((cluster) => {
      return this.applyTo.length == 0 || this.applyTo.includes(cluster)
    })
    var values = people.map((person) => +this.value({Person: person}))
    var totalValue = values.reduce((partialSum, a) => partialSum + a)
    var maxSize = (this.max = -1) ? totalValue : this.max
    var minSize = (this.min = -1) ? 0 : this.min
    clustersToUse.forEach((cluster) => {
      model.constraints[this.name + '|' + cluster.toString()] = {min: minSize, max: maxSize}
      for (var i = 0; i < people.length; i++) {
        model.variables[people[i].wcaUserId.toString() + '|' + cluster.toString()][this.name + '|' + cluster.toString()] = values[i]
      }
    })
  }
}

module.exports = {
  BalanceConstraint: BalanceConstraint,
  LimitConstraint: LimitConstraint,
}
