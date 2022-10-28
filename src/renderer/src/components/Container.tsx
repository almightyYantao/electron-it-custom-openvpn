/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Avatar, Badge, message, Modal, Progress } from 'antd'
import '../assets/left.less'
import { createFromIconfontCN } from '@ant-design/icons'
import { useEffect, useState } from 'react'

import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  EVENT_APP_UPDATE_AUTO_UPDATE,
  EVENT_APP_UPDATE_CHECK_FOR_UPDATE,
  EVENT_APP_UPDATE_IS_UPDATE_NOW,
  EVENT_SETTING_RELAUNCH,
  EVENT_VPN_DB_GET,
  EVENT_VPN_DB_SET,
  EVENT_VPN_OPENVPN_CLOSE,
  EVENT_VPN_RELEASE_PORT,
  EVENT_VPN_SUDO_DOWN_OPENVPN
} from '../../../event'
import initTopDrag from '@renderer/common/topMove'

const IconFont = createFromIconfontCN({
  scriptUrl: 'http://at.alicdn.com/t/c/font_2176039_3h4yqnop2vw.js'
})

window.addEventListener('DOMContentLoaded', function onDOMContentLoaded() {
  initTopDrag()
})

function Container(): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const [locaMap] = useState(['/vpn', '/vpn/soft', '/vpn/tools', '/vpn/setting'])
  const [checkedMap, setCheckedMap] = useState({})
  const [badgeUpdate, setBadgeUpdate] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [percentage, setPercontage] = useState(0)
  const [avatar, setAvatar] = useState('')
  const [ldap, setLdap] = useState('')

  const onInputRadio = (value: number) => {
    // 先判断下现在是不是在连接VPN的状态，如果是的话，那么就禁止切换
    window.electron.ipcRenderer.send(EVENT_VPN_DB_GET, 'connectStatus.connecting')
    window.electron.ipcRenderer.once(
      EVENT_VPN_DB_GET + '-connectStatus.connecting',
      (_event: Event, arg: boolean) => {
        console.log(arg)
        if (arg === true) {
          Modal.error({
            title: 'VPN Connect Error',
            content: '当前VPN正在连接中，请不要切换'
          })
        } else {
          navigate(locaMap[value])
          setCheckedMap({ [value]: true })
        }
      }
    )
  }

  /**
   * 初始化
   */
  useEffect(() => {
    switch (location.pathname) {
      case '/vpn':
        setCheckedMap({ [0]: true })
        break
      case '/vpn/soft':
        setCheckedMap({ [1]: true })
        break
      case '/vpn/tools':
        setCheckedMap({ [2]: true })
        break
      case '/vpn/setting':
        setCheckedMap({ [3]: true })
        break
    }
    setAvatar(String(localStorage.getItem('avatar')))
    setLdap(String(localStorage.getItem('name')))
    window.electron.ipcRenderer.send(EVENT_APP_UPDATE_CHECK_FOR_UPDATE)
    window.electron.ipcRenderer.on(EVENT_APP_UPDATE_AUTO_UPDATE, (_event: Event, arg) => {
      console.log(arg)
      if (arg === '检测到新版本') {
        setBadgeUpdate(1)
      }
    })
    window.electron.ipcRenderer.send(EVENT_VPN_DB_GET, 'normallyClosed')
    window.electron.ipcRenderer.once(
      EVENT_VPN_DB_GET + '-normallyClosed',
      (_event: Event, arg: boolean) => {
        if (
          localStorage.getItem(`firstOpen:${require('@electron/remote').app.getVersion()}`) !== null
        ) {
          if (arg !== true) {
            Modal.confirm({
              content: '监测到前一次未正常关闭，是否重新初始化',
              onOk: () => {
                window.electron.ipcRenderer.send(EVENT_VPN_RELEASE_PORT)
                window.electron.ipcRenderer.send(EVENT_VPN_OPENVPN_CLOSE)
                window.electron.ipcRenderer.send(EVENT_SETTING_RELAUNCH)
                window.electron.ipcRenderer.once(EVENT_VPN_SUDO_DOWN_OPENVPN, () => {
                  // setInitLoading(false)
                })
              },
              onCancel: () => {
                // setInitLoading(false)
              }
            })
          }
        } else {
          localStorage.setItem(`firstOpen:${require('@electron/remote').app.getVersion()}`, 'true')
        }
      }
    )
    window.electron.ipcRenderer.send(EVENT_VPN_DB_SET, 'normallyClosed', false)
  }, [])

  const showModal = () => {
    console.log(window.electron.process.versions)
    console.log(require('@electron/remote').app)
    setIsModalOpen(true)
  }

  const handleOk = () => {
    setIsModalOpen(false)
    update()
  }

  const handleCancel = () => {
    setIsModalOpen(false)
  }

  const update = () => {
    const ipc = window.electron.ipcRenderer
    if (percentage !== 0) {
      message.error(t('update.updateRepeatTxt'))
    }
    // 如果已经检测到已经是新版本，那么就直接更新
    if (badgeUpdate === 1) {
      ipc.send('confirm_update')
    } else {
      ipc.send(EVENT_APP_UPDATE_CHECK_FOR_UPDATE)
      ipc.once(EVENT_APP_UPDATE_AUTO_UPDATE, (_event, arg) => {
        console.log(arg)
        if (arg === '检测到新版本') {
          ipc.send(EVENT_APP_UPDATE_CHECK_FOR_UPDATE)
        } else {
          message.info(t('update.noNewVersionTxt'))
        }
      })
    }

    // 监听下载百分比
    ipc.on('downloadProgress', (_event, progressObj) => {
      setPercontage(progressObj.percent.toFixed(1) || 0)
    })

    // 监听是否已经下载完成
    ipc.once(EVENT_APP_UPDATE_IS_UPDATE_NOW, () => {
      Modal.confirm({
        content: t('update.success'),
        onOk: () => {
          window.electron.ipcRenderer.send(EVENT_VPN_OPENVPN_CLOSE)
          setTimeout(() => {
            ipc.send(EVENT_APP_UPDATE_IS_UPDATE_NOW)
          }, 800)
        },
        okText: t('update.restart'),
        cancelText: t('update.later')
      })
    })
  }

  /**
   * 引入国际化
   */
  const { t } = useTranslation()

  return (
    <div className="container">
      <div className="left">
        <div className="left-nav-body">
          <span className="left-nav-logo">
            <Avatar src={avatar} size={50} />
            <span className="left-nav-logo-ldap">{ldap}</span>
          </span>
          <div>
            <input
              id="left-nav-1"
              className="left-nav__radio"
              type="radio"
              name="left-nav"
              value="0"
              checked={checkedMap[0]}
              onChange={() => onInputRadio(0)}
            />
            <label htmlFor="left-nav-1" className="left-nav__1">
              <IconFont type="iconchange" />
              <span className="left-nav-strong">{t('menu.vpn')}</span>
            </label>
            <input
              id="left-nav-2"
              className="left-nav__radio"
              type="radio"
              name="left-nav"
              value="1"
              checked={checkedMap[1]}
              onChange={() => onInputRadio(1)}
            />
            <label htmlFor="left-nav-2" className="left-nav__2">
              <IconFont type="icononlineshop" />
              <span className="left-nav-strong">{t('menu.soft')}</span>
            </label>
            <input
              id="left-nav-3"
              className="left-nav__radio"
              type="radio"
              name="left-nav"
              value="2"
              checked={checkedMap[2]}
              onChange={() => onInputRadio(2)}
            />
            <label htmlFor="left-nav-3" className="left-nav__3">
              <IconFont type="iconswitchgrid" />
              <span className="left-nav-strong">{t('menu.tools')}</span>
            </label>
            <input
              id="left-nav-4"
              className="left-nav__radio"
              type="radio"
              name="left-nav"
              value="3"
              checked={checkedMap[3]}
              onChange={() => onInputRadio(3)}
            />
            <label htmlFor="left-nav-4" className="left-nav__4">
              <IconFont type="iconshezhi" />
              <span className="left-nav-strong">{t('menu.setting')}</span>
            </label>
          </div>
          <div className="left-nav__active"></div>
        </div>
        <div onClick={() => showModal()} style={{ cursor: 'pointer' }}>
          {percentage !== 0 ? (
            <Progress type="circle" percent={percentage} width={60} strokeColor="#FFF" />
          ) : null}
          <Badge dot showZero={false} count={badgeUpdate}>
            <span className="left-nav-footer">{require('@electron/remote').app.getVersion()}</span>
          </Badge>
        </div>
      </div>
      <div className="content">
        <Outlet />
      </div>
      <Modal
        title="提示"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="确认&更新"
        cancelText="取消"
      >
        <p>当前版本: {require('@electron/remote').app.getVersion()}</p>
        <p>由 管理工程部 提供技术支持</p>
        <p>软件收录，请联系【IT桌面运维】</p>
      </Modal>
    </div>
  )
}

export default Container
