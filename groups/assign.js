const solver = require('javascript-lp-solver')
const activityCode = require('./../activity_code')
const extension = require('./../extension')
const lib = require('./../lib')

function Assign(competition, round, assignmentSets, scorers, override) {
  var activityIds = lib.groupIdsForRoundCode(competition, round)
  if (competition.persons.map((person) => person.assignments).flat()
          .some((assignment) => activityIds.includes(assignment.activityId))) {
    if (!override) {
      return {
        round: round,
        warnings: ['Groups are already saved. Not overwriting unless overwrite=true is added.'],
        assignments: {},
      }
    } else {
      competition.persons.forEach((person) => {
        person.assignments = person.assignments.filter(
            (assignment) => !activityIds.includes(assignment.activityId))
      })
    }
  }

  var personIds = lib.getRound(competition, round)
                     .results.map((res) => res.personId)

  var people =
      competition.persons.filter((person) => personIds.includes(person.registrantId))
      .sort((p1, p2) => lib.personalBest(p1, round).value - lib.personalBest(p2, round).value)

  var groups =
      competition.schedule.venues.map((venue) => venue.rooms).flat()
          .map((room) => room.activities).flat()
          .filter((activity) => activity.activityCode == round.id())
          .map((activity) => activity.childActivities).flat()

  var assignmentsByPerson = {}
  var assignmentsByGroup = {}
  groups.forEach((group) => {
    assignmentsByGroup[group.activityCode] = []
  })
  warnings = []
  assignmentSets.forEach((set) => {
    var eligibleGroups = groups.filter((group) => set.groupFilter({Activity: activityCode.parse(group.activityCode)}))
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
    // wcaUserId -> group activity code
    var preAssignedByPerson = {}
    // group activity code -> count
    var preAssignedByGroup = {}
    eligibleGroups.forEach((group) => {
      currentByGroup[group.activityCode] = []
      preAssignedByGroup[group.activityCode] = 0
    })
    eligiblePeople.forEach((person) => {
      if (person.wcaUserId in assignmentsByPerson) {
        var assignment = assignmentsByPerson[person.wcaUserId]
        var group = assignment.group
        if (group.activityCode in currentByGroup) {
          queue.push({person: person, idx: queue.length})
          preAssignedByPerson[person.wcaUserId] = group.activityCode
          preAssignedByGroup[group.activityCode] += 1
        } else {
          warnings.push({
            type: 'ALREADY_ASSIGNED',
            set: set.name,
            person: person,
            group: group,
          })
        }
      } else {
        queue.push({person: person, idx: queue.length})
      }
    })
    var totalToAssign = queue.length
    while (queue.length) {
      // Don't assign any more to groups with enough people pre-assigned.
      var groupsToUse = eligibleGroups.filter((group) => currentByGroup[group.activityCode].length + preAssignedByGroup[group.activityCode] < totalToAssign / eligibleGroups.length)
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
          if (personKey in preAssignedByPerson && preAssignedByPerson[personKey] != group.activityCode) {
            return
          }
          var newScore = 0
          scorers.forEach((scorer) => {
            newScore += scorer.getScore(queueItem.person, group, assignmentsByGroup[group.activityCode].map((assignment) => assignment.person).concat(currentByGroup[group.activityCode]))
          })
          total += newScore
          scores[group.activityCode] = newScore
        })
        groupsToUse.forEach((group) => {
          if (!(group.activityCode in scores)) {
            return
          }
          // Normalize all of the scores so that the average score is -idx.
          var adjustedScore = scores[group.activityCode] - total / groupsToUse.length - queueItem.idx
          var groupKey = group.activityCode
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
        model.constraints[group.activityCode] = {min: 0, max: 1}
      })
      var numToAssign = Math.min(queue.length, groupsToUse.length)
      model.constraints.totalAssigned = {equal: numToAssign}
      var solution = solver.Solve(model)
      var newlyAssigned = []
      var indicesToErase = []
      queue.forEach((queueItem, idx) => {
        groupsToUse.forEach((group) => {
          var key = queueItem.person.wcaUserId.toString() + '-' + group.activityCode
          if (key in solution && solution[key] == 1) {
            newlyAssigned.push({person: queueItem.person, group: group})
            indicesToErase.push(idx)
          }
        })
      })
      queue = queue.filter((item, idx) => !indicesToErase.includes(idx))
      newlyAssigned.forEach((assn) => {
        currentByPerson[assn.person.wcaUserId] = assn.group
        currentByGroup[assn.group.activityCode].push(assn.person)
        if (assn.person.wcaUserId in preAssignedByPerson) {
          delete preAssignedByPerson[assn.person.wcaUserId]
          preAssignedByGroup[assn.group.activityCode] -= 1
        }
      })
    }
    for (const personId in currentByPerson) {
      assignmentsByPerson[personId] = {group: currentByPerson[personId], set: set.name}
    }
    for (const groupCode in currentByGroup) {
      currentByGroup[groupCode].forEach((person) => {
        if (!assignmentsByGroup[groupCode].some((assignment) => assignment.person.wcaUserId == person.wcaUserId)) {
          assignmentsByGroup[groupCode].push({person: person, set: set.name})
        }
      })
    }
  })
  for (const groupCode in assignmentsByGroup) {
    assignmentsByGroup[groupCode].sort(
        (a1, a2) => lib.personalBest(a1.person, round) < lib.personalBest(a2.person, round) ? -1 : 1)
  }
  var codeToId = lib.activityCodeMapForRoundCode(competition, round)
  competition.persons.forEach((person) => {
    if (person.wcaUserId in assignmentsByPerson) {
      person.assignments.push({
        activityId: codeToId[assignmentsByPerson[person.wcaUserId].group.activityCode],
        assignmentCode: "competitor",
      })
    }
  })
  return {
    round: round,
    assignments: assignmentsByGroup,
    warnings: warnings,
  }
}

class AssignmentSet {
  constructor(name, personFilter, groupFilter) {
    this.name = name
    this.personFilter = personFilter
    this.groupFilter = groupFilter
  }
}

module.exports = {
  Assign: Assign,
  AssignmentSet: AssignmentSet,
}
