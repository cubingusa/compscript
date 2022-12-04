const WcaIdIn = {
  name: 'WcaIdIn',
  args: [
    {
      name: 'wcaIds',
      type: 'String',
      repeated: true,
    },
  ],
  outputType: 'Boolean(Person)',
  implementation: (wcaIds, person, ctx) => {
    return wcaIds.includes(person.wcaId)
  },
}

module.exports = {
  functions: [WcaIdIn],
}
