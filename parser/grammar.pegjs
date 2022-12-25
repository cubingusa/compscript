Expression
  = fn:Variable "(" _ args:ArgList _ ")" _ { return { type: 'Function', name: fn, args: args } }
  / AttemptResultLiteral
  / NumberLiteral
  / ActivityLiteral
  / StringLiteral
  / BinaryOperation
  / UdfArg
  / Array
  
ArgList
  = head:Expression tail:(_ "," _ @Expression)* { return [head, ...tail] }
  / "" { return [] }

_ = [ \t\n\r]*

Variable
  = v:$([a-zA-Z][a-zA-Z0-9]*) { return v }
  
NumberLiteral
  = rawNumber:$[0-9\.]+ { return { type: 'Number', value: +rawNumber } }
  
ActivityLiteral
  = "_" eventId:$[a-zA-Z0-9]* { return { type: 'Activity', activityId: eventId } }

StringLiteral
  = '"' rawString:$[^"]* '"' { return { type: 'String', value: rawString } }

AttemptResultLiteral
  = value:$([0-9][0-9\.:]*[mps]) { return { type: 'AttemptResult', value: value } }
  / "DNF" { return { type: 'AttemptResult', value: 'DNF' } }
  / "DNS" { return { type: 'AttemptResult', value: 'DNS' } }

BinaryOperation
  = "(" left:Expression _ "||" _ right:Expression ")" { return { type: 'Function', name: 'Or', args: [left, right] } }
  / "(" left:Expression _ "&&" _ right:Expression ")" { return { type: 'Function', name: 'And', args: [left, right] } }
  / "(" left:Expression _ ">" _ right:Expression ")" { return { type: 'Function', name: 'GreaterThan', args: [left, right] } }
  / "(" left:Expression _ "<" _ right:Expression ")" { return { type: 'Function', name: 'GreaterThan', args: [right, left] } }
  / "(" left:Expression _ ">=" _ right:Expression ")" { return { type: 'Function', name: 'GreaterThanOrEqualTo', args: [left, right] } }
  / "(" left:Expression _ ">" _ right:Expression ")" { return { type: 'Function', name: 'GreaterThanOrEqualTo', args: [right, left] } }
  / "(" left:Expression _ "==" _ right:Expression ")" { return { type: 'Function', name: 'EqualTo', args: [left, right] } }

Array
  = "[" vals:ArgList "]" { return { type: 'Function', name: 'MakeArray', args: vals } }

UdfArg
  = "<" argNum:$[0-9]* "," _ argType:$[a-zA-Z]* ">" { return { type: 'UdfArg', argNum: argNum, argType: argType} }
