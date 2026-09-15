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
  CheckCircle2,
  Target,
  Share2,
  SunMoon,
  Scale,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      title: 'Launch What-If Disruption Simulator',
      desc: 'Simulate emergency shocks, traffic delays, or meeting overruns',
      icon: Zap,
      tag: 'Chaos Lab',
      action: 'open_chaos_lab'
    },
    {
      title: 'Open Live Focus HUD & Pomodoro',
      desc: 'Enter distraction-free active task timer with +15m auto-replan',
      icon: Target,
      tag: 'Focus Mode',
      action: 'open_focus_mode'
    },
    {
      title: 'Sync & Export Schedule (.ICS / Markdown)',
      desc: 'Download RFC 5545 iCalendar or copy daily standup checklist',
      icon: Share2,
      tag: 'Export',
      action: 'open_export'
    },
    {
      title: 'Toggle Dark / Light Mode',
      desc: 'Switch between dark deep-space theme and crisp light theme',
      icon: SunMoon,
      tag: 'Theme',
      action: 'toggle_theme'
    },
    {
      title: 'Replan: Protect Deadlines',
      desc: 'Topologically minimize tardiness and pack schedule tightly',
      icon: ShieldCheck,
      tag: 'Strategy',
      action: 'replan_deadlines'
    },
    {
      title: 'Replan: Balance Workload',
      desc: 'Evenly distribute tasks to prevent cognitive overload & burnout',
      icon: Scale,
      tag: 'Strategy',
      action: 'replan_balanced'
    },
    {
      title: 'Replan: Protect Preferences',
      desc: 'Strictly satisfy preferred morning/evening time windows',
      icon: Sparkles,
      tag: 'Strategy',
      action: 'replan_preferences'
    },
    {
      title: 'Move Team Meeting to 8:00 PM',
      desc: 'Simulate evening meeting disruption and inspect ripple radar',
      icon: Clock,
      tag: 'Demo Impact',
      action: 'move_team_meeting'
    },
    {
      title: 'Reset Canonical Demo State',
      desc: 'Restore default events, tasks, and canonical schedule',
      icon: Sliders,
      tag: 'Reset',
      action: 'reset_demo'
    }
  ];

  const filteredPresets = query.trim()
    ? presets.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.desc.toLowerCase().includes(query.toLowerCase()) ||
          p.tag.toLowerCase().includes(query.toLowerCase())
      )
    : presets;

  const handleRunPreset = async (action: string) => {
    setIsProcessing(true);
    setStatusMsg('Executing command...');
    try {
      if (onCommandExecute) {
        await onCommandExecute(action);
      }
      setStatusMsg('Success! Executed.');
      setTimeout(() => {
        setStatusMsg(null);
        setIsProcessing(false);
        onClose();
      }, 400);
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
      }, 500);
    } catch (err) {
      setStatusMsg('Could not process command');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        className="w-full max-w-2xl glass-panel rounded-3xl border border-yellow-500/30 shadow-2xl overflow-hidden text-neutral-100"
      >
        {/* Input Bar Header */}
        <form
          onSubmit={handleNaturalQuerySubmit}
          className="relative flex items-center border-b border-neutral-800 px-5 py-4 bg-[#0a0a0d]"
        >
          <Sparkles className="w-5 h-5 text-yellow-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or natural language task (e.g. 'Finish report 90m high priority')..."
            className="w-full bg-transparent text-white placeholder-neutral-500 text-sm focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              type="submit"
              disabled={isProcessing}
              className="px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black rounded-xl text-xs transition-all shadow-sm shadow-yellow-400/20 flex items-center space-x-1 shrink-0 ml-2"
            >
              <span>Execute</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-2 p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </form>

        {/* Status Notification */}
        {statusMsg && (
          <div className="px-5 py-2.5 bg-yellow-400/10 border-b border-yellow-500/30 text-yellow-300 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
              <span>{statusMsg}</span>
            </div>
            {isProcessing && (
              <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        )}

        {/* Preset Suggestions List */}
        <div className="p-3 max-h-[60vh] overflow-y-auto space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
            <span>Actions & Presets</span>
            <span className="font-mono text-[10px] text-neutral-500">ESC to close</span>
          </div>

          {filteredPresets.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <button
                key={idx}
                onClick={() => handleRunPreset(preset.action)}
                disabled={isProcessing}
                className="w-full text-left p-3 rounded-2xl hover:bg-neutral-900/70 border border-transparent hover:border-yellow-500/30 transition-all group flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-yellow-400/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 group-hover:bg-yellow-400 group-hover:text-black transition-all">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-yellow-400 transition-colors">
                      {preset.title}
                    </p>
                    <p className="text-[11px] text-neutral-400">{preset.desc}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral-900 text-neutral-400 border border-neutral-800">
                    {preset.tag}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-yellow-400 transition-all" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="bg-[#0a0a0d] px-5 py-2.5 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center space-x-2">
            <Command className="w-3.5 h-3.5 text-yellow-400" />
            <span>Replan Adaptive Engine • Press ⌘K or Ctrl+K anytime</span>
          </div>
          <span>Navigation • Instant Solver</span>
        </div>
      </motion.div>
    </div>
  );
};
