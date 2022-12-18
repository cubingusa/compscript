const express = require('express')
const { DateTime } = require('luxon')

const auth = require('./auth')
const activityCode = require('./activity_code')
const extension = require('./extension')
const pugFunctions = require('./pug_functions')
const driver = require('./parser/driver')
const parser = require('./parser/parser')

var router = express.Router()

compData = function(req) {
  var competition = req.competition
  var out = {
    competition: competition,
    sortedSchedule: [],
    rooms: {},  // ID -> room
    events: {},  // ID -> event
    persons: {},  // ID -> person
    peoplePerRound: {},  // activity code (e.g. 333-r1) -> num people
    savedViews: extension.getExtension(competition, 'Competition').savedViews,
    error: null,
    statusMessage: null,
  }
  if (req.session.error) {
    out.error = req.session.error
    req.session.error = null
  }
  if (req.session.statusMessage) {
    out.statusMessage = req.session.statusMessage
    req.session.statusMessage = null
  }

  competition.events.forEach((evt) => {
    out.events[evt.id] = evt
    for (var i = 0; i < evt.rounds.length - 1; i++) {
      var round = evt.rounds[i]
      if (round.advancementCondition && round.advancementCondition.type == 'ranking') {
        out.peoplePerRound[new activityCode.ActivityCode(evt.id, i + 2, null, null).id()] =
            round.advancementCondition.level
      }
    }
  })
  competition.persons.forEach((person) => {
    // TODO: limit to accepted registrations.
    if (person.registration) {
      person.registration.eventIds.forEach((eventId) => {
        var code = new activityCode.ActivityCode(eventId, 1, null, null).id()
        if (!out.peoplePerRound[code]) {
          out.peoplePerRound[code] = 0
        }
        out.peoplePerRound[code]++
      })
    }
    out.persons[person.wcaUserId] = person
  })

  var activities = []  // Array of {code -> {activities: [activities]}}, one per day

  var startDate = DateTime.fromISO(competition.schedule.startDate)
  for (var i = 0; i < competition.schedule.numberOfDays; i++) {
    activities.push({day: startDate.plus({days: i}), activities: new Map()})
  }

  competition.schedule.venues.forEach((venue) => {
    venue.rooms.forEach((room) => {
      out.rooms[room.id] = room
      room.activities.forEach((activity) => {
        activity.startTime = DateTime.fromISO(activity.startTime).setZone(venue.timezone)
        activity.endTime = DateTime.fromISO(activity.endTime).setZone(venue.timezone)
        var day = Math.floor(activity.startTime.diff(startDate, 'days').as('days'))
        if (!activities[day].activities.has(activity.activityCode)) {
          activities[day].activities.set(activity.activityCode, {activities: new Map()})
        }
        activities[day].activities.get(activity.activityCode).activities.set(room.id, activity)
      })
    })
  })
  activities.forEach((dayActivities) => {
    var dayActivityList = Array.from(dayActivities.activities.entries())
    dayActivityList.forEach((acts) => {
      var thisActivities = Array.from(acts[1].activities.entries()).map((e) => e[1])
      acts[1].activityCode = activityCode.parse(thisActivities[0].activityCode)
      acts[1].startTime = DateTime.min(...thisActivities.map((act) => act.startTime))
      acts[1].endTime = DateTime.max(...thisActivities.map((act) => act.endTime))
      acts[1].numGroups = Math.max(...thisActivities.map((act) => act.childActivities.length))
    })
    dayActivityList.sort((actsA, actsB) => {
      var aStart = actsA[1].startTime
      var bStart = actsB[1].startTime
      if (aStart < bStart) {
        return -1
      }
      if (aStart > bStart) {
        return 1
      }
      if (actsA[0] < actsB[0]) {
        return -1
      }
      if (actsA[0] > actsB[0]) {
        return 1
      }
      return 0
    })
    out.sortedSchedule.push({day: dayActivities.day, activities: dayActivityList.map((x) => x[1])})
  })

  return out
}

router.use('/:competitionId', async (req, res, next) => {
  try {
    req.competition = await auth.getWcaApi('/api/v0/competitions/' + req.params.competitionId + '/wcif', req, res)
    next()
  } catch (e) {
    res.redirect('/')
  }
})

router.get('/:competitionId', (req, res) => {
  res.render('competition', {comp: compData(req), fn: pugFunctions})
})

router.get('/:competitionId/schedule', (req, res) => {
  res.render('schedule', {comp: compData(req), fn: pugFunctions})
})

