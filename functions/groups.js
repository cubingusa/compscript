const activityCode = require('./../activity_code')
const assign = require('./../groups/assign')
const scorers = require('./../groups/scorers')
const lib = require('./../lib')

const AssignGroups = {
  name: 'AssignGroups',
  docs: 'Assigns groups for the given round',
  args: [
    {
      name: 'round',
      type: 'Round',
      docs: 'The round to assign groups for',
    },
    {
      name: 'assignmentSets',
      type: 'Array<AssignmentSet>',
      docs: 'An ordered array of sets of people that should be evenly assigned',
    },
    {
      name: 'scorers',
      type: 'Array<AssignmentScorer>',
      defaultValue: [],
      docs: 'A list of scoring functions to use',
    },
    {
      name: 'stationRules',
      type: 'Array<StationAssignmentRule>',
      defaultValue: [],
      docs: 'Rules for assigning fixed stations',
    },
    {
      name: 'attemptNumber',
      type: 'Number',
      nullable: true,
      defaultValue: null,
      docs: 'If specified, assign groups for only this attempt number',
    },
    {
      name: 'overwrite',
      type: 'Boolean',
      defaultValue: false,
      docs: 'If groups are already assigned, overwrite them',
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
      docs: 'The name of this assignment set (for debug only)',
    },
    {
      name: 'personFilter',
      type: 'Boolean(Person)',
      lazy: true,
      docs: 'Which poeple are in this assignment set',
    },
    {
      name: 'groupFilter',
      type: 'Boolean(Group)',
      lazy: true,
      docs: 'Which groups can be assigned',
    },
    {
      name: 'featured',
      type: 'Boolean',
      defaultValue: false,
      docs: 'Whether people in this assignment set should be marked as "featured" on their scorecard',
    },
  ],
  outputType: 'AssignmentSet',
  implementation: (name, personFilter, groupFilter, featured) => {
    return new assign.AssignmentSet(name, personFilter, groupFilter, featured)
  }
}

const ByMatchingValue = {
  name: 'ByMatchingValue',
  docs: 'Score people based on how many people in each group match on a certain property',
  genericParams: ['T'],
  args: [
    {
      name: 'value',
      type: '$T(Person)',
      lazy: true,
      docs: 'The property to consider',
    },
    {
      name: 'score',
      type: 'Number',
      docs: 'The score to assign for each matching person',
    },
  ],
  outputType: 'AssignmentScorer',
  implementation: (value, score) => {
    return new scorers.ByMatchingValue(value, score)
  }
}

const ByFilters = {
  name: 'ByFilters',
  docs: 'Score people based on whether the group satisfies a certain condition',
  args: [
    {
      name: 'personFilter',
      type: 'Boolean(Person)',
      lazy: true,
      docs: 'The people to consider for this scoring function',
    },
    {
      name: 'groupFilter',
      type: 'Boolean(Group)',
      lazy: true,
      docs: 'The groups to consider for this scoring function',
    },
    {
      name: 'score',
      type: 'Number',
      docS: 'The score to assign if the person and group satisfy the filter',
    },
  ],
  outputType: 'AssignmentScorer',
  implementation: (personFilter, groupFilter, score) => {
    return new scorers.ByMatchingValue(personFilter, groupFilter, score)
  }
}

const StationAssignmentRule = {
  name: 'StationAssignmentRule',
  docs: 'A rule to assign people to stations',
  genericParams: ['T'],
  args: [
    {
      name: 'groupFilter',
      type: 'Boolean(Group)',
      lazy: true,
      docs: 'The groups for which this should apply',
    },
    {
      name: 'mode',
      type: 'String',
      docs: 'The station assignment mode to use, either "ascending", "descending", or "arbitrary"',
    },
    {
      name: 'sortKey',
      type: '$T(Person)',
      lazy: true,
      defaultValue: 0,
      docs: 'If "mode" is either "ascending" or "descending", the sort key to use',
    },
  ],
  outputType: 'StationAssignmentRule',
  implementation: (groupFilter, mode, sortKey) => {
    return new assign.StationAssignmentRule(groupFilter, mode, sortKey)
  }
}

const GroupNumber = {
  name: 'GroupNumber',
  docs: 'The number of a group',
  args: [
    {
      name: 'group',
      type: 'Group',
      canBeExternal: true,
    }
  ],
  outputType: 'Number',
  implementation: (group) => group.activityCode.groupNumber
}

const Stage = {
  name: 'Stage',
  docs: 'The stage name for a group',
  args: [
    {
      name: 'group',
      type: 'Group',
      canBeExternal: true,
    }
  ],
  outputType: 'String',
  implementation: (group) => group.room.name.split(' ')[0]
}

const AssignedGroup = {
  name: 'AssignedGroup',
  docs: 'A person\'s assigned group for a round',
  args: [
    {
      name: 'round',
      type: 'Round',
    },
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true,
    }
  ],
  outputType: 'Group',
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
  docs: 'The full name of a group',
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
  docs: 'The start time of a group',
  args: [
    {
      name: 'group',
      type: 'Group',
    },
  ],
  outputType: 'DateTime',
  usesContext: true,
  implementation: (ctx, group) => {
    return lib.startTime(group, ctx.competition)
  }
}

const AssignmentAtTime = {
  name: 'AssignmentAtTime',
  docs: 'The assignment that a person has at a particular time',
  args: [
    {
      name: 'time',
      type: 'DateTime',
    },
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true,
    },
  ],
  outputType: 'Assignment',
  usesContext: true,
  implementation: (ctx, time, person) => {
    var assignments = person.assignments.map((assignment) => {
      return {
        assignment: assignment,
        group: lib.groupForActivityId(ctx.competition, assignment.activityId)
      }
    }).filter((assignment) => {
      return (time >= lib.startTime(assignment.group, ctx.competition) &&
              time < lib.endTime(assignment.group, ctx.competition))
    })
    return assignments.length == 0 ? null : assignments[0]
  }
}

const Code = {
  name: 'Code',
  docs: 'The AssignmentCode for an Assignment',
  args: [
    {
      name: 'assignment',
      type: 'Assignment',
    }
  ],
  outputType: 'String',
  implementation: (assignment) => assignment.assignment.assignmentCode,
}

const Group = {
  name: 'Group',
  docs: 'The Group for an Assignment',
  args: [
    {
      name: 'assignment',
      type: 'Assignment',
    }
  ],
  outputType: 'Group',
  implementation: (assignment) => assignment.group,
}

const Round = {
  name: 'Round',
  docs: 'The Round for a Group',
  args: [
    {
      name: 'group',
      type: 'Group',
    }
  ],
  outputType: 'Round',
  implementation: (group) => group.activityCode.group(null),
}

module.exports = {
  functions: [AssignGroups, AssignmentSet, ByMatchingValue, ByFilters, StationAssignmentRule,
              GroupNumber, Stage, AssignedGroup,
              Name, StartTime,
              AssignmentAtTime, Code, Group],
}
