import React from 'react';
import { Play, ArrowRight, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

interface GuidedDemoBannerProps {
  step: number;
  onNextStep: () => void;
  onReset: () => void;
  onClose: () => void;
}

export const GuidedDemoBanner: React.FC<GuidedDemoBannerProps> = ({
  step,
  onNextStep,
  onReset,
  onClose,
}) => {
  const steps = [
    {
      title: 'Step 1: Generate Schedule',
      instruction: 'Initial schedule created: College (9–4 PM), Team Meeting (6–7 PM), Research (1h), Electronics Assignment (2h, due tomorrow).',
      actionText: 'Move Team Meeting (6-7 PM -> 8-9 PM)',
    },
    {
      title: 'Step 2: Conflict Triggered',
      instruction: 'Team Meeting has been moved to 8:00 PM – 9:00 PM. Notice the schedule conflict with Electronics Assignment!',
      actionText: 'Analyze Impact',
    },
    {
      title: 'Step 3: Impact Graph & Panel',
      instruction: 'Review direct overlaps (Electronics Assignment) & indirect dependency cascade (Submit Assignment).',
      actionText: 'Select "Protect Deadlines" Strategy',
    },
    {
      title: 'Step 4: Replan & Compare',
      instruction: 'The engine replanned only affected items while preserving College & Research. Review Before vs After!',
      actionText: 'Complete Guided Demo',
    },
  ];

  const currentStepInfo = steps[Math.min(step, steps.length - 1)];

  return (
    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/40 shadow-xl shadow-blue-950/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start space-x-3">
        <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 shrink-0">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white uppercase">
              Guided Demo Flow
            </span>
            <span className="text-xs font-semibold text-blue-300">
              {currentStepInfo.title} ({step + 1}/4)
            </span>
          </div>
          <p className="text-xs text-slate-200 mt-1 max-w-2xl leading-relaxed">
            {currentStepInfo.instruction}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
        <button
          onClick={onReset}
          className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center space-x-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        {step < 3 ? (
          <button
            onClick={onNextStep}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center space-x-1.5 transition-all"
          >
            <span>{currentStepInfo.actionText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finish Walkthrough</span>
          </button>
        )}
      </div>
    </div>
  );
};
