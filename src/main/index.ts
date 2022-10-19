import { app, shell, BrowserWindow } from 'electron'
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
import { BASE } from './common/enumeration'
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
  global.mainWindow.on('ready-to-show', () => {
    global.mainWindow.show()
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
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
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
