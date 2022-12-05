const activityCode = require('./../activity_code')
const attemptResult = require('./../attempt_result')

const CompetingIn = {
  name: 'CompetingIn',
  args: [
    {
      name: 'activity',
      type: 'Activity',
    },
  ],
  outputType: 'Boolean(Person)',
  implementation: (activity, person) => {
    // TODO: implement support for rounds + groups.
    if (activity.roundNumber || activity.groupName) {
      return false
    }
    return person.registration && person.registration.eventIds.includes(activity.eventId)
  },
}

const RegisteredEvents = {
  name: 'RegisteredEvents',
  args: [],
  outputType: 'Array<Activity>(Person)',
  implementation: (person) => {
    if (!person.registration) return []
    return person.registration.eventIds.map((eventId) => activityCode.parse(eventId))
  },
}

const PersonalBest = {
  name: 'PersonalBest',
  args: [
    {
      name: 'event',
      type: 'Activity',
    },
    {
      name: 'type',
      type: 'String',  // 'single' or 'average'
    },
  ],
  outputType: 'AttemptResult(Person)',
  implementation: (evt, type, person) => {
    const eventId = evt.eventId
    var matching = person.personalBests.filter((best) => best.eventId == eventId && best.type == type)
    if (matching.length == 0) {
      return new attemptResult.AttemptResult(-1, eventId)
    } else {
      return new attemptResult.AttemptResult(matching[0].best, eventId)
    }
  }
}

const BetterThan = {
  name: 'BetterThan',
  args: [
    {
      name: 'time1',
      type: 'AttemptResult',
    },
    {
      name: 'time2',
      type: 'AttemptResult',
    },
  ],
  outputType: 'Boolean',
  implementation: (time1, time2) => {
    return time1.value > 0 && time1.value < time2.value
  }
}


module.exports = {
  functions: [CompetingIn, RegisteredEvents, PersonalBest, BetterThan],
}
