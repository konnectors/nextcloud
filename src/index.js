/* eslint-disable no-unused-vars */
const {
  BaseKonnector,
  requestFactory,
  scrape,
  log,
  utils
} = require('cozy-konnector-libs')
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
  await authenticate.bind(this)(fields)
  log('info', 'Successfully logged in')
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
}
