Input
 = head:Expression tail:Input { return [head].concat(tail) }
 / "" { return [] }

Expression
  = _ fn:Variable "(" _ args:ArgList _ ")" _ { return { type: 'Function', name: fn, args: args } }
  / AttemptResultLiteral
  / BooleanLiteral
  / NumberLiteral
  / ActivityLiteral
  / StringLiteral
  / BinaryOperation
  / UdfArg
  / Array
  
ArgList
  = head:Arg tail:(_ "," _ @Arg)* { return [head, ...tail] }
  / "" { return [] }

Arg
  = Expression
  / argName:$[a-zA-Z]+ "=" expr:Expression { expr.argName = argName; return expr }

Whitespace
  = [ \t]*

WhitespaceLine
  = Whitespace "#" ([^\n\r]*)?
  / Whitespace

_
  = WhitespaceLine $[\n\r]+ _
  / WhitespaceLine

Variable
  = v:$([a-zA-Z][a-zA-Z0-9]*) { return v }
  
NumberLiteral
  = rawNumber:$[\-0-9\.]+ { return { type: 'Number', value: +rawNumber } }
  
BooleanLiteral
  = "true" { return { type: 'Boolean', value: true } }
  / "false" { return { type: 'Boolean', value: false } }

ActivityLiteral
  = "_" activityId:$[a-zA-Z0-9-]* { return { type: 'Activity', activityId: activityId } }

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
  / "(" left:Expression _ "<=" _ right:Expression ")" { return { type: 'Function', name: 'GreaterThanOrEqualTo', args: [right, left] } }
  / "(" left:Expression _ "==" _ right:Expression ")" { return { type: 'Function', name: 'EqualTo', args: [left, right] } }
  / "(" left:Expression _ "+" _ right:Expression ")" { return { type: 'Function', name: 'Add', args: [left, right] } }
  / "(" left:Expression _ "-" _ right:Expression ")" { return { type: 'Function', name: 'Subtract', args: [left, right] } }

Array
  = "[" vals:ExpressionList "]" { return { type: 'Function', name: 'MakeArray', args: vals } }
  / "[" _ "]" { return { type: 'Function', name: 'MakeEmptyArray', args: [] } }

ExpressionList
  = head:Expression tail:(_ "," _ @Expression)* { return [head, ...tail] }

UdfArg
  = "{" argNum:$[0-9]* "," _ argType:$[a-zA-Z<>]* "}" { return { type: 'UdfArg', argNum: argNum, argType: argType} }
