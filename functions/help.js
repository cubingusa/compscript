const extension = require('./../extension')

const ListFunctions = {
  name: 'ListFunctions',
  docs: 'Provide a list of all functions',
  args: [],
  outputType: 'ListFunctionsOutput',
  usesContext: true,
  implementation: (ctx) => {
    const exts = extension.getExtensionsWithPrefix(ctx.competition, 'Competition', 'udf.')
    return {
      functions: [...new Set(ctx.allFunctions.map((fn) => fn.name))],
      udfs: exts.map((udf) => udf.name)
    }
  }
}

const Help = {
  name: 'Help',
  docs: 'Provide documentation about a single function',
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
    const ext = extension.getExtension(ctx.competition, 'Competition.udf.' + functionName)
    if (!!ext) {
      return [{ udf: ext }]
    }
    return []
  }
}

module.exports = {
  functions: [ListFunctions, Help]
}
