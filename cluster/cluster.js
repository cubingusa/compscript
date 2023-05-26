const extension = require('./../extension')

function Cluster(name, numClusters, persons, preCluster, constraints) {
  var clusters = [...Array(numClusters).keys()].map((x) => x + 1)
  var result
  var unassignedGroups = {}
  persons.forEach((person) => {
    var preClusterValue = preCluster({ Person: person })
    var key
    if (!!preClusterValue) {
      key = 'CLUSTER-' + preClusterValue
    } else {
      key = 'PERSON-' + person.wcaUserId
    }
    if (unassignedGroups[key] === undefined) {
      unassignedGroups[key] = []
    }
    unassignedGroups[key].push(person)
    constraints.forEach((constraint) => {
      constraint.loadPerson(person, key)
    })
  })
  var assignments = {}
  clusters.forEach((cluster) => {
    assignments[cluster] = []
  })
  var out = {
    name: name,
    constraints: constraints.map((constraint) => constraint.name),
    clusters: {},
  }
  while (Object.keys(unassignedGroups).length > 0) {
    clusters.sort((clusterA, clusterB) => assignments[clusterA].length - assignments[clusterB].length)
    var clusterToAssign = clusters[0]
    var bestKey = null
    var bestScore = Number.NEGATIVE_INFINITY
    for (const [groupKey, group] of Object.entries(unassignedGroups)) {
      var groupScore = group.length
      constraints.forEach((constraint) => {
        clusters.forEach((clusterToScore) => {
          var score = constraint.score(assignments, clusterToScore, groupKey)
          if (clusterToScore === clusterToAssign) {
            groupScore += score
          } else {
            groupScore -= score / (clusters.length - 1)
          }
        })
      })
      if (groupScore > bestScore) {
        bestKey = groupKey
        bestScore = groupScore
      }
    }
    unassignedGroups[bestKey].forEach((person) => {
      assignments[clusterToAssign].push(person)
    })
    delete unassignedGroups[bestKey]
  }
  for (const [cluster, persons] of Object.entries(assignments)) {
    out.clusters[cluster] = {
      id: cluster,
      constraints: {},
      persons: [],
    }
    constraints.forEach((constraint) => {
      out.clusters[cluster].constraints[constraint.name] = 0
    })
    for (const person of persons) {
      var personOut = {
        person: person,
        constraints: {},
      }
      constraints.forEach((constraint) => {
        var val = constraint.valueFor(person)
        personOut.constraints[constraint.name] = val
        out.clusters[cluster].constraints[constraint.name] += val
      })
      var ext = extension.getOrInsertExtension(person, 'Person')
      if (!ext.properties) {
        ext.properties = {}
      }
      ext.properties[name] = cluster
      out.clusters[cluster].persons.push(personOut)
    }
  }
  return out
}

module.exports = {
  Cluster: Cluster,
}
