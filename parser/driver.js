const activityCode = require('./../activity_code')
const attemptResult = require('./../attempt_result')
const extension = require('./../extension')

function parseType(type) {
  var parsed = type.match(/([\$a-zA-Z][a-zA-Z0-9<>]*)\((.*)\)/)
  return {
    type: parsed ? parsed[1] : type,
    params: parsed ? parsed[2].split(',').map((x) => { return { type: x.trim() } } ) : [],
  }
}

function typesMatch(typeA, typeB) {
  if (typeA.type !== typeB.type && typeA.type !== 'Any' && typeB.type !== 'Any') {
    return false
  }
  return true
}

function literalNode(type, value) {
  var serialized = (() => {
    switch (type) {
      case 'AttemptResult':
        return value.value.toString()
      case 'String':
        return value
      default:
        if (value == null) {
          return null
        }
        return value.toString()
    }
  })()
  return {
    type: { type, params: [] },
    value: (inParams, ctx) => value,
    serialize: () => { return { type: type, value: serialized } },
    mutations: [],
  }
}

function udfNode(udf, ctx, args, allowParams) {
  // TODO: check the arguments.
  var oldUdfArgs = ctx.udfArgs;
  ctx.udfArgs = {}
  for (const [idx, arg] of args.entries()) {
    ctx.udfArgs[idx + 1] = arg
    if (arg.type == 'UdfArg') {
      ctx.udfArgs[idx + 1] = oldUdfArgs[arg.argNum]
    }
  }
  var out = parseNode(udf.impl, ctx, allowParams)
  out.serialize = () => {
    return {
      type: 'Function',
      name: udf.name,
      args: args,
    }
  }
  ctx.udfArgs = oldUdfArgs
  return out
}

function substituteExisting(type, generics) {
  for (const generic of Object.keys(generics)) {
    type.type = type.type.replaceAll('$' + generic, generics[generic])
    type.params.forEach((param) => {
      param.type = param.type.replaceAll('$' + generic, generics[generic])
    })
  }
}

function extractOne(typeString, expectedString, fn, generics, errors) {
  var idx = typeString.indexOf('$')
  if (expectedString.substring(0, idx) !== typeString.substring(0, idx)) {
    errors.push({ errorType: 'ARGUMENT_WRONG_TYPE_1',
                  expectedType: expectedString,
                  actualType: typeString,
                  generics: generics})
    return {}
  }
  var generic = typeString.substring(idx + 1).match(/^[a-zA-Z0-9]*/)[0]
  var genericValue = expectedString.substring(idx).match(/^[a-zA-Z]*/)[0]
  if (fn.genericParams && fn.genericParams.includes(generic)) {
    typeString = typeString.replaceAll('$' + generic, genericValue)
    if (genericValue !== 'Any') {
      generics[generic] = genericValue
    }
  } else {
    errors.push({ errorType: 'INVALID_GENERIC',
                  argumentType: typeString,
                  invalidGeneric: generic })
    return {}
  }
  return { generic: generic, value: genericValue }
}

function substituteGenerics(typeWithGenerics, matchType, fn, generics, errors) {
  substituteExisting(typeWithGenerics, generics)

  while (typeWithGenerics.type.indexOf('$') >= 0) {
    var newGeneric = extractOne(typeWithGenerics.type, matchType.type, fn, generics, errors)
    if (errors.length > 0) {
      return
    }
    substituteExisting(typeWithGenerics, { [newGeneric.generic]: newGeneric.value })
    generics[newGeneric.generic] = newGeneric.value
  }
  if (typeWithGenerics.type !== matchType.type) {
    errors.push({ errorType: 'UNEXPECTED_TYPE',
                  expectedType: matchType,
                  gotType: typeWithGenerics })
    return
  }
  matchType.params.forEach((param) => {
    if (typeWithGenerics.params.map((param) => param.type).includes(param.type)) {
      return
    }
    var paramsWithGeneric = typeWithGenerics.params.filter((p) => p.type.indexOf('$') >= 0)
    if (paramsWithGeneric.length == 0) {
      return
    }
    var paramWithGeneric = paramsWithGeneric[0]
    while (paramWithGeneric.type.indexOf('$') >= 0) {
      var newGeneric = extractOne(paramWithGeneric.type, param.type, fn, generics, errors)
      if (errors.length > 0) {
        return
      }
      substituteExisting(typeWithGenerics, { [newGeneric.generic]: newGeneric.value })
      generics[newGeneric.generic] = newGeneric.value
    }
  })
}

