const solver = require('javascript-lp-solver')
const activityCode = require('./../activity_code')
const extension = require('./../extension')
const lib = require('./../lib')
const driver = require('./../parser/driver')

function Assign(ctx, round, groupFilter, persons, jobs, scorers, overwrite) {
  var competition = ctx.competition
  var allGroups = lib.allGroups(competition)
  // Find matching groups
  var groups = lib.groupsForRoundCode(competition, round).filter((group) => {
    return groupFilter({Group: group})
  })

  var groupIds = groups.map((group) => group.wcif.id)

  // Check if there's anyone who already has a staff assignment.
  var peopleAlreadyAssigned = competition.persons.filter((person) => {
    return person.assignments.filter((assignment) => {
      return assignment.assignmentCode !== 'competitor' && groupIds.includes(assignment.activityId)
    }).length > 0
  })
  if (peopleAlreadyAssigned.length > 0) {
    if (overwrite) {
      peopleAlreadyAssigned.forEach((person) => {
        person.assignments = person.assignments.filter((assignment) => {
          return assignment.assignmentCode === 'competitor' || !groupIds.includes(assignment.activityId)
        })
      })
    } else {
      return {
        round: round,
        warnings: ['Jobs are already saved. Not overwriting unless overwrite=true is added.'],
        assignments: {
          groups: groups,
          jobs: {},
        },
      }
    }
  }

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
    var conflictingGroupIds = allGroups.filter((otherGroup) => {
      return group.startTime < otherGroup.endTime && otherGroup.startTime < group.endTime
    }).map((group) => group.wcif.id)
    var eligiblePeople = persons.filter((person) => {
      if (!person.assignments.every((assignment) => !conflictingGroupIds.includes(assignment.activityId))) {
        return false
      }
      var ext = extension.getExtension(person, 'Person')
      if (!ext || !('staffUnavailable' in ext)) {
        return true
      }
      var unavailableFn = driver.parseNode(ext.staffUnavailable.impl, ctx, true)
      return !unavailableFn({ Group: group })
    })
    var neededPeople = jobs.map((job) => job.count).reduce((a, v) => a+v)
    if (eligiblePeople.length < neededPeople) {
      out.warnings.push('Not enough people for group ' + group.name() + ' (needed ' + neededPeople + ', got ' + eligiblePeople.length + ')')
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
      var personScore = 0
      scorers.forEach((scorer) => {
        if (!scorer.caresAboutJobs) {
          var start = Date.now()
          var subscore = scorer.Score(competition, person, group)
          var end = Date.now()
          personScore += subscore
        }
      })
      jobs.forEach((job) => {
        if (!job.eligibility({Person: person})) {
          return
        }
        var jobScore = personScore
        scorers.forEach((scorer) => {
          if (scorer.caresAboutJobs && !scorer.caresAboutStations) {
            var start = Date.now()
            var subscore = scorer.Score(competition, person, group, job.name)
            var end = Date.now()
            jobScore += subscore
          }
        })
        var stations = job.assignStations ? [...Array(job.count).keys()] : [null]
        stations.forEach((num) => {
          var numStr = (num === null) ? '' : '-' + (num + 1)
          var score = jobScore
          scorers.forEach((scorer) => {
            if (scorer.caresAboutStations) {
              var start = Date.now()
              var subscore = scorer.Score(competition, person, group, job.name, num + 1)
              var end = Date.now()
              score += subscore
            }
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
    var start = Date.now()
    var solution = solver.Solve(model)
    var end = Date.now()
    if (!solution.feasible) {
      out.warnings.push('Failed to find a solution for group ' + group.name())
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
      persons.filter((person) => person.wcaUserId == wcaUserId).forEach((person) => {
        var totalScore = 0
        var breakdown = {}
        scorers.forEach((scorer) => {
          var subscore = scorer.Score(competition, person, group, jobName, stationNumber)
          totalScore += subscore
          breakdown[scorer.constructor.name] = subscore
        })
        var jobKey = jobName + (stationNumber ? '-' + stationNumber : '')
        var groupKey = group.wcif.id
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
          activityId: group.wcif.id,
          assignmentCode: 'staff-' + jobName,
          stationNumber: stationNumber
        })
      })
    })
  })
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
