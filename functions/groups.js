const { DateTime } = require('luxon')

const events = require('./../events')
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
    // TODO: clear this after nationals
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
      docs: 'The score to assign if the person and group satisfy the filter',
    },
  ],
  outputType: 'AssignmentScorer',
  implementation: (personFilter, groupFilter, score) => {
    return new scorers.ByFilters(personFilter, groupFilter, score)
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
      canBeExternal: true,
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

const AssignedGroups = {
  name: 'AssignedGroups',
  docs: 'All of a person\'s assigned groups',
  args: [
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true,
    }
  ],
  outputType: 'Array<Group>',
  usesContext: true,
  implementation: (ctx, person) => {
    var activityIds = person.assignments
        .filter((assignment) => assignment.assignmentCode === "competitor" )
        .map((assignment) => assignment.activityId)
    return lib.allGroups(ctx.competition).filter((group) => activityIds.includes(group.wcif.id))
  }
}

const GroupName = {
  name: 'GroupName',
  docs: 'The full name of a group',
  args: [
    {
      name: 'group',
      type: 'Group',
      canBeExternal: true,
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
      canBeExternal: true,
    },
  ],
  outputType: 'DateTime',
  usesContext: true,
  implementation: (ctx, group) => {
    return lib.startTime(group, ctx.competition)
  }
}

const EndTime = {
  name: 'EndTime',
  docs: 'The end time of a group',
  args: [
    {
      name: 'group',
      type: 'Group',
      canBeExternal: true,
    },
  ],
  outputType: 'DateTime',
  usesContext: true,
  implementation: (ctx, group) => {
    return lib.endTime(group, ctx.competition)
  }
}

const Date = {
  name: 'Date',
  docs: 'The date of a group',
  args: [
    {
      name: 'group',
      type: 'Group',
      canBeExternal: true,
    },
  ],
  outputType: 'Date',
  usesContext: true,
  implementation: (ctx, group) => {
    return dateTime = lib.startTime(group, ctx.competition).set({
      hour: 0,
      minute: 0,
      second: 0
    })
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
      return (assignment.group !== null &&
              time >= lib.startTime(assignment.group, ctx.competition) &&
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
      canBeExternal: true,
    }
  ],
  outputType: 'Round',
  implementation: (group) => group.activityCode.group(null),
}

const Event = {
  name: 'Event',
  docs: 'The Event for a Group',
  args: [
    {
      name: 'group',
      type: 'Group',
      canBeExternal: true,
    }
  ],
  outputType: 'Event',
  implementation: (group) => group.activityCode.group(null).round(null),
}

const Groups = {
  name: 'Groups',
  docs: 'All groups in a round',
  args: [
    {
      name: 'round',
      type: 'Round',
      canBeExternal: true,
    }
  ],
  outputType: 'Array<Group>',
  usesContext: true,
  implementation: (ctx, round) => lib.groupsForRoundCode(ctx.competition, round),
}

const GroupForActivityId = {
  name: 'GroupForActivityId',
  docs: 'Returns the group with the specified id',
  args: [
    {
      name: 'id',
      type: 'Number',
    }
  ],
  outputType: 'Group',
  usesContext: true,
  implementation: (ctx, id) => lib.groupForActivityId(ctx.competition, id),
}

const CreateGroup = {
  name: 'CreateGroup',
  docs: 'Inserts a group into the schudle.',
  args: [
    {
      name: 'round',
      type: 'Round',
    },
    {
      name: 'number',
      type: 'Number',
    },
    {
      name: 'stage',
      type: 'String',
    },
    {
      name: 'start',
      type: 'DateTime',
    },
    {
      name: 'end',
      type: 'DateTime',
    }
  ],
  outputType: 'String',
  usesContext: true,
  mutations: ['schedule'],
  implementation: (ctx, round, number, stage, start, end) => {
    var maxActivityId = 0
    ctx.competition.schedule.venues.forEach((venue) => {
      venue.rooms.forEach((room) => {
        room.activities.forEach((activity) => {
          maxActivityId = Math.max(maxActivityId, activity.id)
          activity.childActivities.forEach((childActivity) => {
            maxActivityId = Math.max(maxActivityId, childActivity.id)
            // Theoretically this could have more child activities, but in practice it won't.
          })
        })
      })
    })

    var venue = ctx.competition.schedule.venues[0]
    var matchingRooms = venue.rooms.filter((room) => room.name === stage)
    if (matchingRooms.length === 0) {
      return 'Stage ' + stage + ' not found.'
    }
    var matchingActivities = matchingRooms[0].activities.filter((activity) => {
      return activity.activityCode === round.id() &&
        start >= DateTime.fromISO(activity.startTime).setZone(ctx.competition.schedule.venues[0].timezone) &&
        end <= DateTime.fromISO(activity.endTime).setZone(ctx.competition.schedule.venues[0].timezone)
    })
    var activity = null
    if (matchingActivities.length === 0) {
      activity = {
        id: ++maxActivityId,
        activityCode: round.id(),
        childActivities: [],
        scrambleSetId: null,
        extensions: [],
        startTime: start.toISO(),
        endTime: end.toISO(),
        name: round.id()
      }
      matchingRooms[0].activities.push(activity)
    } else {
      activity = matchingActivities[0]
    }
    activity.childActivities.push({
      id: ++maxActivityId,
      activityCode: round.group(number).id(),
      childActivities: [],
      scrambleSetId: null,
      extensions: [],
      startTime: start.toISO(),
      endTime: end.toISO(),
      name: stage.split(' ')[0] + ' ' + number
    })
    return 'Successfully added group.'
  }
}

