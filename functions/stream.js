const fs = require('fs')

const { DateTime } = require('luxon')

const activityCode = require('./../activity_code')
const extension = require('./../extension')
const group = require('./../group')

const DeleteFeaturedCompetitorsByTime = {
  name: 'DeleteFeaturedCompetitorsByTime',
  args: [
    {
      name: 'startTime',
      type: 'DateTime',
    },
    {
      name: 'endTime',
      type: 'DateTime',
    },
  ],
  outputType: 'Array<String>',
  mutations: ['schedule'],
  usesContext: true,
  implementation: (ctx, startTime, endTime) => {
    const out = [];
    ctx.competition.schedule.venues[0].rooms.forEach((room) => {
      room.activities.forEach((activity) => {
        activity.childActivities.forEach((childActivity) => {
          var g = new group.Group(childActivity, room, ctx.competition)
          if (g.startTime > startTime && g.endTime < endTime) {
            ext = extension.getExtension(childActivity, 'ActivityConfig', 'groupifier')
            if (ext && ext.featuredCompetitorWcaUserIds.length) {
              ext.featuredCompetitorWcaUserIds = [];
              out.push("Removed ids from activity " + g.activityCode + " " + g.name())
            }
          }
        })
      })
    })
    return out;
  }
}

const AddFeaturedCompetitors = {
  name: 'AddFeaturedCompetitors',
  args: [
    {
      name: 'round',
      type: 'Round',
    },
    {
      name: 'persons',
      type: 'Array<Person>',
    },
  ],
  outputType: 'Array<String>',
  mutations: ['schedule'],
  usesContext: true,
  implementation: (ctx, round, persons) => {
    const out = [];
    ctx.competition.schedule.venues[0].rooms.forEach((room) => {
      room.activities.forEach((activity) => {
        activity.childActivities.forEach((childActivity) => {
          const code = activityCode.parse(childActivity.activityCode)
          if (round.contains(code)) {
            ext = extension.getExtension(childActivity, 'ActivityConfig', 'groupifier')
            if (ext.featuredCompetitorWcaUserIds === undefined) {
              ext.featuredCompetitorWcaUserIds = []
            }
            persons.forEach((person) => {
              if (person.assignments.some((a) => a.activityId == childActivity.id && a.assignmentCode == "competitor")) {
                ext.featuredCompetitorWcaUserIds.push(person.wcaUserId)
                out.push("Added featured " + person.name + " to " + code.toString())
              }
            })
          }
        })
      })
    })
    return out
  }
}

const DeleteFeaturedCompetitors = {
  name: 'DeleteFeaturedCompetitors',
  args: [
    {
      name: 'persons',
      type: 'Array<Person>',
    },
  ],
  outputType: 'Array<String>',
  mutations: ['schedule'],
  usesContext: true,
  implementation: (ctx, persons) => {
    const out = [];
    ctx.competition.schedule.venues[0].rooms.forEach((room) => {
      room.activities.forEach((activity) => {
        activity.childActivities.forEach((childActivity) => {
          ext = extension.getExtension(childActivity, 'ActivityConfig', 'groupifier')
          if (ext && ext.featuredCompetitorWcaUserIds !== undefined) {
            const len = ext.featuredCompetitorWcaUserIds.length
            ext.featuredCompetitorWcaUserIds = ext.featuredCompetitorWcaUserIds.filter((x) => !persons.map((p) => p.wcaUserId).includes(x))
            if (len > ext.featuredCompetitorWcaUserIds.length) {
              out.push("Removed " + (len - ext.featuredCompetitorWcaUserIds.length) + " competitors from " + childActivity.name)
            }
          }
        })
      })
    })
    return out
  }
}

module.exports = {
  functions: [DeleteFeaturedCompetitorsByTime, AddFeaturedCompetitors, DeleteFeaturedCompetitors],
}
