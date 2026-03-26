import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0f0f0f',
            color: '#f5f5f0',
            border: '1px solid #2a2a2a',
            borderRadius: '12px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px'
          },
          success: { iconTheme: { primary: '#b8f442', secondary: '#0f0f0f' } },
          error: { iconTheme: { primary: '#ff4d4d', secondary: '#fff' } }
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
