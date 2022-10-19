import { ipcMain, IpcMainEvent } from 'electron'
import { xiaokuDebug, xiaokuError } from '../common/log'
import db from '../store/config'
import cmd, { ExecException } from 'child_process'
import { BASE } from '../common/enumeration'

const __appPath = db.get(BASE.APP_PATH).value()

ipcMain.on('printer-install', (_event: IpcMainEvent, arg: string) => {
  xiaokuDebug('开始安装打印机')
  const argSplit = arg.split('|')
  const ip = argSplit[0]
  const name = argSplit[1]
  if (process.platform === 'darwin') {
    installByMac(ip, name)
      .then((result) => {
        _event.sender.send('printer-success')
      })
      .catch((reason) => {
        _event.sender.send('printer-error', reason)
      })
  } else if (process.platform === 'win32') {
    installByWindows(ip, name)
      .then((result) => {
        _event.sender.send('printer-success')
      })
      .catch((reason) => {
        xiaokuError('123')
        _event.sender.send('printer-error', reason)
      })
  }
})

/**
 * windows 安装打印机
 * @param {*} ip
 * @param {*} name
 * @returns
 */
function installByWindows(ip: string, name: string): Promise<boolean> {
  return new Promise((resolve, rejects) => {
    global.mainWindow.webContents.send('printer-download-info', '开始注册打印机端口信息')
    try {
      const sudo = require('sudo-prompt')
      sudo.exec(
        `echo Windows Registry Editor Version 5.00>a.reg&echo [HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Print\\Monitors\\Standard TCP/IP Port\\Ports] >> a.reg&echo [HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Print\\Monitors\\Standard TCP/IP Port\\Ports] >> a.reg&echo "StatusUpdateInterval"=dword:0000000a >> a.reg&echo "StatusUpdateEnabled"=dword:00000001 >> a.reg&echo [HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Print\\Monitors\\Standard TCP/IP Port\\Ports\\${ip}] >> a.reg&echo "Protocol"=dword:00000001 >> a.reg&echo "Version"=dword:00000001 >> a.reg&echo "IPAddress"="${ip}" >> a.reg&echo "HostName"="" >> a.reg&echo "HWAddress"="" >> a.reg&echo "PortNumber"=dword:0000238c >> a.reg&echo "SNMP Community"="public" >> a.reg&echo "SNMP Enabled"=dword:00000001 >> a.reg&echo "SNMP Index"=dword:00000001 >> a.reg&regedit /s a.reg`,
        function (error, stdout, stderr) {
          // sc config spooler start= auto &net stop spooler & net start spooler
          if (error) {
            throw new Error(error)
          }
          global.mainWindow.webContents.send('printer-download-info', '重启打印机服务')
          sudo.exec(
            'sc config spooler start= auto &net stop spooler & net start spooler & del a.reg',
            function (error, stdout, stderr) {
              if (error) {
                throw new Error(error)
              }
              global.mainWindow.webContents.send('printer-download-info', '开始安装打印机')
              // rundll32 printui.dll,PrintUIEntry /if /b %name% /f "\\10.1.21.49\share\dv\KOAYEJA_.INF" /r "%ip%" /m "Generic 36BW-8SeriesPCL"
              xiaokuDebug(
                `安装打印机: rundll32 printui.dll,PrintUIEntry /if /b ${name} /f "${__appPath}\\dv\\KOAYEJA_.INF" /r "${ip}" /m "Generic 36BW-8SeriesPCL"`
              )
              cmd.execSync(
                `rundll32 printui.dll,PrintUIEntry /if /b ${name} /f "${__appPath}\\dv\\KOAYEJA_.INF" /r "${ip}" /m "Generic 36BW-8SeriesPCL"`
              )
              resolve(true)
              global.mainWindow.webContents.send('printer-success')
            }
          )
        }
      )
    } catch (e) {
      xiaokuError(`Windows安装打印机失败: ${e}`)
      global.mainWindow.webContents.send('printer-error', e)
      resolve(false)
      rejects(e)
    }
  })
}

/**
 * mac 一键安装打印机
 * @param {*} parameter
 * @returns
 */
function installByMac(ip: string, name: string): Promise<boolean> {
  return new Promise((resolve, rejects) => {
    global.mainWindow.webContents.send('printer-download-info', '开始注册打印机端口信息')
    cmd.exec(
      `lpadmin -p ${name} -E -v socket://${ip} -P ${__appPath}/dv/GENERIC36BW-9e.gz -o PageSize=A4`,
      (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) {
          xiaokuError(`Mac安装打印机失败: ${error};stderr: ${stderr}`)
          rejects(`Mac安装打印机失败: ${error};stderr: ${stderr}`)
        } else {
          resolve(true)
        }
      }
    )
  })
}
