import React from 'react';
import { ArrowRight, CheckCircle2, Clock, MoveRight, Shield, Sparkles, Zap } from 'lucide-react';
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
  // Map tasks for side-by-side view
  const taskIds = Array.from(new Set([...beforeTasks.map((t) => t.id), ...afterTasks.map((t) => t.id)]));

  const beforeMap = new Map(beforeTasks.map((t) => [t.id, t]));
  const afterMap = new Map(afterTasks.map((t) => [t.id, t]));

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider border border-indigo-200">
              Replan Result
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Strategy: <span className="text-slate-900 font-bold capitalize">{strategyUsed.replace('_', ' ')}</span>
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Schedule Adaptation Breakdown
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">{explanation}</p>
        </div>

        <div className="flex items-center space-x-4 shrink-0">
          <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">
              Tasks Moved
            </span>
            <span className="text-lg font-bold text-amber-700">{movedCount}</span>
          </div>

          <div className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-center shadow-xs">
            <span className="text-[10px] text-indigo-100 block uppercase tracking-wider font-bold">
              Health Score
            </span>
            <span className="text-xl font-bold">{healthScore.overall}%</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
          >
            Done
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold bg-slate-50">
              <th className="py-3 px-4">Task Name</th>
              <th className="py-3 px-4">Original Schedule (Before)</th>
              <th className="py-3 px-4"></th>
              <th className="py-3 px-4">Adapted Schedule (After)</th>
              <th className="py-3 px-4 text-right">Status Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {taskIds.map((id) => {
              const b = beforeMap.get(id);
              const a = afterMap.get(id);
              const isMoved = b?.scheduled_start !== a?.scheduled_start || b?.scheduled_end !== a?.scheduled_end;

              return (
                <tr
                  key={id}
                  className={`transition-colors ${
                    isMoved ? 'bg-amber-50/70 hover:bg-amber-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {a?.title || b?.title}
                    {a?.is_split && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-800 border border-purple-200 font-medium">
                        Split Task
                      </span>
                    )}
                  </td>

                  {/* Before */}
                  <td className="py-3.5 px-4 text-slate-500 font-mono">
                    {b?.scheduled_start ? (
                      <span>{b.scheduled_start} - {b.scheduled_end?.split(' ')[1]}</span>
                    ) : (
                      <span className="text-slate-400 italic">Unscheduled</span>
                    )}
                  </td>

                  {/* Arrow */}
                  <td className="py-3.5 px-2 text-center text-slate-400">
                    <MoveRight className={`w-4 h-4 ${isMoved ? 'text-amber-600' : ''}`} />
                  </td>

                  {/* After */}
                  <td className="py-3.5 px-4 font-mono">
                    {a?.scheduled_start ? (
                      <span className={isMoved ? 'text-amber-800 font-bold' : 'text-slate-700'}>
                        {a.scheduled_start} - {a.scheduled_end?.split(' ')[1]}
                      </span>
                    ) : (
                      <span className="text-rose-600 font-medium">
                        {a?.unscheduled_reason || 'Unscheduled'}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-right">
                    {isMoved ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Shifted
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
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

