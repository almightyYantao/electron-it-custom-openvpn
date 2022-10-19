import { exec } from 'child_process'
import { ipcMain, IpcMainEvent } from 'electron'
import { INSTALL_APP } from '../common/enumeration'
import { xiaokuError, xiaokuInfo } from '../common/log'
import db from '../store/soft'
const fs = require('fs')
const { download } = require('electron-dl')

ipcMain.on('installAppStatus', (_event: IpcMainEvent) => {
  const success = db.get(INSTALL_APP.SUCCESS).value()
  _event.sender.send(
    'installAppStatus',
    success == null ? true : success,
    db.get(INSTALL_APP.PERCENT).value(),
    db.get(INSTALL_APP.ITEM).write()
  )
})

/**
 * 监听渲染层过来的安装软件
 */
ipcMain.on(
  'startInstallApp',
  (_event: IpcMainEvent, id: number, path: string, silent: string, item: any) => {
    db.set(INSTALL_APP.SUCCESS, false).write()
    db.set(INSTALL_APP.ITEM, item).write()
    xiaokuInfo(`开始下载文件:${path}`)
    download(global.mainWindow, path, {
      onProgress: (progress: any) => {
        db.set(INSTALL_APP.PERCENT, (progress.percent * 100).toFixed(2)).write()
        _event.sender.send('download-percent-' + id, (progress.percent * 100).toFixed(2))
      },
      onCompleted: (compile: any) => {
        db.set(INSTALL_APP.SUCCESS, true).write()
        xiaokuInfo(`${path}下载完成\n${JSON.stringify(compile)}`)
        if (process.platform != 'darwin') {
          autoInstall(_event, id, compile.path, silent)
        } else {
          _event.sender.send('download-success-' + id, 'success')
        }
      },
      onerror: () => {
        db.set(INSTALL_APP.SUCCESS, true).write()
      }
    })
  }
)

/**
 * 开始执行自动安装程序，执行完成后删除文件
 * @param {*} path
 * @param {*} silent
 */
function autoInstall(_event: IpcMainEvent, id: number, path: string, silent: string): void {
  let cmd = ''
  if (silent && silent != null) {
    cmd = `"${path}" ${silent}`
  } else {
    cmd = `"${path}"`
  }
  exec(cmd, (err: any, data: any, stderr: any) => {
    if (err) {
      _event.sender.send('download-success-' + id, '执行CMD命令失败:' + cmd)
    } else {
      _event.sender.send('download-success-' + id, 'success')
    }
    fs.unlink(path, function (err: any) {
      if (err) {
        xiaokuError(err)
      }
      xiaokuInfo('文件:' + path + '删除成功!')
    })
  })
}
