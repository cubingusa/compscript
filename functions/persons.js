const extension = require('./../extension')

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

const Country = {
  name: 'Country',
  args: [],
  outputType: 'String(Person)',
  implementation: (person) => person.countryIso2,
}

const FirstName = {
  name: 'FirstName',
  args: [],
  outputType: 'String(Person)',
  implementation: (person) => person.name.split(' ').at(0),
}

const LastName = {
  name: 'LastName',
  args: [],
  outputType: 'String(Person)',
  implementation: (person) => person.name.split(' ').at(-1),
}

const Property = (type) => {
  var defaultValue = ((type) => {
    switch (type) {
      case 'String':
        return ''
      case 'Boolean':
        return false
      case 'Number':
        return 0
    }
  })(type)
  return {
    name: type + 'Property',
    args: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'defaultValue',
        type: type,
        defaultValue: defaultValue,
      },
    ],
    outputType: type + '(Person)',
    implementation: (name, defaultValue, person) => {
      const ext = extension.getExtension(person, 'Person')
      if (ext.properties && name in ext.properties) {
        return ext.properties[name]
      }
      return defaultValue
    }
  }
}

const HasProperty = {
  name: 'HasProperty',
  args: [
    {
      name: 'property',
      type: 'String',
    },
  ],
  outputType: 'Boolean(Person)',
  implementation: (property, person) => {
    const ext = extension.getExtension(person, 'Person')
    console.log(ext)
    if (!ext.properties) {
      return false
    }
    return property in ext.properties
  }
}

const SetProperty = {
  name: 'SetProperty',
  genericParams: ['T'],
  args: [
    {
      name: 'filter',
      type: 'Array<Person>',
      lazy: true,
    },
    {
      name: 'property',
      type: 'String',
    },
    {
      name: 'value',
      type: '$T',
    },
  ],
  usesContext: true,
  outputType: 'String',
  mutations: ['persons'],
  implementation: (persons, property, value) => {
    persons.forEach((person) => {
      const ext = extension.getExtension(person, 'Person')
      if (!ext.properties) {
        ext.properties = {}
      }
      ext.properties[property] = value
    })
    return 'Set ' + property + ' for ' + persons.length.toString() + ' persons.'
  }
}

const AddPerson = {
  name: 'AddPerson',
  args: [
    {
      name: 'wcaUserId',
      type: 'Number',
    },
  ],
  usesContext: true,
  outputType: 'String',
  mutations: ['persons'],
  implementation: (ctx, wcaUserId) => {
    ctx.competition.persons.push({ wcaUserId: wcaUserId })
    return 'Added person with userId ' + wcaUserId
  }
}

const Persons = {
  name: 'Persons',
  args: [
    {
      name: 'filter',
      type: 'Boolean(Person)',
      lazy: true,
    },
  ],
  usesContext: true,
  outputType: 'Array<Person>',
  implementation: (ctx, filter) => {
    return ctx.competition.persons.filter((person) => filter({Person: person}))
  }
}

const SetStaffUnavailable = {
  name: 'SetStaffUnavailable',
  args: [
    {
      name: 'persons',
      type: 'Array<Person>',
    },
    {
      name: 'groupFilter',
      type: 'Boolean(Group)',
      serialized: true,
    },
  ],
  outputType: 'String',
  mutations: ['persons'],
  usesContext: true,
  implementation: (ctx, persons, groupFilter) => {
    persons.forEach((person) => {
      const ext = extension.getExtension(ctx.competition, 'Person')
      ext.staffUnavailable = { implementation: groupFilter, cmd: ctx.command }
    })
    return 'Set unavailable for ' + persons.map((person) => person.name).join(', ')
  }
}

module.exports = {
  functions:
      [Name, WcaId, WcaLink, Registered, WcaIdYear, Country, FirstName, LastName,
       Property('Boolean'), Property('String'), Property('Number'),
       SetProperty, SetStaffUnavailable,
       AddPerson, Persons],
}
