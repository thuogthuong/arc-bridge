import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from './lib/config'
import { BridgeApp } from './components/BridgeApp'
import './index.css'

// Mặc định là light mode
const savedTheme = localStorage.getItem('arc-bridge-theme') ?? 'light'
document.documentElement.setAttribute('data-theme', savedTheme)

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BridgeApp />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
