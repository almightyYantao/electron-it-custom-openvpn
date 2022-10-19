/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Button, Space, Alert, Spin } from 'antd'
import { useEffect, useState } from 'react'
import '@renderer/assets/vpn.less'
import { useTranslation } from 'react-i18next'

const Network: React.FC<any> = (prop: any) => {
  const [networkEvent] = useState(['network', 'intranet', 'dns', 'vpn'])
  const [netAllEvent, setNetAllEvent] = useState({})
  const [netAllEventLoading, setNetAllEventLoading] = useState({})

  /**
   * 引入国际化
   */
  const { t } = useTranslation()

  useEffect(() => {}, [netAllEvent])

  /**
   * 检查网络
   */
  const networkCheck = (eventName: string): Promise<boolean> => {
    return new Promise((resolve) => {
      netAllEventLoading[eventName] = true
      const newLoadingResult = Object.create(netAllEventLoading)
      setNetAllEventLoading(newLoadingResult)
      console.log(netAllEvent)
      window.electron.ipcRenderer.send('checkLocalHostNetwork', eventName)
      window.electron.ipcRenderer.once(
        'checkLocalHostNetwork-' + eventName,
        (event: Event, arg: boolean) => {
          netAllEvent[eventName] = arg
          setNetAllEvent(netAllEvent)
          // 设置是否加载中
          netAllEventLoading[eventName] = false
          setNetAllEventLoading(netAllEventLoading)
          resolve(arg)
        }
      )
    })
  }

  /**
   * 一键检测
   */
  const allKeyStart = async () => {
    for (const item of networkEvent) {
      netAllEvent[item] = null
    }
    for (const item of networkEvent) {
      await networkCheck(item)
    }
  }

  return (
    <Space direction="vertical">
      <Button onClick={allKeyStart}>{t('vpn.network.start')}</Button>
      {networkEvent.map((s) => {
        return (
          <Spin
            tip="Loading..."
            key={s}
            spinning={netAllEventLoading[s] == null ? false : netAllEventLoading[s]}
          >
            <Alert
              message={t('vpn.network.' + s)}
              style={{ width: '330px' }}
              type={
                netAllEvent[s] === null || netAllEvent[s] === undefined
                  ? 'info'
                  : netAllEvent[s] === true
                  ? 'success'
                  : 'error'
              }
              key={s}
              action={
                <Button size="small" type="primary" onClick={() => networkCheck(s)}>
                  {t('vpn.network.startTest')}
                </Button>
              }
              showIcon
            />
          </Spin>
        )
      })}
    </Space>
  )
}

export default Network
