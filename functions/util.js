const fs = require('fs')

const auth = require('./../auth')
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
      default: 'org.cubingusa.natshelper.v1',
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

module.exports = {
  functions: [Type, ClearCache, SetExtension, RenameAssignments, AssignmentsBeforeCompeting],
}
