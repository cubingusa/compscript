const assign = require('./../staff/assign')
const scorers = require('./../staff/scorers')

const AssignStaff = {
  name: 'AssignStaff',
  args: [
    {
      name: 'round',
      type: 'Activity',
    },
    {
      name: 'groupFilter',
      type: 'Boolean(Activity)',
      lazy: true,
    },
    {
      name: 'personFilter',
      type: 'Boolean(Person)',
      lazy: true,
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
  implementation: (ctx, round, groupFilter, personFilter, jobs, scorers, overwrite) => {
    return assign.Assign(ctx.competition, round, groupFilter, personFilter, jobs, scorers, overwrite || ctx.dryrun)
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
    {
      name: 'previousGroup',
      type: 'Activity',
      defaultValue: null,
    },
    {
      name: 'nextGroup',
      type: 'Activity',
      defaultValue: null,
    },
  ],
  outputType: 'AssignmentScorer',
  implementation: (weight, previousGroup, nextGroup) => {
    return new scorers.AdjacentGroupScorer(weight, previousGroup, nextGroup)
  },
}

module.exports = {
  functions: [AssignStaff, Job, JobCountScorer, PreferenceScorer, AdjacentGroupScorer],
}
