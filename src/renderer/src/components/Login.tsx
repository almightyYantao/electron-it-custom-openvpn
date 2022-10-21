import { useEffect, useState } from 'react'
import '@renderer/assets/login.less'
import { useTranslation } from 'react-i18next'
import { Button, Checkbox, Form, Input, Modal, Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import { FieldData } from 'rc-field-form/lib/interface'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'

function Login(): JSX.Element {
  const [loginLoading, setLoginLoading] = useState(false)
  const [fields, setFields] = useState<FieldData[]>([])

  const navigate = useNavigate()

  const onFinish = (values: any): void => {
    setLoginLoading(true)
    window.electron.ipcRenderer.send('login', values.username, values.password)
    window.electron.ipcRenderer.once('login-success', (_event: Event, json: any) => {
      window.electron.ipcRenderer.removeAllListeners('login-error')
      localStorage.setItem('avatar', json.avatar)
      localStorage.setItem('username', json.ldapId)
      setLoginLoading(false)
      // 跳转到VPN的页面
      navigate('/')
    })
    window.electron.ipcRenderer.once('login-error', (_event: Event, error: any) => {
      window.electron.ipcRenderer.removeAllListeners('login-success')
      Modal.error({
        title: '登录失败',
        content: error
      })
      setLoginLoading(false)
    })
  }

  useEffect(() => {
    window.electron.ipcRenderer.send('getUsername')
    window.electron.ipcRenderer.once(
      'getUsername',
      (_event: Event, username: string, password: string) => {
        setFields([
          { name: 'username', value: username },
          { name: 'password', value: password }
        ])
      }
    )
  }, [])

  const onFinishFailed = (errorInfo: any): void => {
    console.log('Failed:', errorInfo)
  }

  /**
   * 设置是否记住我
   * @param e
   */
  const rememberMe = (e: CheckboxChangeEvent): void => {
    window.electron.ipcRenderer.send('setRemember', e.target.checked)
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
        <Spin spinning={loginLoading}>
          <Form
            fields={fields}
            name="basic"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            initialValues={{ remember: true }}
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
              <Checkbox onChange={rememberMe}>{t('base.login.rememberMe')}</Checkbox>
              <Button type="primary" htmlType="submit">
                {t('base.login.submit')}
              </Button>
            </div>
          </Form>
        </Spin>
      </div>
    </div>
  )
}

export default Login
