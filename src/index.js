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
  cheerio: true,
  json: false,
  jar: true
})

const VENDOR = 'nextcloud.cozycloud.cc'
const baseUrl = 'https://nextcloud.cozycloud.cc'

module.exports = new BaseKonnector(start)

async function start(fields, cozyParameters) {
  log('info', 'Authenticating ...')
  if (cozyParameters) log('debug', 'Found COZY_PARAMETERS')
  await authenticate.bind(this)(fields.login, fields.password)
  log('info', 'Successfully logged in')
  log('info', 'Fetching the list of documents')
  log('info', 'Parsing list of documents')
  const documents = await parseDocuments()
  log('info', 'Saving data to Cozy')
  await this.saveBills(documents, fields, {
    identifiers: ['nextcloud']
  })
}

function authenticate(username, password) {}

function parseDocuments() {}
