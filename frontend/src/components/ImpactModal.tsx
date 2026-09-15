import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Scale,
  HeartHandshake,
  Layers,
  Clock,
  CheckCircle2,
  X,
  Sparkles,
  ChevronRight,
  Zap
} from 'lucide-react';
import { ImpactAnalysis, Strategy } from '../types';

interface ImpactModalProps {
  impact: ImpactAnalysis;
  onClose: () => void;
  onReplan: (strategy: Strategy) => void;
}

export const ImpactModal: React.FC<ImpactModalProps> = ({
  impact,
  onClose,
  onReplan,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy>('protect_deadlines');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strategies = [
    {
      id: 'protect_deadlines' as Strategy,
      title: 'Protect Deadlines',
      icon: ShieldCheck,
      color: 'from-cyan-500 to-blue-600',
      borderColor: 'border-cyan-500',
      glow: 'glow-cyan',
      tag: 'Urgent & Mandatory First',
      description:
        'Guarantees all urgent work meets hard deadlines. Splitting or moving lower priority/optional tasks if required.',
    },
    {
      id: 'balance_workload' as Strategy,
      title: 'Balance Workload',
      icon: Scale,
      color: 'from-yellow-500 to-amber-600',
      borderColor: 'border-yellow-500',
      glow: 'glow-yellow',
      tag: 'Even Daily Spread',
      description:
        'Smooths tasks evenly across available days to prevent daily overload and balance focus hours.',
    },
    {
      id: 'protect_preferences' as Strategy,
      title: 'Protect Preferences',
      icon: HeartHandshake,
      color: 'from-emerald-500 to-teal-600',
      borderColor: 'border-emerald-500',
      glow: 'glow-emerald',
      tag: 'Habit & Time slots',
      description:
        'Preserves preferred times (morning study, evening gym) as much as possible, reallocating flexible items.',
    },
  ];

  const handleApplyReplan = async () => {
    setIsSubmitting(true);
    try {
      await onReplan(selectedStrategy);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl glass-panel rounded-3xl border border-yellow-500/30 shadow-2xl p-6 md:p-8 my-8 text-neutral-100">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-yellow-400/15 border border-yellow-400/40 text-yellow-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                Schedule Impact Analysis
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 font-black uppercase border border-yellow-400/40">
                  Conflict Detected
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Target: <span className="text-yellow-400 font-bold">{impact.target_title}</span>
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

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Left Column: Affected Tasks & Visual Impact Graph */}
          <div className="lg:col-span-6 space-y-4">
            {/* Impact Graph Visualization */}
            <div className="p-4 rounded-2xl bg-[#0c0c0f] border border-neutral-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Layers className="w-4 h-4 text-yellow-400" />
                  Dependency Cascade Graph
                </span>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {impact.graph_nodes.length} Affected Nodes
                </span>
              </div>

              {/* Node Diagram */}
              <div className="flex flex-col space-y-2 py-2">
                {impact.graph_nodes.map((node) => (
                  <div
                    key={node.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      node.status === 'changed'
                        ? 'bg-amber-400/[0.08] border-amber-400/30 text-amber-200'
                        : node.status === 'direct_impact'
                        ? 'bg-rose-500/[0.08] border-rose-500/30 text-rose-200'
                        : 'bg-yellow-400/[0.05] border-yellow-500/30 text-yellow-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          node.status === 'changed'
                            ? 'bg-amber-400'
                            : node.status === 'direct_impact'
                            ? 'bg-rose-500'
                            : 'bg-yellow-400'
                        }`}
                      />
                      <div>
                        <p className="font-bold text-white">{node.label}</p>
                        <p className="text-[10px] text-neutral-400">{node.detail}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                        node.status === 'changed'
                          ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                          : node.status === 'direct_impact'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40'
                      }`}
                    >
                      {node.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risks & Displacements Summary */}
            <div className="p-4 rounded-2xl bg-[#0c0c0f] border border-neutral-800 space-y-3">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                Detected Risks & Violations
              </h4>
              {impact.deadline_risks.length > 0 ? (
                impact.deadline_risks.map((risk, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-rose-500/[0.08] border border-rose-500/30 text-xs text-rose-200 flex items-start space-x-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">{risk.task_title}</p>
                      <p className="text-[11px] text-rose-300">{risk.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-yellow-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                  No immediate hard deadline breaches.
                </p>
              )}
            </div>
          </div>

          {/* Right Column: 3 Trade-off Engine Choices */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-yellow-400" />
                Select Trade-off Strategy
              </h3>
              <p className="text-xs text-neutral-400 mb-4">
                Replan engine will rebuild affected components using your strategy model.
              </p>

              <div className="space-y-3">
                {strategies.map((st) => {
                  const Icon = st.icon;
                  const isSelected = selectedStrategy === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => setSelectedStrategy(st.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-yellow-400/10 border-2 border-yellow-400 shadow-md shadow-yellow-400/15'
                          : 'bg-[#0a0a0d] border-neutral-800 hover:border-yellow-500/40 hover:bg-neutral-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2.5">
                          <div className={`p-2 rounded-xl ${isSelected ? 'bg-yellow-400 text-black' : 'bg-neutral-800 text-yellow-400'} shadow-xs`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-white text-sm">{st.title}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                          {st.tag}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 pl-9 leading-relaxed">
                        {st.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Execute Replan Action Bar */}
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyReplan}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black shadow-md shadow-yellow-400/20 flex items-center space-x-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Replan Schedule</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
