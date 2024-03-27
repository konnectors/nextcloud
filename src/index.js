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
  debug: true
})

module.exports = new BaseKonnector(start)

async function start(fields) {
  const url = cleanUrl(fields.url)
  await checkIfIsNextcloud(url)
  const folderPath = await createSharedDrivesDirectory()
  await createShortcut.bind(this)(url, folderPath)
}

async function checkIfIsNextcloud(url) {
  const checkReq = await request(`${url}/status.php`)
  if (checkReq?.productname === 'Nextcloud') {
    log('info', 'Nextcloud instance detected correctly')
  } else {
    log('error', 'Seems not a nextcloud instance')
    throw new Error(errors.LOGIN_FAILED)
  }
}

async function createShortcut(url, folderPath) {
  const filename = `${new URL(url).host} (Nextcloud).url`
  await this.saveFiles(
    [
      {
        url,
        filename,
        filestream: `[InternetShortcut]\nURL=${url}`,
      }
    ],
    { folderPath },
    {
      validateFile: () => true,
      identifier: ['shortcuts'],
      fileIdAttributes: [`nextCloud ${url}`]
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
  const url = new URL(rawUrl)
  // We force usage of https here if the user forget it
  // We keep the port number if present
  return `https://${url.host}/`
}
