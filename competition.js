const express = require('express')
const { DateTime } = require('luxon')
const url = require('url')
const compiler = require('c-preprocessor')

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
  await runScript(req, res, script || req.query.script, req.filename, true)
})

router.post('/:competitionId', async (req, res) => {
  await runScript(req, res, req.body.script, req.filename, req.body.dryrun)
})

async function runScript(req, res, script, filename, dryrun) {
  var logger = req.logger
  var params = {
    comp: req.competition,
    fn: pugFunctions,
    script: script,
    outputs: [],
    dryrun: dryrun,
    dryrunWarning: false,
  }
  if (filename) {
    script = `#include ${filename}
    ${script}`
  }
  if (script) {
    compiler.compile(script, {
      basePath: process.env.SCRIPT_BASE + '/',
      newLine: '\r\n',
    }, async (err, newScript) => {
      newScript = newScript.trim()
      if (err) {
        params.outputs = [{type: 'Error', data: err}]
        res.render('script', params)
        return
      }
      var ctx = {
        competition: req.competition,
        command: newScript,
        allFunctions: functions.allFunctions,
        dryrun: dryrun,
        logger,
      }
      try {
        ctx.logger.start('parse')
        var scriptResult = await parser.parse(newScript, req, res, ctx, false)
        ctx.logger.stop('parse')
        params.outputs = scriptResult.outputs
        if (scriptResult.mutations.length) {
          if (dryrun) {
            params.dryrunWarning = true
          } else {
            ctx.logger.start('patch')
            await auth.patchWcif(ctx.competition, scriptResult.mutations, req, res)
            ctx.logger.stop('patch')
          }
        }
      } catch (e) {
        params.outputs.splice(0, 0, {type: 'Exception', data: e.stack })
        console.log(e)
      }
      logger.start('render')
      res.render('script', params)
      logger.stop('render')
      logger.log()
    })
  } else {
    logger.start('render')
    res.render('script', params)
    logger.stop('render')
    logger.log()
  }

}

module.exports = {
  router: router
}
