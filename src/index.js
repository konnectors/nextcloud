process.env.SENTRY_DSN =
  process.env.SENTRY_DSN ||
  'https://b94860ff2b1e890530cbc483c7cf5887@errors.cozycloud.cc/75'

const {
  BaseKonnector,
  requestFactory,
  log,
  errors,
  cozyClient
} = require('cozy-konnector-libs')

const cheerio = require('cheerio')
const request = requestFactory({
  cheerio: false,
  json: false,
  jar: true,
  debug: false
})

module.exports = new BaseKonnector(start)

async function start(fields) {
  const { instanceUrl, instanceName } = await checkAndcleanUrl(fields.url)
  const folderPath = await createSharedDrivesDirectory()
  await createShortcut.bind(this)(
    instanceUrl,
    instanceName,
    folderPath,
    fields.login
  )
}

async function createShortcut(url, instanceName, folderPath, login) {
  await this.saveFiles(
    [
      {
        nextcloudInstance: url,
        filename: `${instanceName} (Nextcloud).url`,
        filestream: `[InternetShortcut]\nURL=${url}`,
        fileAttributes: {
          metadata: {
            instanceName: instanceName
          }
        }
      }
    ],
    { folderPath },
    {
      validateFile: () => true,
      fileIdAttributes: ['nextcloudInstance'],
      sourceAccountIdentifier: login
    }
  )
}

async function createSharedDrivesDirectory() {
  // This call create if needed the directory and return the io.cozy.files
  const sharedDriveDir = await cozyClient.fetchJSON(
    'POST',
    `/files/shared-drives`
  )
  return sharedDriveDir.attributes.path
}

async function checkAndcleanUrl(rawUrl) {
  try {
    const url = new URL(rawUrl)
    // We force usage of https here if the user forget it or use http://
    // We keep the port number if present, we keep the path if present
    const userUrl = `https://${url.host}${url.pathname}`
    const loginReq = await request({
      uri: userUrl,
      resolveWithFullResponse: true
    })
    // We get now the login url
    const loginUrl = loginReq.request.uri.href
    // Removing the 'login' word in path because cozy-stack will need
    // the webdav endpoint
    let instanceUrl
    if (loginUrl.endsWith('login')) {
      // This method should garantee the usage of a subPath like
      // https://example.com/nextcloud/
      instanceUrl = loginUrl.slice(0, -5)
    } else if (loginUrl.includes('/saml/')) {
      // SAML auth activated. We keep the url provided as this.
      // Keep duplicate
      instanceUrl = userUrl
    } else {
      // By default use the url provided
      instanceUrl = userUrl
    }
    log('debug', `Instance url detected: ${instanceUrl}`)
    // Extracting instance Name
    let instanceName
    const $ = cheerio.load(loginReq.body)
    instanceName = $('meta[property="og:title"]').attr('content')

    // Try fallback for nextcloud with alternative auth
    // Ex: https://cloud.colleges.sib.fr
    if (instanceName === undefined) {
      instanceName = $('p.info')
        .html()
        .match(/–(.*)<br>/)[1]
        .trim()
    }
    log('debug', `Instance name detected: ${instanceName}`)
    // Confirming it is a nextcloud
    const checkReq = await request({
      uri: `${instanceUrl}/status.php`,
      json: true
    })
    if (checkReq?.productname === 'Nextcloud') {
      log('info', 'Nextcloud instance detected correctly')
    } else {
      log('error', 'Seems not a nextcloud instance')
      throw new Error(errors.LOGIN_FAILED)
    }
    return { instanceUrl, instanceName }
  } catch (e) {
    // Maybe a special error here on nextcloud url could be better understood
    throw new Error(errors.LOGIN_FAILED)
  }
}
