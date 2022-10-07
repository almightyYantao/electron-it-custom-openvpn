import Container from './components/Container'
import 'antd/dist/antd.variable.min.css'
import { ConfigProvider } from 'antd'

import { useEffect } from 'react'

function App(): JSX.Element {
  /**
   * 初始化全局配色
   */
  useEffect(() => {
    ConfigProvider.config({
      theme: {
        primaryColor: '#1760F6',
        errorColor: '#ff4d4f',
        warningColor: '#faad14',
        successColor: '#52c41a',
        infoColor: '#1760F6'
      }
    })
  }, [])

  return (
    <div>
      <ConfigProvider>
        <Container></Container>
      </ConfigProvider>
    </div>
  )
}

export default App
