import { useEffect, useState } from 'react'
import '@renderer/assets/login.less'
import { useTranslation } from 'react-i18next'
import { Button, Checkbox, Divider, Form, Input, Modal, Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import { FieldData } from 'rc-field-form/lib/interface'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import {
  EVENT_SETTING_RELAUNCH,
  EVENT_USER_GET_REMEMBER,
  EVENT_USER_GET_USERNAME,
  EVENT_USER_LOGIN,
  EVENT_USER_LOGIN_ERROR,
  EVENT_USER_LOGIN_SUCCESS,
  EVENT_USER_SET_REMEMBER
} from '../../../event'

function Login(): JSX.Element {
  const [loginLoading, setLoginLoading] = useState(false)
  const [fields, setFields] = useState<FieldData[]>([])
  const [remember, setRemember] = useState(false)

  const navigate = useNavigate()

  const onFinish = (values: any): void => {
    setLoginLoading(true)
    window.electron.ipcRenderer.send(EVENT_USER_LOGIN, values.username, values.password)
    window.electron.ipcRenderer.once(EVENT_USER_LOGIN_SUCCESS, (_event: Event, json: any) => {
      window.electron.ipcRenderer.removeAllListeners(EVENT_USER_LOGIN_ERROR)
      localStorage.setItem('avatar', json.avatar)
      localStorage.setItem('username', json.ldapId)
      localStorage.setItem('name', json.name)
      setLoginLoading(false)
      // 跳转到VPN的页面
      navigate('/vpn')
    })
    window.electron.ipcRenderer.once(EVENT_USER_LOGIN_ERROR, (_event: Event, error: any) => {
      window.electron.ipcRenderer.removeAllListeners(EVENT_USER_LOGIN_SUCCESS)
      Modal.error({
        title: '登录失败',
        content: error
      })
      setLoginLoading(false)
    })
  }

  useEffect(() => {
    window.electron.ipcRenderer.send(EVENT_USER_GET_USERNAME)
    window.electron.ipcRenderer.once(
      EVENT_USER_GET_USERNAME,
      (_event: Event, username: string, password: string) => {
        setFields([
          { name: 'username', value: username },
          { name: 'password', value: password }
        ])
      }
    )
    window.electron.ipcRenderer.send(EVENT_USER_GET_REMEMBER)
    window.electron.ipcRenderer.once(EVENT_USER_GET_REMEMBER, (_event, arg: boolean) => {
      console.log(arg)
      setRemember(arg)
    })
  }, [])

  const onFinishFailed = (errorInfo: any): void => {
    console.log('Failed:', errorInfo)
  }

  /**
   * 设置是否记住我
   * @param e
   */
  const rememberMe = (e: CheckboxChangeEvent): void => {
    setRemember(e.target.checked)
    console.log(e.target.checked)
    window.electron.ipcRenderer.send(EVENT_USER_SET_REMEMBER, e.target.checked)
  }

  /**
   * 引入国际化
   */
  const { t } = useTranslation()

  return (
    <div className="login">
      <div className="login__left">
        <span className="login__left__content">{t('base.login.left')}</span>
      </div>
      <div className="login__right">
        <div className="login__right__body">
          <Spin spinning={loginLoading}>
            <span
              className="login__right__language"
              onClick={(): void => {
                localStorage.setItem('localLanguage', 'zh')
                window.electron.ipcRenderer.send(EVENT_SETTING_RELAUNCH)
              }}
            >
              {localStorage.getItem('localLanguage') === 'zh' ? <strong>中文</strong> : '中文'}
            </span>
            <Divider type="vertical"></Divider>
            <span
              className="login__right__language"
              onClick={(): void => {
                localStorage.setItem('localLanguage', 'cn')
                window.electron.ipcRenderer.send(EVENT_SETTING_RELAUNCH)
              }}
            >
              {localStorage.getItem('localLanguage') === 'cn' ? (
                <strong>English</strong>
              ) : (
                'English'
              )}
            </span>
            <div className="login__right__from">
              <Form
                fields={fields}
                labelAlign="left"
                name="basic"
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
              >
                <Form.Item
                  label={t('base.login.username')}
                  name="username"
                  rules={[{ required: true, message: 'Please input your username!' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label={t('base.login.password')}
                  name="password"
                  rules={[{ required: true, message: 'Please input your password!' }]}
                >
                  <Input.Password />
                </Form.Item>
                <div className="login__right__submit">
                  <Checkbox checked={remember} onChange={rememberMe}>
                    {t('base.login.rememberMe')}
                  </Checkbox>
                  <Button type="primary" htmlType="submit">
                    {t('base.login.submit')}
                  </Button>
                </div>
              </Form>
            </div>
          </Spin>
        </div>
      </div>
    </div>
  )
}

export default Login
