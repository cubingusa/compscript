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

const WcaIdYear = {
  name: 'WcaIdYear',
  args: [],
  outputType: 'Number(Person)',
  implementation: (person) => {
    if (!person.wcaId) {
      return 0
    }
    return +person.wcaId.substring(0, 4)
  }
}

module.exports = {
  functions: [Name, WcaId, WcaLink, Registered, WcaIdYear],
}
