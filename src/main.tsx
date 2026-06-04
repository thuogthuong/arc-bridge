import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from './lib/config'
import { BridgeApp } from './components/BridgeApp'
import './index.css'

// Init theme trước khi render
const savedTheme = localStorage.getItem('arc-bridge-theme') ?? 'dark'
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
