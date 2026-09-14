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
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <HistoryIcon className="w-7 h-7 text-indigo-600" />
          Replanning Audit History
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete log of past schedule adaptations, trade-off choices, and health score deltas.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((h) => (
              <div
                key={h.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-indigo-600">{h.trigger}</span>
                    <span className="text-slate-400">•</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold capitalize border border-indigo-200">
                      Strategy: {h.strategy.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono">{h.timestamp}</span>
                </div>

                <p className="text-slate-700 text-[11px] leading-relaxed">{h.explanation}</p>

                <div className="flex items-center space-x-4 text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  <span>Affected Tasks: <strong className="text-amber-700">{h.affected_tasks_count}</strong></span>
                  <span>Health Delta: <strong className="text-slate-600">{h.health_score_before}%</strong> <ArrowRight className="w-3 h-3 inline mx-1 text-slate-400" /> <strong className="text-emerald-600">{h.health_score_after}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic py-4 text-center">
            No replanning operations recorded yet. Try running the Interactive Demo on the Dashboard!
          </p>
        )}
      </div>
    </div>
  );
};
