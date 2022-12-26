const assign = require('./../groups/assign')
const scorers = require('./../groups/scorers')

const AssignGroups = {
  name: 'AssignGroups',
  args: [
    {
      name: 'round',
      type: 'Activity',
    },
    {
      name: 'assignmentSets',
      type: 'Array<AssignmentSet>',
    },
    {
      name: 'scorers',
      type: 'Array<AssignmentScorer>',
      defaultValue: [],
    },
  ],
  outputType: 'GroupAssignmentResult',
  usesContext: true,
  // mutations: ['persons'],
  implementation: (ctx, round, assignmentSets, scorers) => {
    return assign.Assign(ctx.competition, round, assignmentSets, scorers)
  }
}

const AssignmentSet = {
  name: 'AssignmentSet',
  args: [
    {
      name: 'name',
      type: 'String',
    },
    {
      name: 'personFilter',
      type: 'Boolean(Person)',
      lazy: true,
    },
    {
      name: 'groupFilter',
      type: 'Boolean(Activity)',
      lazy: true,
    },
  ],
  outputType: 'AssignmentSet',
  implementation: (name, personFilter, groupFilter) => {
    return new assign.AssignmentSet(name, personFilter, groupFilter)
  }
}

const ByMatchingValue = {
  name: 'ByMatchingValue',
  genericParams: ['T'],
  args: [
    {
      name: 'value',
      type: '$T(Person)',
      lazy: true,
    },
    {
      name: 'score',
      type: 'Number',
    },
  ],
  outputType: 'AssignmentScorer',
  implementation: (value, score) => {
    return new scorers.ByMatchingValue(value, score)
  }
}

const ByFilters = {
  name: 'ByFilters',
  args: [
    {
      name: 'personFilter',
      type: 'Boolean(Person)',
      lazy: true,
    },
    {
      name: 'groupFilter',
      type: 'Boolean(Activity)',
      lazy: true,
    },
    {
      name: 'score',
      type: 'Number',
    },
  ],
  outputType: 'AssignmentScorer',
  implementation: (personFilter, groupFilter, score) => {
    return new scorers.ByMatchingValue(personFilter, groupFilter, score)
  }
}

const GroupNumber = {
  name: 'GroupNumber',
  args: [],
  outputType: 'Number(Activity)',
  implementation: (activity) => {
    if (!activity.groupName) {
      return -1
    }
    return +activity.groupName.match(/\d+/g)[0]
  }
}

const Stage = {
  name: 'Stage',
  args: [],
  outputType: 'String(Activity)',
  implementation: (activity) => {
    if (!activity.groupName) {
      return ""
    }
    return activity.groupName.match(/[a-zA-Z]+/g)[0]
  }
}

module.exports = {
  functions: [AssignGroups, AssignmentSet, ByMatchingValue, ByFilters,
              GroupNumber, Stage],
}
