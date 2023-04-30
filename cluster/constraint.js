class BalanceConstraint {
  constructor(name, value, decay, initialAllowance, applyTo) {
    this.name = name
    this.value = value
    this.decay = decay
    this.initialAllowance = initialAllowance
    this.applyTo = applyTo
  }

  populate(clusters, persons, preClusters, iter, model) {
    var clustersToUse = clusters.filter((cluster) => {
      return this.applyTo.length == 0 || this.applyTo.includes(cluster)
    })
    var values = persons.map((person) => +this.value({Person: person}))
    var totalValue = values.reduce((partialSum, a) => partialSum + a)
    var targetValue = totalValue / clustersToUse.length
    var maxSize = Math.ceil(targetValue * (1 + this.decay * iter) + this.initialAllowance)
    var minSize = Math.floor(targetValue * (1 - this.decay * iter * 10) - this.initialAllowance)
    minSize = 0
    clustersToUse.forEach((cluster) => {
      var varName = this.name + '|' + cluster.toString()
      model.constraints[varName] = {min: minSize, max: maxSize}
      for (var i = 0; i < persons.length; i++) {
        var vars = model.variables[preClusters[persons[i].wcaUserId] + '|' + cluster.toString()]
        if (vars[varName] === undefined) {
          vars[varName] = 0
        }
        vars[varName] += values[i]
      }
    })
  }
}

class LimitConstraint {
  constructor(name, value, min, max, applyTo) {
    this.name = name
    this.value = value
    this.min = min
    this.max = max
    this.applyTo = applyTo
  }

  populate(clusters, persons, preClusters, iter, model) {
    var clustersToUse = clusters.filter((cluster) => {
      return this.applyTo.length == 0 || this.applyTo.includes(cluster)
    })
    var values = persons.map((person) => +this.value({Person: person}))
    var totalValue = values.reduce((partialSum, a) => partialSum + a)
    var maxSize = (this.max == -1) ? totalValue : this.max
    var minSize = (this.min == -1) ? 0 : this.min
    clustersToUse.forEach((cluster) => {
      var varName = this.name + '|' + cluster.toString()
      model.constraints[varName] = {min: minSize, max: maxSize}
      for (var i = 0; i < persons.length; i++) {
        var vars = model.variables[preClusters[persons[i].wcaUserId] + '|' + cluster.toString()]
        if (vars[varName] === undefined) {
          vars[varName] = 0
        }
        vars[varName] += values[i]
      }
    })
  }
}

module.exports = {
  BalanceConstraint: BalanceConstraint,
  LimitConstraint: LimitConstraint,
}
