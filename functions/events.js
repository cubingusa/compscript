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

module.exports = {
  functions: [CompetingIn],
}
