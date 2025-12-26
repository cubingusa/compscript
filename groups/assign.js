const solver = require('javascript-lp-solver')
const activityCode = require('./../activity_code')
const extension = require('./../extension')
const lib = require('./../lib')

function Assign(competition, round, assignmentSets, scorers, stationRules, attemptNumber, override) {
  var groups = lib.groupsForRoundCode(competition, round)
  groups.sort((g1, g2) => g1.activityCode.groupNumber - g2.activityCode.groupNumber)
  if (attemptNumber !== null) {
    groups = groups.filter((group) => group.activityCode.attemptNumber === attemptNumber)
  }
  var activityIds = groups.map((group) => group.wcif.id)

  if (competition.persons.map((person) => person.assignments).flat()
          .some((assignment) => activityIds.includes(assignment.activityId))) {
    if (!override) {
      return {
        round: round,
        groups: groups,
        warnings: ['Groups are already saved. Not overwriting unless overwrite=true is added.'],
        assignments: {},
      }
    } else {
      competition.persons.forEach((person) => {
        person.assignments = person.assignments.filter(
            (assignment) => !activityIds.includes(assignment.activityId) || assignment.code !== 'competitor')
      })
    }
  }

  var personIds = lib.getWcifRound(competition, round)
                     .results.map((res) => res.personId)

  var people =
      competition.persons.filter((person) => personIds.includes(person.registrantId))
    .sort((p1, p2) => {
      var pb1 = lib.personalBest(p1, round)
      var pb2 = lib.personalBest(p2, round)
      if (pb1 === null) {
        return 1
      }
      if (pb2 === null) {
        return -1
      }
      return pb1.value - pb2.value
    })

  var assignmentsByPerson = {}
  var assignmentsByGroup = {}
  var conflictingActivitiesByGroup = {}
  groups.forEach((group) => {
    assignmentsByGroup[group.wcif.id] = []
    conflictingActivitiesByGroup[group.wcif.id] = []
    lib.allGroups(competition).forEach((otherGroup) => {
      if (group.startTime < otherGroup.endTime && otherGroup.startTime < group.endTime) {
        conflictingActivitiesByGroup[group.wcif.id].push(otherGroup.wcif.id)
      }
    })

    var ext = extension.getOrInsertExtension(group.wcif, 'ActivityConfig', 'groupifier')
    ext.featuredCompetitorWcaUserIds = []
  })
  var groupSizeLimit = people.length / groups.length
  warnings = []
  assignmentSets.forEach((set) => {
    console.log('assigning ' + set.name)
    var eligibleGroups = groups.filter((group) => set.groupFilter({Group: group}))
    var eligiblePeople = people.filter((person) => set.personFilter({Person: person}))
    if (eligibleGroups.length == 0) {
      warnings.push({
        type: 'NO_ELIGIBLE_GROUPS',
        category: set.name,
      })
      return
    }
    var queue = []
    var currentByPerson = {}
    var currentByGroup = {}
    // wcaUserId -> group id
    var preAssignedByPerson = {}
    // group id -> count
    var preAssignedByGroup = {}
    var preAssignedTotal = 0
    eligibleGroups.forEach((group) => {
      currentByGroup[group.wcif.id] = []
      preAssignedByGroup[group.wcif.id] = 0
    })
    eligiblePeople.forEach((person) => {
      if (person.wcaUserId in assignmentsByPerson) {
        var assignment = assignmentsByPerson[person.wcaUserId]
        var group = assignment.group
        if (group.wcif.id in currentByGroup) {
          queue.push({person: person, idx: queue.length})
          preAssignedByPerson[person.wcaUserId] = group.wcif.id
          preAssignedByGroup[group.wcif.id] += 1
          preAssignedTotal += 1
        }
      } else {
        queue.push({person: person, idx: queue.length})
      }
    })
    var totalToAssign = queue.length
    var previousLength = -1;
    while (queue.length > preAssignedTotal) {
      var potentialInfinite = queue.length === previousLength;
      previousLength = queue.length;
      console.log(queue.length + ' left')
      // Don't assign any more to groups with enough people pre-assigned.
      var groupsToUse = eligibleGroups.filter((group) => currentByGroup[group.wcif.id].length + preAssignedByGroup[group.wcif.id] <= groupSizeLimit)
      // but if that filters out all groups, it means the math is wrong and we need to allow more space.
      if (groupsToUse.length === 0) {
        groupSizeLimit++
        continue
      }
      // Remove anyone from the queue who's pre-assigned to a full group.
      queue = queue.filter((queueItem, idx) => {
        var preAssigned = preAssignedByPerson[queueItem.person.wcaUserId]
        var toKeep = preAssigned === undefined || groupsToUse.map((group) => group.wcif.id).includes(preAssigned)
        if (!toKeep) {
          preAssignedTotal--
        }
        return toKeep
      })

      var model = constructModel(queue.slice(0, 100), groupsToUse, scorers, assignmentsByGroup, currentByGroup, preAssignedByPerson, conflictingActivitiesByGroup)
      var solution = solver.Solve(model)
      var newlyAssigned = []
      var indicesToErase = []
      queue.forEach((queueItem, idx) => {
        groupsToUse.forEach((group) => {
          var key = queueItem.person.wcaUserId.toString() + '-g' + group.wcif.id
          if (key in solution && solution[key] == 1) {
            newlyAssigned.push({person: queueItem.person, group: group})
            indicesToErase.push(idx)
            if (set.featured) {
              var ext = extension.getOrInsertExtension(group.wcif, 'ActivityConfig', 'groupifier')
              ext.featuredCompetitorWcaUserIds.push(queueItem.person.wcaUserId)
            }
          }
        })
      })
      if (!solution.feasible && potentialInfinite) {
        var unfeasibleWarning = `The group assignment '${set.name}' is not feasible, the function has broken out to prevent an infinite loop.`
        warnings.push(unfeasibleWarning)
        console.log(unfeasibleWarning)
        break;
      }
      queue = queue.filter((item, idx) => !indicesToErase.includes(idx))
      newlyAssigned.forEach((assn) => {
        currentByPerson[assn.person.wcaUserId] = assn.group
        currentByGroup[assn.group.wcif.id].push(assn.person)
        if (assn.person.wcaUserId in preAssignedByPerson) {
          delete preAssignedByPerson[assn.person.wcaUserId]
          preAssignedByGroup[assn.group.wcif.id] -= 1
          preAssignedTotal -= 1
        }
      })
    }
    for (const personId in currentByPerson) {
      assignmentsByPerson[personId] = {group: currentByPerson[personId], set: set.name}
    }
    for (const groupId in currentByGroup) {
      currentByGroup[groupId].forEach((person) => {
        if (!assignmentsByGroup[groupId].some((assignment) => assignment.person.wcaUserId == person.wcaUserId)) {
          assignmentsByGroup[groupId].push({person: person, set: set.name})
        }
      })
    }
  })

  assignStations(stationRules, groups, assignmentsByGroup, assignmentsByPerson)

  for (const groupId in assignmentsByGroup) {
    assignmentsByGroup[groupId].sort(
        (a1, a2) => lib.personalBest(a1.person, round) < lib.personalBest(a2.person, round) ? -1 : 1)
  }

  people.forEach((person) => {
    if (person.wcaUserId in assignmentsByPerson) {
      var assignment = {
        activityId: assignmentsByPerson[person.wcaUserId].group.wcif.id,
        assignmentCode: "competitor",
      }
      if ('stationNumber' in assignmentsByPerson[person.wcaUserId]) {
        assignment.stationNumber = assignmentsByPerson[person.wcaUserId].stationNumber
      }
      person.assignments.push(assignment)
    }
  })
  return {
    round: round,
    groups: groups,
    assignments: assignmentsByGroup,
    warnings: warnings,
  }
}

