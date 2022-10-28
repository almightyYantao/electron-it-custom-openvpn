import { app, ipcMain, shell } from 'electron'
const fs = require('fs')
const path = require('path')
const JSZip = require('jszip')
const os = require('os')
const log = require('electron-log')
import cmd from 'child_process'
import db from '../store/vpn'
import { VPN_ENUM } from './enumeration'
import { EVENT_USER_DOWNLOAD_LOG } from '../../event'

log.transports.console.level = true
// 值得注意的是：输出到文件的时候，log.log的日志输出默认级别是warn。也就是说，最常被使用的info()是不会被输出的，这是个小坑。所以，可以使用下面的代码，修改输出到文件的时候，默认的输出日志级别。
log.transports.console.level = 'silly'
log.transports.console.format = '{h}:{i}:{s} {text}'
log.transports.file.fileName = 'xiaoku.log'
log.transports.file.maxSize = 1048576

export function xiaokuInfo(text: string): void {
  log.transports.file.fileName = 'xiaoku-info.log'
  log.info(text)
}

export function xiaokuError(text: string): void {
  log.transports.file.fileName = 'xiaoku-error.log'
  log.error(text)
}

export function xiaokuDebug(text: string): void {
  log.transports.file.fileName = 'xiaoku-debug.log'
  log.debug(text)
}

export function xiaokuOpenvpnConnectLog(text: string, configName: string): void {
  log.transports.file.fileName = 'xiaokuOpenvpnConnectLog-' + configName + '.log'
  log.info(text)
}

export default function xiaokuLog(level: string, text: any): void {
  switch (level) {
    case 'error':
      log.error(text)
      break
    case 'info':
      log.info(text)
      break
    case 'debug':
      log.debug(text)
      break
  }
}

ipcMain.on(EVENT_USER_DOWNLOAD_LOG, () => {
  log.transports.file.fileName = 'xiaoku-info.log'
  log.info('点击下载日志，下面记录基础信息')
  log.info('当前版本号: ', app.getVersion())
  log.info('当前系统型号: ', process.platform)
  if (process.platform === 'darwin') {
    const macVersion = cmd.execSync('sw_vers -productVersion', { encoding: 'utf-8' })
    log.info('当前系统版本: ', 'Mac OS' + '-' + macVersion)
  } else {
    const os = require('os')
    log.info('当前系统版本: ', os.type + '-' + os.version)
  }
  toZip('log')
})

/**
 * 把mtl文件和obj文件打包成zip压缩包
 * @param  {} fileName 不带文件后缀的文件名
 */
function toZip(fileName: string): void {
  const zip = new JSZip()
  try {
    zip.file('xiaoku-info.log', getFileContent('xiaoku-info.log'))
    zip.file('xiaoku-debug.log', getFileContent('xiaoku-debug.log'))
    zip.file('xiaoku-error.log', getFileContent('xiaoku-error.log'))
    zip.file(
      'xiaokuOpenvpnConnectLog-' + db.get(VPN_ENUM.CONFIG_VALUE).value() + '.log',
      getFileContent('xiaokuOpenvpnConnectLog-' + db.get(VPN_ENUM.CONFIG_VALUE).value() + '.log')
    )
    // 填充配置文件
    zip.file(
      'base-config.json',
      fs.readFileSync(path.join(app.getPath('userData'), '/base-config.json'), {
        encoding: 'utf-8'
      })
    )
    zip.file(
      'vpn.json',
      fs.readFileSync(path.join(app.getPath('userData'), '/vpn.json'), { encoding: 'utf-8' })
    )
    zip.file(
      'soft.json',
      fs.readFileSync(path.join(app.getPath('userData'), '/soft.json'), { encoding: 'utf-8' })
    )
  } catch (e) {
    xiaokuError(`获取文件内容失败: ${e}`)
  }

  // 压缩
  zip
    .generateAsync({
      // 压缩类型选择nodebuffer，在回调函数中会返回zip压缩包的Buffer的值，再利用fs保存至本地
      type: 'nodebuffer',
      // 压缩算法
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9
      }
    })
    .then(function (content) {
      const zip = fileName + '-' + new Date().getTime() + '.zip'
      // 写入磁盘
      fs.writeFile(getFullFileName(zip), content, function (err) {
        if (!err) {
          shell.showItemInFolder(`${getFullFileName(zip)}`)
        } else {
          xiaokuError(err)
          xiaokuError(zip + '压缩失败')
        }
      })
    })
}

/**
 * 获取文件内容
 * @param  {string} fileName 文件名 file.mtl
 */
function getFileContent(fileName): any {
  // 指定encoding会返回一个string，否则返回一个Buffer
  const content = fs.readFileSync(getFullFileName(fileName), { encoding: 'utf-8' })
  return content
}

/**
 * 获取完整文件路径
 * @param  {string} fileName 文件名 file.mtl
 */
function getFullFileName(fileName): string {
  let config = {
    // 文件根目录
    dir: path.join(os.homedir(), 'AppData', 'Roaming', 'xiaoku-helper', 'logs')
  }
  if (process.platform === 'darwin') {
    config = {
      // 文件根目录
      dir: `${os.homedir()}/Library/Logs/xiaoku-helper`
    }
  }
  return path.join(config.dir, fileName)
}

// /**
//  * 删除文件
//  * @param  {string} fileName 文件名 file.mtl
//  */
// function delFile(fileName): void {
//   fs.unlink(getFullFileName(fileName), function (err) {
//     if (err) {
//       console.log('删除文件失败:' + fileName)
//     }
//   })
// }
