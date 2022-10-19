import 'antd/dist/antd.variable.min.css'
import { ConfigProvider } from 'antd'

import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import VPN from './components/child/Vpn'
import Container from './components/Container'
import Soft from './components/child/Soft'
import Tools from './components/child/Tools'
import Setting from './components/child/Setting'
import Login from './components/Login'

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
        <HashRouter>
          <Routes>
            <Route path="/" element={<Container />}>
              <Route index element={<VPN />} />
              <Route path="/soft" element={<Soft />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/setting" element={<Setting />} />
            </Route>
            <Route path="/login" element={<Login />} />
          </Routes>
        </HashRouter>
      </ConfigProvider>
    </div>
  )
}

export default App
