import { app, shell, BrowserWindow, Menu, Tray, ipcMain } from 'electron'
import * as path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
require('@electron/remote/main').initialize()
import './common/event'
import './module/openvpn'
import './module/network'
import './module/soft'
import './module/printer'
import './module/setting'
import './common/login'

import db from './store/config'
import * as vpnDb from './store/vpn'
import { BASE, VPN_ENUM } from './common/enumeration'
import { xiaokuError } from './common/log'

global.mainWindow = null
function createWindow(): void {
  // Create the browser window.
  global.mainWindow = new BrowserWindow({
    width: 960,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: 'hidden', // mac设置控制按钮在无边框窗口中的位置。
    trafficLightPosition: { x: 12, y: 6 },
    // 在windows上，设置默认显示窗口控制工具
    titleBarOverlay: { color: '#fff', symbolColor: 'black' },
    resizable: false,
    ...(process.platform === 'linux'
      ? {
          icon: path.join(__dirname, '../../build/icon.png')
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      // 官网似乎说是默认false，但是这里必须设置contextIsolation
      contextIsolation: false
    }
  })

  require('@electron/remote/main').enable(global.mainWindow.webContents)

  // globalShortcut.register('F12', function () {
  //   global.mainWindow.webContents.openDevTools()
  // })

  Menu.setApplicationMenu(null)
  updateHandle()

  global.mainWindow.on('ready-to-show', () => {
    global.mainWindow.show()
  })

  global.mainWindow.on('close', (event: { preventDefault: () => void }) => {
    event.preventDefault()
    if (global.mainWindow) {
      global.mainWindow.minimize()
    } else {
      app.exit()
    }
    // if (global.mainWindow && global.mainWindow.webContents) {
    //   event.preventDefault()
    //   showVpnConnectWindows()
    // } else {
    //   global.mainWindow.minimize()
    // }
  })

  global.mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    global.mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    global.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // 设置托盘图标
  let trayConfig: string | Electron.NativeImage
  if (process.platform === 'darwin') {
    trayConfig = path.join(db.get(BASE.APP_PATH).value(), '/icon/tray-mac.png')
  } else {
    trayConfig = path.join(db.get(BASE.APP_PATH).value(), '/icon/tray-win.png')
  }
  const appTray = new Tray(trayConfig)
  appTray.setToolTip('小酷助手VPN')
  //系统托盘右键菜单
  const trayMenuTemplate = [
    {
      label: '显示主页',
      click: function (): void {
        if (global.mainWindow.isMinimized()) {
          global.mainWindow.restore()
        } else {
          global.mainWindow.show()
        }
        global.mainWindow.setSkipTaskbar(false)
        global.mainWindow.focus()
      }
    },
    {
      label: '退出',
      click: function (): void {
        showVpnConnectWindows()
      }
    }
  ]
  const trayMenu = Menu.buildFromTemplate(trayMenuTemplate)
  appTray.on('double-click', () => {
    global.mainWindow.show()
    global.mainWindow.setSkipTaskbar(false)
    global.mainWindow.focus()
  })
  appTray.setContextMenu(trayMenu)
}

// 显示窗口，判断是否连接着VPN
const showVpnConnectWindows = (): void => {
  if (vpnDb.default.get(VPN_ENUM.CONNECT_STATUS_STATUS).value() === false) {
    vpnDb.default.set(VPN_ENUM.NORMALLY_CLOSED, true).write()
    global.mainWindow = null
    app.exit()
  } else {
    if (global.mainWindow.isMinimized()) {
      global.mainWindow.restore()
    } else {
      global.mainWindow.show()
    }
    global.mainWindow.setSkipTaskbar(true)
    global.mainWindow.focus()
    global.mainWindow.webContents.send(
      'alter_windows_openvpn_connect',
      '当前VPN处于连接状态,请断开后退出',
      'VPN连接提醒'
    )
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // 当运行第二个实例时,将会聚焦到myWindow这个窗口
    if (global.mainWindow) {
      global.mainWindow.show()
      global.mainWindow.focus()
    }
  })
}

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  createWindow()
  // 初始化基础配置
  db.set(
    BASE.APP_PATH,
    path.join(
      app.getAppPath().replace(/\\/g, '\\\\').replace('\\\\app.asar', '').replace('/app.asar', ''),
      '/static'
    )
  ).write()
  db.set(BASE.VERSION, app.getVersion()).write()
  db.set(BASE.STATIC_PATH, path.join(__dirname, '/static').replace(/\\/g, '\\\\')).write()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

const { autoUpdater } = require('electron-updater')

/**
 * 自动检测当前app是否有新版本
 */
function updateHandle(): void {
  const message = {
    error: '检查更新出错',
    checking: '正在检查更新……',
    updateAva: '检测到新版本',
    updateNotAva: '现在使用的就是最新版本，不用更新'
  }
  autoUpdater.autoDownload = false

  autoUpdater.setFeedURL('https://it-service-cos.kujiale.com/xiaoku/version/')

  autoUpdater.on('error', function () {
    sendUpdateMessage(message.error)
  })
  autoUpdater.on('checking-for-update', function () {
    sendUpdateMessage(message.checking)
  })
  autoUpdater.on('update-available', function () {
    sendUpdateMessage(message.updateAva)
    ipcMain.on('confirm_update', () => {
      autoUpdater.downloadUpdate()
    })
  })
  autoUpdater.on('update-not-available', function () {
    sendUpdateMessage(message.updateNotAva)
  })

  // 更新下载进度事件
  autoUpdater.on('download-progress', function (progressObj) {
    global.mainWindow.webContents.send('downloadProgress', progressObj)
  })
  // 下载更新文件完成
  autoUpdater.on('update-downloaded', function () {
    global.mainWindow.webContents.send('isUpdateNow')
    ipcMain.on('isUpdateNow', () => {
      //some code here to handle event
      // mainWindow.webContents.send('setNormalClose');
      try {
        autoUpdater.quitAndInstall(true, true)
      } catch (e) {
        xiaokuError(String(e))
      }
    })
  })

  /**
   * 接收更新事件
   */
  ipcMain.on('checkForUpdate', () => {
    console.log('=====')
    //执行自动更新检查
    autoUpdater.checkForUpdates()
  })
}

/**
 * 通过main进程发送事件给renderer进程，提示更新信息
 * @param {*} text
 */
function sendUpdateMessage(text): void {
  global.mainWindow.webContents.send('autoUpdate', text)
}
