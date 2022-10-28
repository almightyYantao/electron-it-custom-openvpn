import { ipcMain, IpcMainEvent, shell } from 'electron'
import { EVENT_APP_OPEN_URL, EVENT_VPN_DB_GET, EVENT_VPN_DB_SET } from '../../event'
import db from '../store/vpn'

/**
 * 获取VPN配置文件的一些参数
 */
ipcMain.on(EVENT_VPN_DB_GET, (_event: IpcMainEvent, field: string) => {
  if (db !== null && db.data !== null) {
    _event.sender.send(EVENT_VPN_DB_GET + '-' + field, db.get(field).value())
  } else {
    _event.sender.send(EVENT_VPN_DB_GET + '-' + field, 'slb')
  }
})

/**
 * 设置需要连接的VPN文件
 */
ipcMain.on(EVENT_VPN_DB_SET, (_event: IpcMainEvent, field: string, value: any) => {
  if (db !== null) {
    console.log(field, value)
    db.set(field, value).write()
  }
})

/**
 * 浏览器打开链接
 */
ipcMain.on(EVENT_APP_OPEN_URL, (_event: IpcMainEvent, url: string) => {
  shell.openExternal(url)
})
