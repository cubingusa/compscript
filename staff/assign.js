const solver = require('javascript-lp-solver')
const activityCode = require('./../activity_code')
const extension = require('./../extension')
const lib = require('./../lib')
const driver = require('./../parser/driver')

function AssignImpl(ctx, activities, persons, jobs, scorers, overwrite, name, avoidConflicts, unavailable) {
  var competition = ctx.competition
  var allGroups = lib.allGroups(competition)
  var groupIds = activities.map((group) => group.wcif.id)

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
        round: name,
        warnings: ['Jobs are already saved. Not overwriting unless overwrite=true is added.'],
        assignments: {
          activities: activities,
          jobs: {},
        },
      }
    }
  }

  var out = {
    round: name,
    warnings: [],
    assignments: {
      activities: activities,
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

  var unavailableByPerson = {}
  persons.forEach((person) => {
    unavailableByPerson[person.wcaUserId] = unavailable({Person: person})
  })

  activities.forEach((activity, idx) => {
    var conflictingGroupIds = allGroups.filter((otherGroup) => {
      return activity.startTime < otherGroup.endTime && otherGroup.startTime < activity.endTime
    }).map((activity) => activity.wcif.id)
    var eligiblePeople = persons.filter((person) => {
      if (avoidConflicts &&
          !person.assignments.every((assignment) => !conflictingGroupIds.includes(assignment.activityId))) {
        return false
      }
      return !unavailableByPerson[person.wcaUserId].some((unavail) => unavail(activity))
    })
    var neededPeople = jobs.map((job) => job.count).reduce((a, v) => a+v)
    if (eligiblePeople.length < neededPeople) {
      out.warnings.push('Not enough people for activity ' + activity.name() + ' (needed ' + neededPeople + ', got ' + eligiblePeople.length + ')')
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
          var subscore = scorer.Score(competition, person, activity)
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
            var subscore = scorer.Score(competition, person, activity, job.name)
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
              var subscore = scorer.Score(competition, person, activity, job.name, num + 1)
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
      out.warnings.push('Failed to find a solution for activity ' + activity.name())
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
          var subscore = scorer.Score(competition, person, activity, jobName, stationNumber)
          totalScore += subscore
          breakdown[scorer.constructor.name] = subscore
        })
        var jobKey = jobName + (stationNumber ? '-' + stationNumber : '')
        var activityKey = activity.wcif.id
        if (!(activityKey in jobAssignments[jobKey])) {
          jobAssignments[jobKey][activityKey] = []
        }
        jobAssignments[jobKey][activityKey].push({
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
          activityId: activity.wcif.id,
          assignmentCode: 'staff-' + jobName,
          stationNumber: stationNumber
        })
      })
    })
  })
  return out
}

function Assign(ctx, round, groupFilter, persons, jobs, scorers, overwrite, avoidConflicts, unavailable) {
  var competition = ctx.competition
  var groups = lib.groupsForRoundCode(competition, round).filter((group) => {
    return groupFilter({Group: group})
  })
  return AssignImpl(ctx, groups, persons, jobs, scorers, overwrite, round.toString(), avoidConflicts, unavailable)
}

function AssignMisc(ctx, activityId, persons, jobs, scorers, overwrite, avoidConflicts) {
  var activity = lib.miscActivityForId(ctx.competition, activityId)
  if (activity === null) {
    return {
      round: 'unknown',
      warnings: ['No activity found.'],
      assignments: {
        activities: [],
        jobs: {},
      },
    }
  }
  return AssignImpl(ctx, [activity], persons, jobs, scorers, overwrite, activity.name(), avoidConflicts)
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
  AssignMisc: AssignMisc,
  Job: Job,
}
