import React, { useState } from 'react';
import {
  Zap,
  AlertTriangle,
  Flame,
  Car,
  Clock,
  HeartPulse,
  Sliders,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  X,
  ShieldCheck,
  Scale,
  Sparkles,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import { ImpactAnalysis, Strategy, Event } from '../types';
import { useToast } from '../context/ToastContext';

interface DisruptionSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduleUpdated: () => void;
}

export const DisruptionSimulator: React.FC<DisruptionSimulatorProps> = ({
  isOpen,
  onClose,
  onScheduleUpdated
}) => {
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState<string>('incident');
  const [customTitle, setCustomTitle] = useState('Emergency Server Incident');
  const [customDuration, setCustomDuration] = useState(90);
  const [customStartHour, setCustomStartHour] = useState(14);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy>('protect_deadlines');

  const [impactData, setImpactData] = useState<ImpactAnalysis | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const presets = [
    {
      id: 'incident',
      icon: Flame,
      title: 'Emergency Bug / Production Incident',
      desc: '+90 mins immediate urgent block right now',
      duration: 90,
      hour: new Date().getHours(),
      category: 'work',
      badge: 'High Impact'
    },
    {
      id: 'traffic',
      icon: Car,
      title: 'Transit Delay / Traffic Jam',
      desc: 'Unexpected travel roadblock pushing items +45 mins',
      duration: 45,
      hour: Math.min(new Date().getHours() + 1, 20),
      category: 'personal',
      badge: 'Ripple Effect'
    },
    {
      id: 'meeting',
      icon: Clock,
      title: 'Meeting Overrun',
      desc: 'Current sync running 60 mins over scheduled time',
      duration: 60,
      hour: 17,
      category: 'work',
      badge: 'Displacement'
    },
    {
      id: 'illness',
      icon: HeartPulse,
      title: 'Energy Crash / Afternoon Off',
      desc: 'Sudden sickness requiring afternoon rest from 2 PM',
      duration: 180,
      hour: 14,
      category: 'health',
      badge: 'Full Reschedule'
    }
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    setSelectedPreset(p.id);
    setCustomTitle(p.title);
    setCustomDuration(p.duration);
    setCustomStartHour(p.hour);
    setImpactData(null);
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const sh = customStartHour < 10 ? `0${customStartHour}` : `${customStartHour}`;
      const endTotalMins = customStartHour * 60 + customDuration;
      const ehNum = Math.floor(endTotalMins / 60);
      const emNum = endTotalMins % 60;
      const eh = ehNum < 10 ? `0${ehNum}` : `${ehNum}`;
      const em = emNum < 10 ? `0${emNum}` : `${emNum}`;

      const startStr = `${todayStr} ${sh}:00`;
      const endStr = `${todayStr} ${eh}:${em}`;

      // Analyze against existing schedule
      const impact = await api.analyzeImpact('simulated-disruption', startStr, endStr);
      setImpactData(impact);
      toast(
        'Disruption Simulated!',
        `Calculated ripple effect across ${impact.displaced_blocks.length} displaced tasks.`,
        'warning'
      );
    } catch (err) {
      console.error('Simulation error:', err);
      toast('Simulation Error', 'Failed to calculate disruption ripple effect.', 'warning');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApplyAdaptation = async () => {
    setIsApplying(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const sh = customStartHour < 10 ? `0${customStartHour}` : `${customStartHour}`;
      const endTotalMins = customStartHour * 60 + customDuration;
      const ehNum = Math.floor(endTotalMins / 60);
      const emNum = endTotalMins % 60;
      const eh = ehNum < 10 ? `0${ehNum}` : `${ehNum}`;
      const em = emNum < 10 ? `0${emNum}` : `${emNum}`;

      // 1. Create the disruption as a fixed calendar event so it reserves time
      const shockEvent: Event = {
        id: `evt-shock-${Date.now().toString(36)}`,
        title: `🚨 ${customTitle}`,
        start: `${todayStr} ${sh}:00`,
        end: `${todayStr} ${eh}:${em}`,
        fixed: true,
        category: 'disruption'
      };

      await api.createEvent(shockEvent);

      // 2. Replan schedule with the chosen strategy
      await api.replanSchedule(selectedStrategy, shockEvent);

      toast(
        'Schedule Adapted & Committed!',
        `Successfully re-optimized using "${selectedStrategy.replace('_', ' ')}" strategy.`,
        'replan'
      );

      onScheduleUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to apply adaptation:', err);
      toast('Failed to apply', 'Could not apply schedule adaptation.', 'warning');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="relative w-full max-w-3xl glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-yellow-500/20 text-neutral-100 my-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400 flex items-center justify-center text-black shadow-lg shadow-yellow-400/25 font-black">
              <Zap className="w-5 h-5 fill-current animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Disruption Simulator
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
                  What-If Chaos Lab
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Simulate real-life disruptions to stress-test your day and preview how Replan auto-heals your calendar.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chaos Presets */}
        <div className="mt-6 space-y-3">
          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            1. Select a Real-World Disruption Shock
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {presets.map((p) => {
              const Icon = p.icon;
              const isSelected = selectedPreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 relative ${
                    isSelected
                      ? 'bg-yellow-400/10 border-yellow-400/80 shadow-lg shadow-yellow-400/15'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                      isSelected
                        ? 'bg-yellow-400 text-black'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 pr-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white leading-tight">
                        {p.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-snug">
                      {p.desc}
                    </p>
                  </div>
                  <span className="absolute top-3 right-3 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-black border border-neutral-800 text-yellow-400">
                    {p.duration}m
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Customization Sliders */}
        <div className="mt-5 p-4 rounded-2xl bg-black border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-yellow-400" />
              Tune Shock Parameters
            </span>
            <span className="text-yellow-400 font-mono text-[11px]">
              Start: {customStartHour}:00 ({customDuration} mins block)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span>Start Time</span>
                <span className="font-mono text-white">{customStartHour}:00</span>
              </div>
              <input
                type="range"
                min="8"
                max="21"
                value={customStartHour}
                onChange={(e) => setCustomStartHour(Number(e.target.value))}
                className="w-full accent-yellow-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span>Duration</span>
                <span className="font-mono text-white">{customDuration} mins</span>
              </div>
              <input
                type="range"
                min="15"
                max="240"
                step="15"
                value={customDuration}
                onChange={(e) => setCustomDuration(Number(e.target.value))}
                className="w-full accent-yellow-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="w-full py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md shadow-yellow-400/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Calculating Ripple Graph...' : 'Calculate Ripple Impact Tree'}</span>
          </button>
        </div>

        {/* Simulation Results (Impact Analysis) */}
        {impactData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <div className="p-4 rounded-2xl bg-yellow-400/5 border border-yellow-400/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-yellow-300 uppercase tracking-wide flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  Simulated Disruption Impact Tree
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-yellow-400/20 text-yellow-300">
                  {impactData.displaced_blocks.length} Tasks Collided
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-black border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 uppercase block">Directly Collided</span>
                  <span className="text-lg font-bold text-rose-400">
                    {impactData.directly_affected_tasks.length}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-black border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 uppercase block">Downstream Ripples</span>
                  <span className="text-lg font-bold text-yellow-400">
                    {impactData.indirectly_affected_tasks.length}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-black border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 uppercase block">Deadline Breaches</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {impactData.deadline_risks.length === 0 ? '0 (Safe)' : `${impactData.deadline_risks.length} At Risk`}
                  </span>
                </div>
              </div>

              {impactData.displaced_blocks.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-yellow-400/20">
                  <span className="text-[11px] font-semibold text-neutral-300">Colliding Tasks:</span>
                  {impactData.displaced_blocks.map((block, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-black border border-neutral-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-white">{block.task_title}</span>
                      <span className="text-[11px] font-mono text-rose-300">
                        {block.original_start.split(' ')[1]} - {block.original_end.split(' ')[1]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Choose Adaptation Strategy */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-yellow-400" />
                2. Choose Adaptive Healing Strategy
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'protect_deadlines' as Strategy,
                    icon: ShieldCheck,
                    name: 'Protect Deadlines',
                    desc: 'Zero tolerance for late deliveries; packs tasks tightly'
                  },
                  {
                    id: 'balance_workload' as Strategy,
                    icon: Scale,
                    name: 'Balance Workload',
                    desc: 'Spreads tasks evenly across open slots to avoid burnout'
                  },
                  {
                    id: 'protect_preferences' as Strategy,
                    icon: Sparkles,
                    name: 'Protect Preferences',
                    desc: 'Strictly honors preferred morning/evening time windows'
                  }
                ].map((s) => {
                  const Icon = s.icon;
                  const isSelected = selectedStrategy === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStrategy(s.id)}
                      className={`p-3 rounded-2xl border text-left transition-all space-y-1.5 ${
                        isSelected
                          ? 'bg-yellow-400/15 border-yellow-400 shadow-md shadow-yellow-400/20'
                          : 'bg-neutral-900/60 border-neutral-800 hover:bg-neutral-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-yellow-400' : 'text-neutral-400'}`} />
                        <span className="text-xs font-bold text-white">{s.name}</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-snug">{s.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1-Click Commit Action */}
            <div className="pt-2">
              <button
                onClick={handleApplyAdaptation}
                disabled={isApplying}
                className="w-full py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-yellow-400/25 disabled:opacity-50"
              >
                {isApplying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Committing Adaptive Schedule...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply Adaptation & Commit to Calendar</span>
                    <ArrowRight className="w-4 h-4 ml-1 stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
