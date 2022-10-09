import { app, ipcMain, IpcMainEvent } from 'electron'
import { xiaokuDebug, xiaokuError, xiaokuInfo } from '../common/log'
import db from '../store/config'
import * as vpnDb from '../store/vpn'
import path from 'path'
import cmd from 'child_process'
const { Telnet } = require('telnet-client')
import fs from 'fs'
import { aesDecrypt } from '../common/decrypt'
const type = process.platform
let connection: any
let shell: cmd.ChildProcess

type OpenvpnStartStatus = {
  status: boolean
  connectIp?: string
  remark?: string
}

/**
 * 监听VPN连接按钮
 */
ipcMain.on('openvpn-start', (_event: IpcMainEvent, args: string) => {
  startOpenvpn(_event).then((result: OpenvpnStartStatus) => {
    _event.sender.send('openvpn-start-status', result)
    vpnDb.default.set('connectStatus', result).write()
  })
})

/**
 * 监听VPN断开按钮
 */
ipcMain.on('openvpn-close', (_event: IpcMainEvent, args: string) => {
  closeVpn(shell).then((result: boolean) => {
    if (result && result === true) {
      vpnDb.default.set('connectStatus.status', false).write()
    }
  })
})

/**
 * 开始连接Openvpn
 * @returns boolean 是否连接成功
 */
function startOpenvpn(_event: IpcMainEvent): Promise<OpenvpnStartStatus> {
  //   console.log('===>>>', global.mainWindow.webContents.sender.send())
  connection = new Telnet()
  return new Promise((_resolve, _reject) => {
    const port = vpnDb.default.data?.vpnPort === undefined ? 7001 : vpnDb.default.data?.vpnPort
    let ssh = ''
    if (type === 'darwin') {
      ssh =
        `"/Library/Application Support/xiaoku-app/macos/openvpn-executable" ` +
        `--cd "/Library/Application Support/xiaoku-app/" ` +
        `--config "./config/qunheVPN-${vpnDb.default.get('configValue').value()}.ovpns" ` +
        `--management 127.0.0.1 ${port} --auth-retry interact --management-query-passwords ` +
        `--management-hold --script-security 2 ` +
        `--up "./macos/dns.sh" ` +
        `--down "./macos/close.sh"`
    } else {
      const config = `"${db.get('appPath').value() + '/assets/config/'}
      ${vpnDb.default.get('configValue').value()}.ovpn"`
      ssh = `"${path.join(
        db.get('appPath').value(),
        '/assets/windows/openvpn.exe'
      )}" --config "${config}" --management 127.0.0.1 ${port} --auth-retry interact --management-query-passwords --management-hold `
    }
    shell = cmd.exec(`${ssh}`)

    // 监听是否过程中出现了不影响的错误信息，只记录
    shell.stderr?.on('data', (err) => {
      xiaokuError(`stderr: ${err}`)
      //   _resolve({ status: false, remark: err })
      //   _reject(err)
      //   return
    })

    // 监听是否发生了错误
    shell.stdout?.on('error', (error: any) => {
      xiaokuError(`error: ${error}`)
      _resolve({ status: false, remark: error })
      _reject(error)
      return
    })

    // 监听进程关闭事件
    shell.once('close', (code: number, signal: NodeJS.Signals) => {
      const error = `Openvpn进程关闭: ${code},signal: ${signal}`
      xiaokuError(error)
      if (code !== 0) {
        _resolve({ status: true, remark: error })
        _reject(code)
        return
      }
    })

    // 监听进程输出事件
    shell.stdout?.on('data', (data: any) => {
      // 判断是否启动完成management
      console.log(data)
      // setConnectingLog
      _event.sender.send('setConnectingLog', data)
      //   global.mainWindow.webContents.send('setConnectingLog', data)
      if (data.indexOf('Need hold release from management interface') !== -1) {
        // 发现Openvpn开始接入management了，那么启动数据转发
        const syncUsername = cmd.execSync(
          `security find-generic-password -a "xiaoku-username" -s "xiaoku-app" -w`
        )
        const syncPassword = cmd.execSync(
          `security find-generic-password -a "xiaoku-password" -s "xiaoku-app" -w`
        )
        const secretkey = 'H!o18u$@%^'
        const iv = 'H1u@@#*U(*'
        connectOpenVPNSocket(
          syncUsername.toString().replace('\n', ''),
          aesDecrypt(syncPassword.toString().replace('\n', ''), secretkey, iv),
          port
        )
      }
      const subIndex = data.indexOf('MANAGEMENT: >STATE:')
      if (subIndex !== -1) {
        // subIndex = subIndex.replace('MANAGEMENT: >STATE:', '');
        // 启动完成后进行数据分割，判断是否连接成功或者失败
        const mg = data.substring(subIndex).split(',')
        if (mg[1] === 'CONNECTED' && mg[2] === 'SUCCESS') {
          // event.sender.send('vpnSuccess')
          // event.sender.send('vpn-ip', mg[3])
          _resolve({ status: true, connectIp: mg[3] })
        }
        if (mg[1] === 'CONNECTED' && mg[2] === 'ERROR') {
          _resolve({ status: false, remark: mg })
          _reject(mg)
        }
      }
    })
  })
}

