import { get } from './request'

export interface Config {
  id: string
  configName: string
  configValue: string
  configTitle: string
  pac: string
  md5: string
  port: string
  ip: string
  url: string
  socksIp: string
  socksPort: string
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getConfigList = (ldap: string) => {
  return new Promise((resolve, reject) => {
    get(`https://desktop.qunhequnhe.com/api/v1/webapp/vpn-config?ldap=${ldap}`).then(
      (res: Config[]) => {
        resolve(res)
      },
      (error: Config[]) => {
        console.log('网络异常~', error)
        reject(error)
      }
    )
  })
}
