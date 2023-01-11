const solver = require('javascript-lp-solver')
const activityCode = require('./../activity_code')
const lib = require('./../lib')

function Assign(competition, round, groupFilter, personFilter, jobs, scorers, overwrite) {
  // Find matching groups
  var groups = lib.groupsForRoundCode(competition, round).filter((group) => {
    return groupFilter({Activity: activityCode.parse(group.activityCode)})
  })

  var groupIds = groups.map((group) => group.id)

  // Check if there's anyone who already has a staff assignment.
  var peopleAlreadyAssigned = competition.persons.filter((person) => {
    return !person.assignments.every((assignment) => {
      assignment.assignmentCode !== 'competitor' || !groupIds.includes(assignment.activityId)
    })
  })
  if (peopleAlreadyAssigned.length > 0) {
    if (overwrite) {
      peopleAlreadyAssigned.forEach((person) => {
        person.assignments = person.assignments.filter((assignment) => {
          return !groupIds.includes(assignment.activityId)
        })
      })
    } else {
      return {
        round: round,
        warnings: ['Jobs are already saved. Not overwriting unless overwrite=true is added.'],
        assignments: [],
      }
    }
  }

  var peopleCopy = JSON.parse(JSON.stringify(competition.persons))
  var people = peopleCopy.filter((person) => personFilter({Person: person}))

  var out = {
    round: round,
    warnings: [],
    assignments: {
      groups: groups,
      jobs: {},
    },
  }

  var jobAssignments = out.assignments.jobs
  jobs.forEach((job) => {
    if (job.assignStations) {
      [...Array(job.count).keys()].forEach((num) => {
        jobAssignments[job.name + '-' + (num + 1)] = []
      })
    } else {
      jobAssignments[job.name] = []
    }
  })

  groups.forEach((group, idx) => {
    var conflictingGroupIds = lib.allGroups(competition).filter((otherGroup) => {
      return group.startTime < otherGroup.endTime && otherGroup.startTime < group.endTime
    }).map((group) => group.activityId)
    var eligiblePeople = people.filter((person) => {
      return person.assignments.every((assignment) => !conflictingGroupIds.includes(assignment.activityId))
    })
    var neededPeople = jobs.map((job) => job.count).reduce((a, v) => a+v)
    if (eligiblePeople.length < neededPeople) {
      out.warnings.push('Not enough people for group ' + group.activityCode + ' (needed ' + neededPeople + ', got ' + eligiblePeople.length + ')')
      return
    }
    var model = {
      optimize: 'score',
      opType: 'max',
      constraints: {},
      variables: {},
      ints: {},
    }
    jobs.forEach((job) => {
      if (job.assignStations) {
        [...Array(job.count).keys()].forEach((num) => {
          model.constraints['job-' + job.name + '-' + (num + 1)] = {equal: 1}
        })
      } else {
        model.constraints['job-' + job.name] = {equal: job.count}
      }
    })
    eligiblePeople.forEach((person) => {
      model.constraints['person-' + person.wcaUserId] = {min: 0, max: 1}
      jobs.forEach((job) => {
        if (!job.eligibility({Person: person})) {
          return
        }
        var stations = job.assignStations ? [...Array(job.count).keys()] : [null]
        stations.forEach((num) => {
          var numStr = (num === null) ? '' : '-' + (num + 1)
          var score = 0
          scorers.forEach((scorer) => {
            var subscore = scorer.Score(competition, person, groups, idx, job.name, num + 1)
            score += subscore
          })
          var key = 'assignment-' + person.wcaUserId + '-' + job.name + numStr
          model.variables[key] = {score: score}
          model.variables[key]['person-' + person.wcaUserId] = 1
          model.variables[key]['job-' + job.name + numStr] = 1
          model.variables[key][key] = 1
          model.constraints[key] = {min: 0, max: 1}
          model.ints[key] = 1
        })
      })
    })
    var solution = solver.Solve(model)
    if (!solution.feasible) {
      out.warnings.push('Failed to find a solution for group ' + group.activityCode)
      return
    }
    Object.keys(solution).forEach((key) => {
      if (!key.startsWith('assignment-') || solution[key] !== 1) {
        return
      }
      var spl = key.split('-')
      var wcaUserId = +spl[1]
      var jobName = spl[2]
      var stationNumber = null
      if (spl.length > 3) {
        stationNumber = +spl[3]
      }
      people.filter((person) => person.wcaUserId == wcaUserId).forEach((person) => {
        var totalScore = 0
        var breakdown = {}
        scorers.forEach((scorer) => {
          var subscore = scorer.Score(competition, person, group, jobName, stationNumber)
          totalScore += subscore
          breakdown[scorer.constructor.name] = subscore
        })
        var jobKey = jobName + (stationNumber ? '-' + stationNumber : '')
        var groupKey = group.activityCode
        if (!(groupKey in jobAssignments[jobKey])) {
          jobAssignments[jobKey][groupKey] = []
        }
        jobAssignments[jobKey][groupKey].push({
          person: person,
          score: {
            total: totalScore,
            breakdown: breakdown,
          }
        })
        if (!person.assignments) {
          person.assignments = []
        }
        person.assignments.push({
          activityId: group.id,
          assignmentCode: 'staff-' + jobName,
          stationNumber: stationNumber
        })
      })
    })
  })
  competition.persons = peopleCopy
  return out
}

function Job(name, count, assignStations, eligibility) {
  return {
    name: name,
    count: count,
    assignStations: assignStations,
    eligibility: eligibility,
  }
}

module.exports = {
  Assign: Assign,
  Job: Job,
}
