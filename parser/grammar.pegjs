Expression
  = fn:Variable "(" args:ArgList ")" { return { type: 'FUNCTION', name: fn, args: args } }
  / AttemptResultLiteral
  / NumberLiteral
  / ActivityLiteral
  / StringLiteral
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

Array
  = "[" vals:ArgList "]" { return { type: 'FUNCTION', name: 'MakeArray', args: vals } }
