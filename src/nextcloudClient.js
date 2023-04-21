const { createClient } = require('webdav')
const { log } = require('cozy-konnector-libs')
const xml2js = require('xml2js')

class NextcloudClient {
  constructor({ fields, userCookies }) {
    this.fields = fields
    this.userCookies = userCookies
  }
  createClient() {
    const client = createClient(
      `${this.fields.url}/remote.php/dav/addressbooks/users/${this.userCookies.userNumber}/default_shared_by_admin/`,
      { username: this.fields.login, password: this.fields.password }
    )
    return client
  }

  async getUserContacts(client) {
    log('info', 'getUserContacts starts')
    const resultContacts = await this.makeCustomRequest(client, '/')
    // const resultContacts = await client.customRequest('/', {
    //   method: 'PROPFIND',
    //   headers: {
    //     'Content-Type': 'text/xml'
    //   }
    // })
    // log('info', resultContacts)
    const contactsHref = []
    xml2js.parseString(resultContacts.data, function (err, result) {
      if (err) {
        log('warn', err)
        return
      }
      const nodes = result['d:multistatus']['d:response']
      for (const node of nodes) {
        contactsHref.push(node['d:href'][0])
      }
    })
    // Here we shifting the first element because it's just de base URL
    contactsHref.shift()
    const fullContactsVCARD = []
    let loop = 1
    for (const contactHref of contactsHref) {
      log('info', `contactHref is ${contactHref} at ${loop} loop`)
      const contactCode = contactHref.split('admin')[1]
      const fullContact = await this.makeCustomRequest(client, contactCode)
      loop++
      log('info', 'fullContact')
      fullContactsVCARD.push(fullContact)
    }

    // ON REPRENDS ICI LUNDI
    log('info', 'getUserContacts ends')
  }

  async makeCustomRequest(client, path) {
    log('info', 'makeCustomRequest starts')
    if (path === '/') {
      log('info', 'path is "/"')
      const result = await client.customRequest('/', {
        method: 'PROPFIND',
        headers: {
          'Content-Type': 'text/xml'
        }
      })
      return result
    }
    const result = await client.getFileContents(path, {
      format: 'text'
    })
    return result
  }
}

module.exports = { NextcloudClient }
