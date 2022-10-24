import cmd, { ExecException } from 'child_process'
import { ipcMain, IpcMainEvent } from 'electron'
import { xiaokuError } from '../common/log'

/**
 * 获取本地网络
 */
ipcMain.on('getLocalHostNetwork', (_event: IpcMainEvent) => {
  localNetwork().then((result: string) => {
    _event.sender.send('setLocalHostNetwork', result)
  })
})

/**
 * 监听网络检测
 */
ipcMain.on('checkLocalHostNetwork', (_event: IpcMainEvent, eventName: string) => {
  let url = '10.1.1.1'
  switch (eventName) {
    case 'network':
      url = '114.114.114.114'
      break
    case 'intranet':
      url = '10.1.1.1'
      break
    case 'dns':
      url = 'www.baidu.com'
      break
    case 'vpn':
      url = 'it-vpn-clb.qunhequnhe.com'
      break
    default:
      break
  }
  pingNetwork(url).then((result: boolean) => {
    console.log(result)
    _event.sender.send('checkLocalHostNetwork-' + eventName, result)
  })
})

/**
 * 检测当前网络是否正常，用ping的方法
 * @param url 检测地址
 * @returns Promise<boolean>
 */
export function pingNetwork(url: string): Promise<boolean> {
  return new Promise((_resolve, _reject) => {
    let processCmd
    setTimeout(() => {
      _resolve(false)
      processCmd.kill('SIGKILL')
      return
    }, 3000)
    if (process.platform == 'darwin') {
      processCmd = cmd.exec(
        `ping -c 1 ${url}`,
        (error: ExecException | null, stdout: string, stderr: string) => {
          if (error || stderr) {
            xiaokuError('网络检测失败,Url: ' + url + 'error: ' + error + 'stderr:' + stderr)
            _resolve(false)
            return
          } else {
            if (stdout.indexOf('无法访问目标主机') != -1) {
              _resolve(false)
              return
            } else {
              _resolve(true)
              return
            }
          }
        }
      )
    } else {
      processCmd = cmd.exec(
        `ping -n 1 ${url}`,
        (error: ExecException | null, stdout: string, stderr: string) => {
          if (error || stderr) {
            xiaokuError('网络检测失败,Url: ' + url + 'error: ' + error + 'stderr:' + stderr)
            _resolve(false)
            return
          } else {
            if (stdout.indexOf('无法访问目标主机') != -1) {
              _resolve(false)
              return
            } else {
              _resolve(true)
              return
            }
          }
        }
      )
    }
  })
}

/**
 * 获取本机网络信息
 * @returns Promise<string>
 */
export function localNetwork(): Promise<string> {
  return new Promise((_resolve, _reject) => {
    const interfaces = require('os').networkInterfaces()
    const ip = [] as any[]
    for (const devName in interfaces) {
      const iface = interfaces[devName]
      for (let i = 0; i < iface.length; i++) {
        const alias: any = iface[i]
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
          //   ip = ip ? ip + ',' + alias.address : alias.address
          ip.push(alias.address)
        }
      }
    }
    const dns = require('dns')
    dns.lookup(require('os').hostname(), function (err, add, fam) {
      _resolve(ip[0] + ' | DNS:' + dns.getServers())
    })
  })
}
