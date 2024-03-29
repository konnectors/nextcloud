const { log, cozyClient } = require('cozy-konnector-libs')

const { Q } = require('cozy-client')

onDeleteAccount().catch(err => {
  log(
    'error',
    `onDeleteAccount: An error occured during onDeleteAccount script: ${err.message}`
  )
})

async function onDeleteAccount() {
  log('info', 'onDeleteAccount: Removing url of instance')
  const cozyFields = JSON.parse(process.env.COZY_FIELDS)
  const filesQuery = Q('io.cozy.files')
    .where({
      'cozyMetadata.createdByApp': 'nextcloud',
      'cozyMetadata.sourceAccount': cozyFields.account,
      type: 'file'
    })
    .partialIndex({
      trashed: false
    })
    .indexFields([
      'cozyMetadata.createdByApp',
      'cozyMetadata.sourceAccount',
      'type'
    ])
  const files = await cozyClient.new.queryAll(filesQuery)
  if (files.length < 1) {
    log('warn', 'No link found to delete')
  }
  for (const file of files) {
    if (file.attributes.class === 'shortcut') {
      await cozyClient.new
        .collection('io.cozy.files')
        .deleteFilePermanently(file.id)
      log('info', 'Link to instance correctly deleted')
    }
  }
}
