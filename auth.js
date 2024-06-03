const express = require('express')
const { Issuer, custom } = require('openid-client')
const fs = require('fs')
const fse = require('fs-extra')

fse.ensureDirSync('.wcif_cache/' + process.env.ENV)

custom.setHttpOptionsDefaults({
  timeout: 240000,
});

var router = express.Router()

function cachePath(competitionId) {
  return '.wcif_cache/' + process.env.ENV + '/' + competitionId
}

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

async function getWcif(competitionId, req, res) {
  var shouldFetch = false
  try {
    var stat = fs.statSync(cachePath(competitionId))
    if (stat.mtimeMs < Date.now() - 6 * 60 * 60 * 1000) {
      shouldFetch = true
    }
  } catch (e) {
    shouldFetch = true
  }
  if (shouldFetch) {
    console.log('fetching WCIF')
    var wcif = await getWcaApi('/api/v0/competitions/' + competitionId + '/wcif', req, res)
    fs.writeFileSync(cachePath(competitionId), JSON.stringify(wcif))
    console.log('fetched WCIF')
    return wcif
  } else {
    console.log('reading cached WCIF')
    var wcif = fs.readFileSync(cachePath(competitionId))
    return JSON.parse(wcif)
  }
}

function wcaUrl(path) {
  var host = process.env.WCA_HOST
  if (process.env.USE_CDN) {
    host = (path.startsWith('api/v0') || path.startsWith('/api/v0')) ? process.env.WCA_CDN_HOST : process.env.WCA_HOST
    path = path.replace('api/v0', '')
  }
  return `${host}/${path}`
}

async function getWcaApi(resourceUrl, req, res) {
  if (!req.session.refreshToken) {
    return Promise.resolve(null)
  }
  var tokenSet = await client.refresh(req.session.refreshToken)
  req.session.refreshToken = tokenSet.refresh_token
  var url = wcaUrl(resourceUrl)
  console.log(`starting call ${url}`)
  var out = await client.requestResource(url, tokenSet.access_token)
  console.log('ending call')
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
        wcaUrl(`/api/v0/competitions/${obj.id}/wcif`),
        tokenSet.access_token,
        {method: 'PATCH',
         body: JSON.stringify(toPatch),
         headers: {'Content-Type': 'application/json'}})
  if (out.statusCode !== 200) {
    throw new Error(out.body.toString())
  }
  // This automatically clears the cache.
  try {
    fs.unlinkSync(cachePath(obj.id))
  } catch(e) {
    console.log(e)
  }
  return JSON.parse(out.body.toString());
}

async function patchWcifWithRetries(obj, keys, req, res) {
  var i = 0
  while (i < 10) {
    try {
      return await patchWcif(obj, keys, req, res)
    } catch (e) {
      if (i == 9) {
        throw e
      }
      if (e.code == 'ECONNRESET') {
        i += 1
        continue
      }
      throw e
    }
  }
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
      console.log(e)
      // Refresh token doesn't work, go to login flow.
    }
  }
  if (req.body.script) {
    req.session.script = req.body.script
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
  getWcif: getWcif,
  redirectIfNotLoggedIn: redirectIfNotLoggedIn,
  patchWcif: patchWcif,
  patchWcifWithRetries: patchWcifWithRetries,
  cachePath: cachePath,
}
