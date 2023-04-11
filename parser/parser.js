const fs = require('fs/promises')
const peggy = require('peggy')

const driver = require('./driver')

async function parse(text, req, res, ctx, allowParams) {
  if (!req.parser) {
    const data = await fs.readFile('parser/grammar.pegjs')
    try {
      req.parser = peggy.generate(data.toString())
    } catch (err) {
      console.log(err)
      var line = data.toString().split('\n')[err.location.start.line - 1]
      return { errors: [{ type: 'GrammarParseError', data: { line: line, location: err.location } }] }
    }
    try {
      const tree = req.parser.parse(text, {startRule: "Input"})
    } catch (err) {
      console.log(err)
      var line = text.split('\n')[err.location.start.line - 1]
      return { errors: [{ type: 'InputParseError', data: { line: line, location: err.location } }] }
    }
    return tree.map((expr) => driver.parseNode(expr, ctx, allowParams))
  }
}

module.exports = {
  parse: parse,
}
