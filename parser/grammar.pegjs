Expression
  = fn:Variable "(" args:ArgList ")" { return { type: 'FUNCTION', name: fn, args: args } }
  / NumberLiteral
  / ActivityLiteral
  / StringLiteral
  / rawVar:Variable { return { type: 'VARIABLE', name: rawVar } }
  
ArgList
  = head:Expression tail:(_ "," _ @Expression)* { return [head, ...tail] }

_ = [ \t]*

Variable
  = v:$([a-zA-Z][a-zA-Z0-9]*) { return v }
  
NumberLiteral
  = rawNumber:$[0-9]+ { return { type: 'NUMBER', value: +rawNumber } }
  
ActivityLiteral
  = "_" eventId:$[a-zA-Z0-9]* { return { type: 'ACTIVITY', activityId: eventId } }

StringLiteral
  = '"' rawString:$[^"]* '"' { return { type: 'STRING', value: rawString } }
