/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Config, getConfigList } from '@renderer/api/vpnConfig'
import { Button, Space, Select } from 'antd'
import { useEffect, useState } from 'react'
import db from '../../store/vpn'
import '../../assets/vpn.less'

const { Option } = Select

function VPN(): JSX.Element {
  const [configs, setConfigs] = useState<Config[]>()
  const [useConfig, setUseConfig] = useState('')

  /**
   * 获取配置文件
   * @param ldap 花名LDAP
   */
  const getConfig = (ldap: string, name: string) => {
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
    // setConnectConfig(value)
    db.read().set('configValue', value)
    // getConnectConfig(value, 0)
  }

  /**
   * 初始化组件
   */
  useEffect(() => {
    getConfig('yantao', db.read().get('configValue'))
  }, [])

  return (
    <div className="content">
      <div className="vpn-top-tool">
        <Space className="button">
          <Button type="primary">Primary Button</Button>
          <Button type="primary">Primary Button</Button>
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
        <div className="circle"></div>
        <div className="circleTwo">
          <span>开始连接</span>
          <span className="connect-status">.</span>
          <span className="connect-status">.</span>
          <span className="connect-status">.</span>
        </div>
      </div>
      <div className="vpn-footer"></div>
    </div>
  )
}

export default VPN
