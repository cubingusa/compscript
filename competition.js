const express = require('express')
const { DateTime } = require('luxon')

const auth = require('./auth')
const activityCode = require('./activity_code')
const pugFunctions = require('./pug_functions')

var router = express.Router()

compData = function(competition) {
  out = {
    competition: competition,
    sortedSchedule: [],
    rooms: {},  // ID -> room
    events: {},  // ID -> event
    persons: {},  // ID -> person
  }

  competition.events.forEach((evt) => {
    out.events[evt.id] = evt
  })
  competition.persons.forEach((person) => {
    out.persons[person.wcaUserId] = person
  })

  var activities = []  // Array of {code -> [activities]}, one per day

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
          activities[day].activities.set(activity.activityCode, [])
        }
        activities[day].activities.get(activity.activityCode).push(activity)
      })
    })
  })
  activities.forEach((dayActivities) => {
    var dayActivityList = Array.from(dayActivities.activities.entries())
    dayActivityList.sort((actsA, actsB) => {
      var aStart = DateTime.min(...actsA[1].map((act) => act.startTime))
      var bStart = DateTime.min(...actsB[1].map((act) => act.startTime))
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
  res.render('competition', {comp: compData(req.competition), fn: pugFunctions})
})

router.get('/:competitionId/schedule', (req, res) => {
  res.render('schedule', {comp: compData(req.competition), fn: pugFunctions})
})

module.exports = {
  router: router
}