/**
 * 初始化Openvpn配置信息，只有Mac需要
 * @returns boolean 是否初始化成功
 */
function initOpenvpn(): Promise<boolean> {
  const options = {
    name: 'ItServer'
  }
  return new Promise((_reject, _resolve) => {
    const version = app.getVersion()
    const vpnPath = '/Library/Application Support/xiaoku-app/' + version
    fs.exists(vpnPath, (exists: boolean) => {
      if (exists) {
        console.log('文件已存在')
      } else {
        try {
          if (!db.data || db.get('appPath').value() == undefined) {
            _reject(false)
            xiaokuError('当前基础配置文件不存在')
            _resolve('当前基础配置文件不存在')
          } else {
            const sh = `mkdir -p "${vpnPath + version}/" & chmod -R 777 
            ${db.get('appPath').value()}/start.sh & chmod -R 777 
            ${db.get('appPath').value()}/close.sh & 
            ${db.get('appPath').value()}/start.sh ${version}`
            xiaokuInfo(sh)
            //   sudo.exec(sh, options, function (error, stdout, stderr) {
            //     if (error) throw error
            //     if (stderr) throw stderr
            //     xiaokuInfo('初始化完成')
            //   })
            _reject(true)
          }
        } catch (e) {
          xiaokuError(`初始化失败：${e}`)
          _reject(false)
          _resolve(e)
        }
      }
    })
  })
}

/**
 * 断开VPN
 * @param pid PID
 * @param openvpnProcess
 */
function closeVpn(openvpnProcess: cmd.ChildProcess): Promise<boolean> {
  return new Promise((_resolve, _reject) => {
    try {
      const pid = openvpnProcess.pid
      connection && connection.send('signal SIGTERM')
      connection && connection.end()
      if (openvpnProcess) {
        openvpnProcess.kill('SIGTERM')
        xiaokuDebug(`子进程断开状态: ${openvpnProcess.killed}`)
        _resolve(true)
      }
      setTimeout(() => {
        if (process.platform === 'win32') {
          cmd.exec('tasklist | findStr ' + pid, (err, data, stderr) => {
            xiaokuError(`当前PID是否还存在: ${data}`)
            if (data && data != '' && data != undefined && data != null) {
              cmd.exec('taskkill /pid ' + pid, (err, data, stderr) => {
                // 如果通过pid断开失败的话，那么就采用管理员强制断开
                if (err || stderr) {
                  xiaokuError(`断开VPN失败: ${err} - ${stderr}`)
                  _resolve(true)
                  //   sudoDownVpn()
                } else {
                  xiaokuDebug(`断开VPN-response: ${data}`)
                  _resolve(true)
                }
              })
            }
          })
        }
      }, 100)
    } catch (e) {
      _resolve(false)
    }
  })
}

/**
 * 发送链接信息
 * @param username 用户名
 * @param password 密码
 * @param vpnPort 连接端口
 */
function connectOpenVPNSocket(
  username: string,
  password: string,
  vpnPort: number | undefined
): void {
  const params = {
    host: '127.0.0.1',
    port: vpnPort,
    negotiationMandatory: false
  }
  xiaokuInfo('开始进行Socket数据传送')
  // 发送相关的sokect cmd命令
  // 详见：https://openvpn.net/community-resources/management-interface/
  connection.connect(params)
  // var _ = require('lodash');
  const cmds = [
    'state all',
    'state on',
    'log all on',
    'echo all on',
    'echo on',
    'bytecount 5',
    'hold off',
    'hold release'
  ]
  let networkIn = 0
  let networkOut = 0
  let oldNetworkIn = 0
  let oldNetworkOut = 0
  connection.on('data', (data: string) => {
    // 判断是否要求输入密码了
    if (data && data.indexOf("Need 'Auth' username/password") !== -1) {
      connection.send('username "Auth" "' + username + '"')
      setTimeout(() => {
        connection.send('password "Auth" "' + password + '"')
      }, 100)
    }
    // 输出流量监听
    if (data && data.indexOf('>BYTECOUNT:') !== -1) {
      // qunheDebug("接收到的DATA", data);
      data = String(data).replace('>BYTECOUNT:', '')
      networkIn = Number(data.split(',')[0]) - oldNetworkIn
      networkOut = Number(data.split(',')[1]) - oldNetworkOut
      //   mainWindow.webContents.send('network_traffic_in', fomartNetwork(networkIn))
      //   mainWindow.webContents.send('network_traffic_out', fomartNetwork(networkOut))
      oldNetworkIn = Number(data.split(',')[0])
      oldNetworkOut = Number(data.split(',')[1])
    }
  })
  // 循环输出命令
  for (let j = 0; j < cmds.length; j++) {
    ;(function (t): void {
      // 注意这里是形参
      setTimeout(function () {
        connection.send(cmds[j])
      }, 50 * (t + 1)) // 还是每秒执行一次，不是累加的
    })(j) // 注意这里是实参，这里把要用的参数传进去
  }
}
