import { IncomingMessage, ipcMain, IpcMainEvent, net } from 'electron'
import { aesDecrypt, aesEncrypt } from './decrypt'
import { xiaokuError } from './log'
import { USER, VPN_ENUM } from './enumeration'
import db from '../store/config'
import {
  EVENT_USER_EXIT_LOGIN,
  EVENT_USER_GET_REMEMBER,
  EVENT_USER_GET_USERNAME,
  EVENT_USER_IS_TOKEN_VALID,
  EVENT_USER_LOGIN,
  EVENT_USER_LOGIN_ERROR,
  EVENT_USER_LOGIN_SUCCESS,
  EVENT_USER_SET_REMEMBER
} from '../../event'

ipcMain.on(EVENT_USER_SET_REMEMBER, (_event: IpcMainEvent, remember: boolean) => {
  db.set(USER.USER_REMEMBER_ME, remember).write()
})

ipcMain.on(EVENT_USER_GET_REMEMBER, (_event: IpcMainEvent) => {
  _event.sender.send(EVENT_USER_GET_REMEMBER, db.get(USER.USER_REMEMBER_ME).value())
})

ipcMain.on(EVENT_USER_GET_USERNAME, (_event: IpcMainEvent) => {
  if (db.get(USER.USER_REMEMBER_ME).value() === true) {
    _event.sender.send(
      EVENT_USER_GET_USERNAME,
      db.get(USER.USER_USERNAME).value(),
      aesDecrypt(db.get(USER.USER_PASSWORD).value(), VPN_ENUM.SECRET_KEY, VPN_ENUM.SECRET_KEY_IV)
    )
  } else {
    _event.sender.send(EVENT_USER_GET_USERNAME, '', '')
  }
})

/**
 * 判断当前Token是否有效
 */
ipcMain.on(EVENT_USER_IS_TOKEN_VALID, (_event: IpcMainEvent) => {
  getUserInfo(db.get(USER.USER_TOKEN).value(), db.get(USER.USER_USERNAME).value())
    .then(() => {
      _event.sender.send(EVENT_USER_IS_TOKEN_VALID, true)
    })
    .catch(() => {
      _event.sender.send(EVENT_USER_IS_TOKEN_VALID, false)
    })
})

/**
 * 退出登录
 */
ipcMain.on(EVENT_USER_EXIT_LOGIN, () => {
  db.set(USER.USER_TOKEN, '').write()
  //   db.set(USER.USER_USERNAME, '').write()
  db.set(USER.EXIT_AUTO_LOGIN, false).write()
})

/**
 * 登录
 */
ipcMain.on(EVENT_USER_LOGIN, (_event: IpcMainEvent, username: string, password: string) => {
  login(username, password)
    .then((json: any) => {
      if (json.c === '0') {
        db.set(USER.USER_TOKEN, json.d).write()
        db.set(USER.USER_USERNAME, username).write()
        getUserInfo(json.d, username)
          .then((result) => {
            _event.sender.send(EVENT_USER_LOGIN_SUCCESS, result)
            db.set(
              USER.USER_PASSWORD,
              aesEncrypt(password, VPN_ENUM.SECRET_KEY, VPN_ENUM.SECRET_KEY_IV)
            ).write()
          })
          .catch((error) => {
            _event.sender.send(EVENT_USER_LOGIN_ERROR, error)
          })
      } else {
        _event.sender.send(EVENT_USER_LOGIN_ERROR, json.m)
      }
    })
    .catch((err) => {
      _event.sender.send(EVENT_USER_LOGIN_ERROR, err)
    })
})

/**
 * SSO登录方法
 * @param username
 * @param password
 */
function login(username: string, password: string): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = ''
    const resp = net.request({
      method: 'POST',
      protocol: 'https:',
      hostname: 'kuauth.kujiale.com',
      path: '/api/ssologin/'
    })
    const postData = `{"uid":"${username}","pswd":"${password}"}`
    resp.setHeader('Content-Type', 'application/json')
    resp.write(postData)
    resp.end()
    resp.on('response', (response: IncomingMessage) => {
      // console.log(`STATUS: ${response.statusCode}`);
      response.on('data', (chunk) => {
        data = data + chunk.toString()
      })
      response.on('end', () => {
        const json = JSON.parse(data)
        resolve(json)
      })
      response.on('error', (response, _data) => {
        reject(response)
        xiaokuError(_data)
      })
    })
  })
}

/**
 * 获取当前登录用户信息
 */
function getUserInfo(token: string, ldap: string): Promise<any> {
  let data = ''
  return new Promise((resolve, reject) => {
    const resp = net.request({
      method: 'GET',
      protocol: 'https:',
      hostname: 'kuauth.kujiale.com',
      path: '/authnet/open/api/user/basicinfo?ldap=' + ldap
    })
    resp.setHeader('Cookie', 'qunheinternalsso=' + decodeURIComponent(token))
    resp.on('response', (response) => {
      response.on('data', (chunk) => {
        data = data + chunk.toString()
      })
      response.on('end', () => {
        try {
          const json = JSON.parse(data)
          const field = {
            ldapId: json.ldapId,
            name: json.name,
            avatar: json.avatar,
            userId: json.userId
          }
          resolve(field)
        } catch (e) {
          console.log(e)
          reject(e)
        }
      })
      response.on('error', (response) => {
        xiaokuError(`获取用户信息失败:${response}`)
        reject(response)
      })
    })
    resp.end()
  })
}
