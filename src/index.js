/* eslint-disable no-unused-vars */
const { BaseKonnector, requestFactory, log } = require('cozy-konnector-libs')
const { NextcloudClient } = require('./nextcloudClient')
const VCardParser = require('cozy-vcard')

const request = requestFactory({
  // debug: true,
  cheerio: false,
  json: true,
  jar: true
})

const cozyVCardParser = {
  parse: data => {
    const parser = new VCardParser(data)
    return parser.contacts
  }
}

module.exports = new BaseKonnector(start)

async function start(fields, cozyParameters) {
  log('info', 'Authenticating ...')
  if (cozyParameters) log('debug', 'Found COZY_PARAMETERS')
  const userCookies = await authenticate.bind(this)(fields)
  log('info', 'Successfully logged in')
  const userContacts = await getUserContacts.bind(this)(fields, userCookies)
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
  for (const cookie of cookies) {
    if (cookie.startsWith('nc_username')) {
      userNumber = cookie.split('=')[1]
    }
  }
  return userNumber
}

async function getUserContacts(fields, userNumber) {
  log('info', 'getUserContacts starts')
  const ncClient = new NextcloudClient({ fields, userNumber })
  const client = ncClient.createClient()
  const contactsVCards = await ncClient.getUserContacts(client)
  let parsedContacts = []
  for (const contactVCard of contactsVCards) {
    const contact = cozyVCardParser.parse(contactVCard)
    if (contact[0].n.match(';;;')) {
      contact[0].n = contact[0].n.replace(/;;;/g, '').replace(';', ' ').trim()
    }
    parsedContacts.push(contact[0])
  }
  return parsedContacts
}
