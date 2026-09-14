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
  RefreshCw
} from 'lucide-react';
import { api } from '../api/client';
import { Task, Event, HealthScore, ImpactAnalysis, Strategy, ReplanResponse } from '../types';
import { QuickAdd } from '../components/QuickAdd';
import { ImpactModal } from '../components/ImpactModal';
import { BeforeAfterView } from '../components/BeforeAfterView';
import { GuidedDemoBanner } from '../components/GuidedDemoBanner';

export const DashboardPage: React.FC = () => {
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
      const res = await api.generateSchedule();
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

  // Demo Action 1: Move Team Meeting from 6-7 PM to 8-9 PM
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

        // Auto trigger impact analysis
        const impact = await api.analyzeImpact(tm.id, updatedTm.start, updatedTm.end);
        setImpactData(impact);
        setDemoStep(2);
      }
    } catch (err) {
      console.error('Move Team Meeting failed:', err);
    }
  };

  // Demo Action 2: Trigger Impact Analysis manually
  const handleAnalyzeImpact = async () => {
    const tm = events.find((e) => e.title.includes('Team Meeting'));
    if (tm) {
      const todayStr = tm.start.split(' ')[0];
      const impact = await api.analyzeImpact(tm.id, `${todayStr} 20:00`, `${todayStr} 21:00`);
      setImpactData(impact);
    }
  };

  // Demo Action 3: Replan with chosen strategy
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
    } catch (err) {
      console.error('Replan failed:', err);
    }
  };

  const handleResetDemo = async () => {
    await api.resetDemo();
    setReplanResult(null);
    setImpactData(null);
    setDemoStep(0);
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

      {/* Clean Light Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold uppercase tracking-wider border border-indigo-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              Live Schedule Engine
            </span>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">Deterministic Constraints</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
            Adaptive Schedule Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Real-time schedule adaptation engine. Automatically shifts flexible tasks around fixed calendar conflicts while maximizing deep work blocks.
          </p>
        </div>

        {/* Preset Strategy Switcher Quick Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleReplan('protect_deadlines')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
              activeStrategy === 'protect_deadlines'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs font-bold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Protect Deadlines</span>
          </button>

          <button
            onClick={() => handleReplan('balance_workload')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
              activeStrategy === 'balance_workload'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs font-bold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Balance Workload</span>
          </button>

          <button
            onClick={() => handleReplan('protect_preferences')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
              activeStrategy === 'protect_preferences'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs font-bold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Flame className="w-4 h-4 text-indigo-600" />
            <span>Protect Preferences</span>
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />

          <button
            onClick={handleMoveTeamMeeting}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Simulate Conflict (8 PM)</span>
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
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Schedule Health
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {healthScore ? `${healthScore.overall}%` : '--'}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center mt-0.5">
              <TrendingUp className="w-3 h-3 mr-1" /> Optimal safety index
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Scheduled Tasks */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Scheduled Tasks
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {scheduledTasks.length}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">Fixed time slots</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Active Conflicts */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Conflicts / Drop Risks
            </span>
            <span className="text-2xl font-bold text-rose-600 mt-1 block">
              {conflictTasks.length}
            </span>
            <span className="text-[10px] text-rose-500 mt-0.5">Requires trade-off</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Next Hard Deadline */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Next Deadline
            </span>
            <span className="text-sm font-bold text-slate-900 mt-1 block truncate max-w-[130px]">
              {tasks.length > 0 ? tasks[0].title : 'None'}
            </span>
            <span className="text-[10px] text-indigo-600 font-medium mt-0.5">
              {tasks.length > 0 ? tasks[0].deadline : ''}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Agenda Column (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-600" />
                Today's Schedule Blocks
              </h2>
              <span className="text-xs text-slate-500">Deterministic Slots</span>
            </div>

            {/* Timeline List */}
            <div className="space-y-3">
              {/* Fixed Calendar Events */}
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-2.5 h-10 rounded-full bg-slate-400 shrink-0" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-slate-900">{evt.title}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase tracking-wider">
                          Fixed Event
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {evt.start.split(' ')[1]} - {evt.end.split(' ')[1]}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">Non-negotiable</span>
                </div>
              ))}

              {/* Scheduled Adaptive Tasks */}
              {scheduledTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    task.priority === 'high'
                      ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-2.5 h-10 rounded-full shrink-0 ${
                        task.priority === 'high'
                          ? 'bg-indigo-600'
                          : task.priority === 'medium'
                          ? 'bg-sky-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                        {task.dependencies.length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium border border-indigo-200">
                            Depends on {task.dependencies.join(', ')}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {task.scheduled_start?.split(' ')[1]} - {task.scheduled_end?.split(' ')[1]} ({task.duration}m)
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-slate-500 block font-mono">
                      Due: {task.deadline.split(' ')[1] || task.deadline}
                    </span>
                    <span className="text-[10px] text-indigo-600 uppercase font-semibold">
                      {task.priority} Priority
                    </span>
                  </div>
                </div>
              ))}

              {/* Conflict Tasks */}
              {conflictTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-2.5 h-10 rounded-full bg-rose-500 shrink-0" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-rose-950">{t.title}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 font-bold uppercase">
                          Conflict
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        {t.unscheduled_reason || 'Cannot fit before hard deadline.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyzeImpact}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    Resolve Impact
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Health & Audit Column (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Health Score Panel */}
          {healthScore && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Health Breakdown
                </h3>
                <span className="text-xs font-bold text-indigo-600">
                  {healthScore.overall}%
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span>Deadline Safety</span>
                    <span className="text-slate-900 font-semibold">{healthScore.deadline_safety}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${healthScore.deadline_safety}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span>Conflict Free</span>
                    <span className="text-slate-900 font-semibold">{healthScore.conflict_free}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-sky-500 rounded-full"
                      style={{ width: `${healthScore.conflict_free}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span>Preference Match</span>
                    <span className="text-slate-900 font-semibold">{healthScore.preference_fulfillment}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${healthScore.preference_fulfillment}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audit History Log */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-600" />
              What Changed?
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
                  <span className="font-semibold text-indigo-600">Constraint Engine</span>
                  <span>Just now</span>
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  Calculated optimal schedule. Protected hard deadlines with zero overlap conflicts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Trade-off Impact Modal */}
      {impactData && (
        <ImpactModal
          impact={impactData}
          onClose={() => setImpactData(null)}
          onReplan={handleReplan}
        />
      )}
    </div>
  );
};


