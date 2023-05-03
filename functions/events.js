const activityCode = require('./../activity_code')
const attemptResult = require('./../attempt_result')
const lib = require('./../lib')

const Events = {
  name: 'Events',
  docs: 'Returns a list of all events in a competition',
  args: [],
  outputType: 'Array<Event>',
  usesContext: true,
  implementation: (ctx) => {
    return ctx.competition.events.map((evt) => activityCode.parse(evt.id))
  }
}

const EventId = {
  name: 'EventId',
  docs: 'Returns the string event ID for an event',
  args: [
    {
      name: 'event',
      type: 'Event',
      canBeExternal: true,
    }
  ],
  outputType: 'String',
  implementation: (evt) => evt.id()
}

const RoundId = {
  name: 'RoundId',
  docs: 'Returns the ID for a round',
  args: [
    {
      name: 'round',
      type: 'Round',
      canBeExternal: true,
    }
  ],
  outputType: 'String',
  implementation: (rd) => rd.id()
}

const CompetingIn_Event = {
  name: 'CompetingIn',
  docs: 'Returns true if the specified person is competing in the specified event',
  args: [
    {
      name: 'event',
      type: 'Event',
      canBeExternal: true,
    },
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true,
    }
  ],
  outputType: 'Boolean',
  implementation: (event, person) => {
    return person.registration && person.registration.status == 'accepted' && person.registration.eventIds.includes(event.eventId)
  },
}

const CompetingIn_Round = {
  name: 'CompetingIn',
  docs: 'Returns true if the specified person is competing in the specified round',
  args: [
    {
      name: 'round',
      type: 'Round',
    },
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true,
    }
  ],
  outputType: 'Boolean',
  usesContext: true,
  implementation: (ctx, round, person) => {
    var rd = lib.getWcifRound(ctx.competition, round)
    return rd.results.filter((res) => res.personId == person.registrantId).length > 0
  },
}

// TODO: Add CompetingIn(Group)

const RegisteredEvents = {
  name: 'RegisteredEvents',
  docs: 'Returns an array of events that the person is registered for',
  args: [
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true,
    }
  ],
  outputType: 'Array<Event>',
  implementation: (person) => {
    if (!person.registration) return []
    if (person.registration.status !== 'accepted') return []
    return person.registration.eventIds.map((eventId) => activityCode.parse(eventId))
  },
}

const PersonalBest = {
  name: 'PersonalBest',
  docs: 'Returns the personal best for an event',
  args: [
    {
      name: 'event',
      type: 'Event',
      canBeExternal: true,
    },
    {
      name: 'type',
      type: 'String',  // 'single', 'average', or 'default'
      defaultValue: 'default',
    },
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true,
    }
  ],
  outputType: 'AttemptResult',
  implementation: (evt, type, person) => lib.personalBest(person, evt, type),
}

const PsychSheetPosition = {
  name: 'PsychSheetPosition',
  docs: 'Returns this person\'s position on the psych sheet for an event',
  args: [
    {
      name: 'event',
      type: 'Event',
      canBeExternal: true,
    },
    {
      name: 'type',
      type: 'String',
      defaultValue: 'default',
    },
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true,
    }
  ],
  outputType: 'Number',
  usesContext: true,
  implementation: (ctx, evt, type, person) => {
    if (person.registration.status !== 'accepted' ||
        !person.registration.eventIds.includes(evt.eventId)) {
      return null
    }
    var pb = lib.personalBest(person, evt, type)
    var singlePb = lib.personalBest(person, evt, 'single')
    return ctx.competition.persons.filter((otherPerson) => {
      if (!otherPerson.registration || otherPerson.registration.status !== 'accepted') {
        return false
      }
      if (!otherPerson.registration.eventIds.includes(evt.eventId)) {
        return false
      }
      var otherPb = lib.personalBest(otherPerson, evt, type)
      if (otherPb === null) {
        return false
      }
      if (pb === null) {
        return true
      }
      if (pb.value > otherPb.value) {
        return true
      } else if (pb.value < otherPb.value) {
        return false
      } else {
        var otherSinglePb = lib.personalBest(otherPerson, evt, 'single')
        return singlePb.value > otherSinglePb.value
      }
    }).length + 1
  }
}

const RoundPosition = {
  name: 'RoundPosition',
  docs: 'Returns this person\'s placement in a round that has already happened',
  args: [
    {
      name: 'round',
      type: 'Round',
    },
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true,
    }
  ],
  outputType: 'Number',
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
  docs: 'Add fake results for the given persons in the given round',
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
    return 'Added ' + rd.results.length + ' results for ' + round.id()
  }
}

const IsFinal = {
  name: 'IsFinal',
  docs: 'Returns true if the provided round is a final',
  args: [
    {
      name: 'round',
      type: 'Round',
    }
  ],
  outputType: 'Boolean',
  usesContext: true,
  implementation: (ctx, round) => {
    var matchingEvt = ctx.competition.events.filter((evt) => evt.id === round.eventId)
    if (matchingEvt.length !== 1) {
      return false
    }
    return matchingEvt[0].rounds.length === round.roundNumber
  },
}

const RoundNumber = {
  name: 'RoundNumber',
  docs: 'Returns the number of a round',
  args: [
    {
      name: 'round',
      type: 'Round',
    }
  ],
  outputType: 'Number',
  implementation: round => round.roundNumber,
}

const RoundForEvent = {
  name: 'RoundForEvent',
  docs: 'Returns a round for the specified event.',
  args: [
    {
      name: 'number',
      type: 'Number',
    },
    {
      name: 'event',
      type: 'Event',
      canBeExternal: true,
    }
  ],
  outputType: 'Round',
  implementation: (number, event) => event.round(number),
}

module.exports = {
  functions: [Events, EventId, RoundId, CompetingIn_Event, CompetingIn_Round, RegisteredEvents, PersonalBest,
              PsychSheetPosition, RoundPosition, AddResults,
              IsFinal, RoundNumber, RoundForEvent],
}
