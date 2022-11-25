const dotenv = require('dotenv')
dotenv.config()

const auth = require('./auth')
const competition = require('./competition')

const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const express = require('express')
const favicon = require('serve-favicon')

var app = express()

app.set('view engine', 'pug')
app.use(cookieSession({
  keys: [process.env.COOKIE_SECRET],
  maxAge: 5 * 24 * 60 * 60 * 1000 // 5 days
}))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(favicon(__dirname + '/static/favicon.ico'))
app.use(auth.redirectIfNotLoggedIn)
app.use('/auth', auth.router)
app.get('/', async function(req, res) {
  var startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  var competitions = await auth.getWcaApi('/api/v0/competitions?managed_by_me=true&start=' + startTime, req, res);
  res.render('index', {'competitions': competitions})
})
app.use(competition.router)

app.listen(process.env.PORT, function() {
  console.log('Server running at http://localhost:%d', process.env.PORT);
})
