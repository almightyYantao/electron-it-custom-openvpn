/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Config, getConfigList } from '@renderer/api/vpnConfig'
import { Button, Space, Select, Modal, Drawer, Spin, message } from 'antd'
import { useEffect, useState } from 'react'
import '@renderer/assets/vpn.less'
import { useTranslation } from 'react-i18next'
import Network from './Network'
import { useNavigate } from 'react-router-dom'

const { Option } = Select

type NavList = {
  name: string
  icon?: string
  url: string
}

function VPN(): JSX.Element {
  const [configs, setConfigs] = useState<Config[]>()
  const [useConfig, setUseConfig] = useState('qunhe-slb')
  const [title, setTitle] = useState()
  const [connectStatus, setConnectStatus] = useState(false)
  const [connectingStatus, setConnectingStatus] = useState(false)
  const [connectingClass, setConnectingClass] = useState('connect-status')
  const [connectClass, setConnectCLass] = useState('circle')
  const [connectingLog, setConnectingLog] = useState('')
  const [nav, setNav] = useState<NavList[]>()
  const [remoteNetwork, setRemoteNetwork] = useState('')
  const [localNetwork, setLocalNetwork] = useState('')
  const [networkDrawerStatus, setNetworkDrawerStatus] = useState(false)
  const [initLoading, setInitLoading] = useState(false)
  const [timeConsuming, setTimeConsuming] = useState(0)

  const navigate = useNavigate()

  /**
   * 获取配置文件
   * @param ldap 花名LDAP
   */
  const getConfig = (ldap: string, name: string) => {
    console.log(name)
    setUseConfig(name)
    getConfigList(ldap).then((response: any) => {
      const res = response as Config[]
      if (name === null || name === undefined) {
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
    window.electron.ipcRenderer.send('isTokenValid')
    window.electron.ipcRenderer.once('isTokenValid', (_event: Event, isTokenValid: boolean) => {
      console.log(isTokenValid)
      if (!isTokenValid) {
        navigate('/login')
      } else {
        // 获取上一次连接的配置文件
        window.electron.ipcRenderer.send('vpnDbGet', 'configValue')
        window.electron.ipcRenderer.once('vpnDbGet-configValue', (_event: Event, arg: string) => {
          getConfig(String(localStorage.getItem('username')), arg)
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
              window.electron.ipcRenderer.send('vpnDbGet', 'connectStatus.connectIp')
              window.electron.ipcRenderer.once(
                'vpnDbGet-connectStatus.connectIp',
                (_event: Event, arg: string) => {
                  console.log(arg)
                  setRemoteNetwork(arg)
                }
              )
            }
          }
        )
        window.electron.ipcRenderer.send('getLocalHostNetwork')
        window.electron.ipcRenderer.once('setLocalHostNetwork', (_event: Event, arg: string) => {
          setLocalNetwork(arg)
        })
      }
    })
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
    if (sessionStorage.getItem('just-started') === 'true') {
      console.log('禁止操作阶段')
      return
    }
    setTimeConsuming(new Date().getTime())
    // 设置3秒后按钮可操作
    setTimeout(() => {
      sessionStorage.setItem('just-started', 'false')
    }, 3000)
    // 设置链接中的标题和状态
    setConnectingClass(connectingClass + ' connect-status-ing')
    setConnectingStatus(true)
    setTitle(t('vpn.connect.connecting'))
    window.electron.ipcRenderer.send('openvpn-start')
    // 发送设置当前链接中的状态
    window.electron.ipcRenderer.send('vpnDbSet', 'connectStatus.connecting', true)
    window.electron.ipcRenderer.once('init-start', () => {
      setInitLoading(true)
    })
    window.electron.ipcRenderer.once('init-success', () => {
      message.success(t('vpn.init.success'))
      setInitLoading(false)
      closeVpn()
    })
    window.electron.ipcRenderer.once('init-error', (_event: Event, arg: any) => {
      message.error(t('vpn.init.error') + ': ' + arg)
      setInitLoading(false)
      closeVpn()
    })

    /**
     * 设置一个延时检测
     */
    // setTimeout(() => {
    //   if (connectStatus !== true) {
    //     Modal.error({
    //       title: 'VPN Connect Error',
    //       content: '连接超时，请联系IT桌面运维'
    //     })
    //     closeVpn()
    //   }
    // }, 30000)

    /**
     * 监听后端的连接状态返回
     */
    window.electron.ipcRenderer.once('openvpn-start-status', (_event: Event, arg: any) => {
      const status = arg.status
      const remark = arg.remark
      window.electron.ipcRenderer.send('vpnDbSet', 'connectStatus.connecting', false)
      if (status == true) {
        setSuccessStatus()
        setRemoteNetwork(arg.connectIp)
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
    window.electron.ipcRenderer.removeAllListeners('init-success')
    window.electron.ipcRenderer.removeAllListeners('init-error')
    window.electron.ipcRenderer.removeAllListeners('init-start')
    window.electron.ipcRenderer.removeAllListeners('setConnectingLog')
    setConnectingStatus(false)
    setConnectingLog('')
    // 计算从点击到完成的耗时
    setTimeConsuming((per) => new Date().getTime() - per)
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
    setRemoteNetwork('')
  }

  /**
   * 设置网络检测页面是否打开
   */
  const showNetworkDrawer = () => {
    setNetworkDrawerStatus(true)
  }
  const onCloseNetworkDrawer = () => {
    setNetworkDrawerStatus(false)
  }

  /**
   * 打开链接
   * @param url 连接
   */
  const openUrl = (url: string) => {
    window.electron.ipcRenderer.send('open-url', url)
  }
  return (
    <div>
      <Spin spinning={initLoading}>
        <div className="vpn-top-tool">
          <Space className="button">
            <Button
              type="primary"
              onClick={(): void => window.electron.ipcRenderer.send('downloadLog')}
            >
              {t('vpn.downlog')}
            </Button>
            <Button type="primary" onClick={showNetworkDrawer}>
              {t('vpn.network.check')}
            </Button>
          </Space>
          <div>
            <Select
              value={useConfig}
              disabled={connectStatus}
              onChange={configOnChange}
              className="vpn-top-tool-config"
            >
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
        <span style={{ color: connectStatus ? '#000' : '#fff' }}>
          本次链接耗时:{timeConsuming}ms
        </span>
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
                    <a
                      key={item.name}
                      className="vpn-body-nav-item"
                      onClick={() => {
                        openUrl(item.url)
                      }}
                    >
                      <div className="vpn-body-nav-item-icon">{item.name.substr(0, 1)}</div>
                      {item.name}
                    </a>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
        <div className="vpn-footer">
          <span className="local">{localNetwork}</span>
          <span className="remote">{remoteNetwork}</span>
        </div>
        <Drawer
          title={t('vpn.network.check')}
          placement="right"
          onClose={onCloseNetworkDrawer}
          open={networkDrawerStatus}
        >
          <Network isReload={true}></Network>
        </Drawer>
      </Spin>
    </div>
  )
}

export default VPN
