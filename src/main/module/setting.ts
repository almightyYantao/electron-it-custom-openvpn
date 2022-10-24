import { app, ipcMain, IpcMainEvent } from 'electron'
import { xiaokuDebug } from '../common/log'
import db from '../store/config'
import * as vpnDb from '../store/vpn'
import { BASE, VPN_ENUM } from '../common/enumeration'

/**
 * 设置语言
 */
ipcMain.on('setLocalLanguage', (_event: IpcMainEvent, language: string) => {
  db.set(BASE.LOCAL_LANGUAGE, language)
})

/**
 * 获取语言
 */
ipcMain.on('getLocalLanguage', (_event: IpcMainEvent) => {
  _event.sender.send('getLocalLanguage', db.get(BASE.LOCAL_LANGUAGE).value())
})

/**
 * 刷新界面
 */
ipcMain.on('relaunch', () => {
  vpnDb.default.set(VPN_ENUM.NORMALLY_CLOSED, true).write()
  global.mainWindow.reload()
})

/**
 * 开机自启
 */
ipcMain.on('setOpenAtLogin', (_event: IpcMainEvent, arg) => {
  xiaokuDebug(`开始设置开机启动: ${arg}`)
  if (!app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: arg,
      path: process.execPath
    })
  } else {
    app.setLoginItemSettings({
      openAtLogin: arg
    })
  }
  xiaokuDebug(String(app.getLoginItemSettings().openAtLogin))
})

/**
 * 设置端口
 */
ipcMain.on('set-vpn-port', (_event: IpcMainEvent, port: number) => {
  vpnDb.default.set(VPN_ENUM.VPN_PORT, port).write()
})

/**
 * 读取端口
 */
ipcMain.on('get-vpn-port', (_event: IpcMainEvent) => {
  _event.sender.send('get-vpn-port', vpnDb.default.get(VPN_ENUM.VPN_PORT).value())
})

/**
 * 打开调试窗口
 */
ipcMain.on('openDev', () => {
  global.mainWindow.webContents.openDevTools()
})
