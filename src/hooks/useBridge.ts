import { useState, useCallback } from 'react'
import { useConnectorClient, useWalletClient } from 'wagmi'
import { createAdapterFromProvider } from '@circle-fin/adapter-viem-v2'
import { appKit, ChainId, saveTx, updateTx } from '../lib/config'

export type BridgeStep = { name: string; state: string; txHash?: string; explorerUrl?: string }
export type BridgeStatus = 'idle' | 'estimating' | 'ready' | 'bridging' | 'done' | 'error'
export interface FeeEstimate { type: string; amount: string; currency: string }

// Lấy provider từ nhiều nguồn khác nhau
function extractProvider(connectorClient: any, walletClient: any): any {
  // Thử từ connectorClient trước
  const p1 = connectorClient?.transport?.value?.provider
  if (p1) return p1
  const p2 = connectorClient?.transport?.provider
  if (p2) return p2

  // Thử từ walletClient
  const p3 = walletClient?.transport?.value?.provider
  if (p3) return p3
  const p4 = walletClient?.transport?.provider
  if (p4) return p4

  // Fallback window.ethereum (Rabby, MetaMask)
  if (typeof window !== 'undefined') {
    const eth = (window as any).ethereum
    if (eth) return eth
  }

  return null
}

async function getAdapter(connectorClient: any, walletClient: any) {
  const provider = extractProvider(connectorClient, walletClient)
  if (!provider) throw new Error('Không tìm thấy wallet provider — hãy chắc chắn ví đã kết nối')
  return createAdapterFromProvider({ provider })
}

export function useBridge() {
  const { data: connectorClient } = useConnectorClient()
  const { data: walletClient }    = useWalletClient()

  const [status, setStatus] = useState<BridgeStatus>('idle')
  const [fees, setFees]     = useState<FeeEstimate[]>([])
  const [steps, setSteps]   = useState<BridgeStep[]>([])
  const [error, setError]   = useState('')

  const estimate = useCallback(async (fromChain: ChainId, toChain: ChainId, amount: string) => {
    setStatus('estimating'); setError(''); setFees([])
    try {
      const adapter = await getAdapter(connectorClient, walletClient)
      const result  = await appKit.estimateBridge({
        from: { adapter, chain: fromChain },
        to:   { adapter, chain: toChain, useForwarder: true },
        amount,
      })
      setFees((result.fees ?? []) as FeeEstimate[])
      setStatus('ready')
    } catch (e: any) {
      setError(e?.message?.slice(0, 200) ?? 'Estimate thất bại')
      setStatus('error')
    }
  }, [connectorClient, walletClient])

  const bridge = useCallback(async (
    fromChain: ChainId,
    toChain: ChainId,
    amount: string,
    recipientAddress?: string,
  ) => {
    setStatus('bridging'); setError(''); setSteps([])

    const txId = Date.now().toString()
    saveTx({ id: txId, fromChain, toChain, amount, status: 'pending', timestamp: Date.now() })

    try {
      const adapter = await getAdapter(connectorClient, walletClient)

      const toParams: any = {
        adapter,
        chain: toChain,
        useForwarder: true,
      }
      if (recipientAddress) toParams.recipientAddress = recipientAddress

      const result = await appKit.bridge({
        from:   { adapter, chain: fromChain },
        to:     toParams,
        amount,
        config: { transferSpeed: 'FAST', maxFee: '0.50' },
      })

      const parsedSteps: BridgeStep[] = ((result as any).steps ?? []).map((s: any) => ({
        name: s.name, state: s.state,
        txHash: s.txHash ?? s.data?.txHash,
        explorerUrl: s.data?.explorerUrl ?? s.explorerUrl,
      }))
      setSteps(parsedSteps)
      const burnStep = parsedSteps.find(s => s.name === 'burn' || s.name === 'approve')
      updateTx(txId, { status: 'success', txHash: burnStep?.txHash, explorerUrl: burnStep?.explorerUrl })
      setStatus('done')
    } catch (e: any) {
      updateTx(txId, { status: 'error' })
      setError(e?.message?.slice(0, 200) ?? 'Bridge thất bại')
      setStatus('error')
    }
  }, [connectorClient, walletClient])

  const reset = useCallback(() => {
    setStatus('idle'); setFees([]); setSteps([]); setError('')
  }, [])

  return { status, fees, steps, error, estimate, bridge, reset }
}
