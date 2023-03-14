const extension = require('./../extension')

const ListFunctions = {
  name: 'ListFunctions',
  args: [],
  outputType: 'ListFunctionsOutput',
  usesContext: true,
  implementation: (ctx) => {
    const ext = extension.getExtension(ctx.competition, 'Competition')
    if (!ext.udf) {
      ext.udf = {}
    }
    return {
      functions: [...new Set(ctx.allFunctions.map((fn) => fn.name))],
      udfs: Object.keys(ext.udf),
    }
  }
}

const Help = {
  name: 'Help',
  args: [
    {
      name: 'functionName',
      type: 'String',
    }
  ],
  outputType: 'FunctionHelp',
  usesContext: true,
  implementation: (ctx, functionName) => {
    var matching = ctx.allFunctions.filter((fn) => fn.name === functionName)
    if (matching.length) {
      return matching.map((fn) => {
        return {
          fn: fn
        }
      })
    }
    const ext = extension.getExtension(ctx.competition, 'Competition')
    if (ext.udf && ext.udf[functionName]) {
      return [{ udf: ext.udf[functionName] }]
    }
    return []
  }
}

module.exports = {
  functions: [ListFunctions, Help]
}