function constructModel(queue, groupsToUse, scorers, assignmentsByGroup, currentByGroup, preAssignedByPerson, conflictingActivitiesByGroup) {
  var model = {
    optimize: 'score',
    opType: 'max',
    constraints: {},
    variables: {},
    ints: {},
  }
  queue.slice(0, 100).forEach((queueItem) => {
    var personKey = queueItem.person.wcaUserId.toString()
    model.constraints[personKey] = {min: 0, max: 1}
    var scores = {}
    var total = 0
    groupsToUse.forEach((group) => {
      if (personKey in preAssignedByPerson && preAssignedByPerson[personKey] != group.wcif.id) {
        return
      }
      if (!queueItem.person.assignments.every((assignment) => assignment.code !== 'competitor' || !conflictingActivitiesByGroup[group.wcif.id].includes(assignment.activityId))) {
        return
      }
      var newScore = 0
      scorers.forEach((scorer) => {
        newScore += scorer.getScore(queueItem.person, group, assignmentsByGroup[group.wcif.id].map((assignment) => assignment.person).concat(currentByGroup[group.wcif.id]))
      })
      total += newScore
      scores[group.wcif.id] = newScore
    })
    groupsToUse.forEach((group) => {
      if (!(group.wcif.id in scores)) {
        return
      }
      // Normalize all of the scores so that the average score is -idx.
      var adjustedScore = scores[group.wcif.id] - total / groupsToUse.length - queueItem.idx
      var groupKey = 'g' + group.wcif.id
      var key = personKey + '-' + groupKey
      model.variables[key] = {
        score: adjustedScore,
        totalAssigned: 1,
      }
      model.variables[key][personKey] = 1
      model.variables[key][groupKey] = 1
      model.variables[key][key] = 1
      model.constraints[key] = {min: 0, max: 1}
      model.ints[key] = 1
    })
  })
  groupsToUse.forEach((group) => {
    model.constraints['g' + group.wcif.id] = {min: 0, max: 1}
  })
  var numToAssign = Math.min(queue.length, groupsToUse.length)
  model.constraints.totalAssigned = {equal: numToAssign}
  return model
}

function assignStations(stationRules, groups, assignmentsByGroup, assignmentsByPerson) {
  stationRules.forEach((rule) => {
    groups.filter((group) => rule.groupFilter({Group: group})).forEach((group) => {
      assignmentsByGroup[group.wcif.id].sort((a1, a2) => {
        switch (rule.mode) {
          case "ascending":
            return rule.sortKey({Person: a1.person}) < rule.sortKey({Person: a2.person}) ? -1 : 1
          case "descending":
            return rule.sortKey({Person: a2.person}) < rule.sortKey({Person: a1.person}) ? 1 : -1
          case "arbitrary":
            return Math.random() - 0.5
        }
      }).forEach((assignment, idx) => {
        assignmentsByPerson[assignment.person.wcaUserId].stationNumber = idx + 1
        assignment.stationNumber = idx + 1
      })
    })
  })
}

class AssignmentSet {
  constructor(name, personFilter, groupFilter, featured) {
    this.name = name
    this.personFilter = personFilter
    this.groupFilter = groupFilter
    this.featured = featured
  }
}

class StationAssignmentRule {
  constructor(groupFilter, mode, sortKey) {
    this.groupFilter = groupFilter
    this.mode = mode
    this.sortKey = sortKey
  }
}

module.exports = {
  Assign: Assign,
  AssignmentSet: AssignmentSet,
  StationAssignmentRule: StationAssignmentRule,
}
