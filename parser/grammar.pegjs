Expression
  = fn:Variable "(" args:ArgList ")" { return { type: 'FUNCTION', name: fn, args: args } }
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

Array
  = "[" vals:ArgList "]" { return { type: 'FUNCTION', name: 'MakeArray', args: vals } }
