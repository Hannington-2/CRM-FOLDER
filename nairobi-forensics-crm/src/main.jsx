import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Global styles imported here

import { registerServiceWorker } from './utils/pushNotifications'

// Register service worker early
registerServiceWorker().catch(err => {
  console.warn('SW registration failed:', err);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)