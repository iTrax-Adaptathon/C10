import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  Sparkles,
  Zap,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  History,
  MoveRight,
  GitBranch,
  ShieldCheck,
  Flame,
  Layers,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
  Scale,
  HeartHandshake
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../api/client';
import { Task, Event, HealthScore, ImpactAnalysis, Strategy, ReplanResponse } from '../types';
import { QuickAdd } from '../components/QuickAdd';
import { ImpactModal } from '../components/ImpactModal';
import { BeforeAfterView } from '../components/BeforeAfterView';
import { GuidedDemoBanner } from '../components/GuidedDemoBanner';
import { useToast } from '../context/ToastContext';

export const DashboardPage: React.FC = () => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [impactData, setImpactData] = useState<ImpactAnalysis | null>(null);
  const [replanResult, setReplanResult] = useState<ReplanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStrategy, setActiveStrategy] = useState<Strategy>('protect_deadlines');

  // Demo flow state
  const [guidedDemoActive, setGuidedDemoActive] = useState(true);
  const [demoStep, setDemoStep] = useState(0);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.generateSchedule(activeStrategy);
      setTasks(res.scheduled_tasks.concat(res.unscheduled_tasks));
      setEvents(res.events);
      setHealthScore(res.health_score);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTaskCreated = () => {
    loadData();
  };

  const handleMoveTeamMeeting = async () => {
    try {
      const allEvents = await api.getEvents();
      const tm = allEvents.find((e) => e.title.includes('Team Meeting'));
      if (tm) {
        const todayStr = tm.start.split(' ')[0];
        const updatedTm: Event = {
          ...tm,
          start: `${todayStr} 20:00`,
          end: `${todayStr} 21:00`,
        };
        await api.updateEvent(updatedTm);

        const impact = await api.analyzeImpact(tm.id, updatedTm.start, updatedTm.end);
        setImpactData(impact);
        setDemoStep(2);
        toast('Team Meeting Moved to 8 PM!', 'Conflict created with Electronics Assignment.', 'warning');
        await loadData();
      }
    } catch (err) {
      console.error('Move Team Meeting failed:', err);
    }
  };

  const handleAnalyzeImpact = async () => {
    const tm = events.find((e) => e.title.includes('Team Meeting'));
    if (tm) {
      const todayStr = tm.start.split(' ')[0];
      const impact = await api.analyzeImpact(tm.id, `${todayStr} 20:00`, `${todayStr} 21:00`);
      setImpactData(impact);
    }
  };

  const handleReplan = async (strategy: Strategy) => {
    setActiveStrategy(strategy);
    const tm = events.find((e) => e.title.includes('Team Meeting'));
    let modifiedEvt: Event | undefined = undefined;
    if (tm) {
      const todayStr = tm.start.split(' ')[0];
      modifiedEvt = {
        ...tm,
        start: `${todayStr} 20:00`,
        end: `${todayStr} 21:00`,
      };
    }

    try {
      const result = await api.replanSchedule(strategy, modifiedEvt);
      setReplanResult(result);
      setImpactData(null);
      setHealthScore(result.health_score);
      setTasks(result.after_schedule);
      setDemoStep(3);
      toast(
        'Schedule Re-Optimized!',
        `Applied "${strategy.replace('_', ' ')}" strategy with ${result.moved_count} moves.`,
        'replan'
      );
    } catch (err) {
      console.error('Replan failed:', err);
    }
  };

  const handleResetDemo = async () => {
    await api.resetDemo();
    setReplanResult(null);
    setImpactData(null);
    setDemoStep(0);
    toast('Demo Reset', 'Restored default canonical schedule.', 'info');
    await loadData();
  };

  const scheduledTasks = tasks.filter((t) => t.status === 'scheduled');
  const conflictTasks = tasks.filter((t) => t.status === 'conflict');

  return (
    <div className="space-y-6 pb-16">
      {/* Guided Demo Assistant Banner */}
      {guidedDemoActive && (
        <GuidedDemoBanner
          step={demoStep}
          onNextStep={async () => {
            if (demoStep === 0) {
              await handleMoveTeamMeeting();
            } else if (demoStep === 1) {
              await handleAnalyzeImpact();
              setDemoStep(2);
            } else if (demoStep === 2) {
              await handleReplan('protect_deadlines');
            }
          }}
          onReset={handleResetDemo}
          onClose={() => setGuidedDemoActive(false)}
        />
      )}

      {/* Hero Header Section */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-yellow-500/25 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-yellow-400/15 text-yellow-400 text-[10px] font-extrabold uppercase tracking-wider border border-yellow-400/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Dynamic Engine Live
            </span>
            <span className="text-neutral-600 text-xs">•</span>
            <span className="text-xs text-neutral-400 font-mono">Deterministic Constraint Solver</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-2">
            Adaptive Schedule Studio
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl leading-relaxed">
            Real-time schedule adaptation engine. When disruptions or shifting deadlines occur, topological dependency sorting automatically rebalances your day.
          </p>
        </div>

        {/* Strategy Switcher Quick Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleReplan('protect_deadlines')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 ${
              activeStrategy === 'protect_deadlines'
                ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-400/25 font-black'
                : 'bg-neutral-900/80 text-neutral-300 border-neutral-800 hover:border-yellow-400/40 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Protect Deadlines</span>
          </button>

          <button
            onClick={() => handleReplan('balance_workload')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 ${
              activeStrategy === 'balance_workload'
                ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-400/25 font-black'
                : 'bg-neutral-900/80 text-neutral-300 border-neutral-800 hover:border-yellow-400/40 hover:text-white'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Balance Workload</span>
          </button>

          <button
            onClick={() => handleReplan('protect_preferences')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 ${
              activeStrategy === 'protect_preferences'
                ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-400/25 font-black'
                : 'bg-neutral-900/80 text-neutral-300 border-neutral-800 hover:border-yellow-400/40 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Protect Preferences</span>
          </button>

          <div className="h-6 w-px bg-neutral-800 hidden sm:block mx-1" />

          <button
            onClick={handleMoveTeamMeeting}
            className="px-3.5 py-2 rounded-xl bg-yellow-400/15 hover:bg-yellow-400/25 text-yellow-300 border border-yellow-400/30 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
          >
            <Clock className="w-4 h-4 text-yellow-400" />
            <span>Simulate Disruption (8 PM)</span>
          </button>
        </div>
      </div>

      {/* Quick Add NLP Prompt Bar */}
      <QuickAdd onTaskCreated={handleTaskCreated} />

      {/* Before / After Visual Diff Modal (When Replanned) */}
      {replanResult && (
        <BeforeAfterView
          beforeTasks={replanResult.before_schedule}
          afterTasks={replanResult.after_schedule}
          healthScore={replanResult.health_score}
          strategyUsed={replanResult.strategy_used}
          explanation={replanResult.explanation}
          movedCount={replanResult.moved_count}
          onClose={() => setReplanResult(null)}
        />
      )}

      {/* Key Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Health Score */}
        <div className="glass-panel p-5 rounded-2xl border border-yellow-500/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Schedule Health
            </span>
            <span className="text-3xl font-extrabold font-mono text-yellow-400 mt-1 block">
              {healthScore ? `${healthScore.overall}%` : '--'}
            </span>
            <span className="text-[10px] text-yellow-400 font-semibold flex items-center mt-0.5">
              <TrendingUp className="w-3 h-3 mr-1" /> Multi-vector optimization
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Metric 2: Scheduled Tasks */}
        <div className="glass-panel p-5 rounded-2xl border border-yellow-500/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Placed Tasks
            </span>
            <span className="text-3xl font-extrabold font-mono text-white mt-1 block">
              {scheduledTasks.length}
            </span>
            <span className="text-[10px] text-neutral-400 mt-0.5">Satisfied intervals</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-yellow-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Active Conflicts */}
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Conflicts / Delays
            </span>
            <span className="text-3xl font-extrabold font-mono text-rose-400 mt-1 block">
              {conflictTasks.length}
            </span>
            <span className="text-[10px] text-rose-400 mt-0.5 font-medium">Requires adaptation</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Next Hard Deadline */}
        <div className="glass-panel p-5 rounded-2xl border border-yellow-500/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Urgent Deadline
            </span>
            <span className="text-sm font-bold text-white mt-1 block truncate max-w-[140px]">
              {tasks.length > 0 ? tasks[0].title : 'None'}
            </span>
            <span className="text-[10px] text-yellow-400 font-mono mt-0.5 block">
              {tasks.length > 0 ? tasks[0].deadline : ''}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Agenda Column (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-yellow-500/20 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-yellow-400" />
                Today's Schedule Agenda
              </h2>
              <span className="text-xs text-yellow-400/80 font-mono">Deterministic Time Slots</span>
            </div>

            {/* Timeline List */}
            <div className="space-y-3">
              {/* Fixed Calendar Events */}
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-2xl bg-black/60 border border-neutral-800 flex items-center justify-between hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-2.5 h-10 rounded-full bg-neutral-600 shrink-0" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-white">{evt.title}</h4>
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-400 uppercase tracking-wider border border-neutral-800">
                          Fixed Event
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        {evt.start.split(' ')[1]} - {evt.end.split(' ')[1]}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-neutral-400 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800">
                    Locked Slot
                  </span>
                </div>
              ))}

              {/* Scheduled Tasks */}
              {scheduledTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-black/60 border border-neutral-800/80 flex items-center justify-between hover:border-yellow-400/40 transition-all group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-2.5 h-10 rounded-full shrink-0 ${
                        t.priority === 'high'
                          ? 'bg-rose-500'
                          : t.priority === 'medium'
                          ? 'bg-yellow-400'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-white group-hover:text-yellow-400 transition-colors">
                          {t.title}
                        </h4>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            t.priority === 'high'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : t.priority === 'medium'
                              ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {t.priority}
                        </span>
                        {t.is_split && (
                          <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Split
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        {t.scheduled_start?.split(' ')[1]} - {t.scheduled_end?.split(' ')[1]} ({t.duration}m)
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 block font-mono">
                      Due: {t.deadline.split(' ')[1] || t.deadline}
                    </span>
                    <span className="text-[10px] text-yellow-400 font-bold mt-0.5 inline-block">
                      Placed
                    </span>
                  </div>
                </div>
              ))}

              {/* Unscheduled / Conflicting Tasks */}
              {conflictTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-2.5 h-10 rounded-full bg-rose-500 shrink-0" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-rose-300">{t.title}</h4>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                          Conflict / Displaced
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-400/80 mt-0.5">
                        {t.unscheduled_reason || 'No viable interval before deadline'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleReplan('protect_deadlines')}
                    className="px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black transition-all shadow-sm"
                  >
                    Auto-Adapt
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Health Vectors & Trade-Off Radar (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Health Score Vector Breakdown */}
          {healthScore && (
            <div className="glass-panel p-6 rounded-3xl border border-yellow-500/20 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Optimization Vectors
                </span>
                <span className="text-xs font-extrabold text-yellow-400 font-mono">
                  {healthScore.overall}% Overall
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" /> Deadline Safety
                    </span>
                    <span className="font-mono font-bold text-white">{healthScore.deadline_safety}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-900 overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${healthScore.deadline_safety}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-yellow-400" /> Conflict-Free Interval
                    </span>
                    <span className="font-mono font-bold text-white">{healthScore.conflict_free}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-900 overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${healthScore.conflict_free}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-400 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-amber-400" /> Workload Balance
                    </span>
                    <span className="font-mono font-bold text-white">{healthScore.workload_balance}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-900 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${healthScore.workload_balance}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-400 flex items-center gap-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-yellow-300" /> Preference Fit
                    </span>
                    <span className="font-mono font-bold text-white">{healthScore.preference_fulfillment}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-900 overflow-hidden">
                    <div
                      className="h-full bg-yellow-300 rounded-full transition-all duration-500"
                      style={{ width: `${healthScore.preference_fulfillment}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Impact Radar Panel */}
          {impactData && (
            <div className="glass-panel p-6 rounded-3xl border border-yellow-500/30 shadow-lg space-y-4 bg-yellow-500/5">
              <div className="flex items-center justify-between pb-3 border-b border-yellow-500/20">
                <span className="text-xs font-bold uppercase tracking-wider text-yellow-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  Disruption Impact Radar
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300">
                  Active Disruption
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-black border border-neutral-800">
                  <span className="text-neutral-400 block text-[10px] uppercase">Colliding Item</span>
                  <span className="font-bold text-white mt-0.5 block">{impactData.target_title}</span>
                </div>

                <div className="p-3 rounded-xl bg-black border border-neutral-800 space-y-1">
                  <span className="text-neutral-400 block text-[10px] uppercase">Displaced Tasks</span>
                  {impactData.displaced_blocks.map((d, i) => (
                    <div key={i} className="flex justify-between text-rose-300 font-semibold">
                      <span>• {d.task_title}</span>
                      <span className="font-mono text-[10px]">{d.original_start.split(' ')[1]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleReplan('protect_deadlines')}
                className="w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs shadow-md shadow-yellow-400/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Re-Solve Schedule</span>
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
