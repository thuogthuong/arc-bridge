import { createConfig, http } from 'wagmi'
import { defineChain } from 'viem'
import { injected, metaMask } from 'wagmi/connectors'
import { AppKit } from '@circle-fin/app-kit'

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { decimals: 6, name: 'USD Coin', symbol: 'USDC' },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
  testnet: true,
})

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [injected(), metaMask()],
  transports: { [arcTestnet.id]: http() },
})

export const appKit = new AppKit()

// All supported chains - cả 2 chiều
export const ALL_CHAINS = [
  { id: 'Arc_Testnet',          name: 'Arc Testnet',      icon: '🌐', color: '#5b8dee', isArc: true  },
  { id: 'Ethereum_Sepolia',     name: 'Ethereum Sepolia', icon: '⬡',  color: '#627eea', isArc: false },
  { id: 'Base_Sepolia',         name: 'Base Sepolia',     icon: '🔵', color: '#0052ff', isArc: false },
  { id: 'Arbitrum_Sepolia',     name: 'Arbitrum Sepolia', icon: '🩵', color: '#28a0f0', isArc: false },
  { id: 'Optimism_Sepolia',     name: 'OP Sepolia',       icon: '🔴', color: '#ff0420', isArc: false },
  { id: 'Avalanche_Fuji',       name: 'Avalanche Fuji',   icon: '🔺', color: '#e84142', isArc: false },
  { id: 'Polygon_Amoy_Testnet', name: 'Polygon Amoy',     icon: '🟣', color: '#8247e5', isArc: false },
] as const

export type ChainId = typeof ALL_CHAINS[number]['id']

// Lịch sử tx lưu trong localStorage
export interface TxRecord {
  id:          string
  fromChain:   string
  toChain:     string
  amount:      string
  status:      'pending' | 'success' | 'error'
  txHash?:     string
  explorerUrl?: string
  timestamp:   number
}

export function saveTx(tx: TxRecord) {
  const history = loadHistory()
  history.unshift(tx)
  localStorage.setItem('arc-bridge-history', JSON.stringify(history.slice(0, 20)))
}

export function updateTx(id: string, patch: Partial<TxRecord>) {
  const history = loadHistory()
  const idx = history.findIndex(t => t.id === id)
  if (idx >= 0) { history[idx] = { ...history[idx], ...patch }; localStorage.setItem('arc-bridge-history', JSON.stringify(history)) }
}

export function loadHistory(): TxRecord[] {
  try { return JSON.parse(localStorage.getItem('arc-bridge-history') ?? '[]') } catch { return [] }
}
