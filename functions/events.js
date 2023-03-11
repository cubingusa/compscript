const activityCode = require('./../activity_code')
const attemptResult = require('./../attempt_result')
const lib = require('./../lib')

const Events = {
  name: 'Events',
  args: [],
  outputType: 'Array<Event>',
  usesContext: true,
  implementation: (ctx) => {
    return ctx.competition.events.map((evt) => activityCode.parse(evt.id))
  }
}

const CompetingIn_Event = {
  name: 'CompetingIn',
  args: [
    {
      name: 'event',
      type: 'Event',
    },
  ],
  outputType: 'Boolean(Person)',
  implementation: (event, person) => {
    return person.registration && person.registration.status == 'accepted' && person.registration.eventIds.includes(event.eventId)
  },
}

const CompetingIn_Round = {
  name: 'CompetingIn',
  args: [
    {
      name: 'round',
      type: 'Round',
    }
  ],
  outputType: 'Boolean(Person)',
  usesContext: true,
  implementation: (ctx, round, person) => {
    var rd = lib.getWcifRound(ctx.competition, round)
    return rd.results.filter((res) => res.personId == person.registrantId).length > 0
  },
}

// TODO: Add CompetingIn(Group)

const RegisteredEvents = {
  name: 'RegisteredEvents',
  args: [],
  outputType: 'Array<Event>(Person)',
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
      type: 'Event',
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
      type: 'Event',
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
    if (!person.registration.eventIds.includes(evt.eventId)) {
      return null
    }
    var pb = lib.personalBest(person, evt, type)
    return ctx.competition.persons.filter((otherPerson) => {
      if (!otherPerson.registration || otherPerson.registration.status !== 'accepted') {
        return false
      }
      if (!otherPerson.registration.eventIds.includes(evt.eventId)) {
        return false
      }
      var otherPb = lib.personalBest(otherPerson, evt, type)
      return otherPb !== null && (pb === null || pb.value > otherPb.value)
    }).length + 1
  }
}

const RoundPosition = {
  name: 'RoundPosition',
  args: [
    {
      name: 'round',
      type: 'Round',
    },
  ],
  outputType: 'Number(Person)',
  usesContext: true,
  implementation: (ctx, round, person) => {
    var allResults = lib.getWcifRound(ctx.competition, round).results
    var res = allResults.filter((res) => res.personId == person.registrantId)
    if (res.length && res[0].ranking) {
      return res[0].ranking
    }
    return null
  }
}

const AddResults = {
  name: 'AddResults',
  args: [
    {
      name: 'round',
      type: 'Round',
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
    var rd = lib.getWcifRound(ctx.competition, round)
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
  functions: [Events, CompetingIn_Event, CompetingIn_Round, RegisteredEvents, PersonalBest,
              PsychSheetPosition, RoundPosition, AddResults],
}
