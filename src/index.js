const {
  BaseKonnector,
  requestFactory,
  log,
  errors
} = require('cozy-konnector-libs')
const request = requestFactory({
  cheerio: false,
  json: true,
  jar: true,
  debug: true
})

module.exports = new BaseKonnector(start)

async function start(fields) {
  await checkIfIsNextcloud(fields.url)
  await createShortcut.bind(this)(fields.url)
  return
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

async function createShortcut(url) {
  await this.saveFiles(
    [
      {
        url,
        filename: `Nextcloud.url`,
        filestream: `[InternetShortcut]\nURL=${url}`,
        shouldReplaceFile: true
      }
    ],
    { folderPath: '/' },
    {
      identifier: ['shortcuts'],
      sourceAccount: 'Nextcloud',
      sourceAccountIdentifier: 'NextcloudConnector',
      fileIdAttributes: [`nextCloud ${url}`],
      //subPath: "/Applications de l'école"
    }
  )
}
