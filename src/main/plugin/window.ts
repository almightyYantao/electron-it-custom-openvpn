import { shell, BrowserWindow } from 'electron'
import * as path from 'path'
import { is } from '@electron-toolkit/utils'

export default function createPluginWindow(): void {
  // Create the browser window.
  global.pluginWindow = new BrowserWindow({
    width: 960,
    height: 120,
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
      webviewTag: true,
      nodeIntegration: true,
      // 官网似乎说是默认false，但是这里必须设置contextIsolation
      contextIsolation: false
    }
  })

  global.pluginWindow.on('ready-to-show', () => {
    global.pluginWindow.show()
  })

  global.pluginWindow.on('close', (event: { preventDefault: () => void }) => {
    event.preventDefault
    global.pluginWindow.hide()
    // if (global.pluginWindow && global.pluginWindow.webContents) {
    //   event.preventDefault()
    //   showVpnConnectWindows()
    // } else {
    //   global.pluginWindow.minimize()
    // }
  })

  global.pluginWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    global.pluginWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    global.pluginWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}
