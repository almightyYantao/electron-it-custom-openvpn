/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Config, getConfigList } from '@renderer/api/vpnConfig'
import { Button, Space, Select } from 'antd'
import { useEffect, useState } from 'react'
import { databaseSet } from '../../common/dbEvent'
import '../../assets/vpn.less'
import { useTranslation } from 'react-i18next'

const { Option } = Select

function VPN(): JSX.Element {
  const [configs, setConfigs] = useState<Config[]>()
  const [useConfig, setUseConfig] = useState('')
  const [title, setTitle] = useState()
  const [connectStatus, setConnectStatus] = useState(false)
  const [connectingClass, setConnectingClass] = useState('connect-status')

  /**
   * 获取配置文件
   * @param ldap 花名LDAP
   */
  const getConfig = (ldap: string, name: string) => {
    console.log(name)
    setUseConfig(name)
    getConfigList(ldap).then((response: any) => {
      const res = response as Config[]
      if (name === null) {
        setUseConfig(res[0].configValue)
      }
      setConfigs(res)
    })
  }

  /**
   * 配置文件变更
   * @param value 配置文件名称
   */
  const configOnChange = (value: string) => {
    console.log(`selected ${value}`)
    setUseConfig(value)
    databaseSet('dbSet-connectConfig', { configValue: value })
  }

  /**
   * 初始化组件
   */
  useEffect(() => {
    // 获取上一次连接的配置文件
    window.electron.ipcRenderer.send('vpnDbGet', 'configValue')
    window.electron.ipcRenderer.once('vpnDbGet-configValue', (_event: Event, arg: string) => {
      getConfig('yantao', arg)
    })
    setTitle(t('vpn.connect.title'))

    // 获取当前VPN状态
    window.electron.ipcRenderer.send('vpnDbGet', 'connectStatus')
    window.electron.ipcRenderer.once('vpnDbGet-connectStatus', (_event: Event, arg: boolean) => {
      console.log(arg)
      setConnectStatus(arg)
    })
  }, [])

  /**
   * 引入国际化
   */
  const { t } = useTranslation()

  /**
   * 连接VPN
   */
  const startVpn = () => {
    setConnectingClass(connectingClass + ' connect-status-ing')
    setConnectStatus(true)
    setTitle(t('vpn.connect.connecting'))
    setTimeout(() => {
      closeVpn()
    }, 10000)
  }

  /**
   * 断开VPN
   */
  const closeVpn = () => {
    setConnectingClass('connect-status')
    setConnectStatus(false)
    setTitle(t('vpn.connect.title'))
  }

  return (
    <div className="content">
      <div className="vpn-top-tool">
        <Space className="button">
          <Button type="primary">{t('vpn.downlog')}</Button>
          <Button type="primary">{t('vpn.network.check')}</Button>
        </Space>
        <div>
          <Select value={useConfig} onChange={configOnChange} className="vpn-top-tool-config">
            {configs && configs?.length > 0 ? (
              configs?.map((item: Config) => {
                return <Option key={item.configValue}>{item.configTitle}</Option>
              })
            ) : (
              <Option key={useConfig}>加载中...</Option>
            )}
          </Select>
        </div>
      </div>
      <div className="vpn-main-body">
        <div className="circle" onClick={startVpn}>
          <div className="circleTwo">
            <span>{title}</span>
            <span className={connectingClass}>.</span>
            <span className={connectingClass}>.</span>
            <span className={connectingClass}>.</span>
            <span className={connectingClass}>.</span>
          </div>
        </div>
      </div>
      <div className="vpn-footer"></div>
    </div>
  )
}

export default VPN
