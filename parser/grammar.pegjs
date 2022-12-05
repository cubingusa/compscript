Expression
  = fn:Variable "(" args:ArgList ")" { return { type: 'FUNCTION', name: fn, args: args } }
  / AttemptResultLiteral
  / NumberLiteral
  / ActivityLiteral
  / StringLiteral
  / BinaryOperation
  / Array
  
ArgList
  = head:Expression tail:(_ "," _ @Expression)* { return [head, ...tail] }
  / "" { return [] }

_ = [ \t]*

Variable
  = v:$([a-zA-Z][a-zA-Z0-9]*) { return v }
  
NumberLiteral
  = rawNumber:$[0-9]+ { return { type: 'NUMBER', value: +rawNumber } }
  
ActivityLiteral
  = "_" eventId:$[a-zA-Z0-9]* { return { type: 'ACTIVITY', activityId: eventId } }

StringLiteral
  = '"' rawString:$[^"]* '"' { return { type: 'STRING', value: rawString } }

AttemptResultLiteral
  = value:$([0-9][0-9\.:]*[mps]) { return { type: 'ATTEMPT_RESULT', value: value } }
  / "DNF" { return { type: 'ATTEMPT_RESULT', value: 'DNF' } }
  / "DNS" { return { type: 'ATTEMPT_RESULT', value: 'DNS' } }

BinaryOperation
  = "(" left:Expression _ "||" _ right:Expression ")" { return { type: 'FUNCTION', name: 'Or', args: [left, right] } }
  / "(" left:Expression _ "&&" _ right:Expression ")" { return { type: 'FUNCTION', name: 'And', args: [left, right] } }
  / "(" left:Expression _ ">" _ right:Expression ")" { return { type: 'FUNCTION', name: 'GreaterThan', args: [left, right] } }
  / "(" left:Expression _ "<" _ right:Expression ")" { return { type: 'FUNCTION', name: 'GreaterThan', args: [right, left] } }
  / "(" left:Expression _ ">=" _ right:Expression ")" { return { type: 'FUNCTION', name: 'GreaterThanOrEqualTo', args: [left, right] } }
  / "(" left:Expression _ ">" _ right:Expression ")" { return { type: 'FUNCTION', name: 'GreaterThanOrEqualTo', args: [right, left] } }
  / "(" left:Expression _ "==" _ right:Expression ")" { return { type: 'FUNCTION', name: 'EqualTo', args: [left, right] } }

Array
  = "[" vals:ArgList "]" { return { type: 'FUNCTION', name: 'MakeArray', args: vals } }
