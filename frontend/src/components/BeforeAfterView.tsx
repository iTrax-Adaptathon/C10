import React from 'react';
import { ArrowRight, CheckCircle2, Clock, MoveRight, Shield, Sparkles, Zap, X } from 'lucide-react';
import { Task, HealthScore, Strategy } from '../types';

interface BeforeAfterViewProps {
  beforeTasks: Task[];
  afterTasks: Task[];
  healthScore: HealthScore;
  strategyUsed: Strategy;
  explanation: string;
  movedCount: number;
  onClose: () => void;
}

export const BeforeAfterView: React.FC<BeforeAfterViewProps> = ({
  beforeTasks,
  afterTasks,
  healthScore,
  strategyUsed,
  explanation,
  movedCount,
  onClose,
}) => {
  const taskIds = Array.from(new Set([...beforeTasks.map((t) => t.id), ...afterTasks.map((t) => t.id)]));
  const beforeMap = new Map(beforeTasks.map((t) => [t.id, t]));
  const afterMap = new Map(afterTasks.map((t) => [t.id, t]));

  return (
    <div className="glass-panel rounded-3xl border border-yellow-500/30 p-6 md:p-8 space-y-6 shadow-2xl transition-all">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-black uppercase tracking-wider border border-yellow-400/40">
              Replan Result
            </span>
            <span className="text-xs text-neutral-400 font-medium">
              Strategy: <span className="text-white font-bold capitalize">{strategyUsed.replace('_', ' ')}</span>
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-1.5">
            Schedule Adaptation Breakdown
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">{explanation}</p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="px-4 py-2 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
            <span className="text-[10px] text-neutral-400 block uppercase tracking-wider font-bold">
              Tasks Moved
            </span>
            <span className="text-lg font-bold text-amber-400">{movedCount}</span>
          </div>

          <div className="px-5 py-2.5 rounded-2xl bg-yellow-400 text-black text-center shadow-lg shadow-yellow-400/20 font-black">
            <span className="text-[10px] text-neutral-900 block uppercase tracking-wider font-bold">
              Health Score
            </span>
            <span className="text-xl font-black">{healthScore.overall}%</span>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold transition-colors border border-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-bold bg-[#0b0b0e]">
              <th className="py-3 px-4">Task Name</th>
              <th className="py-3 px-4">Original Schedule (Before)</th>
              <th className="py-3 px-4"></th>
              <th className="py-3 px-4">Adapted Schedule (After)</th>
              <th className="py-3 px-4 text-right">Status Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {taskIds.map((id) => {
              const b = beforeMap.get(id);
              const a = afterMap.get(id);
              const isMoved = b?.scheduled_start !== a?.scheduled_start || b?.scheduled_end !== a?.scheduled_end;

              return (
                <tr
                  key={id}
                  className={`transition-colors ${
                    isMoved
                      ? 'bg-amber-400/[0.08] hover:bg-amber-400/[0.12]'
                      : 'hover:bg-neutral-900/40'
                  }`}
                >
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {a?.title || b?.title}
                    {a?.is_split && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 font-bold">
                        Split Task
                      </span>
                    )}
                  </td>

                  {/* Before */}
                  <td className="py-3.5 px-4 text-neutral-400 font-mono">
                    {b?.scheduled_start ? (
                      <span>{b.scheduled_start} - {b.scheduled_end?.split(' ')[1]}</span>
                    ) : (
                      <span className="text-neutral-500 italic">Unscheduled</span>
                    )}
                  </td>

                  {/* Arrow */}
                  <td className="py-3.5 px-2 text-center text-neutral-400">
                    <MoveRight className={`w-4 h-4 ${isMoved ? 'text-amber-400' : 'text-neutral-600'}`} />
                  </td>

                  {/* After */}
                  <td className="py-3.5 px-4 font-mono">
                    {a?.scheduled_start ? (
                      <span className={isMoved ? 'text-amber-300 font-bold' : 'text-neutral-300'}>
                        {a.scheduled_start} - {a.scheduled_end?.split(' ')[1]}
                      </span>
                    ) : (
                      <span className="text-rose-400 font-medium">
                        {a?.unscheduled_reason || 'Unscheduled'}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-right">
                    {isMoved ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                        Shifted
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-neutral-900 text-neutral-400 border border-neutral-800">
                        Preserved
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
