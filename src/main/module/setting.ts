import { app, ipcMain, IpcMainEvent } from 'electron'
import { xiaokuDebug } from '../common/log'
import db from '../store/config'
import * as vpnDb from '../store/vpn'
import { BASE, VPN_ENUM } from '../common/enumeration'
import {
  EVENT_SETTING_GET_LANGUAGE,
  EVENT_SETTING_GET_VPN_PORT,
  EVENT_SETTING_OPEN_DEV,
  EVENT_SETTING_RELAUNCH,
  EVENT_SETTING_SET_LANGUAGE,
  EVENT_SETTING_SET_OPENAT_LOGIN,
  EVENT_SETTING_SET_VPN_PORT
} from '../../event'

/**
 * 设置语言
 */
ipcMain.on(EVENT_SETTING_SET_LANGUAGE, (_event: IpcMainEvent, language: string) => {
  db.set(BASE.LOCAL_LANGUAGE, language)
})

/**
 * 获取语言
 */
ipcMain.on(EVENT_SETTING_GET_LANGUAGE, (_event: IpcMainEvent) => {
  _event.sender.send(EVENT_SETTING_GET_LANGUAGE, db.get(BASE.LOCAL_LANGUAGE).value())
})

/**
 * 刷新界面
 */
ipcMain.on(EVENT_SETTING_RELAUNCH, () => {
  vpnDb.default.set(VPN_ENUM.NORMALLY_CLOSED, true).write()
  global.mainWindow.reload()
})

/**
 * 开机自启
 */
ipcMain.on(EVENT_SETTING_SET_OPENAT_LOGIN, (_event: IpcMainEvent, arg) => {
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
ipcMain.on(EVENT_SETTING_SET_VPN_PORT, (_event: IpcMainEvent, port: number) => {
  vpnDb.default.set(VPN_ENUM.VPN_PORT, port).write()
})

/**
 * 读取端口
 */
ipcMain.on(EVENT_SETTING_GET_VPN_PORT, (_event: IpcMainEvent) => {
  _event.sender.send(EVENT_SETTING_GET_VPN_PORT, vpnDb.default.get(VPN_ENUM.VPN_PORT).value())
})

/**
 * 打开调试窗口
 */
ipcMain.on(EVENT_SETTING_OPEN_DEV, () => {
  global.mainWindow.webContents.openDevTools()
})
