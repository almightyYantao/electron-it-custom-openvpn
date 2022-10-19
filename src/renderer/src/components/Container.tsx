/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Avatar, Modal } from 'antd'
import '../assets/left.less'
import { createFromIconfontCN } from '@ant-design/icons'
import { useEffect, useState } from 'react'

import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

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
  const [locaMap] = useState(['/', 'soft', 'tools', 'setting'])
  const [checkedMap, setCheckedMap] = useState({})

  const onInputRadio = (value: number) => {
    // 先判断下现在是不是在连接VPN的状态，如果是的话，那么就禁止切换
    window.electron.ipcRenderer.send('vpnDbGet', 'connectStatus.connecting')
    window.electron.ipcRenderer.once(
      'vpnDbGet-connectStatus.connecting',
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
      case '/':
        setCheckedMap({ [0]: true })
        break
      case '/soft':
        setCheckedMap({ [1]: true })
        break
      case '/tools':
        setCheckedMap({ [2]: true })
        break
      case '/setting':
        setCheckedMap({ [3]: true })
        break
    }
  }, [])

  /**
   * 引入国际化
   */
  const { t } = useTranslation()

  return (
    <div className="container">
      <div className="left">
        <span className="left-nav-logo">
          <Avatar
            src="http://wework.qpic.cn/wwhead/dx4Y70y9XcvSiazHvUicn0E2Rz1J0OWSpKcPDgoqiaSwOyLJxoOpfcxPwWlKiccH3XgHXoJ4Ogh9Mak/0"
            size={50}
          />
        </span>

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
        <div className="left-nav__active"></div>
      </div>
      <div className="content">
        <Outlet />
      </div>
    </div>
  )
}

export default Container
