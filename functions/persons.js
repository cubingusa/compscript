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

const Registered = {
  name: 'Registered',
  args: [],
  outputType: 'Boolean(Person)',
  implementation: (person) => person.registration && person.registration.status == 'accepted'
}

module.exports = {
  functions: [Name, WcaId, WcaLink, Registered],
}