function functionNode(functionName, allFunctions, args, allowParams=true) {
  var matchingFunctions = allFunctions.filter((fn) => fn.name == functionName)
  var errors = args.filter((arg) => !!arg.errors).map((arg) => arg.errors).flat()
  if (!matchingFunctions.length) {
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
      var matchIdxs = []
      for (var argIdx = 0; argIdx < availableArgs.length; argIdx++) {
        if (availableArgs[argIdx].argName == arg.name) {
          matchIdxs.push(argIdx)
        }
      }
      // Otherwise, pick the first arg, or all remaining unnamed args if it's repeated.
      for (var argIdx = 0; argIdx < availableArgs.length; argIdx++) {
        if (!availableArgs[argIdx].argName && (arg.repeated || !matchIdxs.length)) {
          matchIdxs.push(argIdx)
        }
      }
      var alreadyUsed = 0
      var matches = []
      // Check that all args are the right type.
      matchIdxs.forEach((matchIdx) => {
        var match = availableArgs[matchIdx - alreadyUsed];
        if ('errorType' in match) {
          errors.push(match)
          return
        }
        var matchErrors = [];
        var argType = parseType(arg.type)
        var matchType = match.type
        substituteGenerics(argType, match.type, fn, generics, matchErrors)

        if (typesMatch(matchType, argType)) {
          matchType.params.forEach((param) => {
            if (!argType.params.map(p => p.type).includes(param.type) &&
                !extraParams.map(p => p.type).includes(param.type)) {
              var requestedBy = (param.requestedBy !== undefined) ? param.requestedBy : functionName
              extraParams.push({ type: param.type, requestedBy: requestedBy })
            }
          })
          if (extraParams.length && !allowParams) {
            matchErrors.push({ errorType: 'UNEXPECTED_PARAMS',
                               argumentName: arg.name,
                               expectedType: argType,
                               actualType: match.type,
                               generics: generics})
          }
        } else {
          matchErrors.push({ errorType: 'ARGUMENT_WRONG_TYPE_2',
                             argumentName: arg.name,
                             expectedType: arg.type,
                             actualType: match.type,
                             generics: generics})
        }
        if (!matchErrors.length) {
          matches.push(match)
          availableArgs.splice(matchIdx - alreadyUsed, 1)
          alreadyUsed += 1
        } else {
          if (!arg.canBeExternal) {
            errors = errors.concat(matchErrors)
          }
        }
      })
      // Use the default value if there's no value.
      if (!arg.repeated && arg.defaultValue !== undefined && !matches.length) {
        matches.push(literalNode(arg.type, arg.defaultValue))
      }
      var isExternal = false
      // Check that we have exactly one if it's not repeated.
      if (!arg.repeated && matches.length == 0) {
        if (arg.canBeExternal) {
          if (!extraParams.map(p => p.type).includes(arg.type)) {
            extraParams.push({ type: arg.type, requestedBy: functionName })
          }
          isExternal = true
        } else {
          errors.push({ errorType: 'ARGUMENT_MISSING',
                        argument: arg })
        }
      } else if (!arg.repeated && matches.length > 1) {
        errors.push({ errorType: 'ARGUMENT_WRONG_COUNT',
                      argumentName: arg.name,
                      count: matches.length })
      }

      matchedArgs.push({
        arg: arg,
        matches: matches,
        isExternal: isExternal})
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

  var mutations = [...(new Set(args.filter((arg) => !!arg.mutations).map((arg) => arg.mutations).flat()))]
  if (fn.mutations) {
    fn.mutations.forEach((mut) => {
      if (!mutations.includes(mut)) {
        mutations.push(mut)
      }
    })
  }

  return {
    type: outputType,
    value: function(inParams, ctx) {
      var argsToUse = []
      if (fn.usesContext) {
        argsToUse.push(ctx)
      }
      if (fn.usesGenericTypes) {
        argsToUse.push(generics)
      }

      var returnNull = false
      for (var i = 0; i < fn.args.length; i++) {
        var evalFn = (match) => {
          if (fn.args[i].serialized) {
            return match.serialize()
          }
          if (fn.args[i].lazy) {
            return (newParams) => {
              var mergedParams = {}
              Object.assign(mergedParams, inParams)
              Object.assign(mergedParams, newParams)
              return match.value(mergedParams, ctx)
            }
          }
          var value = match.value(inParams, ctx)
          if (value === null && !fn.args[i].nullable) {
            returnNull = true
          }
          return value
        }
        if (fn.args[i].repeated) {
          argsToUse.push(args[i].matches.map(evalFn))
        } else if (args[i].isExternal) {
          argsToUse.push(inParams[args[i].arg.type])
        } else {
          argsToUse.push(evalFn(args[i].matches[0]))
        }
      }
      if (returnNull) {
        return null
      }
      var outputType = parseType(fn.outputType)
      outputType.params.forEach((param) => {
        argsToUse.push(inParams[param.type])
      })

      return fn.implementation(...argsToUse)
    },
    serialize: function() {
      return {
        type: 'Function',
        name: functionName,
        args: args.map((arg) => arg.matches.map((match) => {
          var out = match.serialize()
          out.argName = arg.name
          return out
        })).flat(),
      }
    },
    mutations: mutations,
  }
}

function activityNode(activityId) {
  var code = activityCode.parse(activityId)
  if (code) {
    var type = code.roundNumber ? 'Round' : 'Event';
    return {
      type: { type, params: [] },
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

function savedUdfArgNode(argNum, argType, ctx) {
  return parseNode(ctx.udfArgs[argNum], ctx, true)
}

function udfArgNode(argNum, argType, ctx) {
  return {
    type: {type: argType, params: [] },
    value: (inParams, ctx) => {
      throw new Error("UDF args should only be used inside Define().")
    },
    serialize: () => { return { type: 'SavedUdfArg', argNum: argNum, argType: argType } },
    mutations: [],
  }
}

function parseNode(node, ctx, allowParams) {
  var out = (() => {
    switch (node.type) {
      case 'Function':
        var ext = extension.getExtension(ctx.competition, 'Competition')
        if (node.name in (ext.udf || {})) {
          return udfNode(ext.udf[node.name], ctx, node.args, allowParams)
        }
        return functionNode(node.name, ctx.allFunctions,
                            node.args.map((arg) => parseNode(arg, ctx, true)),
                            allowParams)
      case 'Number':
        return literalNode('Number', node.value)
      case 'String':
        return literalNode('String', node.value)
      case 'Boolean':
        return literalNode('Boolean', node.value)
      case 'Activity':
        return activityNode(node.activityId)
      case 'AttemptResult':
        return literalNode('AttemptResult', attemptResult.parseString(node.value))
      case 'UdfArg':
        return udfArgNode(node.argNum, node.argType, ctx)
      case 'SavedUdfArg':
        return savedUdfArgNode(node.argNum, node.argType, ctx)
    }
  })()
  if (!!out.errors) {
    return out
  }
  if (!!node.argName) {
    out.argName = node.argName
  }
  return out
}

module.exports = {
  parseNode: parseNode,
  parseType: parseType,
}
