const fs = require('fs')

const { DateTime } = require('luxon')

const activityCode = require('./../activity_code')
const auth = require('./../auth')
const events = require('./../events')
const extension = require('./../extension')
const lib = require('./../lib')

const Type = {
  name: 'Type',
  genericParams: ['T'],
  args: [
    {
      name: 'arg',
      type: '$T',
    },
  ],
  outputType: 'String',
  usesGenericTypes: true,
  implementation: (generics, arg) => generics.T
}

const IsNull = {
  name: 'IsNull',
  genericParams: ['T'],
  args: [
    {
      name: 'arg',
      type: '$T',
      nullable: true,
    }
  ],
  outputType: 'Boolean',
  implementation: (arg) => arg == null,
}

const Arg = {
  name: 'Arg',
  docs: 'A function to capture arguments that are passed in, for example in a user-defined function or Map().',
  genericParams: ['T'],
  args: [
    {
      name: 'arg',
      type: '$T',
      canBeExternal: true,
    },
  ],
  outputType: '$T',
  implementation: (arg) => arg
}

const ToString = {
  name: 'ToString',
  genericParams: ['T'],
  args: [
    {
      name: 'arg',
      type: '$T',
    },
  ],
  outputType: 'String',
  implementation: (arg) => arg.toString(),
}

const ToString_Date = {
  name: 'ToString',
  args: [
    {
      name: 'arg',
      type: 'Date',
    },
  ],
  outputType: 'String',
  implementation: (arg) => arg.toLocaleString(DateTime.DATE_SHORT),
}

const ClearCache = {
  name: 'ClearCache',
  args: [],
  outputType: 'String',
  usesContext: true,
  implementation: (ctx) => {
    fs.unlinkSync(auth.cachePath(ctx.competition.id))
    return 'cache cleared'
  }
}

const SetExtension = {
  name: 'SetExtension',
  docs: 'Sets a property in a competition-level extension.',
  genericParams: ['T'],
  args: [
    {
      name: 'property',
      type: 'String',
    },
    {
      name: 'value',
      type: '$T',
    },
    {
      name: 'type',
      type: 'String',
    },
    {
      name: 'namespace',
      type: 'String',
      defaultValue: 'org.cubingusa.natshelper.v1',
    }
  ],
  outputType: 'String',
  usesContext: true,
  mutations: ['extensions'],
  implementation: (ctx, property, value, type, namespace) => {
    var ext = extension.getOrInsertExtension(ctx.competition, type, namespace)
    ext[property] = value
    return 'Set ' + property + ' to ' + value
  }
}

const SetGroupExtension = {
  name: 'SetGroupExtension',
  docs: 'Sets a property in a group extension.',
  genericParams: ['T'],
  args: [
    {
      name: 'property',
      type: 'String',
    },
    {
      name: 'value',
      type: '$T',
    },
    {
      name: 'type',
      type: 'String',
    },
    {
      name: 'group',
      type: 'Group',
      canBeExternal: true,
    },
    {
      name: 'namespace',
      type: 'String',
      defaultValue: 'org.cubingusa.natshelper.v1',
    }
  ],
  outputType: 'String',
  usesContext: true,
  mutations: ['schedule'],
  implementation: (ctx, property, value, type, group, namespace) => {
    var ext = extension.getOrInsertExtension(group.wcif, type, namespace)
    ext[property] = value
    return 'Set ' + property + ' to ' + value
  }
}

const RenameAssignments = {
  name: 'RenameAssignments',
  args: [],
  outputType: 'String',
  usesContext: true,
  mutations: ['persons'],
  implementation: (ctx) => {
    affected = 0
    ctx.competition.persons.forEach((person) => {
      person.assignments.forEach((assignment) => {
        if (assignment.assignmentCode === 'staff-announcer') {
          affected += 1
          assignment.assignmentCode = 'staff-Delegate'
        }
      })
    })
    return 'Updated ' + affected + ' assignments'
  }
}

