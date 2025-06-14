const assign = require('./../staff/assign')
const scorers = require('./../staff/scorers')
const extension = require('./../extension')
const lib = require('./../lib')

const AssignStaff = {
  name: 'AssignStaff',
  args: [
    {
      name: 'round',
      type: 'Round',
    },
    {
      name: 'groupFilter',
      type: 'Boolean(Group)',
      lazy: true,
    },
    {
      name: 'persons',
      type: 'Array<Person>',
    },
    {
      name: 'jobs',
      type: 'Array<AssignmentJob>',
    },
    {
      name: 'scorers',
      type: 'Array<AssignmentScorer>',
    },
    {
      name: 'overwrite',
      type: 'Boolean',
      defaultValue: false,
    },
    {
      name: 'avoidConflicts',
      type: 'Boolean',
      defaultValue: true,
    },
    {
      name: 'unavailable',
      type: 'Array<StaffUnavailability>(Person)',
      lazy: true,
      defaultValue: [],
    }
  ],
  outputType: 'StaffAssignmentResult',
  usesContext: true,
  mutations: ['persons'],
  implementation: (ctx, round, groupFilter, persons, jobs, scorers, overwrite, avoidConflicts, unavailable) => {
    return assign.Assign(ctx, round, groupFilter, persons, jobs, scorers, overwrite || ctx.dryrun, avoidConflicts, unavailable)
  }
}

const AssignMisc = {
  name: 'AssignMisc',
  args: [
    {
      name: 'activityId',
      type: 'Number',
    },
    {
      name: 'persons',
      type: 'Array<Person>',
    },
    {
      name: 'jobs',
      type: 'Array<AssignmentJob>',
    },
    {
      name: 'scorers',
      type: 'Array<AssignmentScorer>',
    },
    {
      name: 'overwrite',
      type: 'Boolean',
      defaultValue: false,
    },
    {
      name: 'avoidConflicts',
      type: 'Boolean',
      defaultValue: true,
    },
  ],
  outputType: 'StaffAssignmentResult',
  usesContext: true,
  mutations: ['persons'],
  implementation: (ctx, activityId, persons, jobs, scorers, overwrite, avoidConflicts) => {
    return assign.AssignMisc(ctx, activityId, persons, jobs, scorers, overwrite || ctx.dryrun, avoidConflicts)
  }
}

const Job = {
  name: 'Job',
  args: [
    {
      name: 'name',
      type: 'String',
    },
    {
      name: 'count',
      type: 'Number',
    },
    {
      name: 'assignStations',
      type: 'Boolean',
      defaultValue: false,
    },
    {
      name: 'eligibility',
      type: 'Boolean(Person)',
      lazy: true,
      defaultValue: true,
    },
  ],
  outputType: 'AssignmentJob',
  implementation: (name, count, assignStations, eligibility) => {
    return assign.Job(name, count, assignStations, eligibility)
  },
}

const JobCountScorer = {
  name: 'JobCountScorer',
  args:[
    {
      name: 'weight',
      type: 'Number',
    },
  ],
  outputType: 'AssignmentScorer',
  implementation: (weight) => {
    return new scorers.JobCountScorer(weight)
  },
}

const PriorAssignmentScorer = {
  name: 'PriorAssignmentScorer',
  args: [
    {
      name: 'staffingWeight',
      type: 'Number',
      description: 'Weight added per hour previously spent staffing.',
    },
    {
      name: 'competingWeight',
      type: 'Number',
      description: 'Weight added per hour previously spent competing.',
    },
    {
      name: 'startTime',
      type: 'DateTime',
      defaultValue: null,
      nullable: true,
    },
  ],
  outputType: 'AssignmentScorer',
  usesContext: true,
  implementation: (ctx, staffingWeight, competingWeight, startTime) => {
    return new scorers.PriorAssignmentScorer(ctx.competition, staffingWeight, competingWeight, startTime)
  }
}

const PreferenceScorer = {
  name: 'PreferenceScorer',
  args: [
    {
      name: 'weight',
      type: 'Number',
    },
    {
      name: 'prefix',
      type: 'String',
    },
    {
      name: 'prior',
      type: 'Number',
    },
    {
      name: 'allJobs',
      type: 'Array<String>',
    }
  ],
  outputType: 'AssignmentScorer',
  implementation: (weight, prefix, prior, allJobs) => {
    return new scorers.PreferenceScorer(weight, prefix, prior, allJobs)
  },
}

