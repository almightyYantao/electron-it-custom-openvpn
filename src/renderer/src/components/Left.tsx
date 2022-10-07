/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Avatar } from 'antd'
import '../assets/left.less'
import { createFromIconfontCN } from '@ant-design/icons'
import React from 'react'

import { useTranslation } from 'react-i18next'

const IconFont = createFromIconfontCN({
  scriptUrl: 'http://at.alicdn.com/t/c/font_2176039_3h4yqnop2vw.js'
})

/**
 * 左边导航栏点击事件
 * @param id span 的 ID
 */
const navActive = (id: string) => {
  const leftDoms = document.getElementsByClassName('left-nav')
  for (let index = 0; index < leftDoms.length; index++) {
    leftDoms[index].classList.remove('left-nav-active')
  }
  const dom = document.getElementById(id)
  dom?.classList.add('left-nav-active')
}

function Left(): JSX.Element {
  /**
   * 初始化
   */
  React.useEffect(() => {
    navActive('0')
  })

  /**
   * 引入国际化
   */
  const { t } = useTranslation()

  return (
    <div className="left">
      <span className="left-nav-logo">
        <Avatar
          src="http://wework.qpic.cn/wwhead/dx4Y70y9XcvSiazHvUicn0E2Rz1J0OWSpKcPDgoqiaSwOyLJxoOpfcxPwWlKiccH3XgHXoJ4Ogh9Mak/0"
          size={50}
        />
      </span>
      <span className="left-nav" onClick={() => navActive('0')} id="0">
        <IconFont type="iconchange" />
        <strong className="left-nav-strong">{t('menu.vpn')}</strong>
      </span>
      <span className="left-nav" onClick={() => navActive('1')} id="1">
        <IconFont type="icononlineshop" />
        <strong className="left-nav-strong">{t('menu.soft')}</strong>
      </span>
      <span className="left-nav" onClick={() => navActive('2')} id="2">
        <IconFont type="iconswitchgrid" />
        <strong className="left-nav-strong">{t('menu.tools')}</strong>
      </span>
      <span className="left-nav" onClick={() => navActive('3')} id="3">
        <IconFont type="iconshezhi" />
        <strong className="left-nav-strong">{t('menu.setting')}</strong>
      </span>
    </div>
  )
}

export default Left
