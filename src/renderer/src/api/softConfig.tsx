import { get } from './request'

export interface SoftResult {
  id: number
  appStore: string
  createAt: string
  desc: string
  downUrl: string
  execSilent: string
  icon: string
  macUrl: string
  title: string
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getSoftList = (typeId: number) => {
  return new Promise((resolve, reject) => {
    get(`https://desktop.qunhequnhe.com/api/v1/webapp/list?typeId=${typeId}&from=0&to=1000`).then(
      (res: SoftResult[]) => {
        resolve(res)
      },
      (error: SoftResult[]) => {
        console.log('网络异常~', error)
        reject(error)
      }
    )
  })
}
