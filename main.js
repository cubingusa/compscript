const dotenv = require('dotenv')
dotenv.config()

const auth = require('./auth')

const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const express = require('express')

var app = express()

app.use(cookieSession({
  keys: [process.env.COOKIE_SECRET],
  maxAge: 5 * 24 * 60 * 60 * 1000 // 5 days
}))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(auth.redirectIfNotLoggedIn)
app.use('/auth', auth.router)
app.get('/', function(req, res) {
  res.send('Hello world!')
})

app.listen(process.env.PORT, function() {
  console.log('Server running at http://localhost:%d', process.env.PORT);
})
