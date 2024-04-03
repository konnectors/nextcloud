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

const request = requestFactory({
  cheerio: false,
  json: true,
  jar: true,
  debug: false
})

module.exports = new BaseKonnector(start)

async function start(fields) {
  const url = cleanUrl(fields.url)
  await checkIfIsNextcloud(url)
  const folderPath = await createSharedDrivesDirectory()
  await createShortcut.bind(this)(url, folderPath, fields.login)
}

async function checkIfIsNextcloud(url) {
  try {
    const checkReq = await request(`${url}/status.php`)

    if (checkReq?.productname === 'Nextcloud') {
      log('info', 'Nextcloud instance detected correctly')
    } else {
      log('error', 'Seems not a nextcloud instance')
      throw new Error(errors.LOGIN_FAILED)
    }
  } catch (e) {
    // Maybe an nextcloud specific error could be thrown here in future
    throw new Error(errors.LOGIN_FAILED)
  }
}

async function createShortcut(url, folderPath, login) {
  const instance = `${new URL(url).host}`
  await this.saveFiles(
    [
      {
        nextcloudInstance: instance,
        filename: `${instance} (Nextcloud).url`,
        filestream: `[InternetShortcut]\nURL=${url}`,
        fileAttributes: {
          metadata: {
            instance
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

function cleanUrl(rawUrl) {
  try {
    const url = new URL(rawUrl)
    return `https://${url.host}/`
    // We force usage of https here if the user forget it
    // We keep the port number if present
  } catch (e) {
    throw new Error(errors.LOGIN_FAILED)
  }
}
