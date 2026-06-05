const COINS = [
  { symbol: '₿', label: 'BTC', color: '#f7931a', bg: '#fff8f0', size: 110, x: 4,  dur: 11, delay: 0   },
  { symbol: 'Ξ', label: 'ETH', color: '#627eea', bg: '#f0f2ff', size: 130, x: 82, dur: 13, delay: 1.5 },
  { symbol: '◎', label: 'SOL', color: '#9945ff', bg: '#f8f0ff', size: 90,  x: 18, dur: 15, delay: 3   },
  { symbol: '₿', label: 'BTC', color: '#f7931a', bg: '#fff8f0', size: 75,  x: 65, dur: 10, delay: 5   },
  { symbol: '⬡', label: 'ETH', color: '#627eea', bg: '#f0f2ff', size: 95,  x: 48, dur: 14, delay: 2   },
  { symbol: '▲', label: 'AVX', color: '#e84142', bg: '#fff0f0', size: 80,  x: 90, dur: 12, delay: 4   },
  { symbol: 'Ξ', label: 'ETH', color: '#627eea', bg: '#f0f2ff', size: 70,  x: 33, dur: 16, delay: 6   },
  { symbol: '₿', label: 'BTC', color: '#f7931a', bg: '#fff8f0', size: 100, x: 73, dur: 9,  delay: 7   },
  { symbol: '◈', label: 'ARB', color: '#28a0f0', bg: '#f0f9ff', size: 68,  x: 56, dur: 13, delay: 1   },
  { symbol: '✦', label: 'UDC', color: '#2775ca', bg: '#f0f4ff', size: 82,  x: 10, dur: 11, delay: 8   },
]

export function CryptoBg() {
  return (
    <div aria-hidden="true" style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
      <style>{`
        @keyframes risefall {
          0%   { transform: translateY(0px)   rotate(0deg)   scale(1);    opacity: 0; }
          8%   { opacity: 1; }
          45%  { transform: translateY(-40px) rotate(8deg)   scale(1.04); opacity: 1; }
          55%  { transform: translateY(-40px) rotate(-4deg)  scale(1.04); opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateY(0px)   rotate(0deg)   scale(1);    opacity: 0; }
        }
        @keyframes risefallB {
          0%   { transform: translateY(0px)   rotate(0deg)   scale(1);    opacity: 0; }
          8%   { opacity: 1; }
          45%  { transform: translateY(50px)  rotate(-6deg)  scale(0.96); opacity: 1; }
          55%  { transform: translateY(50px)  rotate(5deg)   scale(0.96); opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateY(0px)   rotate(0deg)   scale(1);    opacity: 0; }
        }
        .cc { position: absolute; border-radius: 50%; display:flex; flex-direction:column;
              align-items:center; justify-content:center; gap:2px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.6); }
        [data-theme="dark"] .cc { box-shadow: 0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1); filter: brightness(0.75) saturate(0.8); }
        .cc-sym { font-family:'DM Mono',monospace; font-weight:900; line-height:1; }
        .cc-lbl { font-family:'Syne',sans-serif; font-weight:700; letter-spacing:.08em; line-height:1; opacity:.7; }
        .cc-odd  { animation: risefall   linear infinite; }
        .cc-even { animation: risefallB  linear infinite; }
      `}</style>

      {COINS.map((c, i) => {
        // spread vertically so coins sit at different heights
        const topPct = 10 + (i * 8) % 75
        return (
          <div key={i}
            className={`cc ${i % 2 === 0 ? 'cc-odd' : 'cc-even'}`}
            style={{
              left:             `${c.x}%`,
              top:              `${topPct}%`,
              width:            `${c.size}px`,
              height:           `${c.size}px`,
              background:       c.bg,
              border:           `3px solid ${c.color}40`,
              animationDuration:`${c.dur}s`,
              animationDelay:   `${c.delay}s`,
            }}
          >
            <span className="cc-sym" style={{ fontSize: c.size * 0.38, color: c.color }}>{c.symbol}</span>
            <span className="cc-lbl" style={{ fontSize: c.size * 0.13, color: c.color }}>{c.label}</span>
          </div>
        )
      })}

      {/* Orbs */}
      <div style={{ position:'absolute', top:'-8%', left:'-4%', width:'600px', height:'600px', borderRadius:'50%',
        background:'radial-gradient(circle, rgba(91,141,238,0.07) 0%, transparent 65%)', filter:'blur(50px)' }} />
      <div style={{ position:'absolute', bottom:'-8%', right:'-4%', width:'500px', height:'500px', borderRadius:'50%',
        background:'radial-gradient(circle, rgba(247,147,26,0.06) 0%, transparent 65%)', filter:'blur(50px)' }} />

      {/* Grid */}
      <div style={{ position:'absolute', inset:0,
        backgroundImage:'linear-gradient(rgba(91,141,238,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(91,141,238,0.05) 1px,transparent 1px)',
        backgroundSize:'60px 60px' }} />
    </div>
  )
}
