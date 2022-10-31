import './assets/index.css'
import PluginAppWindow from './pluginAppWindow'
import './locales/config'
import { createRoot } from 'react-dom/client'
const container = document.getElementById('root')
if (container != null) {
  const root = createRoot(container)
  root.render(<PluginAppWindow />)
}