const SameJobScorer = {
  name: 'SameJobScorer',
  args: [
    {
      name: 'center',
      type: 'Number',
    },
    {
      name: 'posWeight',
      type: 'Number',
    },
    {
      name: 'negWeight',
      type: 'Number',
    },
    {
      name: 'jobs',
      type: 'Array<String>',
      nullable: true,
      defaultValue: null,
    }
  ],
  outputType: 'AssignmentScorer',
  usesContext: true,
  implementation: (ctx, center, posWeight, negWeight, jobs) => {
    return new scorers.PrecedingAssignmentsScorer(
        ctx.competition, center, posWeight, negWeight,
        (assignment, job) => assignment.assignmentCode === 'staff-' + job, jobs)
  },
}

const ConsecutiveJobScorer = {
  name: 'ConsecutiveJobScorer',
  args: [
    {
      name: 'center',
      type: 'Number',
    },
    {
      name: 'posWeight',
      type: 'Number',
    },
    {
      name: 'negWeight',
      type: 'Number',
    },
    {
      name: 'jobs',
      type: 'Array<String>',
      nullable: true,
      defaultValue: null,
    }
  ],
  outputType: 'AssignmentScorer',
  usesContext: true,
  implementation: (ctx, center, posWeight, negWeight, jobs) => {
    return new scorers.PrecedingAssignmentsScorer(
        ctx.competition, center, posWeight, negWeight,
        (assignment, job) => assignment.assignmentCode !== 'competitor', jobs)
  },
}

const MismatchedStationScorer = {
  name: 'MismatchedStationScorer',
  args: [
    {
      name: 'weight',
      type: 'Number',
    },
  ],
  outputType: 'AssignmentScorer',
  usesContext: true,
  implementation: (ctx, weight) => {
    return new scorers.MismatchedStationScorer(ctx.competition, weight)
  },
}

const SolvingSpeedScorer = {
  name: 'SolvingSpeedScorer',
  args: [
    {
      name: 'event',
      type: 'Event',
    },
    {
      name: 'maxTime',
      type: 'AttemptResult',
    },
    {
      name: 'weight',
      type: 'Number',
    },
    {
      name: 'jobs',
      type: 'Array<String>',
    }
  ],
  outputType: 'AssignmentScorer',
  implementation: (event, maxTime, weight, jobs) => {
    return new scorers.SolvingSpeedScorer(event, maxTime, weight, jobs)
  }
}

const GroupScorer = {
  name: 'GroupScorer',
  args: [
    {
      name: 'condition',
      type: 'Boolean(Person, Group)',
      lazy: true,
    },
    {
      name: 'weight',
      type: 'Number',
    }
  ],
  outputType: 'AssignmentScorer',
  implementation: (condition, weight) => {
    return new scorers.GroupScorer(condition, weight)
  }
}

const FollowingGroupScorer = {
  name: 'FollowingGroupScorer',
  args: [
    {
      name: 'weight',
      type: 'Number',
    },
    {
      name: 'maxMinutes',
      type: 'Number',
      defaultValue: 0,
    },
  ],
  usesContext: true,
  outputType: 'AssignmentScorer',
  implementation: (ctx, weight, maxMinutes) => {
    return new scorers.FollowingGroupScorer(ctx.competition, weight, maxMinutes)
  }
}

const PersonPropertyScorer = {
  name: 'PersonPropertyScorer',
  args: [
    {
      name: 'filter',
      type: 'Boolean(Person, Group)',
      lazy: true,
    },
    {
      name: 'weight',
      type: 'Number',
    }
  ],
  outputType: 'AssignmentScorer',
  implementation: (filter, weight) => {
    return new scorers.PersonPropertyScorer(filter, weight)
  }
}

const ComputedWeightScorer = {
  name: 'ComputedWeightScorer',
  args: [
    {
      name: 'weightFn',
      type: 'Number(Person)',
      lazy: true,
    },
    {
      name: 'jobs',
      type: 'Array<String>',
    }
  ],
  outputType: 'AssignmentScorer',
  implementation: (weightFn, jobs) => {
    return new scorers.ComputedWeightScorer(weightFn, jobs)
  }
}

const ConditionalScorer = {
  name: 'ConditionalScorer',
  args: [
    {
      name: 'personCondition',
      type: 'Boolean(Person)',
      lazy: true,
    },
    {
      name: 'groupCondition',
      type: 'Boolean(Group)',
      lazy: true,
    },
    {
      name: 'jobCondition',
      type: 'Boolean(String)',
      lazy: true,
    },
    {
      name: 'stationCondition',
      type: 'Boolean(Number)',
      lazy: true,
    },
    {
      name: 'score',
      type: 'Number',
    },
  ],
  outputType: 'AssignmentScorer',
  implementation: (personCondition, groupCondition, jobCondition, stationCondition, score) => {
    return new scorers.ConditionalScorer(personCondition, groupCondition, jobCondition, stationCondition, score)
  }
}

