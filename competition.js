const express = require('express')

const auth = require('./auth')

var router = express.Router()

router.use('/:competitionId', async (req, res, next) => {
  try {
    req.competition = await auth.getWcaApi('/api/v0/competitions/' + req.params.competitionId + '/wcif', req, res)
    next()
  } catch (e) {
    res.redirect('/')
  }
})

router.get('/:competitionId', (req, res) => {
  res.render('competition', {competition: req.competition})
})

router.get('/:competitionId/schedule', (req, res) => {
  res.render('schedule', {competition: req.competition})
})

module.exports = {
  router: router
}
