/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from '@google/genai';
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { Trade, TradeResult, Stats } from './types';
import { generateId } from './utils';
import DottedGlowBackground from './components/DottedGlowBackground';
import { SparklesIcon, ThinkingIcon, ArrowUpIcon, GridIcon } from './components/Icons';

function App() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [form, setForm] = useState({
    pair: '',
    time: new Date().toISOString().slice(0, 16),
    resultType: 'gain' as TradeResult,
    amount: '',
    rrr: '',
    reason: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiCritique, setAiCritique] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem('crypto_trades_v1');
    if (saved) setTrades(JSON.parse(saved));
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem('crypto_trades_v1', JSON.stringify(trades));
  }, [trades]);

  const stats = useMemo((): Stats => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const calc = (sinceMs: number) => 
      trades
        .filter(t => t.timestamp >= now - sinceMs)
        .reduce((acc, t) => acc + (t.resultType === 'gain' ? t.amount : -t.amount), 0);

    return {
      daily: calc(dayMs),
      threeDay: calc(dayMs * 3),
      weekly: calc(dayMs * 7),
      monthly: calc(dayMs * 30),
      allTime: trades.reduce((acc, t) => acc + (t.resultType === 'gain' ? t.amount : -t.amount), 0)
    };
  }, [trades]);

  const handleAddTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pair || !form.amount) return;

    const newTrade: Trade = {
      id: generateId(),
      pair: form.pair.toUpperCase(),
      timestamp: new Date(form.time).getTime(),
      resultType: form.resultType,
      amount: parseFloat(form.amount),
      rrr: parseFloat(form.rrr) || 0,
      reason: form.reason
    };

    setTrades([newTrade, ...trades]);
    setForm({
      pair: '',
      time: new Date().toISOString().slice(0, 16),
      resultType: 'gain',
      amount: '',
      rrr: '',
      reason: ''
    });
  };

  const runAiAudit = async () => {
    if (trades.length === 0) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const history = trades.slice(0, 10).map(t => 
        `[${t.pair}] ${t.resultType === 'gain' ? '+' : '-'}${t.amount} (RRR: ${t.rrr}). Reason: ${t.reason}`
      ).join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: `Act as a world-class crypto trading coach. Analyze my recent trades and provide 3 bullet points of psychological or tactical advice based on these patterns:\n\n${history}` }] }]
      });
      setAiCritique(response.text);
    } catch (e) {
      console.error(e);
      setAiCritique("Failed to analyze trades. Check API connectivity.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="app-container">
      <DottedGlowBackground 
        gap={30} 
        radius={1} 
        color="rgba(255, 255, 255, 0.05)" 
        glowColor="rgba(0, 255, 128, 0.1)" 
        speedScale={0.3} 
      />

      <header className="main-header">
        <div className="logo">
          <GridIcon />
          <span>CRYPTO<b>JOURNAL</b></span>
        </div>
        <button className="ai-audit-btn" onClick={runAiAudit} disabled={isAnalyzing || trades.length === 0}>
          {isAnalyzing ? <ThinkingIcon /> : <SparklesIcon />}
          {isAnalyzing ? 'Analyzing Patterns...' : 'AI Strategy Audit'}
        </button>
      </header>

      <main className="dashboard-grid">
        {/* Statistics Panel */}
        <section className="stats-panel">
          <div className="panel-title">PERFORMANCE METRICS</div>
          <div className="stats-cards">
            <StatItem label="Daily PnL" value={stats.daily} />
            <StatItem label="3-Day PnL" value={stats.threeDay} />
            <StatItem label="Weekly PnL" value={stats.weekly} />
            <StatItem label="Monthly PnL" value={stats.monthly} />
            <StatItem label="All-Time" value={stats.allTime} isLarge />
          </div>
          
          {aiCritique && (
            <div className="ai-critique-box">
              <div className="box-header"><SparklesIcon /> COACH FEEDBACK</div>
              <div className="box-content">{aiCritique}</div>
              <button onClick={() => setAiCritique(null)}>Clear</button>
            </div>
          )}
        </section>

        {/* Trade Entry & History */}
        <div className="main-content">
          <section className="entry-section card">
            <form onSubmit={handleAddTrade} className="trade-form">
              <div className="form-grid">
                <div className="field">
                  <label>Trading Pair</label>
                  <input type="text" placeholder="BTC/USDT" value={form.pair} onChange={e => setForm({...form, pair: e.target.value})} />
                </div>
                <div className="field">
                  <label>Execution Time</label>
                  <input type="datetime-local" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
                </div>
                <div className="field">
                  <label>Result</label>
                  <select value={form.resultType} onChange={e => setForm({...form, resultType: e.target.value as TradeResult})}>
                    <option value="gain">Gain (+)</option>
                    <option value="loss">Loss (-)</option>
                  </select>
                </div>
                <div className="field">
                  <label>PnL Amount ($)</label>
                  <input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                </div>
                <div className="field">
                  <label>RR Ratio (1:X)</label>
                  <input type="number" step="0.1" placeholder="2.5" value={form.rrr} onChange={e => setForm({...form, rrr: e.target.value})} />
                </div>
              </div>
              <div className="field reason-field">
                <label>Trade Reason / Logic</label>
                <textarea placeholder="e.g. RSI divergence on 4H, breakout of descending triangle..." value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
              </div>
              <button type="submit" className="submit-btn">
                <ArrowUpIcon /> Log Trade
              </button>
            </form>
          </section>

          <section className="history-section">
            <div className="section-header">
              RECENT ACTIVITY
              <span>{trades.length} entries</span>
            </div>
            <div className="trade-list">
              {trades.length === 0 ? (
                <div className="empty-history">No trades logged yet. Start by entering one above.</div>
              ) : (
                trades.map(trade => (
                  <div key={trade.id} className={`trade-card ${trade.resultType}`}>
                    <div className="trade-card-main">
                      <div className="trade-info">
                        <span className="pair">{trade.pair}</span>
                        <span className="date">{new Date(trade.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="trade-math">
                        <span className="amount">{trade.resultType === 'gain' ? '+' : '-'}${trade.amount.toFixed(2)}</span>
                        <span className="rrr">RRR 1:{trade.rrr}</span>
                      </div>
                    </div>
                    {trade.reason && <div className="trade-reason">{trade.reason}</div>}
                    <button className="del-btn" onClick={() => setTrades(trades.filter(t => t.id !== trade.id))}>&times;</button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatItem({ label, value, isLarge = false }: { label: string, value: number, isLarge?: boolean }) {
  const isPositive = value >= 0;
  return (
    <div className={`stat-item ${isLarge ? 'large' : ''} ${isPositive ? 'positive' : 'negative'}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        {isPositive ? '+' : '-'}${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
