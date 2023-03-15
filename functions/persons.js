const extension = require('./../extension')

const Name = {
  name: 'Name',
  docs: 'Returns the person\'s name',
  args: [
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true
    }
  ],
  outputType: 'String',
  implementation: (person) => person.name
}

const WcaId = {
  name: 'WcaId',
  docs: 'Returns the person\'s WCA ID',
  args: [
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true
    }
  ],
  outputType: 'String',
  implementation: (person) => {
    if (person.wcaId === undefined) {
      return null
    }
    return person.wcaId
  }
}

const WcaLink = {
  name: 'WcaLink',
  docs: 'Returns a link to the person\'s WCA profile',
  args: [
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true
    }
  ],
  outputType: 'String',
  implementation: (person) => {
    if (person.wcaId === undefined) {
      return null
    }
    return 'https://wca.link/' + person.wcaId
  }
}

const Registered = {
  name: 'Registered',
  docs: 'Returns true if the person is registered for the competition',
  args: [
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true
    }
  ],
  outputType: 'Boolean',
  implementation: (person) => person.registration && person.registration.status == 'accepted'
}

const WcaIdYear = {
  name: 'WcaIdYear',
  docs: 'Returns the year component of the person\'s WCA ID',
  args: [
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true
    }
  ],
  outputType: 'Number',
  implementation: (person) => {
    return +person.wcaId.substring(0, 4)
  }
}

const Country = {
  name: 'Country',
  docs: 'Returns the person\'s country',
  args: [
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true
    }
  ],
  outputType: 'String',
  implementation: (person) => person.countryIso2,
}

const FirstName = {
  name: 'FirstName',
  docs: 'Returns the person\'s first name',
  args: [
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true
    }
  ],
  outputType: 'String',
  implementation: (person) => person.name.split(' ').at(0),
}

const LastName = {
  name: 'LastName',
  docs: 'Returns the person\'s last name',
  args: [
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true
    }
  ],
  outputType: 'String',
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
      case 'List':
        return []
    }
  })(type)
  return {
    name: type + 'Property',
    docs: 'Gets a property attached to the person\'s WCIF',
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
      {
        name: 'person',
        type: 'Person',
        canBeExternal: true,
      }
    ],
    outputType: type,
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
  docs: 'Returns true if the person has this property set',
  args: [
    {
      name: 'property',
      type: 'String',
    },
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true,
    }
  ],
  outputType: 'Boolean',
  implementation: (property, person) => {
    const ext = extension.getExtension(person, 'Person')
    if (!ext.properties) {
      return false
    }
    return property in ext.properties
  }
}

const SetProperty = {
  name: 'SetProperty',
  docs: 'Sets the given property on the provided people',
  genericParams: ['T'],
  args: [
    {
      name: 'filter',
      type: 'Array<Person>',
    },
    {
      name: 'property',
      type: 'String',
    },
    {
      name: 'value',
      type: '$T(Person)',
      lazy: true,
    },
  ],
  outputType: 'String',
  mutations: ['persons'],
  implementation: (persons, property, value) => {
    persons.forEach((person) => {
      const ext = extension.getExtension(person, 'Person')
      if (!ext.properties) {
        ext.properties = {}
      }
      ext.properties[property] = value({Person: person})
    })
    return 'Set ' + property + ' for ' + persons.length.toString() + ' persons.'
  }
}

const AddPerson = {
  name: 'AddPerson',
  docs: 'Adds the given person as a staff member',
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
  docs: 'Returns all persons matching a property',
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
  docs: 'Marks the provided staff members as unavailable at the given time',
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
       Property('Boolean'), Property('String'), Property('Number'), Property('List'),
       SetProperty, SetStaffUnavailable,
       AddPerson, Persons],
}
