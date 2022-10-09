/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Config, getConfigList } from '@renderer/api/vpnConfig'
import { Button, Space, Select, Modal } from 'antd'
import { useEffect, useState } from 'react'
import { databaseSet } from '@renderer/common/dbEvent'
import '@renderer/assets/vpn.less'
import { useTranslation } from 'react-i18next'

const { Option } = Select

type NavList = {
  name: string
  icon?: string
  url: string
}

function VPN(): JSX.Element {
  const [configs, setConfigs] = useState<Config[]>()
  const [useConfig, setUseConfig] = useState('')
  const [title, setTitle] = useState()
  const [connectStatus, setConnectStatus] = useState(false)
  const [connectingStatus, setConnectingStatus] = useState(false)
  const [connectingClass, setConnectingClass] = useState('connect-status')
  const [connectClass, setConnectCLass] = useState('circle')
  const [connectingLog, setConnectingLog] = useState('')
  const [nav, setNav] = useState<NavList[]>()

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
    window.electron.ipcRenderer.send('vpnDbSet', 'configValue', value)
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
    setNav([
      {
        name: 'confluence',
        url: 'https://cf.qunhequnhe.com'
      },
      {
        name: '核伙人门户',
        url: 'https://coreland.qunhequnhe.com'
      },
      {
        name: '任务中心',
        url: 'https://coreland.qunhequnhe.com/task?id=initiate'
      },
      {
        name: 'OKR',
        url: 'https://okr-web.qunhequnhe.com'
      },
      {
        name: 'Kaptain',
        url: 'https://kaptain.qunhequnhe.com/'
      },
      {
        name: 'nextCloud',
        url: 'https://nextcloud.qunhequnhe.com/'
      },
      {
        name: '数据小站',
        url: 'https://tesseract.qunhequnhe.com/'
      },
      {
        name: '运营云台',
        url: 'https://yuntai.qunhequnhe.com/#/home'
      },
      {
        name: 'KuBOSS',
        url: 'https://salesplatform.kujiale.com/workbench/#/workbench/index'
      }
    ])
    // 获取当前VPN状态
    window.electron.ipcRenderer.send('vpnDbGet', 'connectStatus.status')
    window.electron.ipcRenderer.once(
      'vpnDbGet-connectStatus.status',
      (_event: Event, arg: boolean) => {
        console.log(arg)
        if (arg === true) {
          setSuccessStatus()
        }
      }
    )
  }, [])

  /**
   * 引入国际化
   */
  const { t } = useTranslation()

  /**
   * VPN总启动方式
   */
  const startVpn = () => {
    if (connectStatus === true || connectingStatus === true) {
      closeVpn()
    } else {
      connectVpn()
    }
  }

  /**
   * 连接VPN
   */
  const connectVpn = () => {
    setConnectingClass(connectingClass + ' connect-status-ing')
    setConnectingStatus(true)
    setTitle(t('vpn.connect.connecting'))
    window.electron.ipcRenderer.send('openvpn-start')
    window.electron.ipcRenderer.once('openvpn-start-status', (_event: Event, arg: any) => {
      const status = arg.status
      const remark = arg.remark
      if (status == true) {
        setSuccessStatus()
      } else {
        Modal.error({
          title: 'VPN Connect Error',
          content: remark
        })
        closeVpn()
      }
    })
    window.electron.ipcRenderer.on('setConnectingLog', (_event: Event, arg: string) => {
      setConnectingLog(arg)
    })
  }

  /**
   * 设置连接成功状态
   */
  const setSuccessStatus = () => {
    setConnectStatus(true)
    setTitle(t('vpn.connect.closeVpn'))
    setConnectingClass('connect-status')
    setConnectCLass('circle circle-success')
    setConnectingStatus(false)
    setConnectingLog('')
  }

  /**
   * 断开VPN
   */
  const closeVpn = () => {
    setConnectingClass('connect-status')
    setConnectStatus(false)
    setTitle(t('vpn.connect.title'))
    setConnectCLass('circle')
    setConnectingStatus(false)
    window.electron.ipcRenderer.send('openvpn-close')
    window.electron.ipcRenderer.removeAllListeners('setConnectingLog')
    setConnectingLog('')
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
        <div className={connectClass} onClick={startVpn}>
          <div className="circleTwo">
            <span>{title}</span>
            <span className={connectingClass}>.</span>
            <span className={connectingClass}>.</span>
            <span className={connectingClass}>.</span>
            <span className={connectingClass}>.</span>
          </div>
        </div>
        <span className="connecting-log">{connectingLog}</span>
        {connectStatus ? (
          <div className="vpn-body-nav">
            <span className="vpn-body-nav-title">指路牌</span>
            <div className="vpn-body-nav-info">
              {nav?.map((item: NavList) => {
                return (
                  <a key={item.name} className="vpn-body-nav-item">
                    <div className="vpn-body-nav-item-icon">{item.name.substr(0, 1)}</div>
                    {item.name}
                  </a>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
      <div className="vpn-footer"></div>
    </div>
  )
}

export default VPN
