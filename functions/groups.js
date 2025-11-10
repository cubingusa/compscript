const { DateTime } = require('luxon')

const events = require('./../events')
const activityCode = require('./../activity_code')
const assign = require('./../groups/assign')
const extension = require('./../extension')
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
    return assign.Assign(ctx.competition, round, assignmentSets, scorers, stationRules, attemptNumber, overwrite)
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
    {
      name: 'limit',
      type: 'Number',
      defaultValue: null,
      nullable: true,
      docs: 'If set, max number of matching people this can apply to.',
    },
  ],
  outputType: 'AssignmentScorer',
  implementation: (value, score, limit) => {
    return new scorers.ByMatchingValue(value, score, limit)
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

const RecentlyCompeted = {
  name: 'RecentlyCompeted',
  docs: 'Score a person\'s assignment based on how recently they competed',
  args: [
    {
      name: 'groupFilter',
      type: 'Boolean(Group)',
      lazy: true,
      docs: 'Which groups this applies to',
    },
    {
      name: 'otherGroupFilter',
      type: 'Boolean(Group)',
      lazy: true,
      docs: 'Which other groups should be considered',
    },
    {
      name: 'scoreFn',
      type: 'Number(Number)',
      lazy: true,
      docs: 'Scoring function based on the number of minutes since most recent group',
    },
  ],
  usesContext: true,
  outputType: 'AssignmentScorer',
  implementation: (ctx, groupFilter, otherGroupFilter, scoreFn) => {
    return new scorers.RecentlyCompeted(ctx.competition, groupFilter, otherGroupFilter, scoreFn)
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
  implementation: (group) => {
    var ext = extension.getExtension(group.wcif, 'Group')
    if (ext !== null && ext.stageId !== undefined) {
      var room = group.room
      var roomExt = extension.getExtension(room, 'Room')
      if (roomExt !== null) {
        var stage = (roomExt.stages || []).find((stage) => stage.id == ext.stageId)
        if (stage !== undefined) {
          return stage.name
        }
      }
    }
    return group.room.name
  }
}

const Room = {
  name: 'Room',
  docs: 'The room name for a group',
  args: [
    {
      name: 'group',
      type: 'Group',
      canBeExternal: true,
    }
  ],
  outputType: 'String',
  implementation: (group) => group.room.name
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
  implementation: (group) => group.fullName()
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

const RoundStartTime = {
  name: 'RoundStartTime',
  docs: 'The start time of the first group of a round.',
  args: [
    {
      name: 'round',
      type: 'Round',
      canBeExternal: true,
    },
  ],
  outputType: 'DateTime',
  usesContext: true,
  implementation: (ctx, round) => {
    let min = Math.min(
      ...lib.allActivitiesForRoundId(ctx.competition, round.id())
            .map(round => lib.startTime(round, ctx.competition).ts)
    )
    return min ? DateTime.fromMillis(min).setZone(ctx.competition.schedule.venues[0].timezone) : null
  }
}

const RoundEndTime = {
  name: 'RoundEndTime',
  docs: 'The end time of the last group of a round.',
  args: [
    {
      name: 'round',
      type: 'Round',
      canBeExternal: true,
    },
  ],
  outputType: 'DateTime',
  usesContext: true,
  implementation: (ctx, round) => {
    let max = Math.max(
      ...lib.allActivitiesForRoundId(ctx.competition, round.id())
            .map(round => lib.endTime(round, ctx.competition).ts)
    )
    return max ? DateTime.fromMillis(max).setZone(ctx.competition.schedule.venues[0].timezone) : null
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

const Overlaps = {
  name: 'Overlaps',
  docs: 'Whether a group overlaps a window of time',
  args: [
    {
      name: 'group',
      type: 'Group',
      canBeExternal: true,
    },
    {
      name: 'startTime',
      type: 'DateTime',
    },
    {
      name: 'endTime',
      type: 'DateTime',
    },
  ],
  outputType: 'Boolean',
  usesContext: true,
  implementation: (ctx, group, startTime, endTime) => {
    var groupStart = lib.startTime(group, ctx.competition)
    var groupEnd = lib.endTime(group, ctx.competition)
    return groupStart <= endTime && groupEnd >= startTime
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

const AllGroups = {
  name: 'AllGroups',
  docs: 'All groups',
  args: [],
  outputType: 'Array<Group>',
  usesContext: true,
  implementation: (ctx, round) => lib.allGroups(ctx.competition),
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

const CreateGroups = function(activityCodeType) {
  return {
    name: 'CreateGroups',
    docs: 'Inserts groups into the schedule.',
    args: [
      {
        name: 'activityCode',
        type: activityCodeType,
      },
      {
        name: 'count',
        type: 'Number',
      },
      {
        name: 'roomOrStage',
        type: 'String',
        canBeExternal: true,
      },
      {
        name: 'start',
        type: 'DateTime',
      },
      {
        name: 'end',
        type: 'DateTime',
      },
      {
        name: 'skipGroups',
        type: 'Array<Number>',
        defaultValue: [],
      },
      {
        name: 'useStageName',
        type: 'Boolean',
        defaultValue: true,
      },
      {
        name: 'createParentIfNotPresent',
        type: 'Boolean',
        defaultValue: true,
      },
      {
        name: 'extraMinutesByGroup',
        type: 'Array<Tuple<Number, Number>>',
        defaultValue: [],
      },
    ],
    outputType: 'Array<String>',
    usesContext: true,
    mutations: ['schedule'],
    implementation: (ctx, activityCode, count, roomOrStage, start, end, skipGroups, useStageName, createParentIfNotPresent, extraMinutesByGroup) => {
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
      var room = venue.rooms.find((room) => room.name === roomOrStage)
      var stage = null
      if (room === undefined) {
        room = venue.rooms.find((room) => {
          var ext = extension.getExtension(room, 'Room')
          if (ext === null) {
            return false
          }
          var stage = (ext.stages || []).find((stage) => stage.name == roomOrStage)
          return stage !== undefined
        })
        if (room === undefined) {
          return ['Could not find room named ' + roomOrStage]
        }
        var ext = extension.getExtension(room, 'Room')
        stage = (ext.stages || []).find((stage) => stage.name == roomOrStage)
      }
      var matchingActivities = room.activities.filter((activity) => {
        return activity.activityCode === activityCode.id() &&
          end >= DateTime.fromISO(activity.startTime).setZone(ctx.competition.schedule.venues[0].timezone) &&
          start <= DateTime.fromISO(activity.endTime).setZone(ctx.competition.schedule.venues[0].timezone)
      })
      var out = []
      var activity = null
      if (matchingActivities.length === 0) {
        if (!createParentIfNotPresent) {
          return ['Could not find matching activity on schedule.']
        }
        activity = {
          id: ++maxActivityId,
          activityCode: activityCode.id(),
          childActivities: [],
          scrambleSetId: null,
          extensions: [],
          startTime: start.toISO(),
          endTime: end.toISO(),
          name: activityCode.toString()
        }
        room.activities.push(activity)
        out.push('Added activity ' + activity.name)
      } else {
        activity = matchingActivities[0]
      }
      var firstStartTime = null;
      var lastEndTime = null;
      var reservedTime = extraMinutesByGroup.reduce((accumulator, val) => accumulator += val[1], 0)
      var length = (end.diff(start, 'minutes').as('minutes') - reservedTime) / count
      var currentStart = start;
      for (var i = 0; i < count; i++) {
        if (skipGroups.includes(i + 1)) {
          continue
        }
        var groupPrefix
        var ext = extension.getExtension(room, 'Room')
        if (!useStageName) {
          groupPrefix = 'Group'
        } else if (stage !== null && stage.groupNamePrefix !== undefined) {
          groupPrefix = stage.groupNamePrefix
        } else if (stage !== null) {
          groupPrefix = stage.name.split(' ')[0]
        } else if (ext !== null && ext.groupNamePrefix !== undefined) {
          groupPrefix = ext.groupNamePrefix
        } else {
          groupPrefix = room.name.split(' ')[0]
        }
        var groupName = activityCode.toString() + ' ' + groupPrefix + ' ' + (i + 1)
        var nextStart = currentStart.plus({ minutes: length });
        var maybeExtra = extraMinutesByGroup.find((val) => val[0] == (i + 1))
        if (maybeExtra !== undefined) {
          nextStart = nextStart.plus({ minutes: maybeExtra[1] });
        }
        var next = {
          id: ++maxActivityId,
          activityCode: activityCode.group(i + 1).id(),
          childActivities: [],
          scrambleSetId: null,
          extensions: [],
          startTime: currentStart.toISO(),
          endTime: nextStart.toISO(),
          name: groupName
        }
        if (stage !== null) {
          var ext = extension.getOrInsertExtension(next, 'Group')
          ext.stageId = stage.id
        }
        activity.childActivities.push(next)
        currentStart = nextStart
        out.push('Added group ' + groupName + ' from ' + next.startTime + ' to ' + next.endTime)
        if (next.startTime > next.endTime) {
          out.push('Error! Start time before end time.')
        }
        if (firstStartTime === null || next.startTime < firstStartTime) {
          firstStartTime = next.startTime
        }
        lastEndTime = nextStart.toISO()
      }
      if (firstStartTime < activity.startTime) {
        activity.startTime = firstStartTime
      }
      if (lastEndTime > activity.endTime) {
        activity.endTime = lastEndTime
      }
      return out
    }
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
      name: 'roomOrStage',
      type: 'String',
    },
    {
      name: 'number',
      type: 'Number',
    },
    {
      name: 'assignmentCode',
      type: 'String',
      defaultValue: 'competitor',
    }
  ],
  usesContext: true,
  outputType: 'String',
  mutations: ['persons'],
  implementation: (ctx, persons, round, roomOrStage, number, assignmentCode) => {
    var groupsForRound = lib.groupsForRoundCode(ctx.competition, round)
    var groups = groupsForRound.filter((group) => {
      return group.room.name === roomOrStage && group.activityCode.groupNumber === number
    })
    if (groups.length === 0) {
      groups = groupsForRound.filter((group) => {
        var ext = extension.getExtension(group.wcif, 'Group')
        if (ext === null) {
          return false
        }
        if (ext !== null && ext.stageId !== undefined) {
          var room = group.room
          var roomExt = extension.getExtension(room, 'Room')
          if (roomExt !== null) {
            var stage = (roomExt.stages || []).find((stage) => stage.id == ext.stageId)
            if (stage.name == roomOrStage && group.activityCode.groupNumber === number) {
              return true
            }
          }
        }
      })
      if (groups.length === 0) {
        return 'No matching groups found'
      }
    }
    persons.forEach((person) => {
      if (assignmentCode == "competitor") {
        person.assignments = person.assignments.filter((assignment) => {
          return !groupsForRound.map((group) => group.wcif.id).includes(assignment.activityId)
        })
      }
      person.assignments.push({
        activityId: groups[0].wcif.id,
        stationNumber: null,
        assignmentCode: assignmentCode,
      })
    })
    return 'Assigned ' + persons.length + ' people.'
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
  functions: [AssignGroups, AssignmentSet, ByMatchingValue, ByFilters, RecentlyCompeted, StationAssignmentRule,
              GroupNumber, Stage, Room, AssignedGroup, AssignedGroups,
              GroupName, StartTime, EndTime, Date,
              RoundStartTime, RoundEndTime, Overlaps,
              AssignmentAtTime, Code, Group, GroupForActivityId, Round, Event, Groups, AllGroups,
              CreateGroups('Round'), CreateGroups('Attempt'), ManuallyAssign,
              CheckForMissingGroups],
}
