import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Activity,
  ShieldCheck,
  Scale,
  HeartHandshake,
  Zap,
  Flame,
  Brain,
  Timer,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { api } from '../api/client';
import { HealthScore, Task, Event } from '../types';

export const InsightsPage: React.FC = () => {
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.generateSchedule();
        setHealthScore(res.health_score);
        setTasks(res.scheduled_tasks);
        setEvents(res.events);
      } catch (err) {
        console.error('Failed to load insights:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute cognitive workload stats
  const totalTaskMinutes = tasks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const totalTaskHours = (totalTaskMinutes / 60).toFixed(1);
  const deepWorkBlocks = tasks.filter((t) => (t.duration || 0) >= 60).length;
  const contextSwitches = tasks.length + events.length;

  // Burnout score calculation (0 to 100)
  const burnoutRisk = Math.min(
    Math.round((totalTaskMinutes / 480) * 50 + (contextSwitches > 6 ? 30 : 15)),
    100
  );

  const getBurnoutBadge = (score: number) => {
    if (score < 40) return { label: 'Optimal Load (Safe)', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' };
    if (score < 75) return { label: 'Balanced Workload', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' };
    return { label: 'Burnout Warning', color: 'text-rose-400 bg-rose-500/20 border-rose-500/30' };
  };

  const burnoutStatus = getBurnoutBadge(burnoutRisk);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
          <BarChart3 className="w-7 h-7 text-yellow-400" />
          Schedule Insights & Cognitive Load Cockpit
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Deep telemetry on deadline buffers, workload variance, context switching, and burnout prevention.
        </p>
      </div>

      {healthScore && (
        <>
          {/* Main Health & Burnout Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Overall Health Card (lg:col-span-6) */}
            <div className="lg:col-span-6 glass-panel p-6 sm:p-7 rounded-3xl border border-yellow-500/20 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-yellow-400" />
                  Schedule Health Score
                </span>
                <span className="text-3xl font-extrabold font-mono text-yellow-400">
                  {healthScore.overall}%
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-neutral-900 overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full transition-all duration-700 shadow-sm shadow-yellow-400/50"
                  style={{ width: `${healthScore.overall}%` }}
                />
              </div>

              {/* Health Analysis Points */}
              <div className="space-y-2 pt-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Engine Diagnostic Feedback:
                </span>
                {healthScore.analysis.map((line, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#0d0d10] border border-neutral-800/80 text-neutral-300 flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cognitive Load & Burnout Risk Card (lg:col-span-6) */}
            <div className="lg:col-span-6 glass-panel p-6 sm:p-7 rounded-3xl border border-yellow-500/20 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Cognitive Load & Burnout Risk
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                  burnoutRisk < 40
                    ? 'text-yellow-400 bg-yellow-400/15 border-yellow-500/40'
                    : burnoutRisk < 75
                    ? 'text-amber-400 bg-amber-400/15 border-amber-500/40'
                    : 'text-rose-400 bg-rose-500/15 border-rose-500/40'
                }`}>
                  {burnoutStatus.label}
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-neutral-900 overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-rose-500 rounded-full transition-all duration-700"
                  style={{ width: `${burnoutRisk}%` }}
                />
              </div>

              {/* Cognitive Telemetry Stats */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-[#0d0d10] border border-neutral-800 text-center">
                  <span className="text-[10px] text-neutral-400 uppercase block font-semibold">
                    Scheduled Hours
                  </span>
                  <span className="text-xl font-bold font-mono text-white mt-1 block">
                    {totalTaskHours}h
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#0d0d10] border border-neutral-800 text-center">
                  <span className="text-[10px] text-neutral-400 uppercase block font-semibold">
                    Deep Work Slots
                  </span>
                  <span className="text-xl font-bold font-mono text-yellow-400 mt-1 block">
                    {deepWorkBlocks}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#0d0d10] border border-neutral-800 text-center">
                  <span className="text-[10px] text-neutral-400 uppercase block font-semibold">
                    Task Shifts
                  </span>
                  <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
                    {contextSwitches}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-neutral-400 leading-snug">
                Replan automatically guards 15-minute buffers between deep work sessions to minimize context fragmentation.
              </p>
            </div>
          </div>

          {/* Sub-Metrics 4-Vector Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-yellow-500/25 shadow-sm space-y-2">
              <div className="flex items-center space-x-2 text-yellow-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide">Deadline Safety</span>
              </div>
              <span className="text-3xl font-extrabold font-mono text-white block">
                {healthScore.deadline_safety}%
              </span>
              <p className="text-[10px] text-neutral-400">Tasks with sufficient time buffer before cutoff</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-yellow-500/20 shadow-sm space-y-2">
              <div className="flex items-center space-x-2 text-amber-400">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide">Conflict Free</span>
              </div>
              <span className="text-3xl font-extrabold font-mono text-white block">
                {healthScore.conflict_free}%
              </span>
              <p className="text-[10px] text-neutral-400">Zero overlapping hard calendar blocks</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-yellow-500/20 shadow-sm space-y-2">
              <div className="flex items-center space-x-2 text-yellow-400">
                <Scale className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide">Workload Balance</span>
              </div>
              <span className="text-3xl font-extrabold font-mono text-white block">
                {healthScore.workload_balance}%
              </span>
              <p className="text-[10px] text-neutral-400">Even variance distribution across upcoming days</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-yellow-500/20 shadow-sm space-y-2">
              <div className="flex items-center space-x-2 text-yellow-300">
                <HeartHandshake className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide">Preference Fit</span>
              </div>
              <span className="text-3xl font-extrabold font-mono text-white block">
                {healthScore.preference_fulfillment}%
              </span>
              <p className="text-[10px] text-neutral-400">Preferred morning/afternoon slots satisfied</p>
            </div>
          </div>

          {/* Strategy Scorecard Comparison Matrix */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-yellow-500/20 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-yellow-400" />
              Adaptation Strategy Efficiency Scorecard
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#0c0c0f] border border-yellow-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Protect Deadlines</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                    Highest Safety
                  </span>
                </div>
                <p className="text-neutral-400 text-[11px]">
                  Packs tasks tightly before hard deadlines. Prioritizes zero tardiness over personal slot preferences.
                </p>
                <div className="pt-2 border-t border-neutral-800 text-[10px] text-neutral-400 flex justify-between">
                  <span>Deadline Score: <strong className="text-yellow-400">98%</strong></span>
                  <span>Balance Score: <strong className="text-neutral-300">72%</strong></span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0c0c0f] border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Balance Workload</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-neutral-800 text-yellow-400 border border-neutral-700">
                    Burnout Defense
                  </span>
                </div>
                <p className="text-neutral-400 text-[11px]">
                  Spreads work across multiple days to leave ample buffer time and prevent late-night cramming.
                </p>
                <div className="pt-2 border-t border-neutral-800 text-[10px] text-neutral-400 flex justify-between">
                  <span>Deadline Score: <strong className="text-yellow-400">88%</strong></span>
                  <span>Balance Score: <strong className="text-yellow-400">95%</strong></span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0c0c0f] border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Protect Preferences</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-neutral-800 text-yellow-400 border border-neutral-700">
                    Peak Flow
                  </span>
                </div>
                <p className="text-neutral-400 text-[11px]">
                  Strictly schedules focus work in preferred biological morning/afternoon slots for maximum productivity.
                </p>
                <div className="pt-2 border-t border-neutral-800 text-[10px] text-neutral-400 flex justify-between">
                  <span>Deadline Score: <strong className="text-yellow-400">85%</strong></span>
                  <span>Preference: <strong className="text-yellow-400">96%</strong></span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
