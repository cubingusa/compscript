const assign = require('./../staff/assign')
const scorers = require('./../staff/scorers')
const extension = require('./../extension')

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
  ],
  outputType: 'StaffAssignmentResult',
  usesContext: true,
  mutations: ['persons'],
  implementation: (ctx, round, groupFilter, persons, jobs, scorers, overwrite) => {
    return assign.Assign(ctx, round, groupFilter, persons, jobs, scorers, overwrite || ctx.dryrun)
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
  ],
  outputType: 'AssignmentScorer',
  implementation: (weight, prefix, prior) => {
    return new scorers.PreferenceScorer(weight, prefix, prior)
  },
}

const AdjacentGroupScorer = {
  name: 'AdjacentGroupScorer',
  args: [
    {
      name: 'weight',
      type: 'Number',
    },
  ],
  outputType: 'AssignmentScorer',
  usesContext: true,
  implementation: (ctx, weight) => {
    return new scorers.AdjacentGroupScorer(ctx.competition, weight)
  },
}

const ScrambleSpeedScorer = {
  name: 'ScrambleSpeedScorer',
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
    }
  ],
  outputType: 'AssignmentScorer',
  implementation: (event, maxTime, weight) => {
    return new scorers.ScrambleSpeedScorer(event, maxTime, weight)
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

const SetStaffUnavailable = {
  name: 'SetStaffUnavailable',
  docs: 'Marks the provided staff members as unavailable at the given time',
  args: [
    {
      name: 'persons',
      type: 'Array<Person>',
    },
    {
      name: 'groupFilter',
      type: 'Boolean(Group)',
      serialized: true,
    },
  ],
  outputType: 'String',
  mutations: ['persons'],
  usesContext: true,
  implementation: (ctx, persons, groupFilter) => {
    persons.forEach((person) => {
      const ext = extension.getExtension(ctx.competition, 'Person')
      ext.staffUnavailable = { implementation: groupFilter, cmd: ctx.command }
    })
    return 'Set unavailable for ' + persons.map((person) => person.name).join(', ')
  }
}

module.exports = {
  functions: [AssignStaff, Job,
              JobCountScorer, PreferenceScorer, AdjacentGroupScorer, ScrambleSpeedScorer, GroupScorer,
              SetStaffUnavailable],
}
