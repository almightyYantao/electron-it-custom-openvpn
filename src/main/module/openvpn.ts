import { app, ipcMain, IpcMainEvent } from 'electron'
import { xiaokuDebug, xiaokuError, xiaokuInfo, xiaokuOpenvpnConnectLog } from '../common/log'
import db from '../store/config'
import * as vpnDb from '../store/vpn'
import path from 'path'
import cmd, { ExecException } from 'child_process'
const { Telnet } = require('telnet-client')
import { aesDecrypt } from '../common/decrypt'
import { is } from '@electron-toolkit/utils'
import { BASE, VPN_ENUM } from '../common/enumeration'
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
  //   checkPidIsActive(1000)
  if (is.dev) {
    startOpenvpn(_event)
      .then((result: OpenvpnStartStatus) => {
        console.log('openvpn-then')
        _event.sender.send('openvpn-start-status', result)
        vpnDb.default.set(VPN_ENUM.CONNECT_STATUS, result).write()
      })
      .catch((err: OpenvpnStartStatus) => {
        console.log('openvpn-catch')
        _event.sender.send('openvpn-start-status', err)
        vpnDb.default.set(VPN_ENUM.CONNECT_STATUS, false).write()
      })
  } else {
    if (vpnDb.default.get(VPN_ENUM.INT_VERSION).value() !== app.getVersion()) {
      if (process.platform === 'win32') {
        const result = cmd.execSync(`ipconfig /all | findStr "TAP-Windows\\ Adapter\\ V9"`)
        if (!result) {
          const tapSsh = `"${path.join(
            db.get(BASE.APP_PATH).value(),
            '/assets/windows/tap-windows.exe'
          )}" /S`
          _event.sender.send('init-start')
          try {
            cmd.execSync(tapSsh)
            _event.sender.send('init-success')
          } catch (e) {
            xiaokuError(`初始化失败：${e}`)
            _event.sender.send('init-error', e)
          }
          return
        }
      } else {
        _event.sender.send('init-start')
        console.log(app.getVersion())
        initOpenvpn()
          .then((result) => {
            _event.sender.send('init-success')
            vpnDb.default.set(VPN_ENUM.INT_VERSION, app.getVersion()).value()
          })
          .catch((err) => {
            xiaokuError(`初始化失败：${err}`)
            _event.sender.send('init-error', err)
          })
      }
    } else {
      startOpenvpn(_event)
        .then((result: OpenvpnStartStatus) => {
          _event.sender.send('openvpn-start-status', result)
          vpnDb.default.set(VPN_ENUM.CONNECT_STATUS, result).write()
        })
        .catch((err: OpenvpnStartStatus) => {
          _event.sender.send('openvpn-start-status', err)
          vpnDb.default.set(VPN_ENUM.CONNECT_STATUS, false).write()
        })
    }
  }
})

/**
 * 初始化
 */
ipcMain.on('initVpnConfig', (_event: IpcMainEvent) => {
  if (process.platform === 'darwin') {
    initOpenvpn()
      .then((result) => {
        _event.sender.send('init-success')
        vpnDb.default.set(VPN_ENUM.INT_VERSION, app.getVersion()).value()
      })
      .catch((err) => {
        xiaokuError(`初始化失败：${err}`)
        _event.sender.send('init-error', err)
      })
  } else {
    _event.sender.send('init-success')
  }
})

/**
 * 监听VPN断开按钮
 */
ipcMain.on('openvpn-close', (_event: IpcMainEvent, args: string) => {
  // 先判断shell存不存在，不存在的话说明没运行过，但是他的状态又是true，那么直接至为false
  console.log('shell', shell, 'pid', shell?.pid)
  if (shell?.pid) {
    checkPidIsActive(shell.pid)
      .then((active: boolean) => {
        console.log(active)
        if (active === false) {
          vpnDb.default.set(VPN_ENUM.CONNECT_STATUS_STATUS, false).write()
        } else {
          closeVpn(shell)
        }
      })
      .catch((err) => {
        vpnDb.default.set(VPN_ENUM.CONNECT_STATUS_STATUS, false).write()
      })
  } else {
    closeVpn(shell)
  }
  vpnDb.default.set(VPN_ENUM.CONNECT_STATUS_STATUS, false).write()
  vpnDb.default.set(VPN_ENUM.CONNECT_STATUS_CONNECTING, false).write()
})

/**
 * 释放端口，其实也是强制使用管理员方式来断开VPN，不管VPN进程是否存在
 */
ipcMain.on('releasePort', (_event: IpcMainEvent) => {
  releasePort().then(() => {
    _event.sender.send('sudo_down_vpn_success')
  })
})

function releasePort(): Promise<boolean> {
  return new Promise((_resolve, _reject) => {
    const options = {
      name: 'ItServer'
    }
    const sudo = require('sudo-prompt')
    if (process.platform === 'darwin') {
      sudo.exec(
        "kill -9 $(ps -ef | grep openvpn-executable | grep -v grep | awk '{ print $2 }')",
        options,
        function (error, stdout, stderr) {
          if (error) xiaokuError(`强制断开VPN失败: ${error}`)
          if (stderr) xiaokuError(`强制断开VPN失败: ${stderr}`)
          _resolve(true)
        }
      )
    } else {
      sudo.exec('taskkill /f /im openvpn*', options, function (error, stdout, stderr) {
        if (error) xiaokuError(`强制断开VPN失败: ${error}`)
        if (stderr) xiaokuError(`强制断开VPN失败: ${stderr}`)
        _resolve(true)
      })
    }
  })
}

