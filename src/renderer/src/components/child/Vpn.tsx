/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Config, getConfigList } from '@renderer/api/vpnConfig'
import {
  Button,
  Space,
  Select,
  Modal,
  Drawer,
  Spin,
  message,
  Radio,
  RadioChangeEvent,
  Tooltip
} from 'antd'
import { useEffect, useState } from 'react'
import '@renderer/assets/vpn.less'
import { useTranslation } from 'react-i18next'
import Network from './Network'
import { useNavigate } from 'react-router-dom'
import { BulbOutlined, CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons'

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
  const [connectingUp, setConnectingUp] = useState('')
  const [connectingDown, setConnectingDown] = useState('')
  const [connectProxyValue, setConnectProxyValue] = useState('off')
  const [openvpnStatusEvent, setOpenvpnStatusEvent] = useState('')
  const [proxyActive, setProxyActive] = useState(false)
  const [configMap, setConfigMap] = useState({})

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
      res.map((item: Config) => {
        setConfigMap((per) => ({ ...per, [item.configValue]: item }))
      })
      if (name === null || name === undefined) {
        configOnChange(res[0].configValue)
      }
      setConfigs(res)
      initConfig(res)
    })
  }

  /**
   * 配置文件变更
   * @param value 配置文件名称
   */
  const configOnChange = (value: string) => {
    setUseConfig(value)
    if (configMap[value] && configMap[value]?.pac) {
      sessionStorage.setItem('proxyActive', String(true))
    } else {
      sessionStorage.setItem('proxyActive', String(false))
    }
    window.electron.ipcRenderer.send('vpnDbSet', 'configValue', value)
  }

  /**
   * 初始化配置文件
   */
  const initConfig = (configs: Config[]) => {
    window.electron.ipcRenderer.send('initConfigList', configs)
    window.electron.ipcRenderer.once(
      'initConfigList',
      (_event: Event, arg: Map<string, boolean>) => {
        arg.forEach((_value, key) => {
          message.success(`更新完成「${key}」配置文件`)
        })
      }
    )
  }

  /**
   * 初始化组件
   */
  useEffect(() => {
    window.electron.ipcRenderer.removeAllListeners('alter_windows_openvpn_connect')
    window.electron.ipcRenderer.removeAllListeners('initConfigList')
    window.electron.ipcRenderer.on(
      'alter_windows_openvpn_connect',
      (_event: Event, content: string, title: string) => {
        Modal.error({
          title: title,
          content: content
        })
      }
    )
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
            // setSuccessStatus()
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
        window.electron.ipcRenderer.send('vpnDbGet', 'proxy')
        window.electron.ipcRenderer.once('vpnDbGet-proxy', (_event: Event, arg: string) => {
          console.log(arg)
          setConnectProxyValue(arg)
        })
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
    if (sessionStorage.getItem('just-started') === 'true') {
      console.log('禁止操作阶段')
      return
    }
    if (connectStatus === true || connectingStatus === true) {
      closeVpn()
    } else {
      connectVpn()
    }
  }

  /**
   * 监听所有的VPN事件
   */
  const openvpnEventChange = () => {
    window.electron.ipcRenderer.on(
      'openvpn_event',
      (_event: Event, event: string, value: string) => {
        console.log(event, value)
        setOpenvpnStatusEvent(event)
        if (event === 'ADD_ROUTES') {
          sessionStorage.setItem('just-started', String(true))
        } else {
          sessionStorage.setItem('just-started', String(false))
        }
      }
    )
  }

  /**
   * 连接VPN
   */
  const connectVpn = () => {
    window.electron.ipcRenderer.send('openvpn-start')
    // 发送设置当前链接中的状态
    window.electron.ipcRenderer.send('vpnDbSet', 'connectStatus.connecting', true)
    window.electron.ipcRenderer.once('init-start', () => {
      setInitLoading(true)
    })
    window.electron.ipcRenderer.once('init-success', () => {
      message.success(t('vpn.init.success'))
      setInitLoading(false)
      initVpnText()
    })
    window.electron.ipcRenderer.once('init-error', (_event: Event, arg: any) => {
      message.error(t('vpn.init.error') + ': ' + arg)
      setInitLoading(false)
      initVpnText()
    })

    localStorage.setItem('timeConsuming', String(new Date().getTime()))
    // 设置3秒后按钮可操作
    setTimeout(() => {
      sessionStorage.setItem('just-started', 'false')
    }, 3000)
    // 设置链接中的标题和状态
    setConnectingClass(connectingClass + ' connect-status-ing')
    setConnectingStatus(true)
    setTitle(t('vpn.connect.connecting'))
    openvpnEventChange()
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
        // 计算从点击到完成的耗时
        localStorage.setItem(
          'timeConsuming',
          String(new Date().getTime() - Number(localStorage.getItem('timeConsuming')))
        )
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
    window.electron.ipcRenderer.removeAllListeners('openvpn_event')
    setConnectingStatus(false)
    setTimeConsuming(Number(localStorage.getItem('timeConsuming')))
    setConnectingLog('')
    window.electron.ipcRenderer.on('network_traffic_out', (_event: Event, arg: string) => {
      setConnectingUp(arg)
    })
    window.electron.ipcRenderer.on('network_traffic_in', (_event: Event, arg: string) => {
      setConnectingDown(arg)
    })
    setTimeConsuming(Number(localStorage.getItem('timeConsuming')))
    window.electron.ipcRenderer.send('vpnDbGet', 'proxy')
    window.electron.ipcRenderer.once('vpnDbGet-proxy', (_event: Event, arg: string) => {
      setConnectProxyValue(!arg ? 'off' : arg)
      proxyChange(arg)
    })
    if (sessionStorage.getItem('proxyActive') === String(true)) {
      setProxyActive(true)
    }
  }

  /**
   * 断开VPN
   */
  const closeVpn = () => {
    setTitle(t('vpn.connect.inTheClosed'))
    setConnectingClass(connectingClass + ' connect-status-ing')
    window.electron.ipcRenderer.send('openvpn-close')
    window.electron.ipcRenderer.once('complete_close', () => {
      initVpnText()
    })
  }

  /**
   * 初始化界面状态
   */
  const initVpnText = () => {
    setConnectingClass('connect-status')
    setConnectStatus(false)
    setTitle(t('vpn.connect.title'))
    setProxyActive(false)
    setConnectCLass('circle')
    setConnectingStatus(false)
    window.electron.ipcRenderer.removeAllListeners('setConnectingLog')
    window.electron.ipcRenderer.removeAllListeners('openvpn-start-status')
    window.electron.ipcRenderer.removeAllListeners('network_traffic_out')
    window.electron.ipcRenderer.removeAllListeners('network_traffic_in')
    window.electron.ipcRenderer.removeAllListeners('dont_init')
    window.electron.ipcRenderer.removeAllListeners('openvpn_event')
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
   * 代理切换
   * @param e
   */
  const redioProxyChange = (e: RadioChangeEvent) => {
    proxyChange(e.target.value)
  }

  const proxyChange = (value: string) => {
    setConnectProxyValue(value)
    configs?.map((item: Config) => {
      if (item.configValue === useConfig) {
        window.electron.ipcRenderer.send('change_proxy', value, item.pac, item.ip, item.port)
        return
      }
    })
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
            <span className="connecting-up-down">
              <CaretUpOutlined />
              {connectingUp}
              <CaretDownOutlined />
              {connectingDown}
            </span>
          ) : null}
          {proxyActive ? (
            <div className="connect-proxy">
              <Radio.Group
                value={connectProxyValue}
                buttonStyle="solid"
                onChange={redioProxyChange}
              >
                <Radio.Button value="off">公司内网</Radio.Button>
                <Radio.Button value="pac">极速模式</Radio.Button>
                <Radio.Button value="all">全局模式</Radio.Button>
              </Radio.Group>
              <Tooltip
                // color={'orange'}
                style={{ width: '250px' }}
                title={
                  <span style={{ textAlign: 'left' }}>
                    <span>
                      <b>公司内网: </b>
                    </span>
                    仅接入公司内网
                    <br />
                    <span>
                      <b>极速模式: </b>
                    </span>
                    可访问内网+常用海外站点 <br />
                    <span>
                      <b>全局模式: </b>
                    </span>
                    全部流量通过国际线路,延迟较大
                    <br />
                    <span style={{ color: '#ee7621' }}>
                      <b>特别提醒: </b>
                    </span>
                    <br />
                    <span style={{ width: '10px', display: 'inline-block' }}>1</span>
                    、国际线路有日志审计，
                    <span style={{ color: '#ee7621' }}>仅供工作使用！</span>
                    <br />
                    <span style={{ width: '10px', display: 'inline-block' }}>2</span>
                    、如装有浏览器代理插件，需设置为【系统代理】
                  </span>
                }
              >
                <BulbOutlined style={{ marginLeft: '10px' }} />
              </Tooltip>
            </div>
          ) : null}
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
