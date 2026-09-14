import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Command,
  Search,
  Zap,
  Clock,
  Calendar,
  AlertCircle,
  ArrowRight,
  X,
  Sliders,
  CheckCircle2
} from 'lucide-react';

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  onCommandExecute?: (action: string, payload?: any) => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  isOpen,
  onClose,
  onCommandExecute
}) => {
  const [query, setQuery] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const presets = [
    {
      title: 'Move Team Meeting to 8:00 PM',
      desc: 'Simulate evening meeting delay & trigger impact radar',
      icon: Clock,
      tag: 'Demo Impact',
      action: 'move_team_meeting'
    },
    {
      title: 'Apply Balanced Strategy',
      desc: 'Replan schedule optimizing for 85%+ health score',
      icon: Zap,
      tag: 'Auto Replan',
      action: 'replan_balanced'
    },
    {
      title: 'Protect 2-Hour Deep Work Block',
      desc: 'Schedule focus time during peak productivity window',
      icon: Sparkles,
      tag: 'Deep Work',
      action: 'protect_deep_work'
    },
    {
      title: 'Reset Canonical Demo State',
      desc: 'Restore default events, tasks, and initial timeline',
      icon: Sliders,
      tag: 'Reset',
      action: 'reset_demo'
    }
  ];

  const handleRunPreset = async (action: string) => {
    setIsProcessing(true);
    setStatusMsg('Executing command...');
    try {
      if (onCommandExecute) {
        await onCommandExecute(action);
      }
      setStatusMsg('Success! Schedule updated.');
      setTimeout(() => {
        setStatusMsg(null);
        setIsProcessing(false);
        onClose();
      }, 600);
    } catch (err) {
      setStatusMsg('Command execution failed');
      setIsProcessing(false);
    }
  };

  const handleNaturalQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsProcessing(true);
    setStatusMsg(`Processing NLP Intent: "${query}"...`);

    try {
      if (onCommandExecute) {
        await onCommandExecute('nlp_command', query);
      }
      setStatusMsg('Parsed & applied!');
      setTimeout(() => {
        setQuery('');
        setStatusMsg(null);
        setIsProcessing(false);
        onClose();
      }, 700);
    } catch (err) {
      setStatusMsg('Could not process command');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Input Bar Header */}
        <form onSubmit={handleNaturalQuerySubmit} className="relative flex items-center border-b border-slate-200 px-4 py-3 bg-slate-50/50">
          <Sparkles className="w-5 h-5 text-indigo-600 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command e.g. 'Push team meeting by 2 hours'..."
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-sm focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              type="submit"
              disabled={isProcessing}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-all shadow-xs flex items-center space-x-1"
            >
              <span>Execute</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </form>

        {/* Status Notification */}
        {statusMsg && (
          <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 text-indigo-700 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>{statusMsg}</span>
            </div>
            {isProcessing && <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />}
          </div>
        )}

        {/* Preset Suggestions List */}
        <div className="p-3 max-h-96 overflow-y-auto space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Quick Commands & Presets</span>
            <span className="text-[10px] text-slate-400 font-mono">Press ESC to dismiss</span>
          </div>

          {presets.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <button
                key={idx}
                onClick={() => handleRunPreset(preset.action)}
                disabled={isProcessing}
                className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {preset.title}
                    </p>
                    <p className="text-[11px] text-slate-500">{preset.desc}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    {preset.tag}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-all" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-2">
            <Command className="w-3.5 h-3.5 text-slate-400" />
            <span>Smart Replan Engine • Deterministic NLP Parser</span>
          </div>
          <span>Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-white text-slate-600 font-mono text-[10px] border border-slate-200 shadow-xs">Ctrl + K</kbd></span>
        </div>
      </div>
    </div>
  );
};
