import './assets/index.css'
import App from './App'
import './locales/config'
import { createRoot } from 'react-dom/client'
const container = document.getElementById('root')
if (container != null) {
  const root = createRoot(container)
  root.render(<App />)
}

// ReactDOM.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
//   document.getElementById('root')
// )
