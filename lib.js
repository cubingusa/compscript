const attemptResult = require('./attempt_result')

function getEvent(competition, activity) {
  return competition.events.filter((evt) => evt.id == activity.eventId)[0]
}

function getRound(competition, activity) {
  return getEvent(competition, activity).rounds.filter((rd) => rd.id == activity.id())[0]
}

function personalBest(person, evt, type='default') {
  const eventId = evt.eventId
  if (type == 'default') {
    type = ['333bf', '444bf', '555bf', '333fm'].includes(eventId) ? 'single' : 'average'
  }

  var matching = person.personalBests.filter((best) => best.eventId === eventId && best.type === type)
  if (matching.length == 0) {
    return new attemptResult.AttemptResult(0, eventId)
  } else {
    return new attemptResult.AttemptResult(matching[0].best, eventId)
  }
}

function allGroups(competition) {
  return competition.schedule.venues.map((venue) => venue.rooms).flat()
          .map((room) => room.activities).flat()
          .map((activity) => [activity].concat(activity.childActivities)).flat()
}

function activityById(competition, activityId) {
  var matching = allGroups(competition).filter((activity) => activity.id == activityId)
  if (matching.length) {
    return matching[0]
  }
  return null
}

function activityByCode(competition, activityCode) {
  var matching = allGroups(competition).filter((activity) => activity.activityCode == activityCode.id())
  if (matching.length) {
    return matching[0]
  }
  return null
}

function groupIdsForRoundCode(competition, roundCode) {
  return groupsForRoundCode(competition, roundCode).map((group) => group.id)
}

function activityCodeMapForRoundCode(competition, roundCode) {
  return groupsForRoundCode(competition, roundCode)
          .map((activity) => [activity.activityCode, activity.id])
}

function groupsForRoundCode(competition, roundCode) {
  return competition.schedule.venues.map((venue) => venue.rooms).flat()
          .map((room) => room.activities).flat()
          .filter((activity) => activity.activityCode == roundCode.id())
          .map((activity) => activity.childActivities).flat()
}


module.exports = {
  getEvent: getEvent,
  getRound: getRound,
  personalBest: personalBest,
  allGroups: allGroups,
  activityById: activityById,
  activityByCode: activityByCode,
  groupIdsForRoundCode: groupIdsForRoundCode,
  activityCodeMapForRoundCode: activityCodeMapForRoundCode,
  groupsForRoundCode: groupsForRoundCode,
}
