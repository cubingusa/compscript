const tags = require('./tags')
const persons = require('./persons')
const activityCode = require('./../activity_code')

const allFunctions = [].concat(tags.functions, persons.functions)

function functionNode(functionName, args) {
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
        if (!availableArgs[argIdx].name && (arg.repeated || !matches)) {
          matches.push(availableArgs[argIdx])
          availableArgs.splice(argIdx, 1)
          argIdx--
        }
      }
      // Check that all args are the right type.
      matches.filter((match) => match.type != arg.type).forEach((match) => {
        errors.push({ errorType: 'ARGUMENT_WRONG_TYPE',
                      argumentName: arg.name,
                      expectedType: arg.type,
                      actualType: match.type })
      })
      // Use the default value if there's no value.
      if (!arg.repeated && arg.defaultValue !== undefined && !matches) {
        matches.push({ type: arg.type, value: () => arg.defaultValue })
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
      successfulMatches.push({fn: fn, args: matchedArgs})
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
  return {
    type: fn.outputType,
    value: function() {
      var argsToUse = []
      for (var i = 0; i < fn.args.length; i++) {
        if (fn.args[i].repeated) {
          argsToUse.push(args[i].matches.map((arg) => {
            if (fn.args[i].lazy) {
              return arg
            } else {
              return arg.value()
            }
          }))
        } else {
          if (fn.args[i].lazy) {
            argsToUse.push(args[i])
          } else {
            argsToUse.push(args[i].value())
          }
        }
      }
      return fn.implementation(...argsToUse)
    }
  }
}

function activityNode(activityId) {
  var code = activityCode.parse(activityId)
  if (code) {
    return {
      type: 'Activity',
      value: () => code,
    }
  } else {
    return {
      errorType: 'INVALID_ACTIVITY_ID',
      activityId: activityId,
    }
  }
}

function stringNode(value) {
  return {
    type: 'String',
    value: () => value,
  }
}

function numberNode(value) {
  return {
    type: 'Number',
    value: () => value,
  }
}

function parseNode(node) {
  switch (node.type) {
    case 'FUNCTION':
      return functionNode(node.name, node.args.map((arg) => parseNode(arg)))
    case 'NUMBER':
      return numberNode(node.value)
    case 'STRING':
      return stringNode(node.value)
    case 'ACTIVITY':
      return activityNode(node.value)
  }
}     

module.exports = {
  parseNode: parseNode,
}
