const ListFunctions = {
  name: 'ListFunctions',
  docs: 'Provide a list of all functions',
  args: [],
  outputType: 'ListFunctionsOutput',
  usesContext: true,
  implementation: (ctx) => {
    return [...new Set(ctx.allFunctions.map((fn) => fn.name))]
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
    return ctx.allFunctions.filter((fn) => fn.name === functionName)
  }
}

module.exports = {
  functions: [ListFunctions, Help]
}
