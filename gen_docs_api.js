const dotenv = require('dotenv')
const env = process.env.ENV || 'DEV'
dotenv.config({ path: '.env.' + env })

const functions = require('./functions/functions')
const categories = functions.categories.filter(c => c.name !== 'display')

const functionToAnchorName = (name, genericParams) => {
  if (typeof this.generated === 'undefined') {
    this.generated = []
  }
  const baseName = `${name.toLowerCase()}${genericParams ? genericParams.map(t => t.toLowerCase()).join('-') : ''}`
  let suffix = 1
  let generatedName = baseName
  while (this.generated.includes(generatedName)) {
    generatedName = `${baseName}-${suffix++}`
  }
  this.generated.push(generatedName)
  return generatedName
}

const functionName = (name, genericParams) => `${name}${genericParams ? `\\<${genericParams.join(', ')}>` : ''}`

const stringForArg = ({ name, type, defaultValue, nullable, canBeExternal, repeated, lazy, docs }) => {
  const properties = []
  if (nullable) {
    properties.push('(can be null)')
  }
  if (canBeExternal) {
    properties.push('(can be external)')
  }
  if (repeated) {
    properties.push('(variadic)')
  }
  if (lazy) {
    properties.push('(lazy evaluated)')
  }
  const propertiesString = properties.length > 0 ? ` *${properties.join('')}*` : ''
  const helpForArg = docs ? `

      ${docs}` : ''

  return `    - *${type.replace('<', '\\<')}* **${name}**${defaultValue !== undefined ? `=${defaultValue}`:''}${propertiesString}${helpForArg}`
}

const stringForFunction = ({ name, genericParams, docs, outputType, args, mutations}) => `
### ${functionName(name, genericParams)}

${docs || 'TODO'}

  - Args:${args.length === 0 ? ' none' : `\n${args.map(stringForArg).join('\n')}`}

  - Returns: **${outputType.replace('<', '\\<')}**

  - WCIF changes: **${mutations && mutations.length > 0 ? `${mutations.join(', ')}` : 'none'}**`

const documentation = categories.map(({ name, docs }) => {
  const functions = require(`./functions/${name}.js`).functions
  return `## ${name}

${docs || 'TODO'}

${functions.map(stringForFunction).join('\n')}
`
}).join('\n')

const tocFunction = ({ name, genericParams }) => `    - [${functionName(name, genericParams)}](#${functionToAnchorName(name, genericParams)})`
const toc = categories.map(({ name }) => {
  const functions = require(`./functions/${name}.js`).functions
  return `  - [${name}](#${name})
${functions.map(tocFunction).join('\n')}`
}).join('\n')

const { exec } = require('node:child_process')

exec('git log -1 --oneline | cut -d " " -f 1 | tr -d "\n"', (_, stdout ) => {

  console.log(`# CompScript API reference

*This documentation was automatically generated on commit [${stdout}](https://github.com/cubingusa/compscript/commit/${stdout}) with \`npm run gen-docs-api\`, don't edit this file directly.*

## Index

${toc}

${documentation}`)
})

