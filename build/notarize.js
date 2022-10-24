const { notarize } = require('electron-notarize')

module.exports = async (context) => {
  if (process.platform !== 'darwin') return

  console.log('aftersign hook triggered, start to notarize app.')

  console.log(process.env.CI, !process.env.CI, process.env.CI == 'false')

  if (!process.env.CI) {
    console.log(process.env.CI, `skipping notarizing, not in CI.`)
    return
  }

  if (process.env.CI == 'false') {
    console.log(process.env.CI, `skipping notarizing, not in CI.`)
    return
  }

  if (!('APPLE_ID' in process.env && 'APPLE_ID_PASS' in process.env)) {
    console.warn('skipping notarizing, APPLE_ID and APPLE_ID_PASS env variables must be set.')
    return
  }

  const appId = 'com.qunhe.its.app'

  const { appOutDir } = context

  const appName = context.packager.appInfo.productFilename

  try {
    await notarize({
      appBundleId: appId,
      appPath: `${appOutDir}/${appName}.app`,
      teamId: 'L839T6VMSZ',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASS
    })
  } catch (error) {
    console.error(error)
  }

  console.log(`done notarizing ${appId}.`)
}
