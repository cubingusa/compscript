const express = require('express')
const { DateTime } = require('luxon')
const url = require('url')

const auth = require('./auth')
const activityCode = require('./activity_code')
const events = require('./events')
const extension = require('./extension')
const perf = require('./perf')
const pugFunctions = require('./pug_functions')
const functions = require('./functions/functions')
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
    if (person.registration && person.registration.status == 'accepted') {
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
  req.logger = new perf.PerfLogger()
  try {
    req.logger.start('fetch')
    req.competition = await auth.getWcaApi('/api/v0/competitions/' + req.params.competitionId + '/wcif', req, res)
    req.logger.stop('fetch')
    next()
  } catch (e) {
    console.log(e)
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
        extension.getOrInsertExtension(roomActivity, 'Activity').adjustment = adjustment
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
          var groupActivityCode = activityCodeObj.group(idx + 1)
          childActivity.name = events.idToName[activityCodeObj.eventId] + ' Round ' + activityCodeObj.roundNumber + ' ' + room.name.split(' ')[0] + ' ' + groupActivityCode.groupNumber
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
  var script = ''
  if (req.query.script) {
    req.session.script = req.query.script
    res.redirect(url.parse(req.originalUrl).pathname)
    return
  }
  if (req.session.script) {
    script = req.session.script
    delete req.session.script
  }
  await runScript(req, res, script || req.query.script, true)
})

router.post('/:competitionId/script', async (req, res) => {
  await runScript(req, res, req.body.script, req.body.dryrun)
})

async function runScript(req, res, script, dryrun) {
  var logger = req.logger
  logger.start('compData')
  var comp = compData(req)
  logger.stop('compData')
  var params = {
    comp,
    fn: pugFunctions,
    script: script,
    outputs: [],
    dryrun: dryrun,
    dryrunWarning: false,
  }
  if (script) {
    var ctx = {
      competition: params.comp.competition,
      compData: params.comp,
      command: script,
      allFunctions: functions.allFunctions,
      dryrun: dryrun,
      logger,
    }
    try {
      ctx.logger.start('parse')
      var scriptParsed = await parser.parse(script, req, res, ctx, false)
      ctx.logger.stop('parse')
      var errors = []
      if (scriptParsed.errors) {
        errors = scriptParsed.errors
      } else {
        errors = scriptParsed.map((expr) => {
          if (expr.errors) {
            return expr.errors.map((err) => { return { type: 'Error', data: err } })
          }
          var outputType = expr.type
          if (outputType.params.length) {
            return { type: 'Error', data: { errorType: 'WRONG_OUTPUT_TYPE', type: outputType } }
          }
          return []
        }).flat()
      }
      if (errors.length) {
        params.outputs = errors
      } else {
        var mutations = []
        for (const expr of scriptParsed) {
          var outType = expr.type
          var out = await expr.value({}, ctx)
          params.outputs.push({type: outType.type, data: out})
          expr.mutations.forEach((mutation) => {
            if (!mutations.includes(mutation)) {
              mutations.push(mutation)
            }
          })
        }
        if (mutations.length) {
          if (dryrun) {
            params.dryrunWarning = true
          } else {
            ctx.logger.start('patch')
            await auth.patchWcif(ctx.competition, mutations, req, res)
            ctx.logger.stop('patch')
          }
        }
      }
    } catch (e) {
      params.outputs.push({type: 'Exception', data: e.stack })
      console.log(e)
    }
  }
  logger.start('render')
  res.render('script', params)
  logger.stop('render')
  logger.log()
}

module.exports = {
  router: router
}
