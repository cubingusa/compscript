const fs = require('fs')

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
    fs.unlinkSync('.wcif_cache/' + ctx.competition.id)
  }
}

module.exports = {
  functions: [Type, ClearCache],
}
