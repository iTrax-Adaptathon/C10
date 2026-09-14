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
      color: 'from-indigo-600 to-purple-600',
      borderColor: 'border-indigo-500',
      glow: 'glow-indigo',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-8 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Schedule Impact Analysis
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase border border-amber-200">
                  Conflict Detected
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Target: <span className="text-indigo-700 font-semibold">{impact.target_title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Left Column: Affected Tasks & Visual Impact Graph */}
          <div className="lg:col-span-6 space-y-4">
            {/* Impact Graph Visualization */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Dependency Cascade Graph
                </span>
                <span className="text-[11px] text-slate-500">
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
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : node.status === 'direct_impact'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          node.status === 'changed'
                            ? 'bg-amber-500'
                            : node.status === 'direct_impact'
                            ? 'bg-rose-500'
                            : 'bg-indigo-500'
                        }`}
                      />
                      <div>
                        <p className="font-semibold text-slate-900">{node.label}</p>
                        <p className="text-[10px] text-slate-500">{node.detail}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        node.status === 'changed'
                          ? 'bg-amber-100 text-amber-800'
                          : node.status === 'direct_impact'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {node.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risks & Displacements Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-rose-600" />
                Detected Risks & Violations
              </h4>
              {impact.deadline_risks.length > 0 ? (
                impact.deadline_risks.map((risk, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start space-x-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-950">{risk.task_title}</p>
                      <p className="text-[11px] text-rose-800">{risk.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  No immediate hard deadline breaches.
                </p>
              )}
            </div>
          </div>

          {/* Right Column: 3 Trade-off Engine Choices */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-indigo-600" />
                Select Trade-off Strategy
              </h3>
              <p className="text-xs text-slate-500 mb-4">
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
                          ? 'bg-indigo-50/70 border-2 border-indigo-600 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-900 text-sm">{st.title}</span>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {st.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 pl-9 leading-relaxed">
                        {st.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Execute Replan Action Bar */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyReplan}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center space-x-2 transition-all"
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
