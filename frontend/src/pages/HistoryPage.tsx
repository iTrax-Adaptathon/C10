import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import { HistoryEntry } from '../types';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await api.getHistory();
        setHistory(data);
      } catch (err) {
        console.error('Failed to load history:', err);
      }
    };
    loadHistory();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <HistoryIcon className="w-6 h-6 text-blue-400" />
          Replanning Audit History
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete log of past schedule adaptations, trade-off choices, and health score deltas.
        </p>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4">
        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((h) => (
              <div
                key={h.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-blue-400">{h.trigger}</span>
                    <span className="text-slate-500">•</span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold capitalize">
                      Strategy: {h.strategy.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono">{h.timestamp}</span>
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed">{h.explanation}</p>

                <div className="flex items-center space-x-4 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>Affected Tasks: <strong className="text-amber-300">{h.affected_tasks_count}</strong></span>
                  <span>Health Delta: <strong className="text-slate-400">{h.health_score_before}%</strong> <ArrowRight className="w-3 h-3 inline mx-1 text-slate-500" /> <strong className="text-emerald-400">{h.health_score_after}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            No replanning operations recorded yet. Try running the Interactive Demo on the Dashboard!
          </p>
        )}
      </div>
    </div>
  );
};
