const activityCode = require('./../activity_code')

function parseType(type) {
  var parsed = type.match(/([a-zA-Z][a-zA-Z0-9]*)\((.*)\)/)
  return {
    type: parsed ? parsed[1] : type,
    params: parsed ? parsed[2].split(',').map((x) => x.trim()) : [],
  }
}

function literalNode(type, value) {
  return {
    type: type,
    value: (inParams) => value,
  }
}

function functionNode(functionName, allFunctions, args) {
  var matchingFunctions = allFunctions.filter((fn) => fn.name == functionName)
  var errors = args.filter((arg) => !!arg.error).map((arg) => arg.errors).flat()
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
        var matchParsed = parseType(match.type)
        var argParsed = parseType(arg.type)

        if (matchParsed.type == argParsed.type) {
          matchParsed.params.forEach((param) => {
            if (!argParsed.params.includes(param) && !extraParams.includes(param)) {
              extraParams.push(param)
            }
          })
        } else {
          errors.push({ errorType: 'ARGUMENT_WRONG_TYPE',
                        argumentName: arg.name,
                        expectedType: arg.type,
                        actualType: match.type })
        }
      })
      // Use the default value if there's no value.
      if (!arg.repeated && arg.defaultValue !== undefined && !matches) {
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
      successfulMatches.push({fn: fn, args: matchedArgs, extraParams: extraParams})
    }
  })
  if (successfulMatches.length > 1) {
    return {errors: [{ errorType: 'AMBIGUOUS_CALL',
                       functionName: functionName}]}
  }
  if (successfulMatches.length == 0) {
    return {errors: [{ errorType: 'NO_MATCHING_FUNCTION',
                       functionName: functionName,
                       failedMatches: failedMatches}]}
  }
  var fn = successfulMatches[0].fn
  var args = successfulMatches[0].args
  var outputType = parseType(fn.outputType)
  successfulMatches[0].extraParams.forEach((param) => {
    if (!outputType.params.includes(param)) {
      outputType.params.push(param)
    }
  })
  
  return {
    type: outputType.type + (outputType.params.length > 0 ? '(' + outputType.params.join(', ') + ')' : ''),
    value: function(inParams) {
      var argsToUse = []
      for (var i = 0; i < fn.args.length; i++) {
        if (fn.args[i].repeated) {
          argsToUse.push(args[i].matches.map((match) => match.value(inParams)))
        } else {
          argsToUse.push(args[i].matches[0].value(inParams))
        }
      }
      var outputType = parseType(fn.outputType)
      outputType.params.forEach((param) => {
        argsToUse.push(inParams[param])
      })

      return fn.implementation(...argsToUse)
    }
  }
}

function activityNode(activityId) {
  var code = activityCode.parse(activityId)
  if (code) {
    return literalNode('Activity', code)
  } else {
    return {
      errorType: 'INVALID_ACTIVITY_ID',
      activityId: activityId,
    }
  }
}

function parseNode(node, allFunctions, expectedType=undefined) {
  var out = (() => {
    switch (node.type) {
      case 'FUNCTION':
        return functionNode(node.name, allFunctions,
                            node.args.map((arg) => parseNode(arg, allFunctions)))
      case 'NUMBER':
        return literalNode('Number', node.value)
      case 'STRING':
        return literalNode('String', node.value)
      case 'ACTIVITY':
        return activityNode(node.value)
    }
  })()
  if (out.errors) {
    return out
  }
  if (!!expectedType && out.type !== expectedType) {
    return {
      errors: {
        errorType: 'WRONG_OUTPUT_TYPE', expected: expectedType, actual: out.outputType
      }
    }
  }
  return out
}     

module.exports = {
  parseNode: parseNode,
}
