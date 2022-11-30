const express = require('express')
const { Issuer, custom } = require('openid-client')

custom.setHttpOptionsDefaults({
  timeout: 10000,
});

var router = express.Router()

const wca = new Issuer({
  issuer: 'worldcubeassociation',
  authorization_endpoint: `${process.env.WCA_HOST}/oauth/authorize`,
  token_endpoint: `${process.env.WCA_HOST}/oauth/token`,
  userinfo_endpoint: `${process.env.WCA_HOST}/api/v0/me`
})

const redirect_uri = `${process.env.SCHEME}://${process.env.HOST}:${process.env.PORT}/auth/oauth_response`

const client = new wca.Client({
  client_id: process.env.API_KEY,
  client_secret: process.env.API_SECRET,
  response_type: 'code',
  redirect_uri: redirect_uri
})

async function getWcaApi(resourceUrl, req, res) {
  if (!req.session.refreshToken) {
    return Promise.resolve(null)
  }
  var tokenSet = await client.refresh(req.session.refreshToken)
  req.session.refreshToken = tokenSet.refresh_token
  var out = await client.requestResource(`${process.env.WCA_HOST}/${resourceUrl}`, tokenSet.access_token)
  return JSON.parse(out.body.toString());
}

async function patchWcif(obj, keys, req, res) {
  var tokenSet = await client.refresh(req.session.refreshToken)
  req.session.refreshToken = tokenSet.refresh_token
  var toPatch = {}
  keys.forEach((key) => {
    toPatch[key] = obj[key]
  })
  var out =
    await client.requestResource(
        `${process.env.WCA_HOST}/api/v0/competitions/${obj.id}/wcif`,
        tokenSet.access_token,
        {method: 'PATCH',
         body: JSON.stringify(toPatch),
         headers: {'Content-Type': 'application/json'}})
  return JSON.parse(out.body.toString());
}

router.get('/login', function(req, res) {
  const uri = client.authorizationUrl({
    scope: 'public manage_competitions'
  })
  if (req.get('Referer')) {
    req.session.redirect = req.get('Referer')
  }

  res.redirect(uri)
})

router.get('/oauth_response', async function(req, res) {
  const params = client.callbackParams(req)
  try {
    var tokenSet = await client.oauthCallback(redirect_uri, params);
    req.session.refreshToken = tokenSet.refresh_token;
    var url = req.session.redirect
    if (url) {
      req.session.redirect = null;
      res.redirect(url)
    } else {
      res.redirect('/')
    }
  } catch (e) {
    req.session.refreshToken = null;
    res.redirect('/')
  }
})

router.get('/logout', function(req, res) {
  res.clearCookie('userId')
  req.session.refreshToken = null;
  res.redirect('/')
})

async function redirectIfNotLoggedIn(req, res, next) {
  console.log(req.method + ' ' + req.path);
  if (req.path == '/auth/oauth_response') {
    next()
    return
  }
  if (req.session.refreshToken) {
    try {
      var me = await getWcaApi('/api/v0/me', req, res)
      next()
      return
    } catch (e) {
      console.log('error, redirecting')
      // Refresh token doesn't work, go to login flow.
    }
  }
  const uri = client.authorizationUrl({
    scope: 'public manage_competitions'
  })
  req.session.statusMessage = 'Refreshed oauth token'
  req.session.redirect = req.originalUrl;
  res.redirect(uri);
}

module.exports = {
  router: router,
  getWcaApi: getWcaApi,
  redirectIfNotLoggedIn: redirectIfNotLoggedIn,
  patchWcif: patchWcif,
}
