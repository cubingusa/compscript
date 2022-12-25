const attemptResult = require('./attempt_result')

function getEvent(competition, activity) {
  return competition.events.filter((evt) => evt.id == activity.eventId)[0]
}

function getRound(competition, activity) {
  return getEvent(competition, activity).rounds.filter((rd) => rd.id == activity.id())[0]
}

function personalBest(evt, type, person) {
  const eventId = evt.eventId
  var matching = person.personalBests.filter((best) => best.eventId === eventId && best.type === type)
  if (matching.length == 0) {
    return new attemptResult.AttemptResult(0, eventId)
  } else {
    return new attemptResult.AttemptResult(matching[0].best, eventId)
  }
}

module.exports = {
  getEvent: getEvent,
  getRound: getRound,
  personalBest: personalBest,
}