const ManuallyAssign = {
  name: 'ManuallyAssign',
  docs: 'Manually assign the provided competitors to the provided groups.',
  args: [
    {
      name: 'persons',
      type: 'Array<Person>',
    },
    {
      name: 'round',
      type: 'Round',
    },
    {
      name: 'stage',
      type: 'String',
    },
    {
      name: 'number',
      type: 'Number',
    }
  ],
  usesContext: true,
  outputType: 'String',
  mutations: ['persons'],
  implementation: (ctx, persons, round, stage, number) => {
    var groupsForRound = lib.groupsForRoundCode(ctx.competition, round)
    var groups = groupsForRound.filter((group) => {
      return group.room.name === stage && group.activityCode.groupNumber === number
    })
    if (groups.length === 0) {
      return 'No matching groups found'
    }
    persons.forEach((person) => {
      person.assignments = person.assignments.filter((assignment) => {
        return assignment.assignmentCode !== 'competitor' ||
          !groupsForRound.map((group) => group.wcif.id).includes(assignment.activityId)
      })
      person.assignments.push({
        activityId: groups[0].wcif.id,
        assignmentCode: 'competitor',
      })
    })
    return 'Assigned ' + persons.length + ' people.'
  }
}

const FixGroupNames = {
  name: 'FixGroupNames',
  args: [],
  outputType: 'Array<String>',
  usesContext: true,
  mutations: ['schedule'],
  implementation: (ctx) => {
    return lib.allGroups(ctx.competition).map((group) => {
      const activityCodeObj = activityCode.parse(group.wcif.activityCode)
      group.wcif.name = events.idToName[activityCodeObj.eventId] + ' Round ' + activityCodeObj.roundNumber + ' ' + group.room.name.split(' ')[0] + ' ' + activityCodeObj.groupNumber
      return group.wcif.name
    })
  }
}

const FixGroupNumbers = {
  name: 'FixGroupNumbers',
  args: [],
  outputType: 'Array<String>',
  usesContext: true,
  mutations: ['schedule'],
  implementation: (ctx) => {
    return lib.allGroups(ctx.competition).map((group) => {
      const activityCodeObj = activityCode.parse(group.wcif.activityCode)
      if (activityCodeObj.groupNumber === 0) {
        group.wcif.activityCode = activityCodeObj.group(20).id()
        group.wcif.name = events.idToName[activityCodeObj.eventId] + ' Round ' + activityCodeObj.roundNumber + ' ' + group.room.name.split(' ')[0] + ' ' + 20
        return group.wcif.name
      } else {
        return null
      }
    })
  }
}

const CheckForMissingGroups = {
  name: 'CheckForMissingGroups',
  args: [],
  outputType: 'Array<String>',
  usesContext: true,
  implementation: (ctx) => {
    issues = [];
    var groupsById = Object.fromEntries(lib.allGroups(ctx.competition).map((g) => [g.wcif.id, g]))
    var assignedPersonsByRound = {}
    ctx.competition.persons.forEach((p) => {
      p.assignments.forEach((a) => {
        var round = groupsById[a.activityId].activityCode.group(null).id()
        if (assignedPersonsByRound[round] === undefined) {
          assignedPersonsByRound[round] = []
        }
        assignedPersonsByRound[round].push(p.registrantId)
      })
    })
    ctx.competition.events.forEach((e) => {
      e.rounds.forEach((r) => {
        var assigned = assignedPersonsByRound[r.id]
        if (r.results.length > 0 && assigned === undefined) {
          issues.push("No groups for " + r.id)
          return
        }
        r.results.forEach((res) => {
          if (!assigned.includes(res.personId)) {
            issues.push("Missing groups for " + res.personId + " in round " + r.id)
          }
        })
      })
    })
    if (issues.length === 0) {
      return ["ok"]
    }
    return issues
  }
}

module.exports = {
  functions: [AssignGroups, AssignmentSet, ByMatchingValue, ByFilters, StationAssignmentRule,
              GroupNumber, Stage, AssignedGroup, AssignedGroups,
              GroupName, StartTime, EndTime, Date,
              AssignmentAtTime, Code, Group, GroupForActivityId, Round, Event, Groups,
              CreateGroup, ManuallyAssign, FixGroupNames, CheckForMissingGroups, FixGroupNumbers],
}