const SwapAssignments = {
  name: 'SwapAssignments',
  args: [
    {
      name: 'person1',
      type: 'Person',
    },
    {
      name: 'person2',
      type: 'Person',
    },
    {
      name: 'groups',
      type: 'Array<Group>',
    }
  ],
  mutations: ['persons'],
  outputType: 'String',
  implementation: (person1, person2, groups) => {
    var groupIds = groups.map((group) => group.wcif.id)
    var p1keep = person1.assignments.filter((assignment) => !groupIds.includes(assignment.activityId))
    var p1drop = person1.assignments.filter((assignment) => groupIds.includes(assignment.activityId))
    var p2keep = person2.assignments.filter((assignment) => !groupIds.includes(assignment.activityId))
    var p2drop = person2.assignments.filter((assignment) => groupIds.includes(assignment.activityId))

    person1.assignments = p1keep.concat(p2drop)
    person2.assignments = p2keep.concat(p1drop)

    console.log(person1.name + ' new assignments: ' + person1.assignments.map((a) => a.activityId))
    console.log(person2.name + ' new assignments: ' + person2.assignments.map((a) => a.activityId))
    console.log(person1.name + ' swapped assignments: ' + p1drop.map((a) => a.activityId))
    console.log(person2.name + ' swapped assignments: ' + p2drop.map((a) => a.activityId))

    return 'Swapped ' + person1.name + ' ' + p1drop.length + ' assignments with ' + person2.name + ' ' + p2drop.length + ' assignments'
  }
}

const DeleteAssignments = {
  name: 'DeleteAssignments',
  args: [
    {
      name: 'person',
      type: 'Person',
    },
    {
      name: 'groups',
      type: 'Array<Group>',
    },
  ],
  mutations: ['persons'],
  outputType: 'String',
  implementation: (person, groups) => {
    var groupIds = groups.map((group) => group.wcif.id)
    var oldLength = person.assignments.length
    person.assignments = person.assignments.filter((assignment) => !groupIds.includes(assignment.activityId))
    return 'Deleted ' + (oldLength - person.assignments.length) + ' assignments'
  }
}

const AssignmentsBeforeCompeting = {
  name: 'AssignmentsBeforeCompeting',
  args: [
    {
      name: 'persons',
      type: 'Array<Person>',
    }
  ],
  outputType: 'Array<String>',
  usesContext: true,
  implementation: (ctx, persons) => {
    var groups = lib.allGroups(ctx.competition)
    var groupsById = Object.fromEntries(groups.map((group) => [group.wcif.id, group]))
    var yes = {}
    var no = {}
    persons.forEach((person) => {
      var assignmentEndTimes =
        person.assignments.filter((assignment) => assignment.assignmentCode !== 'competitor')
            .map((assignment) => groupsById[assignment.activityId])
            .filter((group) => group !== undefined)
            .map((group) => +group.endTime)
      person.assignments.filter((assignment) => assignment.assignmentCode === 'competitor')
          .map((assignment) => groupsById[assignment.activityId])
          .filter((group) => group !== undefined)
          .forEach((group) => {
            var key = group.activityCode.group(null).id()
            if (yes[key] === undefined) {
              yes[key] = 0
              no[key] = 0
            }
            if (assignmentEndTimes.includes(+group.startTime)) {
              yes[key] += 1
            } else {
              no[key] += 1
            }
          })
    })
    var total = 0
    var totalDenom = 0
    var out = Object.entries(yes).map((e) => {
      total += e[1]
      totalDenom += e[1] + no[e[0]]
      return e[0] + ': ' + e[1] + ' / ' + (e[1] + no[e[0]])
    })
    out.push('total: ' + total + ' / ' + totalDenom)
    return out
  }
}

const CreateAssignments = {
  name: 'CreateAssignments',
  args: [
    {
      name: 'persons',
      type: 'Array<Person>',
    },
    {
      name: 'activityId',
      type: 'Number',
    },
    {
      name: 'assignmentCode',
      type: 'String',
    },
  ],
  outputType: 'String',
  mutations: ['persons'],
  implementation: (persons, activityId, assignmentCode) => {
    persons.forEach((person) => {
      person.assignments.push({
        activityId: activityId,
        assignmentCode: assignmentCode,
      })
    })
    return 'ok'
  }
}

