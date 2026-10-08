import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={{
      token: {
        colorPrimary: '#22c55e', // 主色：青苗绿
        colorSuccess: '#10b981', // 成功色：薄荷绿
        colorWarning: '#f59e0b', // 警告色：丰收橙
        borderRadius: 10,
        colorBgContainer: '#ffffff', // 全局卡片背景设为纯白
        colorText: '#1e293b', // 全局文字设为深灰（防看不清）
      }
    }}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)