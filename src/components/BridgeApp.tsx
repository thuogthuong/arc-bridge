import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { ALL_CHAINS, ChainId, loadHistory, TxRecord } from '../lib/config'
import { useBridge } from '../hooks/useBridge'

function shortAddr(a: string) { return `${a.slice(0,6)}...${a.slice(-4)}` }
function timeAgo(ts: number) {
  const d = (Date.now() - ts) / 1000
  if (d < 60) return 'vừa xong'
  if (d < 3600) return `${Math.floor(d/60)}p trước`
  if (d < 86400) return `${Math.floor(d/3600)}h trước`
  return `${Math.floor(d/86400)}d trước`
}

const STEP_LABELS: Record<string, string> = {
  approve: '✅ Approve USDC', burn: '🔥 Burn on source',
  fetchAttestation: '📡 Chờ attestation', mint: '🪙 Mint on Arc',
  transfer: '📤 Transfer', send: '📤 Send tx',
}

export function BridgeApp() {
  const { address, isConnected } = useAccount()
  const { connect, connectors }  = useConnect()
  const { disconnect }           = useDisconnect()

  // Theme
  const [dark, setDark] = useState(() => localStorage.getItem('arc-bridge-theme') !== 'light')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('arc-bridge-theme', dark ? 'dark' : 'light')
  }, [dark])

  // State
  const [fromChain, setFromChain]   = useState<ChainId>('Base_Sepolia')
  const [toChain, setToChain]       = useState<ChainId>('Arc_Testnet')
  const [amount, setAmount]         = useState('1')
  const [recipient, setRecipient]   = useState('')
  const [useCustom, setUseCustom]   = useState(false)
  const [activeTab, setActiveTab]   = useState<'bridge' | 'history'>('bridge')
  const [history, setHistory]       = useState<TxRecord[]>([])

  const { status, fees, steps, error, estimate, bridge, reset } = useBridge()

  // Load history
  useEffect(() => { setHistory(loadHistory()) }, [activeTab])

  // Swap chains
  function swapChains() {
    const tmp = fromChain
    setFromChain(toChain)
    setToChain(tmp)
    reset()
  }

  async function handleEstimate() { await estimate(fromChain, toChain, amount) }
  async function handleBridge() {
    await bridge(fromChain, toChain, amount, useCustom && recipient ? recipient : undefined)
    setHistory(loadHistory())
  }

  const fromInfo = ALL_CHAINS.find(c => c.id === fromChain)!
  const toInfo   = ALL_CHAINS.find(c => c.id === toChain)!
  const totalFee = fees.reduce((s, f) => s + parseFloat(f.amount || '0'), 0)
  const willReceive = Math.max(0, parseFloat(amount || '0') - totalFee)

  return (
    <div className="app">
      {/* Crypto background icons */}
      <div className="crypto-bg" aria-hidden="true">
        {['₿','Ξ','◎','⬡','▲','✦','◈','⟠','₳','Ł'].map((s, i) => (
          <span key={i} className={`crypto-icon ci-${i}`}>{s}</span>
        ))}
      </div>

      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-name">Arc Bridge</span>
          <span className="logo-sub">USDC · CCTP</span>
        </div>
        <div className="header-right">
          {/* Theme toggle */}
          <button className="theme-toggle" onClick={() => setDark(!dark)} title="Toggle theme">
            {dark ? '☀️' : '🌙'}
          </button>
          {isConnected ? (
            <div className="wallet-row">
              <span className="chain-pill">Arc Testnet</span>
              <span className="wallet-addr">{shortAddr(address!)}</span>
              <button className="btn-sm" onClick={() => disconnect()}>disconnect</button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="main">
        <div className="card">

          {/* Tabs */}
          <div className="tabs">
            <button className={`tab ${activeTab === 'bridge' ? 'active' : ''}`}
              onClick={() => setActiveTab('bridge')}>🌉 Bridge</button>
            <button className={`tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => { setActiveTab('history'); setHistory(loadHistory()) }}>
              📜 Lịch sử {history.length > 0 && <span className="badge">{history.length}</span>}
            </button>
          </div>

          {/* ── BRIDGE TAB ── */}
          {activeTab === 'bridge' && (<>
            <div className="card-title">
              <h1>Bridge USDC</h1>
              <p>Chuyển USDC giữa Arc và các chain khác qua Circle CCTP</p>
            </div>

            {/* Chain selector */}
            <div className="chain-row">
              {/* FROM */}
              <div className="chain-picker">
                <label className="field-label">Từ</label>
                <select className="chain-select"
                  value={fromChain}
                  onChange={e => { setFromChain(e.target.value as ChainId); reset() }}
                  style={{ borderColor: fromInfo.color }}>
                  {ALL_CHAINS.filter(c => c.id !== toChain).map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Swap button */}
              <button className="swap-btn" onClick={swapChains} title="Đổi chiều">⇄</button>

              {/* TO */}
              <div className="chain-picker">
                <label className="field-label">Đến</label>
                <select className="chain-select"
                  value={toChain}
                  onChange={e => { setToChain(e.target.value as ChainId); reset() }}
                  style={{ borderColor: toInfo.color }}>
                  {ALL_CHAINS.filter(c => c.id !== fromChain).map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount */}
            <div className="field-group">
              <label className="field-label">Số lượng USDC</label>
              <div className="amount-wrap">
                <input className="amount-input" type="number" min="0.01" step="0.01"
                  value={amount} placeholder="0.00"
                  onChange={e => { setAmount(e.target.value); reset() }} />
                <span className="amount-unit">USDC</span>
              </div>
              <div className="presets">
                {['1','5','10','50','100'].map(v => (
                  <button key={v} className="preset" onClick={() => { setAmount(v); reset() }}>{v}</button>
                ))}
              </div>
            </div>

            {/* Custom recipient */}
            <div className="field-group">
              <label className="toggle-label">
                <input type="checkbox" checked={useCustom} onChange={e => setUseCustom(e.target.checked)} />
                Gửi đến địa chỉ khác
              </label>
              {useCustom && (
                <input className="text-input" placeholder="0x... địa chỉ nhận"
                  value={recipient} onChange={e => setRecipient(e.target.value)} />
              )}
            </div>

            {/* Fee box */}
            {fees.length > 0 && (
              <div className="fee-box">
                <div className="fee-title">💰 Ước tính phí</div>
                {fees.map((f, i) => (
                  <div key={i} className="fee-row">
                    <span>{f.type === 'provider' ? 'CCTP fee' : f.type === 'gas' ? 'Gas fee' : f.type}</span>
                    <span>{f.amount} {f.currency || 'USDC'}</span>
                  </div>
                ))}
                <div className="fee-row fee-total">
                  <span>Tổng phí</span><span>~{totalFee.toFixed(4)} USDC</span>
                </div>
                <div className="fee-row fee-receive">
                  <span>Bạn nhận được</span><span>~{willReceive.toFixed(4)} USDC</span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && <div className="error-box">❌ {error}</div>}

            {/* Steps */}
            {steps.length > 0 && (
              <div className="steps-box">
                <div className="steps-title">Tiến trình</div>
                {steps.map((s, i) => (
                  <div key={i} className={`step step-${s.state}`}>
                    <span>{s.state === 'success' ? '✅' : s.state === 'error' ? '❌' : '⏳'}</span>
                    <span className="step-name">{STEP_LABELS[s.name] ?? s.name}</span>
                    {s.explorerUrl && (
                      <a href={s.explorerUrl} target="_blank" rel="noopener noreferrer" className="step-link">↗</a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Action */}
            {!isConnected ? (
              <div className="connect-list">
                {connectors.map(c => (
                  <button key={c.id} className="btn-primary" onClick={() => connect({ connector: c })}>
                    Connect {c.name}
                  </button>
                ))}
              </div>
            ) : status === 'idle' || status === 'error' ? (
              <button className="btn-primary" onClick={handleEstimate}
                disabled={!amount || parseFloat(amount) <= 0}>
                🔍 Xem phí ước tính
              </button>
            ) : status === 'estimating' ? (
              <button className="btn-primary loading" disabled>⏳ Đang tính phí...</button>
            ) : status === 'ready' ? (
              <div className="action-row">
                <button className="btn-secondary" onClick={reset}>← Đổi</button>
                <button className="btn-primary" onClick={handleBridge}>
                  🌉 Bridge {amount} USDC
                </button>
              </div>
            ) : status === 'bridging' ? (
              <button className="btn-primary loading" disabled>⏳ Đang bridge...</button>
            ) : status === 'done' ? (
              <div className="done-box">
                <div className="done-icon">🎉</div>
                <div className="done-text">Bridge thành công!</div>
                <div className="done-sub">{amount} USDC → {toInfo.name}</div>
                <button className="btn-secondary" onClick={reset}>Bridge thêm</button>
              </div>
            ) : null}

            {/* Info */}
            <div className="info-grid">
              <div className="info-item"><span>⚡ Tốc độ</span><span>~20 giây</span></div>
              <div className="info-item"><span>🔐 Protocol</span><span>Circle CCTP v2</span></div>
              <div className="info-item">
                <span>🪙 Faucet</span>
                <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer">faucet.circle.com ↗</a>
              </div>
              <div className="info-item">
                <span>🔍 Explorer</span>
                <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer">arcscan.app ↗</a>
              </div>
            </div>
          </>)}

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <div className="history-tab">
              <h2 className="history-title">📜 Lịch sử giao dịch</h2>
              {history.length === 0 ? (
                <div className="history-empty">Chưa có giao dịch nào</div>
              ) : (
                <div className="history-list">
                  {history.map(tx => {
                    const from = ALL_CHAINS.find(c => c.id === tx.fromChain)
                    const to   = ALL_CHAINS.find(c => c.id === tx.toChain)
                    return (
                      <div key={tx.id} className={`history-item hi-${tx.status}`}>
                        <div className="hi-top">
                          <div className="hi-route">
                            <span style={{ color: from?.color }}>{from?.icon} {from?.name ?? tx.fromChain}</span>
                            <span className="hi-arrow">→</span>
                            <span style={{ color: to?.color }}>{to?.icon} {to?.name ?? tx.toChain}</span>
                          </div>
                          <div className={`hi-status hi-${tx.status}`}>
                            {tx.status === 'success' ? '✅' : tx.status === 'error' ? '❌' : '⏳'}
                            {tx.status}
                          </div>
                        </div>
                        <div className="hi-bottom">
                          <span className="hi-amount">{tx.amount} USDC</span>
                          <span className="hi-time">{timeAgo(tx.timestamp)}</span>
                          {tx.explorerUrl && (
                            <a href={tx.explorerUrl} target="_blank" rel="noopener noreferrer" className="hi-link">
                              Xem tx ↗
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <button className="btn-secondary" style={{ marginTop: '1rem' }}
                onClick={() => { localStorage.removeItem('arc-bridge-history'); setHistory([]) }}>
                🗑 Xóa lịch sử
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
