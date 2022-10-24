import { app, ipcMain, IpcMainEvent } from 'electron'
import { xiaokuDebug, xiaokuError, xiaokuInfo, xiaokuOpenvpnConnectLog } from '../common/log'
import db from '../store/config'
import * as vpnDb from '../store/vpn'
import path from 'path'
import fs from 'fs'
import cmd from 'child_process'
const { Telnet } = require('telnet-client')
import { aesDecrypt } from '../common/decrypt'
import { is } from '@electron-toolkit/utils'
import { BASE, USER, VPN_ENUM } from '../common/enumeration'
const type = process.platform
let connection: any
let shell: cmd.ChildProcess

type OpenvpnStartStatus = {
  status: boolean
  connectIp?: string
  remark?: string
}

ipcMain.on(
  'change_proxy',
  (_event: IpcMainEvent, proxy: string, pac: string, ip: string, port: string) => {
    proxy_change(proxy, pac, ip, port)
  }
)

/**
 * 监听VPN连接按钮
 */
ipcMain.on('openvpn-start', (_event: IpcMainEvent) => {
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
        _event.sender.send('init-start')
        const result = cmd.execSync(`ipconfig /all | findStr "TAP-Windows\\ Adapter\\ V9"`)
        if (!result) {
          const tapSsh = `"${path.join(
            db.get(BASE.APP_PATH).value(),
            '/assets/windows/tap-windows.exe'
          )}" /S`
          try {
            cmd.execSync(tapSsh)
            _event.sender.send('init-success')
            vpnDb.default.set(VPN_ENUM.INT_VERSION, app.getVersion()).value()
          } catch (e) {
            xiaokuError(`初始化失败：${e}`)
            _event.sender.send('init-error', e)
          }
          return
        } else {
          _event.sender.send('init-success')
          vpnDb.default.set(VPN_ENUM.INT_VERSION, app.getVersion()).value()
          return
        }
      } else {
        _event.sender.send('init-start')
        console.log(app.getVersion())
        initOpenvpn()
          .then(() => {
            _event.sender.send('init-success')
            vpnDb.default.set(VPN_ENUM.INT_VERSION, app.getVersion()).value()
          })
          .catch((err) => {
            xiaokuError(`初始化失败：${err}`)
            _event.sender.send('init-error', err)
          })
      }
    } else {
      _event.sender.send('dont_init')
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
      .then(() => {
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
ipcMain.on('openvpn-close', () => {
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
      .catch(() => {
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

/**
 * 强制释放端口
 * @returns
 */
function releasePort(): Promise<boolean> {
  return new Promise((_resolve) => {
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
          xiaokuDebug(stdout)
          _resolve(true)
        }
      )
    } else {
      sudo.exec('taskkill /f /im openvpn*', options, function (error, stdout, stderr) {
        if (error) xiaokuError(`强制断开VPN失败: ${error}`)
        if (stderr) xiaokuError(`强制断开VPN失败: ${stderr}`)
        xiaokuDebug(stdout)
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
    } else {
      cmdShell = `tasklist /FI "PID eq ${pid}"`
    }
    cmd.exec(`${cmdShell}`, (error, stdout, stderr) => {
      if (error || stderr) {
        _reject(`error: ${error}; stderr: ${stderr}`)
      } else {
        xiaokuDebug(stdout)
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
    const configName = vpnDb.default.get(VPN_ENUM.CONFIG_VALUE).value()
    const config = `${db.get(BASE.APP_PATH).value() + '/assets/config/'}qunheVPN-${
      configName === undefined ? 'slb' : configName
    }.ovpn`
    if (type === 'darwin') {
      ssh =
        `"/Library/Application Support/xiaoku-app/macos/openvpn-executable" ` +
        `--cd "/Library/Application Support/xiaoku-app/" ` +
        `--config "${config}" ` +
        `--management 127.0.0.1 ${port} --auth-retry interact --management-query-passwords ` +
        `--management-hold --script-security 2 ` +
        `--up "./macos/dns.sh" ` +
        `--down "./macos/close.sh"`
    } else {
      ssh = `"${path.join(
        db.get(BASE.APP_PATH).value(),
        '/assets/windows/openvpn.exe'
      )}" --config "${config}" --management 127.0.0.1 ${port} --auth-retry interact --management-query-passwords --management-hold `
    }
    xiaokuDebug(`ssh: ${ssh}`)
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
      if (code !== 0 && code !== null) {
        _reject({ status: false, remark: error })
        return
      }
      _event.sender.send('complete_close')
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
        const syncUsername = db.get(USER.USER_USERNAME).value()
        const syncPassword = db.get(USER.USER_PASSWORD).value()
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
        _event.sender.send('openvpn_event', mg[1], mg[2])
        xiaokuInfo(`openvpn_event: ${mg[1]} - ${mg[2]}`)
        if (mg[2] === 'init_instance') {
          cleanDns()
        }
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
 * 清理DNS
 */
function cleanDns(): void {
  if (process.platform === 'darwin') {
    const shellCmd = `"/Library/Application Support/xiaoku-app/macos/proxy_conf_helper" -d ""`
    cmd.exec(shellCmd, (error, stdout, stderr) => {
      if (error || stderr) {
        xiaokuError(`error: ${error},stderr: ${stderr}`)
      } else {
        xiaokuInfo(stdout)
      }
    })
  }
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
      // 如果检测到端口被占用了，那么就强制释放一次，然后在重新连接
      releasePort().then(() => {
        _reject(`检测到端口被占用，以强制释放，请重新连接`)
      })
    } else if (data.indexOf('AUTH_FAILED') != -1) {
      _reject(`账号密码错误，请重新登录小酷助手`)
    } else if (data.indexOf('Address already in use') != -1) {
      _reject(`Address already in use (errno=48)`)
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
            xiaokuDebug(stdout)
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
      // const pid = openvpnProcess.pid
      connection && connection.send('signal SIGTERM')
      connection && connection.end()
      if (openvpnProcess) {
        openvpnProcess.kill('SIGTERM')
        xiaokuDebug(`子进程断开状态: ${openvpnProcess.killed}`)
        // if (process.platform === 'win32') {
        //   releasePort()
        // }
        // setTimeout(() => {
        //   if (process.platform === 'win32') {
        //     cmd.exec(`tasklist /FI "PID eq ${pid}"`, (err, data, stderr) => {
        //       xiaokuError(`当前PID是否还存在: ${data}`)
        //       if (err || stderr) {
        //         xiaokuError(`断开VPN失败: ${err} - ${stderr}`)
        //         _resolve(true)
        //       } else {
        //         if (data && data != '' && data != undefined && data != null) {
        //           cmd.exec('taskkill /pid ' + pid, (err, data, stderr) => {
        //             // 如果通过pid断开失败的话，那么就采用管理员强制断开
        //             if (err || stderr) {
        //               xiaokuError(`断开VPN失败: ${err} - ${stderr}`)
        //               _resolve(true)
        //               releasePort()
        //             } else {
        //               xiaokuDebug(`断开VPN-response: ${data}`)
        //               _resolve(true)
        //             }
        //           })
        //         }
        //       }
        //     })
        //   }
        // }, 100)
        _resolve(true)
      }
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
      global.mainWindow.webContents.send('network_traffic_in', fomartNetwork(networkIn))
      global.mainWindow.webContents.send('network_traffic_out', fomartNetwork(networkOut))
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

/**
 * 格式化实时流量单位
 * @param {*} bytes
 * @returns
 */
function fomartNetwork(bytes: any): void {
  if (bytes >= 1073741824) {
    bytes = Math.round((bytes / 1073741824) * 100) / 100 + '/Gb'
  } else if (bytes >= 1048576) {
    bytes = Math.round((bytes / 1048576) * 100) / 100 + '/Mb'
  } else if (bytes >= 1024) {
    bytes = Math.round((bytes / 1024) * 100) / 100 + '/kb'
  } else {
    bytes = bytes + '/bytes'
  }
  return bytes
}

/**
 * 设置代理
 * @param arg 模式
 * @param pac pac地址
 * @param ip sockert IP 地址
 * @param port 端口
 */
function proxy_change(arg: string, pac: string, ip: string, port: string): void {
  let shellCmd
  if (process.platform === 'darwin') {
    shellCmd = `"/Library/Application Support/xiaoku-app/macos/proxy_conf_helper" -m`
    switch (arg) {
      case 'off':
        shellCmd = `${shellCmd} off`
        break
      case 'pac':
        shellCmd = `${shellCmd} auto -u ${pac}`
        break
      case 'all':
        shellCmd = `${shellCmd} global -l ${ip} -p ${port} -r ${port} -s ${ip} -x "*.qunhequnhe.com,*.kujiale.com,*.meijian.com,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12,127.0.0.1"`
        break
      default:
        shellCmd = `${shellCmd} off`
        break
    }
  } else {
    shellCmd = `"${path.join(db.get(BASE.APP_PATH).value(), '/assets/windows/sysproxy.exe')}"`
    switch (arg) {
      case 'off':
        shellCmd = `${shellCmd} set 1 - - - `
        break
      case 'pac':
        if (pac) {
          shellCmd = `${shellCmd} pac ${pac}`
        }
        break
      case 'all':
        if (ip && port) {
          shellCmd = `${shellCmd} global ${ip}:${port} "*.qunhequnhe.com;*.kujiale.com;*.meijian.com;192.*;10.*;172.*;127.0.0.1"`
        }
        break
      default:
        shellCmd = `${shellCmd} set 1 - - - `
        break
    }
  }
  vpnDb.default.set(VPN_ENUM.PROXY, arg).write()
  cmd.exec(shellCmd, (err, data, stderr) => {
    if (err || stderr) {
      xiaokuError(`err: ${err},stderr: ${stderr}`)
    }
    xiaokuDebug(data)
  })
}

ipcMain.on('initConfigList', (_event: IpcMainEvent, configs: any) => {
  initConfigList(configs)
    .then((result: any) => {
      _event.sender.send('initConfigList', result)
    })
    .catch((err) => {
      xiaokuError(err)
    })
})

function initConfigList(configs): Promise<any> {
  const newConfigList = new Map()
  return new Promise((resolve) => {
    const crypto = require('crypto')
    const filePath = db.get(BASE.APP_PATH).value() + '/assets/config/'
    fs.readdir(filePath, async function (err, files) {
      if (err) {
        xiaokuError(err.message)
        // fs.mkdirSync(filePath)
      }
      const map = new Map()
      //遍历读取到的文件列表
      files &&
        files.forEach(function (filename) {
          //获取当前文件的绝对路径
          const filedir = path.join(filePath, filename)
          //读取一个Buffer
          const buffer = fs.readFileSync(filedir)
          const fsHash = crypto.createHash('sha256')
          fsHash.update(buffer)
          const md5 = fsHash.digest('hex')
          map.set(filename, md5)
        })
      // config.url, path.join(filePath, config.configName)
      configs.map((config: any) => {
        if (config.md5 != map.get(config.configName)) {
          const { net } = require('electron')
          const request = net.request(config.url)
          request.on('response', (response) => {
            response.on('data', (chunk) => {
              // console.log(`BODY: ${chunk}`)
              fs.writeFileSync(path.join(filePath, config.configName), chunk, 'binary')
              newConfigList.set(config.url.split('/')[config.url.split('/').length - 1], true)
            })
            response.on('end', () => {
              resolve(newConfigList)
            })
          })
          request.end()
        }
      })
    })
  })
}
