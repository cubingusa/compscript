const solver = require('javascript-lp-solver')
const extension = require('./../extension')

function Cluster(competition, name, numClusters, filter, constraints) {
  var people = competition.persons.filter((person) => filter({Person: person}))
  var clusters = [...Array(numClusters).keys()].map((x) => x + 1)
  var result
  for (var iter = 0; iter < 10; iter++) {
    var model = {
      optimize: "assigned",
      opType: "max",
      constraints: {},
      variables: {},
      ints: {},
    }
    people.forEach((person) => {
      var personId = person.wcaUserId.toString()
      model.constraints[personId] = {min: 0, max: 1}
      clusters.forEach((cluster) => {
        var variableId = personId + '|' + cluster.toString()
        model.variables[variableId] = { assigned: 1 }
        model.variables[variableId][personId] = 1
        model.variables[variableId][variableId] = 1
        model.constraints[variableId] = {min: 0, max: 1}
        model.ints[variableId] = 1
      })
    })
    constraints.forEach((constraint) => constraint.populate(clusters, people, iter, model))

    var result = solver.Solve(model)
    var solved = result.feasible && result.result == people.length
    if (solved || iter == 9) {
      var out = {name: name, model: model, result: result, clusters: {}}
      out.constraints = constraints.map((constraint) => constraint.name)
      clusters.forEach((cluster) => {
        out.clusters[cluster] = {
          id: cluster,
          people: [],
          constraints: {},
        }
      })
      people.forEach((person) => {
        clusters.forEach((cluster) => {
          var key = person.wcaUserId.toString() + '|' + cluster.toString()
          if (key in result && result[key] == 1) {
            var constraintValues = Object.fromEntries(
                constraints.map((constraint) => [constraint.name, constraint.value({Person: person})]))
            out.clusters[cluster].people.push({
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