router.post('/:competitionId/schedule', async (req, res) => {
  var maxActivityId = 0
  req.competition.schedule.venues.forEach((venue) => {
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
  Object.entries(req.body).forEach(([key, value]) => {
    if (!key.endsWith('start')) {
      return
    }
    const keySplit = key.split('.')
    const date = keySplit[0]
    const activityCodeStr = keySplit[1]
    const activityCodeObj = activityCode.parse(activityCodeStr)
    const prefix = date + '.' + activityCodeStr + '.'
    const start = req.body[prefix + 'start']
    const end = req.body[prefix + 'end']
    const numGroups = +req.body[prefix + 'groups']
    req.competition.schedule.venues.forEach((venue) => {
      const activityStart = DateTime.fromFormat(date + ' ' + start, 'yyyyMMdd HH:mm', { zone: venue.zone})
      const activityEnd = DateTime.fromFormat(date + ' ' + end, 'yyyyMMdd HH:mm', { zone: venue.zone})
      venue.rooms.forEach((room) => {
        var roomActivity = null
        var roomActivityIdx = -1
        for (var idx = 0; idx < room.activities.length; idx++) {
          var activity = room.activities[idx]
          if (activity.activityCode !== activityCodeStr) {
            continue
          }
          if (DateTime.fromISO(activity.startTime).setZone(venue.timeZone).toFormat('yyyyMMdd') != date) {
            continue
          }
          roomActivity = activity
          roomActivityIdx = idx
        }
        const isActive = prefix + room.id + '.active' in req.body
        const adjustment = req.body[prefix + room.id + '.adjustment']
        if (roomActivity === null && isActive) {
          roomActivity = {
            id: ++maxActivityId,
            name: activityCodeObj.toString(),
            activityCode: activityCodeStr,
            childActivities: [],
            scrambleSetId: null,
            extensions: []
          }
          room.activities.push(roomActivity)
        } else if (roomActivity !== null && !isActive) {
          room.activities.splice(roomActivityIdx, 1)
        }
        if (!isActive) {
          return
        }
        extension.getExtension(roomActivity, 'Activity').adjustment = adjustment
        if (numGroups === 0) {
          roomActivity.startTime = activityStart.toISO()
          roomActivity.endTime = activityEnd.toISO()
          roomActivity.childActivities = []
          return
        }
        roomActivity.childActivities.splice(numGroups)
        while (roomActivity.childActivities.length < numGroups) {
          roomActivity.childActivities.push({
            id: ++maxActivityId,
            childActivities: [],
            scrambleSetId: null,
            extensions: []
          })
        }
        const groupLength = activityEnd.diff(activityStart, 'seconds').as('seconds') / numGroups
        for (var idx = 0; idx < roomActivity.childActivities.length; idx++) {
          var childActivity = roomActivity.childActivities[idx]
          var groupActivityCode = activityCodeObj.group(
              room.name.split(' ')[0] + (numGroups > 1 ? ' ' + (idx+1) : ''))
          childActivity.name = groupActivityCode.groupName
          childActivity.activityCode = groupActivityCode.id()
          childActivity.startTime = (activityStart.plus({seconds: groupLength * idx})).toISO()
          childActivity.endTime = (activityStart.plus({seconds: groupLength * (idx + 1)})).toISO()
        }
        [...adjustment.matchAll(/[+-]\d+/g)].forEach((adj) => {
          var delta = +adj[0].substring(1)
          if (adj[0].charAt(0) == '+') {
            roomActivity.childActivities.splice(0, delta)
          } else if (adj[0].charAt(0) == '-') {
            roomActivity.childActivities.splice(-1 * delta)
          }
        })
        roomActivity.startTime = roomActivity.childActivities.at(0).startTime
        roomActivity.endTime = roomActivity.childActivities.at(-1).endTime
      })
    })
  })
  var response = await auth.patchWcif(req.competition, ['schedule'], req, res)
  if (response.error) {
    req.session.error = response.error
  } else {
    req.session.statusMessage = response.status
  }
  res.redirect(req.path)
})

router.get('/:competitionId/script', async (req, res) => {
  res.render('script', {
    comp: compData(req),
    fn: pugFunctions,
    script: req.query.script,
    outputs: [],
  })
})

router.post('/:competitionId/script', async (req, res) => {
  var params = {
    comp: compData(req),
    fn: pugFunctions,
    script: req.body.script,
    outputs: [],
  }
  if (req.body.script) {
    var scriptParsed = await parser.parse(req.body.script, req, res, false)
    if (scriptParsed.errors) {
      scriptParsed.errors.forEach((error) => {
        params.outputs.push({type: 'Error', data: error})
      })
    } else {
      var outType = driver.parseType(scriptParsed.type)
      if (outType.params.length) {
        params.outputs.push({type: 'Error', data: { errorType: 'WRONG_OUTPUT_TYPE', type: outType}})
      } else {
        var ctx = {
          competition: params.comp.competition,
          compData: params.comp,
          command: req.body.script,
        }
        params.outputs.push({type: outType.type, data: scriptParsed.value({}, ctx)})
        if (scriptParsed.mutations) {
          await auth.patchWcif(ctx.competition, scriptParsed.mutations, req, res)
        }
      }
    }
  }
  res.render('script', params)
})

module.exports = {
  router: router
}
