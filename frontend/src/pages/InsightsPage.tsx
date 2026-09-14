import React, { useState, useEffect } from 'react';
import { BarChart3, Activity, ShieldCheck, Scale, HeartHandshake, Zap } from 'lucide-react';
import { api } from '../api/client';
import { HealthScore } from '../types';

export const InsightsPage: React.FC = () => {
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.generateSchedule();
        setHealthScore(res.health_score);
      } catch (err) {
        console.error('Failed to load insights:', err);
      }
    };
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          Schedule Insights & Health Score
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Deep analytics on deadline safety ratios, workload variance, and preference fulfillment.
        </p>
      </div>

      {healthScore && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Health Gauge Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Overall Schedule Health Score
              </span>
              <span className="text-3xl font-extrabold text-blue-400">{healthScore.overall}%</span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${healthScore.overall}%` }}
              />
            </div>

            <div className="space-y-2 pt-2 text-xs">
              {healthScore.analysis.map((line, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
                  • {line}
                </div>
              ))}
            </div>
          </div>

          {/* Sub-Metrics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-blue-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-semibold">Deadline Safety</span>
              </div>
              <span className="text-2xl font-bold text-white block">{healthScore.deadline_safety}%</span>
              <p className="text-[10px] text-slate-400">Tasks with buffer before deadline</p>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-semibold">Conflict Free</span>
              </div>
              <span className="text-2xl font-bold text-white block">{healthScore.conflict_free}%</span>
              <p className="text-[10px] text-slate-400">Zero overlapping hard slots</p>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-purple-400">
                <Scale className="w-4 h-4" />
                <span className="text-xs font-semibold">Workload Balance</span>
              </div>
              <span className="text-2xl font-bold text-white block">{healthScore.workload_balance}%</span>
              <p className="text-[10px] text-slate-400">Even spread across days</p>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400">
                <HeartHandshake className="w-4 h-4" />
                <span className="text-xs font-semibold">Preference Fit</span>
              </div>
              <span className="text-2xl font-bold text-white block">{healthScore.preference_fulfillment}%</span>
              <p className="text-[10px] text-slate-400">Preferred time windows honored</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
