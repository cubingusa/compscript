const fs = require('fs/promises')
const peggy = require('peggy')

const driver = require('./driver')
const functions = require('./../functions/functions')

async function parse(text, req, res, expectedType=undefined) {
  if (!req.parser) {
    try {
      const data = await fs.readFile('parser/grammar.pegjs')
      req.parser = peggy.generate(data.toString())
      const tree = req.parser.parse(text)
      return driver.parseNode(tree, functions.allFunctions, expectedType=expectedType)
    } catch (err) {
      console.log(err)
      return { errors: [err.toString()] }
    }
  }
}

module.exports = {
  parse: parse,
}
