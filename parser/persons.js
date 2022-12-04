const WcaIdIn = {
  name: 'WcaIdIn',
  args: [
    {
      name: 'wcaIds',
      type: 'String',
      repeated: true,
    },
  ],
  outputType: 'PersonFilter',
  implementation: (wcaIds) => {
    return function(person) {
      return wcaIds.includes(person.wcaId)
    }
  },
}

module.exports = {
  functions: [WcaIdIn],
}
