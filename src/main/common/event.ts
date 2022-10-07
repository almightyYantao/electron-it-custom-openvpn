import { ipcMain, IpcMainEvent } from 'electron'
import db, { ConfigValue } from '../store/vpn'

/**
 * 获取VPN配置文件的一些参数
 */
ipcMain.on('vpnDbGet', (_event: IpcMainEvent, field: string) => {
  if (db !== null && db.data !== null) {
    _event.sender.send('vpnDbGet-' + field, Object.getOwnPropertyDescriptor(db.data, field)?.value)
  } else {
    _event.sender.send('vpnDbGet-' + field, 'slb')
  }
})

/**
 * 设置需要连接的VPN文件
 */
ipcMain.on('dbSet-connectConfig', (_event: IpcMainEvent, args: any) => {
  const value = args as ConfigValue
  if (db !== null) {
    db.data = { configValue: value.configValue }
    db.write()
  }
})
