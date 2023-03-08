const { DateTime } = require('luxon')

const activityCode = require('./../activity_code')
const assign = require('./../groups/assign')
const scorers = require('./../groups/scorers')
const lib = require('./../lib')

const AssignGroups = {
  name: 'AssignGroups',
  args: [
    {
      name: 'round',
      type: 'Round',
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
    {
      name: 'stationRules',
      type: 'Array<StationAssignmentRule>',
      defaultValue: [],
    },
    {
      name: 'attemptNumber',
      type: 'Number',
      nullable: true,
      defaultValue: null,
    },
    {
      name: 'overwrite',
      type: 'Boolean',
      defaultValue: false,
    }
  ],
  outputType: 'GroupAssignmentResult',
  usesContext: true,
  mutations: ['persons', 'schedule'],
  implementation: (ctx, round, assignmentSets, scorers, stationRules, attemptNumber, overwrite) => {
    return assign.Assign(ctx.competition, round, assignmentSets, scorers, stationRules, attemptNumber, overwrite || ctx.dryrun)
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
      type: 'Boolean(Group)',
      lazy: true,
    },
    {
      name: 'featured',
      type: 'Boolean',
      defaultValue: false,
    },
  ],
  outputType: 'AssignmentSet',
  implementation: (name, personFilter, groupFilter, featured) => {
    return new assign.AssignmentSet(name, personFilter, groupFilter, featured)
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
      type: 'Boolean(Group)',
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

const StationAssignmentRule = {
  name: 'StationAssignmentRule',
  genericParams: ['T'],
  args: [
    {
      name: 'groupFilter',
      type: 'Boolean(Group)',
      lazy: true,
    },
    {
      name: 'mode',
      type: 'String',
    },
    {
      name: 'sortKey',
      type: '$T(Person)',
      lazy: true,
      defaultValue: 0,
    },
  ],
  outputType: 'StationAssignmentRule',
  implementation: (groupFilter, mode, sortKey) => {
    return new assign.StationAssignmentRule(groupFilter, mode, sortKey)
  }
}

const GroupNumber = {
  name: 'GroupNumber',
  args: [],
  outputType: 'Number(Group)',
  implementation: (group) => group.activityCode.groupNumber
}

const Stage = {
  name: 'Stage',
  args: [],
  outputType: 'String(Group)',
  implementation: (group) => group.room.name.split(' ')[0]
}

const AssignedGroup = {
  name: 'AssignedGroup',
  args: [
    {
      name: 'round',
      type: 'Round',
    },
  ],
  outputType: 'Group(Person)',
  usesContext: true,
  implementation: (ctx, round, person) => {
    var matching = person.assignments.map((assignment) => {
      if (assignment.assignmentCode != "competitor") {
        return null
      }
      var group = lib.groupForActivityId(ctx.competition, assignment.activityId)
      if (round.contains(group.activityCode)) {
        return group
      } else {
        return null
      }
    }).filter((x) => x !== null)
    if (!matching.length) {
      return null
    }
    return matching[0]
  }
}

const Name = {
  name: 'Name',
  args: [
    {
      name: 'group',
      type: 'Group',
    },
  ],
  outputType: 'String',
  implementation: (group) => group.name()
}

const StartTime = {
  name: 'StartTime',
  args: [
    {
      name: 'group',
      type: 'Group',
    },
  ],
  outputType: 'DateTime',
  usesContext: true,
  implementation: (ctx, group) => {
    return DateTime.fromISO(group.wcif.startTime).setZone(ctx.competition.schedule.venues[0].timezone)
  }
}

module.exports = {
  functions: [AssignGroups, AssignmentSet, ByMatchingValue, ByFilters, StationAssignmentRule,
              GroupNumber, Stage, AssignedGroup,
              Name, StartTime],
}
