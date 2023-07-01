const fs = require('fs')

const auth = require('./../auth')
const extension = require('./../extension')

const Type = {
  name: 'Type',
  genericParams: ['T'],
  args: [
    {
      name: 'arg',
      type: '$T',
    },
  ],
  outputType: 'String',
  usesGenericTypes: true,
  implementation: (generics, arg) => generics.T
}

const ClearCache = {
  name: 'ClearCache',
  args: [],
  outputType: 'String',
  usesContext: true,
  implementation: (ctx) => {
    fs.unlinkSync(auth.cachePath(ctx.competition.id))
    return 'cache cleared'
  }
}

const SetExtension = {
  name: 'SetExtension',
  docs: 'Sets a property in a competition-level extension.',
  genericParams: ['T'],
  args: [
    {
      name: 'property',
      type: 'String',
    },
    {
      name: 'value',
      type: '$T',
    },
    {
      name: 'type',
      type: 'String',
    },
    {
      name: 'namespace',
      type: 'String',
      default: 'org.cubingusa.natshelper.v1',
    }
  ],
  outputType: 'String',
  usesContext: true,
  mutations: ['extensions'],
  implementation: (ctx, property, value, type, namespace) => {
    var ext = extension.getOrInsertExtension(ctx.competition, type, namespace)
    ext[property] = value
    return 'Set ' + property + ' to ' + value
  }
}

module.exports = {
  functions: [Type, ClearCache, SetExtension],
}
