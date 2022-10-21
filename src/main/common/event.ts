import { ipcMain, IpcMainEvent, shell } from 'electron'
import db, { ConfigValue } from '../store/vpn'

/**
 * 获取VPN配置文件的一些参数
 */
ipcMain.on('vpnDbGet', (_event: IpcMainEvent, field: string) => {
  if (db !== null && db.data !== null) {
    _event.sender.send('vpnDbGet-' + field, db.get(field).value())
  } else {
    _event.sender.send('vpnDbGet-' + field, 'slb')
  }
})

/**
 * 设置需要连接的VPN文件
 */
ipcMain.on('vpnDbSet', (_event: IpcMainEvent, field: string, value: any) => {
  if (db !== null) {
    console.log(field, value)
    db.set(field, value).write()
  }
})

/**
 * 浏览器打开链接
 */
ipcMain.on('open-url', (_event: IpcMainEvent, url: string) => {
  shell.openExternal(url)
})
