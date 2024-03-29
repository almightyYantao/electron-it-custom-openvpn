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
import {
  BulbOutlined,
  CaretDownOutlined,
  CaretUpOutlined,
  QuestionCircleOutlined,
  RedoOutlined
} from '@ant-design/icons'
import {
  EVENT_APP_OPEN_URL,
  EVENT_APP_WINDOWS_ALTER,
  EVENT_NETWORK_GET_LOCAL_HOST_NETWORK,
  EVENT_NETWORK_SET_LOCAL_HOST_NETWORK,
  EVENT_USER_DOWNLOAD_LOG,
  EVENT_VPN_CHANGE_PROXY,
  EVENT_VPN_DB_GET,
  EVENT_VPN_DB_SET,
  EVENT_VPN_DONT_INIT,
  EVENT_VPN_INIT_CONFIG_LIST,
  EVENT_VPN_INIT_ERROR,
  EVENT_VPN_INIT_START,
  EVENT_VPN_INIT_SUCCESS,
  EVENT_VPN_NETWORK_TRAFFIC_IN,
  EVENT_VPN_NETWORK_TRAFFIC_OUT,
  EVENT_VPN_OPENVPN_CLOSE,
  EVENT_VPN_OPENVPN_COMPLETE_CLOSE,
  EVENT_VPN_OPENVPN_EVENT,
  EVENT_VPN_OPENVPN_START,
  EVENT_VPN_OPENVPN_START_STATUS,
  EVENT_VPN_SET_CONNECTING_LOG
} from '../../../../event'

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
  const [timeConsuming, setTimeConsuming] = useState(1)
  const [timeShow, setTimeShow] = useState(false)
  const [connectingUp, setConnectingUp] = useState('')
  const [connectingDown, setConnectingDown] = useState('')
  const [connectProxyValue, setConnectProxyValue] = useState('off')
  const [openvpnStatusEvent, setOpenvpnStatusEvent] = useState('')
  const [selfHelp, setSelfHelp] = useState(false)
  const [proxyActive, setProxyActive] = useState(false)
  const [configMap, setConfigMap] = useState({})

  let interval
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
      if (configMap[name] && configMap[name]?.pac) {
        console.log(proxyActive)
        sessionStorage.setItem('proxyActive', String(true))
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
    window.electron.ipcRenderer.send(EVENT_VPN_DB_SET, 'configValue', value)
  }

  /**
   * 初始化配置文件
   */
  const initConfig = (configs: Config[]) => {
    window.electron.ipcRenderer.send(EVENT_VPN_INIT_CONFIG_LIST, configs)
    window.electron.ipcRenderer.once(
      EVENT_VPN_INIT_CONFIG_LIST,
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
    window.electron.ipcRenderer.removeAllListeners(EVENT_APP_WINDOWS_ALTER)
    window.electron.ipcRenderer.removeAllListeners(EVENT_VPN_INIT_CONFIG_LIST)
    window.electron.ipcRenderer.on(
      EVENT_APP_WINDOWS_ALTER,
      (_event: Event, content: string, title: string) => {
        Modal.error({
          title: title,
          content: content
        })
      }
    )
    // 获取上一次连接的配置文件
    window.electron.ipcRenderer.send(EVENT_VPN_DB_GET, 'configValue')
    window.electron.ipcRenderer.once(
      EVENT_VPN_DB_GET + '-configValue',
      (_event: Event, arg: string) => {
        getConfig(String(localStorage.getItem('username')), arg)
      }
    )
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
    window.electron.ipcRenderer.send(EVENT_VPN_DB_GET, 'connectStatus.status')
    window.electron.ipcRenderer.once(
      EVENT_VPN_DB_GET + '-connectStatus.status',
      (_event: Event, arg: boolean) => {
        // setSuccessStatus()
        console.log(arg)
        if (arg === true) {
          setSuccessStatus()
          window.electron.ipcRenderer.send(EVENT_VPN_DB_GET, 'connectStatus.connectIp')
          window.electron.ipcRenderer.once(
            EVENT_VPN_DB_GET + '-connectStatus.connectIp',
            (_event: Event, arg: string) => {
              console.log(arg)
              setRemoteNetwork(arg)
            }
          )
          // 判断当前代理是否需要展示
          if (sessionStorage.getItem('proxyActive') === 'true') {
            setProxyActive(true)
          }
          setConnectingUp(String(sessionStorage.getItem(EVENT_VPN_NETWORK_TRAFFIC_OUT)))
          setConnectingDown(String(sessionStorage.getItem(EVENT_VPN_NETWORK_TRAFFIC_IN)))
        }
      }
    )
    window.electron.ipcRenderer.send(EVENT_VPN_DB_GET, 'proxy')
    window.electron.ipcRenderer.once(EVENT_VPN_DB_GET + '-proxy', (_event: Event, arg: string) => {
      console.log(arg)
      const m = !arg ? 'off' : arg
      console.log(m, connectProxyValue)
      setConnectProxyValue(m)
    })
    window.electron.ipcRenderer.send(EVENT_NETWORK_GET_LOCAL_HOST_NETWORK)
    window.electron.ipcRenderer.once(
      EVENT_NETWORK_SET_LOCAL_HOST_NETWORK,
      (_event: Event, arg: string) => {
        setLocalNetwork(arg)
      }
    )
    // }
    // })
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
      setTimeShow(true)
      intervalInit(true)
      connectVpn()
    }
  }

  /**
   * 定时器
   */
  const intervalInit = (type: boolean) => {
    if (type) {
      let time = 1
      interval = setInterval(() => {
        setTimeConsuming(() => {
          time = time + 1
          return time
        })
      }, 1000)
      console.log('开始的定时器', interval)
    } else {
      console.log('结束的定时器', interval)
      clearInterval(interval)
    }
  }

  /**
   * 监听所有的VPN事件
   */
  const openvpnEventChange = () => {
    window.electron.ipcRenderer.on(
      EVENT_VPN_OPENVPN_EVENT,
      (_event: Event, event: string, value: string) => {
        console.log(openvpnStatusEvent, event, value)
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
    window.electron.ipcRenderer.send(EVENT_VPN_OPENVPN_START)
    // 发送设置当前链接中的状态
    window.electron.ipcRenderer.send(EVENT_VPN_DB_SET, 'connectStatus.connecting', true)
    window.electron.ipcRenderer.once(EVENT_VPN_INIT_START, () => {
      setInitLoading(true)
    })
    window.electron.ipcRenderer.once(EVENT_VPN_INIT_SUCCESS, () => {
      message.success(t('vpn.init.success'))
      setInitLoading(false)
      initVpnText()
    })
    window.electron.ipcRenderer.once(EVENT_VPN_INIT_ERROR, (_event: Event, arg: any) => {
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
     * 监听后端的连接状态返回
     */
    window.electron.ipcRenderer.once(EVENT_VPN_OPENVPN_START_STATUS, (_event: Event, arg: any) => {
      const status = arg.status
      const remark = arg.remark
      window.electron.ipcRenderer.send(EVENT_VPN_DB_SET, 'connectStatus.connecting', false)
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
        initVpnText()
        closeVpn()
      }
    })
    window.electron.ipcRenderer.on(EVENT_VPN_SET_CONNECTING_LOG, (_event: Event, arg: string) => {
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
    window.electron.ipcRenderer.removeAllListeners(EVENT_VPN_INIT_SUCCESS)
    window.electron.ipcRenderer.removeAllListeners(EVENT_VPN_INIT_ERROR)
    window.electron.ipcRenderer.removeAllListeners(EVENT_VPN_INIT_START)
    window.electron.ipcRenderer.removeAllListeners(EVENT_VPN_SET_CONNECTING_LOG)
    window.electron.ipcRenderer.removeAllListeners(EVENT_VPN_OPENVPN_EVENT)
    setConnectingStatus(false)
    intervalInit(false)
    setTimeout(() => {
      setTimeShow(false)
    }, 5000)
    window.electron.ipcRenderer.once(EVENT_VPN_OPENVPN_COMPLETE_CLOSE, () => {
      window.electron.ipcRenderer.send(EVENT_VPN_OPENVPN_CLOSE)
      initVpnText()
    })
    // setTimeConsuming(Number(localStorage.getItem('timeConsuming')))
    setConnectingLog('')
    window.electron.ipcRenderer.on(EVENT_VPN_NETWORK_TRAFFIC_OUT, (_event: Event, arg: string) => {
      sessionStorage.setItem(EVENT_VPN_NETWORK_TRAFFIC_OUT, arg)
      setConnectingUp(arg)
    })
    window.electron.ipcRenderer.on(EVENT_VPN_NETWORK_TRAFFIC_IN, (_event: Event, arg: string) => {
      sessionStorage.setItem(EVENT_VPN_NETWORK_TRAFFIC_IN, arg)
      setConnectingDown(arg)
    })
    // setTimeConsuming(Number(localStorage.getItem('timeConsuming')))
    window.electron.ipcRenderer.send(EVENT_VPN_DB_GET, 'proxy')
    window.electron.ipcRenderer.once(EVENT_VPN_DB_GET + '-proxy', (_event: Event, arg: string) => {
      console.log(arg, !arg)
      setConnectProxyValue(() => (!arg ? 'off' : arg))
      proxyChange(arg)
    })
    if (configMap[useConfig] && configMap[useConfig]?.pac) {
      setProxyActive(true)
      sessionStorage.setItem('proxyActive', String(true))
    }
  }

  /**
   * 断开VPN
   */
  const closeVpn = () => {
    setTitle(t('vpn.connect.inTheClosed'))
    setConnectingClass(connectingClass + ' connect-status-ing')
    window.electron.ipcRenderer.send(EVENT_VPN_OPENVPN_CLOSE)
    window.electron.ipcRenderer.once(EVENT_VPN_OPENVPN_COMPLETE_CLOSE, () => {
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
    setTimeShow(false)
    setConnectingStatus(false)
    intervalInit(false)
    window.electron.ipcRenderer.removeAllListeners(EVENT_VPN_SET_CONNECTING_LOG)
    window.electron.ipcRenderer.removeAllListeners(EVENT_VPN_OPENVPN_START_STATUS)
    window.electron.ipcRenderer.removeAllListeners(EVENT_VPN_NETWORK_TRAFFIC_OUT)
    window.electron.ipcRenderer.removeAllListeners(EVENT_VPN_NETWORK_TRAFFIC_IN)
    window.electron.ipcRenderer.removeAllListeners(EVENT_VPN_DONT_INIT)
    window.electron.ipcRenderer.removeAllListeners(EVENT_VPN_OPENVPN_EVENT)
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
  const onCloseSelfHelpDrawer = () => {
    setSelfHelp(false)
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
        window.electron.ipcRenderer.send(
          EVENT_VPN_CHANGE_PROXY,
          value,
          item.pac,
          item.ip,
          item.port
        )
        return
      }
    })
  }

  /**
   * 打开链接
   * @param url 连接
   */
  const openUrl = (url: string) => {
    window.electron.ipcRenderer.send(EVENT_APP_OPEN_URL, url)
  }
  return (
    <div>
      <Spin spinning={initLoading}>
        <div className="vpn-top-tool">
          <Space className="button">
            <Button
              type="primary"
              onClick={(): void => window.electron.ipcRenderer.send(EVENT_USER_DOWNLOAD_LOG)}
            >
              {t('vpn.downlog')}
            </Button>
            <Button type="primary" onClick={showNetworkDrawer}>
              {t('vpn.network.check')}
            </Button>
          </Space>
          <div>
            <Space>
              <RedoOutlined
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  getConfig(String(localStorage.getItem('username')), useConfig)
                  message.success(`所有配置文件更新完成`)
                }}
              />
              <Select
                value={useConfig}
                disabled={connectStatus || connectingStatus}
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
            </Space>
          </div>
        </div>
        {timeShow ? (
          <span
            style={{
              color: timeShow ? '#000' : '#fff',
              position: 'absolute',
              top: '50px',
              right: '10px'
            }}
          >
            本次链接耗时:{timeConsuming}/s
          </span>
        ) : null}
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
          <div className="connect-proxy">
            <Radio.Group
              value={connectProxyValue}
              defaultValue={connectProxyValue}
              buttonStyle="solid"
              onChange={redioProxyChange}
              disabled={!proxyActive}
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
              <BulbOutlined
                style={{
                  marginLeft: '10px',
                  position: 'absolute',
                  height: '32px',
                  lineHeight: '30px'
                }}
              />
            </Tooltip>
          </div>
          <div className="vpn-body-problem" onClick={(): void => setSelfHelp(true)}>
            <QuestionCircleOutlined />
          </div>
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

        <Drawer
          // title={t('vpn.network.check')}
          placement="right"
          onClose={onCloseSelfHelpDrawer}
          open={selfHelp}
          width={800}
        >
          <webview
            src="https://it-course.qunhequnhe.com:8180/docs/soft/xiaoku/xiaoku-vpn-problem/"
            style={{ width: '100%', height: '86vh' }}
            // eslint-disable-next-line react/no-unknown-property
            useragent="Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko wxwork"
          ></webview>
        </Drawer>
      </Spin>
    </div>
  )
}

export default VPN
