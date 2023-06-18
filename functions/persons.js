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

const CompetitionGroupsLink = {
  name: 'CompetitionGroups',
  docs: 'Returns a link to competitiongroups.com for the person',
  args: [
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true,
    }
  ],
  outputType: 'String',
  usesContext: true,
  implementation: (ctx, person) => {
    return `https://www.competitiongroups.com/competitions/${ctx.competition.id}/persons/${person.registrantId}`
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
    if (!person.wcaId) return null
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
      case 'Array<String>':
        return []
    }
  })(type)
  var name = type === 'Array<String>' ? 'ArrayProperty' : type + 'Property'
  return {
    name: name,
    docs: 'Gets a property attached to the person\'s WCIF',
    args: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'person',
        type: 'Person',
        canBeExternal: true,
      },
      {
        name: 'defaultValue',
        type: type,
        defaultValue: defaultValue,
      }
    ],
    outputType: type,
    implementation: (name, person, defaultValue) => {
      const ext = extension.getExtension(person, 'Person')
      if (ext !== null && ext.properties && name in ext.properties) {
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
    if (!ext || !ext.properties) {
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
      name: 'persons',
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
      const ext = extension.getOrInsertExtension(person, 'Person')
      if (!ext.properties) {
        ext.properties = {}
      }
      ext.properties[property] = value({Person: person})
    })
    return 'Set ' + property + ' for ' + persons.length.toString() + ' persons.'
  }
}

const DeleteProperty = {
  name: 'DeleteProperty',
  docs: 'Deletes the given property on the provided people',
  args: [
    {
      name: 'persons',
      type: 'Array<Person>',
    },
    {
      name: 'property',
      type: 'String',
    }
  ],
  outputType: 'String',
  mutations: ['persons'],
  implementation: (persons, property) => {
    persons.forEach((person) => {
      const ext = extension.getExtension(person, 'Person')
      if (ext && ext.properties && ext.properties[property] !== undefined) {
        delete ext.properties[property]
      }
    })
    return 'Deleted ' + property + ' for ' + persons.length.toString() + ' persons.'
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

const AddRole = {
  name: 'AddRole',
  docs: 'Adds the provided Role to the given people',
  args: [
    {
      name: 'persons',
      type: 'Array<Person>',
    },
    {
      name: 'role',
      type: 'String',
    },
  ],
  outputType: 'String',
  mutations: ['persons'],
  implementation: (persons, role) => {
    persons.forEach((person) => {
      if (!person.roles.includes(role)) {
        person.roles.push(role)
      }
    })
    return 'Added ' + role + ' to ' + persons.length + ' people.'
  }
}

const DeleteRole = {
  name: 'DeleteRole',
  docs: 'Deletes the provided Role from the given people',
  args: [
    {
      name: 'persons',
      type: 'Array<Person>',
    },
    {
      name: 'role',
      type: 'String',
    },
  ],
  outputType: 'String',
  mutations: ['persons'],
  implementation: (persons, role) => {
    persons.forEach((person) => {
      person.roles = person.roles.filter(existingRole => existingRole !== role)
    })
    return 'Removed ' + role + ' from ' + persons.length + ' people.'
  }
}

const HasRole = {
  name: 'HasRole',
  docs: 'Returns whether the given person has the given role',
  args: [
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true,
    },
    {
      name: 'role',
      type: 'String',
    },
  ],
  outputType: 'Boolean',
  implementation: (person, role) => {
    return (person.roles || []).includes(role)
  }
}

const RegistrationStatus = {
  name: 'RegistrationStatus',
  docs: 'Returns the registration.status field in WCIF.',
  args: [
    {
      name: 'person',
      type: 'Person',
      canBeExternal: true,
    }
  ],
  outputType: 'String',
  implementation: (person) => person.registration.status,
}

module.exports = {
  functions:
      [Name, WcaId, WcaLink, CompetitionGroupsLink, Registered, WcaIdYear, Country, FirstName, LastName,
       Property('Boolean'), Property('String'), Property('Number'), Property('Array<String>'),
       SetProperty, DeleteProperty, AddPerson, Persons,
       AddRole, DeleteRole, HasRole, RegistrationStatus],
}
