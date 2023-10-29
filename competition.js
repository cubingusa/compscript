const express = require('express')
const { DateTime } = require('luxon')
const url = require('url')

const auth = require('./auth')
const activityCode = require('./activity_code')
const events = require('./events')
const extension = require('./extension')
const perf = require('./perf')
const pugFunctions = require('./pug_functions')
const functions = require('./functions/functions')
const driver = require('./parser/driver')
const parser = require('./parser/parser')

var router = express.Router()

router.use('/:competitionId', async (req, res, next) => {
  req.logger = new perf.PerfLogger()
  try {
    req.logger.start('fetch')
    req.competition = await auth.getWcif(req.params.competitionId, req, res)
    req.logger.stop('fetch')
    next()
  } catch (e) {
    console.log(e)
    res.redirect('/')
  }
})

router.get('/:competitionId', async (req, res) => {
  var script = ''
  if (req.query.script) {
    req.session.script = req.query.script
    res.redirect(url.parse(req.originalUrl).pathname)
    return
  }
  if (req.session.script) {
    script = req.session.script
    delete req.session.script
  }
  await runScript(req, res, script || req.query.script, true)
})

router.post('/:competitionId', async (req, res) => {
  await runScript(req, res, req.body.script, req.body.dryrun)
})

async function runScript(req, res, script, dryrun) {
  var logger = req.logger
  var params = {
    comp: req.competition,
    fn: pugFunctions,
    script: script,
    outputs: [],
    dryrun: dryrun,
    dryrunWarning: false,
  }
  if (script) {
    var ctx = {
      competition: req.competition,
      command: script,
      allFunctions: functions.allFunctions,
      dryrun: dryrun,
      logger,
    }
    try {
      ctx.logger.start('parse')
      var scriptParsed = await parser.parse(script, req, res, ctx, false)
      ctx.logger.stop('parse')
      var errors = []
      if (scriptParsed.errors) {
        errors = scriptParsed.errors
      } else {
        errors = scriptParsed.map((expr) => {
          if (expr.errors) {
            return expr.errors.map((err) => { return { type: 'Error', data: err } })
          }
          var outputType = expr.type
          if (outputType.params.length) {
            return { type: 'Error', data: { errorType: 'WRONG_OUTPUT_TYPE', type: outputType } }
          }
          return []
        }).flat()
      }
      if (errors.length) {
        params.outputs = errors
      } else {
        var mutations = []
        for (const expr of scriptParsed) {
          var outType = expr.type
          var out = await expr.value({}, ctx)
          params.outputs.push({type: outType.type, data: out})
          expr.mutations.forEach((mutation) => {
            if (!mutations.includes(mutation)) {
              mutations.push(mutation)
            }
          })
        }
        if (mutations.length) {
          if (dryrun) {
            params.dryrunWarning = true
          } else {
            ctx.logger.start('patch')
            await auth.patchWcif(ctx.competition, mutations, req, res)
            ctx.logger.stop('patch')
          }
        }
      }
    } catch (e) {
      params.outputs.splice(0, 0, {type: 'Exception', data: e.stack })
      console.log(e)
    }
  }
  logger.start('render')
  res.render('script', params)
  logger.stop('render')
  logger.log()
}

module.exports = {
  router: router
}
