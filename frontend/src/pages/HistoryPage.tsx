import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Clock, ShieldCheck, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { HistoryEntry } from '../types';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <HistoryIcon className="w-7 h-7 text-yellow-400" />
            Replanning Audit History & Telemetry Log
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Complete audit trail of past schedule adaptations, trade-off decisions, and health score deltas.
          </p>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="p-2 rounded-2xl glass-panel border border-yellow-500/20 text-neutral-300 hover:text-yellow-400 transition-all shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="glass-panel rounded-3xl border border-yellow-500/20 p-6 sm:p-8 space-y-4 shadow-xl">
        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((h) => (
              <div
                key={h.id}
                className="p-4 rounded-2xl bg-[#0c0c0f] border border-neutral-800 space-y-2 text-xs hover:border-yellow-500/30 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="font-bold text-white">{h.trigger}</span>
                    <span className="text-neutral-600">•</span>
                    <span className="px-2 py-0.5 rounded-full bg-yellow-400/15 text-yellow-300 font-bold capitalize border border-yellow-400/30 text-[10px]">
                      Strategy: {h.strategy.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-neutral-400 font-mono text-[11px]">{h.timestamp}</span>
                </div>

                <p className="text-neutral-300 text-[11px] leading-relaxed">{h.explanation}</p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-neutral-400 pt-2 border-t border-neutral-800">
                  <span>
                    Affected Tasks: <strong className="text-amber-400 font-mono">{h.affected_tasks_count}</strong>
                  </span>
                  <span>
                    Health Delta: <strong className="text-neutral-300 font-mono">{h.health_score_before}%</strong>{' '}
                    <ArrowRight className="w-3 h-3 inline mx-1 text-neutral-500" />{' '}
                    <strong className="text-yellow-400 font-mono">{h.health_score_after}%</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center space-y-2">
            <HistoryIcon className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-xs text-neutral-400 italic">
              No replanning operations recorded yet. Try running the What-If Chaos Lab or Interactive Demo on the Dashboard!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
