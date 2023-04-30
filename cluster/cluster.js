const solver = require('javascript-lp-solver')
const extension = require('./../extension')

function Cluster(name, numClusters, persons, preCluster, constraints) {
  var clusters = [...Array(numClusters).keys()].map((x) => x + 1)
  var result
  var preClusters = {}
  persons.forEach((person) => {
    var preClusterValue = preCluster({ Person: person })
    if (!!preClusterValue) {
      preClusters[person.wcaUserId] = 'CLUSTER-' + preClusterValue
    } else {
      preClusters[person.wcaUserId] = 'PERSON-' + person.wcaUserId
    }
  })
  for (var iter = 0; iter < 10; iter++) {
    var model = {
      optimize: "assigned",
      opType: "max",
      constraints: {},
      variables: {},
      ints: {},
    }
    persons.forEach((person) => {
      var personPreCluster = preClusters[person.wcaUserId]
      model.constraints[personPreCluster] = {min: 0, max: 1}
      clusters.forEach((cluster) => {
        var variableId = personPreCluster + '|' + cluster.toString()
        if (model.variables[variableId] === undefined) {
          model.variables[variableId] = { assigned: 0 }
          model.variables[variableId][personPreCluster] = 1
          model.variables[variableId][variableId] = 0
        }
        model.variables[variableId].assigned += 1
        model.variables[variableId][variableId] += 1
        model.constraints[variableId] = {min: 0, max: 1}
        model.ints[variableId] = 1
      })
    })
    constraints.forEach((constraint) => constraint.populate(clusters, persons, preClusters, iter, model))
    Object.values(model.variables).forEach((variable) => {
      for (var key in variable) {
        if (variable[key] === 0) {
          delete variable[key]
        }
      }
    })

    console.log(model)
    var result = solver.Solve(model)
    console.log(result)
    var solved = result.feasible && result.result == persons.length
    if (solved || iter == 9) {
      var out = {name: name, model: model, result: result, clusters: {}}
      out.constraints = constraints.map((constraint) => constraint.name)
      clusters.forEach((cluster) => {
        out.clusters[cluster] = {
          id: cluster,
          persons: [],
          constraints: {},
        }
      })
      persons.forEach((person) => {
        clusters.forEach((cluster) => {
          var key = preClusters[person.wcaUserId] + '|' + cluster.toString()
          if (key in result && result[key] == 1) {
            var constraintValues = Object.fromEntries(
                constraints.map((constraint) => [constraint.name, constraint.value({Person: person})]))
            out.clusters[cluster].persons.push({
              person: person,
              constraints: constraintValues,
            })
            for (const constraintKey in constraintValues) {
              out.clusters[cluster].constraints[constraintKey] =
                  (out.clusters[cluster].constraints[constraintKey] || 0) + constraintValues[constraintKey]
            }
            if (solved) {
              var ext = extension.getExtension(person, 'Person')
              if (!ext.properties) {
                ext.properties = {}
              }
              ext.properties[name] = cluster
            }
          }
        })
      })
      out.solved = solved
      return out
    }
  }
}

module.exports = {
  Cluster: Cluster,
}
