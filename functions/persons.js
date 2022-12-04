const WcaId = {
  name: 'WcaId',
  args: [],
  outputType: 'String(Person)',
  implementation: (person) => {
    return person.wcaId
  },
}

module.exports = {
  functions: [WcaId],
}
