import { useState, useCallback } from 'react'
import { useConnectorClient } from 'wagmi'
import { createAdapterFromProvider } from '@circle-fin/adapter-viem-v2'
import { appKit, ChainId, saveTx, updateTx } from '../lib/config'

export type BridgeStep = { name: string; state: string; txHash?: string; explorerUrl?: string }
export type BridgeStatus = 'idle' | 'estimating' | 'ready' | 'bridging' | 'done' | 'error'
export interface FeeEstimate { type: string; amount: string; currency: string }

function extractProvider(client: any): any {
  return client?.transport?.value?.provider
      ?? client?.transport?.provider
      ?? (typeof window !== 'undefined' ? (window as any).ethereum : null)
}

async function getAdapter(client: any) {
  const provider = extractProvider(client)
  if (!provider) throw new Error('Không tìm thấy wallet provider')
  return createAdapterFromProvider({ provider })
}

export function useBridge() {
  const { data: connectorClient } = useConnectorClient()
  const [status, setStatus] = useState<BridgeStatus>('idle')
  const [fees, setFees]     = useState<FeeEstimate[]>([])
  const [steps, setSteps]   = useState<BridgeStep[]>([])
  const [error, setError]   = useState('')

  const estimate = useCallback(async (fromChain: ChainId, toChain: ChainId, amount: string) => {
    if (!connectorClient) { setError('Chưa kết nối ví'); return }
    setStatus('estimating'); setError(''); setFees([])
    try {
      const adapter = await getAdapter(connectorClient)
      const result  = await appKit.estimateBridge({
        from: { adapter, chain: fromChain },
        to:   { adapter, chain: toChain },
        amount,
      })
      setFees((result.fees ?? []) as FeeEstimate[])
      setStatus('ready')
    } catch (e: any) {
      setError(e?.message?.slice(0, 200) ?? 'Estimate thất bại')
      setStatus('error')
    }
  }, [connectorClient])

  const bridge = useCallback(async (
    fromChain: ChainId,
    toChain: ChainId,
    amount: string,
    recipientAddress?: string,
  ) => {
    if (!connectorClient) { setError('Chưa kết nối ví'); return }
    setStatus('bridging'); setError(''); setSteps([])

    const txId = Date.now().toString()
    saveTx({ id: txId, fromChain, toChain, amount, status: 'pending', timestamp: Date.now() })

    try {
      const adapter = await getAdapter(connectorClient)
      const params: any = {
        from: { adapter, chain: fromChain },
        to:   { adapter, chain: toChain },
        amount,
      }
      if (recipientAddress && recipientAddress !== connectorClient.account?.address) {
        params.to.recipientAddress = recipientAddress
      }
      const result = await appKit.bridge(params)
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
  }, [connectorClient])

  const reset = useCallback(() => { setStatus('idle'); setFees([]); setSteps([]); setError('') }, [])

  return { status, fees, steps, error, estimate, bridge, reset }
}
