/* eslint-disable no-unused-vars */
const {
  BaseKonnector,
  requestFactory,
  scrape,
  log,
  utils
} = require('cozy-konnector-libs')
const { NextcloudClient } = require('./nextcloudClient')

const request = requestFactory({
  // debug: true,
  cheerio: false,
  json: true,
  jar: true
})

module.exports = new BaseKonnector(start)

async function start(fields, cozyParameters) {
  log('info', 'Authenticating ...')
  if (cozyParameters) log('debug', 'Found COZY_PARAMETERS')
  const userCookies = await authenticate.bind(this)(fields)
  log('info', 'Successfully logged in')
  await getUserContacts.bind(this)(fields, userCookies)
}

async function authenticate(fields) {
  const loginPage = await request(`${fields.url}/login`)
  const requestToken = loginPage.match(/data-requesttoken="(.*)">/)[1]
  const postLoginPage = await request(`${fields.url}/login`, {
    method: 'POST',
    form: {
      user: fields.login,
      password: fields.password,
      timezone: 'Europe/Paris',
      timezone_offset: 2,
      requesttoken: requestToken
    },
    followRedirect: true,
    resolveWithFullResponse: true
  })
  if (postLoginPage.request.uri.href !== `${fields.url}/apps/dashboard/`) {
    log('warn', 'something went wrong with login')
    throw new Error('LOGIN_FAILED')
  }
  const cookies = postLoginPage.request.headers.cookie.split('; ')
  let userNumber
  let ncToken
  for (const cookie of cookies) {
    if (cookie.startsWith('nc_username')) {
      userNumber = cookie.split('=')[1]
    }
    if (cookie.startsWith('nc_token')) {
      ncToken = cookie.split('=')[1]
    }
  }
  log('info', ncToken)
  return { ncToken, userNumber }
}

async function getUserContacts(fields, userCookies) {
  log('info', 'getUserContacts starts')
  const ncClient = new NextcloudClient({ fields, userCookies })
  const client = ncClient.createClient()
  log('info', client)
  const XMLUserContacts = await ncClient.getUserContacts(client)
  // log('info', XMLUserContacts)
}