const CreateCompetitionGroupsAssignments = {
  name: 'CreateCompetitionGroupsAssignments',
  docs: 'Create an assignment using CompetitionGroups\' extension.',
  args: [
    {
      name: 'persons',
      type: 'Array<Person>',
    },
    {
      name: 'jobName',
      type: 'String',
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
  outputType: 'String',
  mutations: ['persons'],
  implementation: (persons, jobName, startTime, endTime) => {
    persons.forEach((person) => {
      ext = extension.getOrInsertExtension(person, 'worldsassignments', namespace='com.competitiongroups')
      if (ext.assignments === undefined) {
        ext.assignments = []
      }
      ext.assignments.push({
        staff: jobName,
        startTime: startTime.toISO(),
        endTime: endTime.toISO(),
      })
    })
    return 'ok'
  }
}

const ClearCompetitionGroupsAssignments = {
  name: 'ClearCompetitionGroupsAssignments',
  docs: 'Delete all assignments using CompetitionGroups\' extension.',
  args: [
    {
      name: 'persons',
      type: 'Array<Person>',
    },
  ],
  outputType: 'String',
  mutations: ['persons'],
  implementation: (persons) => {
    persons.forEach((person) => {
      ext = extension.getOrInsertExtension(person, 'worldsassignments', namespace='com.competitiongroups')
      ext.assignments = []
    })
    return 'ok'
  }
}

const AssignmentReport = {
  name: 'AssignmentReport',
  args: [
    {
      name: 'persons',
      type: 'Array<Person>',
    },
    {
      name: 'groups',
      type: 'Array<Group>',
    },
    {
      name: 'label',
      type: 'String',
    }
  ],
  outputType: 'Multi',
  usesContext: true,
  implementation: (ctx, persons, groups, label) => {
    var allGroupsKeyed = Object.fromEntries(lib.allGroups(ctx.competition).map((group) => [group.wcif.id, group]))
    var groupsByRound = {}
    for (const group of groups) {
      var round = group.activityCode.group(null).id()
      if (groupsByRound[round] === undefined) {
        groupsByRound[round] = Array()
      }
      groupsByRound[round].push(group)
    }
    var roundsSorted = Object.keys(groupsByRound).sort((roundA, roundB) => {
      var timeA = groupsByRound[roundA][0].startTime;
      var timeB = groupsByRound[roundB][0].startTime;
      return timeA - timeB;
    })
    var maxGroupCount = 0;
    for (const [round, groups] of Object.entries(groupsByRound)) {
      if (groups.length > maxGroupCount) {
        maxGroupCount = groups.length;
      }
    }
    return persons.map((person) => {
      var out = roundsSorted.map((round) => {
        return [
          {value: events.idToName[activityCode.parse(round).eventId]},
          {value: groupsByRound[round][0].startTime.toLocaleString(DateTime.TIME_SIMPLE)}
        ].concat(
            [...Array(maxGroupCount).keys()].map((groupNumber) => {
              if (groupNumber >= groupsByRound[round].length) {
                return {value: null}
              }
              var group = groupsByRound[round][groupNumber]
              for (const assignment of person.assignments) {
                var assignmentGroup = allGroupsKeyed[assignment.activityId]
                if (!!assignmentGroup && assignmentGroup.startTime <= group.startTime && assignmentGroup.endTime > group.startTime) {
                  var assignmentCode = assignment.assignmentCode.replace("staff-", "")
                  var code = assignmentCode.toUpperCase()[0] + " " + assignmentGroup.room.name[0]
                  if (assignment.stationNumber > 0) {
                    return {value: code + assignment.stationNumber}
                  } else {
                    return {value: code}
                  }
                }
              }
              return {value: '-'}
            }))
      })
      return [
        {
          type: 'NoPageBreak',
          data: [
            {
              type: 'Header',
              data: person.name + ' ' + label
            },
            {
              type: 'Table',
              data: {
                headers: ['Event', 'Time'].concat([...Array(maxGroupCount).keys()].map((x) => (x+1))),
                rows: out,
              }
            },
          ]
        }
      ]
    }).flat()
  }
}

module.exports = {
  functions: [Type, IsNull, Arg, ClearCache, SetExtension, SetGroupExtension, RenameAssignments, AssignmentsBeforeCompeting, CreateAssignments, CreateCompetitionGroupsAssignments, ClearCompetitionGroupsAssignments, AssignmentReport, ToString, ToString_Date, SwapAssignments, DeleteAssignments],
}