/**
 * 检查进程是否还存在
 * @param pid 进程ID
 * @returns
 */
function checkPidIsActive(pid: number): Promise<boolean> {
  return new Promise((_resolve, _reject) => {
    let cmdShell
    if (type === 'darwin') {
      cmdShell = `ps -ef | awk '{print $2}' | grep ${pid} | grep -v grep`
    }
    cmd.exec(`${cmdShell}`, (error, stdout, stderr) => {
      if (error || stderr) {
        _reject(`error: ${error}; stderr: ${stderr}`)
      } else {
        _resolve(true)
      }
    })
  })
}

/**
 * 开始连接Openvpn
 * @returns boolean 是否连接成功
 */
function startOpenvpn(_event: IpcMainEvent): Promise<OpenvpnStartStatus> {
  //   console.log('===>>>', global.mainWindow.webContents.sender.send())
  connection = new Telnet()
  return new Promise((_resolve, _reject) => {
    const port =
      vpnDb.default.get(VPN_ENUM.VPN_PORT).value() == null
        ? 7001
        : vpnDb.default.get(VPN_ENUM.VPN_PORT).value()
    let ssh = ''
    if (type === 'darwin') {
      ssh =
        `"/Library/Application Support/xiaoku-app/macos/openvpn-executable" ` +
        `--cd "/Library/Application Support/xiaoku-app/" ` +
        `--config "./config/qunheVPN-${vpnDb.default.get(VPN_ENUM.CONFIG_VALUE).value()}.ovpn" ` +
        `--management 127.0.0.1 ${port} --auth-retry interact --management-query-passwords ` +
        `--management-hold --script-security 2 ` +
        `--up "./macos/dns.sh" ` +
        `--down "./macos/close.sh"`
    } else {
      const config = `"${db.get(BASE.APP_PATH).value() + '/assets/config/'}
      ${vpnDb.default.get(VPN_ENUM.CONFIG_VALUE).value()}.ovpn"`
      ssh = `"${path.join(
        db.get(BASE.APP_PATH).value(),
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
      _reject({ status: false, remark: error })
      return
    })

    // 监听进程关闭事件
    shell.once('close', (code: number, signal: NodeJS.Signals) => {
      const error = `Openvpn进程关闭: ${code},signal: ${signal}`
      xiaokuError(error)
      if (code !== 0) {
        _reject({ status: false, remark: error })
        return
      }
    })

    // 监听进程输出事件
    shell.stdout?.on('data', (data: any) => {
      // 判断是否启动完成management
      console.log(data)
      xiaokuOpenvpnConnectLog(data, vpnDb.default.get(VPN_ENUM.CONFIG_VALUE).value())
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
        connectOpenVPNSocket(
          syncUsername.toString().replace('\n', ''),
          aesDecrypt(
            syncPassword.toString().replace('\n', ''),
            VPN_ENUM.SECRET_KEY,
            VPN_ENUM.SECRET_KEY_IV
          ),
          port
        )
      }
      openvpnStatus(data).catch((err) => {
        _reject({ status: false, remark: err })
      })
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
          _reject({ status: false, remark: mg })
        }
      }
    })
  })
}

/**
 * 统一处理OpenVpn的链接信息
 */
function openvpnStatus(data: string): Promise<boolean> {
  return new Promise((_resolve, _reject) => {
    // 判断是否有连接失败的特殊关键词
    if (
      data.indexOf('All tap-windows6 adapters on this system are currently in use or disabled') !=
      -1
    ) {
      _reject(`网卡被占用，请检查是否拥有其他VPN占用了网卡，或重启电脑释放网卡`)
    } else if (data.indexOf('Socket bind failed on local address') != -1) {
      _reject(`端口被占用，请修改当前连接端口`)
    } else if (data.indexOf('AUTH_FAILED') != -1) {
      _reject(`账号密码错误，请重新登录小酷`)
    }
  })
}

/**
 * 初始化Openvpn配置信息，只有Mac需要
 * @returns boolean 是否初始化成功
 */
function initOpenvpn(): Promise<boolean> {
  const options = {
    name: 'Xiaoku Assistant'
  }
  return new Promise((_reject, _resolve) => {
    try {
      const appPaths = db.get(BASE.APP_PATH).value()
      console.log(appPaths)
      if (appPaths == undefined) {
        xiaokuError('当前基础配置文件不存在')
        _resolve('当前基础配置文件不存在')
      } else {
        const sudo = require('sudo-prompt')
        const sh = `chmod -R 777 ${appPaths}/start.sh & chmod -R 777 ${appPaths}/close.sh & ${appPaths}/start.sh`
        xiaokuInfo(sh)
        sudo.exec(sh, options, function (error, stdout, stderr) {
          if (error || stderr) {
            _resolve(`error: ${error};stderr: ${stderr}`)
          } else {
            xiaokuInfo('初始化完成')
            _reject(true)
          }
        })
      }
    } catch (e) {
      _resolve(`初始化失败：${e}`)
    }
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
      _reject(false)
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
      xiaokuDebug(`接收到的DATA: ${data}`)
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
