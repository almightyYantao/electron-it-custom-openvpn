import { useTranslation } from 'react-i18next'
import '@renderer/assets/setting.less'
import { Button, Checkbox, Divider, Input, message, Radio, RadioChangeEvent } from 'antd'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  EVENT_SETTING_GET_VPN_PORT,
  EVENT_SETTING_OPEN_DEV,
  EVENT_SETTING_RELAUNCH,
  EVENT_SETTING_SET_OPENAT_LOGIN,
  EVENT_SETTING_SET_VPN_PORT,
  EVENT_USER_EXIT_LOGIN,
  EVENT_VPN_DB_SET,
  EVENT_VPN_INIT_ERROR,
  EVENT_VPN_INIT_SUCCESS,
  EVENT_VPN_INIT_VPN_CONFIG,
  EVENT_VPN_RELEASE_PORT,
  EVENT_VPN_SUDO_DOWN_OPENVPN
} from '../../../../event'

function Setting(): JSX.Element {
  const [lanagueValue, setLanagueValue] = useState('zh')
  const [vpnPort, setVpnPort] = useState(0)
  const [releasePortLoading, setReleasePortLoading] = useState(false)
  const [initVpnConfigLoading, setInitVpnConfigLoading] = useState(false)
  /**
   * 引入国际化
   */
  const { t } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    console.log(localStorage.getItem('localLanguage'))
    setLanagueValue(
      localStorage.getItem('localLanguage') == null || localStorage.getItem('localLanguage') == 'zh'
        ? 'zh'
        : 'en'
    )
    window.electron.ipcRenderer.send(EVENT_SETTING_GET_VPN_PORT)
    window.electron.ipcRenderer.once(EVENT_SETTING_GET_VPN_PORT, (_event: Event, port: number) => {
      if (port == null) {
        setVpnPort(7001)
      } else {
        setVpnPort(port)
      }
    })
  }, [])

  /**
   * 开机自启
   * @param e
   */
  const autoBootChange = (e: CheckboxChangeEvent): void => {
    console.log(`checked = ${e.target.checked}`)
    window.electron.ipcRenderer.send(EVENT_SETTING_SET_OPENAT_LOGIN, e.target.checked)
  }

  /**
   * 语言切换
   * @param e
   */
  const languageChange = (e: RadioChangeEvent): void => {
    console.log('radio checked', e.target.value)
    localStorage.setItem('localLanguage', e.target.value)
    setLanagueValue(e.target.value)
    window.electron.ipcRenderer.send(EVENT_SETTING_RELAUNCH)
  }

  /**
   * 退出登录
   */
  const exitLogin = (): void => {
    window.electron.ipcRenderer.send(EVENT_USER_EXIT_LOGIN)
    window.electron.ipcRenderer.send(EVENT_VPN_DB_SET, 'normallyClosed', true)
    navigate('/')
  }

  /**
   * 监听VPN Port的输入变更
   * @param e
   */
  const changeVpnPort = (e): void => {
    console.log(e.target.value)
    setVpnPort(e.target.value)
  }

  /**
   * 确认VPN Port 变更
   */
  const confirmVpnPort = (): void => {
    console.log(vpnPort)
    if (vpnPort < 6000 || vpnPort > 10001) {
      message.error(t('base.vpnSetting.portScope'))
    } else {
      window.electron.ipcRenderer.send(EVENT_SETTING_SET_VPN_PORT, vpnPort)
    }
  }

  /**
   * 释放端口
   */
  const releasePort = (): void => {
    setReleasePortLoading(true)
    window.electron.ipcRenderer.send(EVENT_VPN_RELEASE_PORT)
    window.electron.ipcRenderer.once(EVENT_VPN_SUDO_DOWN_OPENVPN, () => {
      setReleasePortLoading(false)
    })
  }

  /**
   * 初始化VPN配置文件
   */
  const initVpnConfig = (): void => {
    setInitVpnConfigLoading(true)
    window.electron.ipcRenderer.send(EVENT_VPN_INIT_VPN_CONFIG)
    window.electron.ipcRenderer.once(EVENT_VPN_INIT_SUCCESS, () => {
      message.success(t('base.systemTools.initVpnConfigSuccess'))
      setInitVpnConfigLoading(false)
    })
    window.electron.ipcRenderer.once(EVENT_VPN_INIT_ERROR, () => {
      message.error(t('base.systemTools.initVpnConfigError'))
      setInitVpnConfigLoading(false)
    })
  }

  return (
    <div>
      <div className="setting-list">
        <Divider orientation="left">{t('base.userInfo.title')}</Divider>
        <Button type="primary" onClick={(): void => exitLogin()}>
          {t('base.userInfo.exit')}
        </Button>
      </div>
      <div className="setting-list">
        <Divider orientation="left">{t('base.vpnSetting.title')}</Divider>
        <Input
          addonBefore={t('base.vpnSetting.port')}
          style={{ width: '300px' }}
          value={vpnPort}
          onChange={changeVpnPort}
        ></Input>
        <Button onClick={confirmVpnPort} type="primary" style={{ marginLeft: '10px' }}>
          {t('base.confirm')}
        </Button>
        <br />
        <span>{t('base.vpnSetting.portScope')}</span>
      </div>
      <div className="setting-list">
        <Divider orientation="left">{t('base.general.title')}</Divider>
        <Checkbox onChange={autoBootChange}>{t('base.general.autoBoot')}</Checkbox>
        <Divider type="vertical" />
        <Radio.Group onChange={languageChange} value={lanagueValue}>
          <Radio value="zh">中文</Radio>
          <Radio value="en">English</Radio>
        </Radio.Group>
      </div>
      <div className="setting-list">
        <Divider orientation="left">{t('base.systemTools.title')}</Divider>
        <Button
          onClick={(): void => window.electron.ipcRenderer.send(EVENT_SETTING_OPEN_DEV)}
          type="primary"
          style={{ marginLeft: '10px' }}
        >
          {t('base.systemTools.openDev')}
        </Button>
        <Button
          loading={releasePortLoading}
          onClick={(): void => releasePort()}
          type="primary"
          style={{ marginLeft: '10px' }}
        >
          {t('base.systemTools.releasePort')}
        </Button>
        <Button
          loading={initVpnConfigLoading}
          onClick={(): void => initVpnConfig()}
          type="primary"
          style={{ marginLeft: '10px' }}
        >
          {t('base.systemTools.initVpnConfig')}
        </Button>
      </div>
    </div>
  )
}

export default Setting
