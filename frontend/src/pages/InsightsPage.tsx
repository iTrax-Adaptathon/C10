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
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-indigo-600" />
          Schedule Insights & Health Score
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Deep analytics on deadline safety ratios, workload variance, and preference fulfillment.
        </p>
      </div>

      {healthScore && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Health Gauge Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Overall Schedule Health Score
              </span>
              <span className="text-3xl font-extrabold text-indigo-600">{healthScore.overall}%</span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${healthScore.overall}%` }}
              />
            </div>

            <div className="space-y-2 pt-2 text-xs">
              {healthScore.analysis.map((line, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                  • {line}
                </div>
              ))}
            </div>
          </div>

          {/* Sub-Metrics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-indigo-600">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-semibold">Deadline Safety</span>
              </div>
              <span className="text-2xl font-bold text-slate-900 block">{healthScore.deadline_safety}%</span>
              <p className="text-[10px] text-slate-500">Tasks with buffer before deadline</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-sky-600">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-semibold">Conflict Free</span>
              </div>
              <span className="text-2xl font-bold text-slate-900 block">{healthScore.conflict_free}%</span>
              <p className="text-[10px] text-slate-500">Zero overlapping hard slots</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-purple-600">
                <Scale className="w-4 h-4" />
                <span className="text-xs font-semibold">Workload Balance</span>
              </div>
              <span className="text-2xl font-bold text-slate-900 block">{healthScore.workload_balance}%</span>
              <p className="text-[10px] text-slate-500">Even spread across days</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center space-x-2 text-emerald-600">
                <HeartHandshake className="w-4 h-4" />
                <span className="text-xs font-semibold">Preference Fit</span>
              </div>
              <span className="text-2xl font-bold text-slate-900 block">{healthScore.preference_fulfillment}%</span>
              <p className="text-[10px] text-slate-500">Preferred time windows honored</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
