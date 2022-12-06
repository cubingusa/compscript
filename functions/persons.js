const Name = {
  name: 'Name',
  args: [],
  outputType: 'String(Person)',
  implementation: (person) => person.name
}

const WcaId = {
  name: 'WcaId',
  args: [],
  outputType: 'String(Person)',
  implementation: (person) => person.wcaId
}

const WcaLink = {
  name: 'WcaLink',
  args: [],
  outputType: 'String(Person)',
  implementation: (person) => 'https://wca.link/' + person.wcaId
}

module.exports = {
  functions: [Name, WcaId, WcaLink],
}
