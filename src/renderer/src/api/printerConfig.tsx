import { get } from './request'

export interface PrinterResult {
  id: number
  title: string
}

export interface PrinterListResult {
  id: number
  title: string
  execSilent: string
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getPrinterType = (): Promise<PrinterResult[]> => {
  return new Promise((resolve, reject) => {
    get('https://desktop.qunhequnhe.com/api/v1/webapp/printer/type').then(
      (res: PrinterResult[]) => {
        resolve(res)
      },
      (error: PrinterResult[]) => {
        console.log('网络异常~', error)
        reject(error)
      }
    )
  })
}

export const getPrinterTypeList = (typeId: number): Promise<PrinterListResult[]> => {
  return new Promise((resolve, reject) => {
    get(`https://desktop.qunhequnhe.com/api/v1/webapp/printer?type=${typeId}`).then(
      (res: PrinterListResult[]) => {
        resolve(res)
      },
      (error: PrinterListResult[]) => {
        console.log('网络异常~', error)
        reject(error)
      }
    )
  })
}
