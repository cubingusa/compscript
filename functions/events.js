const activityCode = require('./../activity_code')
const attemptResult = require('./../attempt_result')
const lib = require('./../lib')

const CompetingIn = {
  name: 'CompetingIn',
  args: [
    {
      name: 'activity',
      type: 'Activity',
    },
  ],
  outputType: 'Boolean(Person)',
  usesContext: true,
  implementation: (ctx, activity, person) => {
    // TODO: implement support for groups.
    if (activity.groupName) {
      return false
    }
    if (activity.roundNumber) {
      var rd = lib.getRound(ctx.competition, activity)
      return rd.results.filter((res) => res.personId == person.registrantId).length > 0
    }
    return person.registration && person.registration.status == 'accepted' && person.registration.eventIds.includes(activity.eventId)
  },
}

const RegisteredEvents = {
  name: 'RegisteredEvents',
  args: [],
  outputType: 'Array<Activity>(Person)',
  implementation: (person) => {
    if (!person.registration) return []
    if (person.registration.status !== 'accepted') return []
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
      type: 'String',  // 'single', 'average', or 'default'
      defaultValue: 'default',
    },
  ],
  outputType: 'AttemptResult(Person)',
  implementation: (evt, type, person) => lib.personalBest(person, evt, type),
}

const PsychSheetPosition = {
  name: 'PsychSheetPosition',
  args: [
    {
      name: 'event',
      type: 'Activity',
    },
    {
      name: 'type',
      type: 'String',
      defaultValue: 'default',
    },
  ],
  outputType: 'Number(Person)',
  usesContext: true,
  implementation: (ctx, evt, type, person) => {
    var pb = lib.personalBest(person, evt, type)
    return ctx.competition.persons.filter((otherPerson) => {
      if (!otherPerson.registration || otherPerson.registration.status !== 'accepted') {
        return false
      }
      if (!otherPerson.registration.eventIds.includes(evt.eventId)) {
        return false
      }
      var otherPb = lib.personalBest(otherPerson, evt, type)
      return pb.value <= 0 || pb.value > otherPb.value
    }).length + 1
  }
}

const RoundPosition = {
  name: 'RoundPosition',
  args: [
    {
      name: 'round',
      type: 'Activity',
    },
  ],
  outputType: 'Number(Person)',
  usesContext: true,
  implementation: (ctx, round, person) => {
    var allResults = lib.getRound(ctx.competition, round).results
    var res = allResults.filter((res) => res.personId == person.registrantId)
    if (res.length && res[0].ranking) {
      return res[0].ranking
    }
    return allResults.length + 1
  }
}

const AddResults = {
  name: 'AddResults',
  args: [
    {
      name: 'round',
      type: 'Activity',
    },
    {
      name: 'persons',
      type: 'Array<Person>',
    },
    {
      name: 'result',
      type: 'AttemptResult(Person)',
      lazy: true,
      defaultValue: new attemptResult.AttemptResult(0, '333'),
    },
  ],
  outputType: 'String',
  usesContext: true,
  mutations: ['events'],
  implementation: (ctx, round, persons, result) => {
    var rd = lib.getRound(ctx.competition, round)
    var attempts = ((rd) => {
      switch (rd.format) {
        case '1':
          return 1
        case '2':
          return 2
        case '3':
          return 3
        case 'm':
          return 3
        case 'a':
          return 5
      }
    })(rd)
    rd.results = persons.map((person) => {
                   var res = result({'Person': person})
                   if (res.value != 0) {
                     return {
                       personId: person.registrantId,
                       attempts: [...Array(attempts)].map((x) => { return { result: res.value } }),
                       best: res.value,
                       average: res.value,
                       ranking: null,
                     }
                   } else {
                     return {
                       personId: person.registrantId,
                       attempts: [...Array(attempts)].map((x) => null),
                       ranking: null,
                       best: 0,
                       average: 0,
                     }
                   }
                 }).sort((p1, p2) => {
                   if (p1.average <= 0) return -1
                   if (p2.average <= 0) return 1
                   return p1.average - p2.average
                 }).map((res, idx) => {
                   if (res.average > 0) {
                     res.ranking = idx
                   }
                   return res
                 })
  }
}

module.exports = {
  functions: [CompetingIn, RegisteredEvents, PersonalBest,
              PsychSheetPosition, RoundPosition, AddResults],
}
