import {
  getPrinterType,
  getPrinterTypeList,
  PrinterListResult,
  PrinterResult
} from '@renderer/api/printerConfig'
import { Button, Card, Divider, message, Select, Spin, Tabs } from 'antd'
import { useEffect, useState } from 'react'
import '@renderer/assets/printer.less'

function Printer(): JSX.Element {
  const [list, setList] = useState<PrinterListResult[]>()
  const [types, setTypes] = useState<PrinterResult[]>([])
  const [spinningLoading, setSpinningLoading] = useState(false)

  useEffect(() => {
    getPrinterType().then((result: PrinterResult[]) => {
      setTypes(result)
    })
    getPrinterTypeList(1).then((result: PrinterListResult[]) => {
      setList(result)
    })
  }, [])

  /**
   * tab切换
   * @param value
   */
  const onTablesChange = (value: string): void => {
    getPrinterTypeList(Number(value)).then((result: PrinterListResult[]) => {
      setList(result)
    })
  }

  /**
   * 安装打印机
   * @param item
   */
  const startInstall = (item: PrinterListResult): void => {
    console.log('开始安装')
    setSpinningLoading(true)
    window.electron.ipcRenderer.send('printer-install', item.execSilent)
    window.electron.ipcRenderer.on('printer-download-info', (_event: Event, info: string) => {
      message.info(info)
    })
    window.electron.ipcRenderer.once('printer-error', (_event: Event, reason: string) => {
      message.error(reason)
      window.electron.ipcRenderer.removeAllListeners('printer-download-info')
      setSpinningLoading(false)
    })
    window.electron.ipcRenderer.once('printer-success', (_event: Event, reason: string) => {
      message.success('安装成功')
      window.electron.ipcRenderer.removeAllListeners('printer-download-info')
      setSpinningLoading(false)
    })
  }

  return (
    <div className="printer-card">
      <Spin spinning={spinningLoading} className="printer-card">
        <Tabs
          defaultActiveKey={String(1)}
          type="card"
          animated={true}
          onChange={(activeKey): any => onTablesChange(activeKey)}
          size="small"
          items={types?.map((_) => {
            return {
              label: _.title,
              key: String(_.id),
              children: (
                <div className="printer-card__main">
                  {list?.map((item: PrinterListResult) => {
                    return (
                      <div className="printer-card__child" key={item.id}>
                        <Card hoverable={true}>
                          <Card.Meta
                            // avatar={<Avatar src={item.icon} />}
                            title={item.title}
                            // description={item.desc}
                          />
                          <Divider />
                          <div style={{ textAlign: 'center' }}>
                            <Button type="primary" onClick={(): void => startInstall(item)}>
                              点击安装
                            </Button>
                          </div>
                        </Card>
                      </div>
                    )
                  })}
                </div>
              )
            }
          })}
        />
      </Spin>
    </div>
  )
}

export default Printer
