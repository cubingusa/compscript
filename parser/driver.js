const activityCode = require('./../activity_code')
const attemptResult = require('./../attempt_result')

function parseType(type) {
  var parsed = type.match(/([\$a-zA-Z][a-zA-Z0-9<>]*)\((.*)\)/)
  return {
    type: parsed ? parsed[1] : type,
    params: parsed ? parsed[2].split(',').map((x) => x.trim()) : [],
  }
}

function literalNode(type, value) {
  return {
    type: type,
    value: (inParams, ctx) => value,
    serialize: () => { return { type: type, value: value } },
    mutations: [],
  }
}

function functionNode(functionName, allFunctions, args, allowParams=true) {
  var matchingFunctions = allFunctions.filter((fn) => fn.name == functionName)
  var errors = args.filter((arg) => !!arg.errors).map((arg) => arg.errors).flat()
  if (!matchingFunctions) {
    errors.push({ errorType: 'UNKNOWN_FUNCTION', functionName: functionName})
  }
  if (errors.length > 0) {
    return {errors: errors}
  }
  var failedMatches = []
  var successfulMatches = []
  matchingFunctions.forEach((fn) => {
    var availableArgs = [...args]
    var matchedArgs = []
    var errors = []
    var extraParams = []
    var generics = {}
    fn.args.forEach((arg) => {
      // Look for named args.
      var matches = []
      for (var argIdx = 0; argIdx < availableArgs.length; argIdx++) {
        if (availableArgs[argIdx].name == arg.name) {
          matches.push(availableArgs[argIdx])
          availableArgs.splice(argIdx, 1)
          argIdx--
        }
      }
      // Otherwise, pick the first arg, or all remaining unnamed args if it's repeated.
      for (var argIdx = 0; argIdx < availableArgs.length; argIdx++) {
        if (!availableArgs[argIdx].name && (arg.repeated || !matches.length)) {
          matches.push(availableArgs[argIdx])
          availableArgs.splice(argIdx, 1)
          argIdx--
        }
      }
      // Check that all args are the right type.
      matches.forEach((match) => {
        if (match.type == arg.type) {
          return
        }
        var argType = arg.type
        for (const generic of Object.keys(generics)) {
          argType = argType.replaceAll('$' + generic, generics[generic])
        }
        while (argType.indexOf('$') >= 0) {
          var idx = argType.indexOf('$')
          if (argType.substring(0, idx) !== match.type.substring(0, idx)) {
            errors.push({ errorType: 'ARGUMENT_WRONG_TYPE_1',
                          argumentName: arg.name,
                          expectedType: arg.type,
                          actualType: match.type,
                          generics: generics})
            return
          }
          var generic = argType.substring(idx + 1).match(/^[a-zA-Z0-9]*/)[0]
          var genericValue = match.type.substring(idx).match(/^[a-zA-Z]*/)[0]
          if (fn.genericParams.includes(generic)) {
            argType = argType.replaceAll('$' + generic, genericValue)
            generics[generic] = genericValue
          } else {
            errors.push({ errorType: 'INVALID_GENERIC',
                          argumentType: arg.type,
                          invalidGeneric: generic })
            return
          }
        }

        var matchParsed = parseType(match.type)
        var argParsed = parseType(argType)

        if (matchParsed.type == argParsed.type) {
          matchParsed.params.forEach((param) => {
            if (!argParsed.params.includes(param) && !extraParams.includes(param)) {
              extraParams.push(param)
            }
          })
          if (extraParams.length && !allowParams) {
            errors.push({ errorType: 'UNEXPECTED_PARAMS',
                          argumentName: arg.name,
                          expectedType: arg.type,
                          actualType: match.type,
                          generics: generics})
          }
        } else {
          errors.push({ errorType: 'ARGUMENT_WRONG_TYPE_2',
                        argumentName: arg.name,
                        expectedType: arg.type,
                        actualType: match.type,
                        generics: generics})
        }
      })
      // Use the default value if there's no value.
      if (!arg.repeated && arg.defaultValue !== undefined && !matches.length) {
        matches.push(literalNode(arg.type, arg.defaultValue))
      }
      // Check that we have exactly one if it's not repeated.
      if (!arg.repeated && matches.length != 1) {
        errors.push({ errorType: 'ARGUMENT_WRONG_COUNT',
                      argumentName: arg.name,
                      count: matches.length })
      }

      matchedArgs.push({
        arg: arg,
        matches: matches})
    })
    // Check there are no remaining args.
    availableArgs.forEach((arg) => {
      errors.push({ errorType: 'UNUSED_ARGUMENT',
                    argumentType: arg.type})
    })

    if (errors.length > 0) {
      failedMatches.push({fn: fn, errors: errors})
    } else {
      var outputType = fn.outputType
      for (const generic of Object.keys(generics)) {
        outputType = outputType.replaceAll('$' + generic, generics[generic])
      }
      successfulMatches.push({fn: fn, args: matchedArgs, extraParams: extraParams, outputType: outputType, generics: generics})
    }
  })
  if (successfulMatches.length > 1) {
    return {errors: [{ errorType: 'AMBIGUOUS_CALL',
                       functionName: functionName,
                       successfulMatches: successfulMatches}]}
  }
  if (successfulMatches.length == 0) {
    return {errors: [{ errorType: 'NO_MATCHING_FUNCTION',
                       functionName: functionName,
                       failedMatches: failedMatches}]}
  }
  var fn = successfulMatches[0].fn
  var args = successfulMatches[0].args
  var generics = successfulMatches[0].generics
  var outputType = parseType(successfulMatches[0].outputType)
  successfulMatches[0].extraParams.forEach((param) => {
    if (!outputType.params.includes(param)) {
      outputType.params.push(param)
    }
  })

  var mutations = [...(new Set(args.map((arg) => arg.mutations).flat()))]
  if (fn.mutations) {
    fn.mutations.forEach((mut) => {
      if (!mutations.includes(mut)) {
        mutations.push(mut)
      }
    })
  }
  
  return {
    type: outputType.type + (outputType.params.length > 0 ? '(' + outputType.params.join(', ') + ')' : ''),
    value: function(inParams, ctx) {
      var argsToUse = []
      for (var i = 0; i < fn.args.length; i++) {
        var evalFn = (match) => {
          if (fn.args[i].serialized) {
            return match.serialize()
          }
          if (fn.args[i].lazy) {
            return match
          }
          return match.value(inParams, ctx)
        }
        if (fn.args[i].repeated) {
          argsToUse.push(args[i].matches.map(evalFn))
        } else {
          argsToUse.push(evalFn(args[i].matches[0]))
        }
      }
      var outputType = parseType(fn.outputType)
      outputType.params.forEach((param) => {
        argsToUse.push(inParams[param])
      })
      if (fn.usesContext) {
        argsToUse.push(ctx)
      }
      if (fn.usesGenericTypes) {
        argsToUse.push(generics)
      }

      return fn.implementation(...argsToUse)
    },
    serialize: function() {
      return {
        type: 'Function',
        name: functionName,
        args: args.map((arg) => arg.matches[0].serialize()),
      }
    },
    mutations: mutations,
  }
}

function activityNode(activityId) {
  var code = activityCode.parse(activityId)
  if (code) {
    return {
      type: 'Activity',
      value: (inParams, ctx) => code,
      serialize: () => { return { type: 'Activity', activityId: activityId } },
      mutations: [],
    }
  } else {
    return {
      errorType: 'INVALID_ACTIVITY_ID',
      activityId: activityId,
    }
  }
}

function parseNode(node, allFunctions, allowParams) {
  var out = (() => {
    switch (node.type) {
      case 'Function':
        return functionNode(node.name, allFunctions,
                            node.args.map((arg) => parseNode(arg, allFunctions, true)), allowParams)
      case 'Number':
        return literalNode('Number', node.value)
      case 'String':
        return literalNode('String', node.value)
      case 'Activity':
        return activityNode(node.activityId)
      case 'AttemptResult':
        return literalNode('AttemptResult', attemptResult.parseString(node.value))
    }
  })()
  if (out.errors) {
    return out
  }
  return out
}     

module.exports = {
  parseNode: parseNode,
  parseType: parseType,
}