const UnavailableBetween = {
  name: 'UnavailableBetween',
  docs: 'Indicates that the staff member is unavailable at the given time',
  args: [
    {
      name: 'start',
      type: 'DateTime',
    },
    {
      name: 'end',
      type: 'DateTime',
    },
  ],
  outputType: 'StaffUnavailability',
  implementation: (start, end) => {
    return (activity) => activity.endTime > start && end > activity.startTime
  }
}

const UnavailableForDate = {
  name: 'UnavailableForDate',
  docs: 'Indicates that the staff member is unavailable on the given date',
  args: [
    {
      name: 'date',
      type: 'Date',
    },
  ],
  outputType: 'StaffUnavailability',
  implementation: (date) => {
    return (activity) => activity.startTime.year === date.year && activity.startTime.month === date.month && activity.startTime.day === date.day
  }
}

const DuringTimes = {
  name: 'DuringTimes',
  docs: 'Indicates the staff member is unavailable during groups that start in the provided times',
  args: [
    {
      name: 'times',
      type: 'Array<DateTime>',
    },
  ],
  outputType: 'StaffUnavailability',
  implementation: (times) => {
    return (activity) => times.some((time) => +time === +activity.startTime)
  }
}

const BeforeTimes = {
  name: 'BeforeTimes',
  docs: 'Indicates the staff member is unavailable during groups that end in the provided times',
  args: [
    {
      name: 'times',
      type: 'Array<DateTime>',
    },
  ],
  outputType: 'StaffUnavailability',
  implementation: (times) => {
    return (activity) => times.some((time) => +time === +activity.endTime)
  }
}

const NumJobs = {
  name: 'NumJobs',
  docs: 'The number of jobs for a given person. If type is not provided, all jobs are included.',
  args: [
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true,
    },
    {
      name: 'type',
      type: 'String',
      defaultValue: null,
      nullable: true,
    }
  ],
  outputType: 'Number',
  implementation: (person, type) => {
    return person.assignments.filter((assignment) => {
      if (type !== null) {
        return assignment.assignmentCode === 'staff-' + type
      } else {
        return assignment.assignmentCode.startsWith('staff-')
      }
    }).length
  }
}

const NumJobsInRound = {
  name: 'NumJobsInRound',
  docs: 'The number of jobs for a given person. If type is not provided, all jobs are included.',
  args: [
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true,
    },
    {
      name: 'round',
      type: 'Round',
    },
    {
      name: 'type',
      type: 'String',
      defaultValue: null,
      nullable: true,
    }
  ],
  outputType: 'Number',
  usesContext: true,
  implementation: (ctx, person, round, type) => {
    const activityIds = lib.allActivitiesForRoundId(ctx.competition, round.id()).map((activity) => activity.wcif.id)
    return person.assignments.filter((assignment) => {
      if (!activityIds.includes(assignment.activityId)) {
        return false
      }
      if (type !== null) {
        return assignment.assignmentCode === 'staff-' + type
      } else {
        return assignment.assignmentCode.startsWith('staff-')
      }
    }).length
  }
}
const LengthOfJobs = {
  name: 'LengthOfJobs',
  docs: 'The number of hours a given person spends working. If type is not provided, all jobs are included.',
  args: [
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true,
    },
    {
      name: 'type',
      type: 'String',
      defaultValue: null,
      nullable: true,
    }
  ],
  outputType: 'Number',
  usesContext: true,
  implementation: (ctx, person, type) => {
    return person.assignments.filter((assignment) => {
      if (type !== null) {
        return assignment.assignmentCode === 'staff-' + type
      } else {
        return assignment.assignmentCode.startsWith('staff-')
      }
    }).map((assignment) => {
      var group = lib.groupForActivityId(ctx.competition, assignment.activityId)
      return group.endTime.diff(group.startTime, 'hours').hours
    }).reduce((total, current) => total + current, 0)
  }
}

module.exports = {
  functions: [AssignStaff, AssignMisc, Job,
              JobCountScorer, PriorAssignmentScorer, PreferenceScorer,
              SameJobScorer, ConsecutiveJobScorer, MismatchedStationScorer,
              SolvingSpeedScorer, GroupScorer, FollowingGroupScorer,
              PersonPropertyScorer, ComputedWeightScorer, ConditionalScorer,
              UnavailableBetween, UnavailableForDate, BeforeTimes, DuringTimes,
              NumJobs, NumJobsInRound, LengthOfJobs],
}
