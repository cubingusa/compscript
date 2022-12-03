const fs = require('fs/promises')
const peggy = require('peggy')

const driver = require('./driver')

async function parse(text, req, res) {
  if (!req.parser) {
    try {
      const data = await fs.readFile('grammar.pegjs')
      req.parser = peggy.generate(data)
    } catch (err) {
      return { errors: [err.toString()] }
    }
  }
  const tree = req.parser.parse(text)
  return node = driver.parseNode(tree)
}

module.exports = {
  parse: parse,
}
