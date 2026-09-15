import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Clock, AlertCircle, ArrowRight, Tag, Zap, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { Task } from '../types';
import { useToast } from '../context/ToastContext';

interface QuickAddProps {
  onTaskCreated: () => void;
}

export const QuickAdd: React.FC<QuickAddProps> = ({ onTaskCreated }) => {
  const { toast } = useToast();
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<{
    title: string;
    duration: number;
    deadline: string;
    priority: 'low' | 'medium' | 'high';
    preferred_time: string;
    optional: boolean;
  } | null>(null);

  const samplePrompts = [
    'Finish electronics assignment for 2 hours before 6pm tomorrow',
    'Write weekly report high priority 45m',
    'Gym session 60m evening optional'
  ];

  useEffect(() => {
    if (!inputText.trim() || inputText.length < 5) {
      setParsedPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsParsing(true);
      try {
        const res = await api.parseTask(inputText);
        setParsedPreview(res);
      } catch (err) {
        console.warn('NLP parsing fallback error', err);
      } finally {
        setIsParsing(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [inputText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSubmitting(true);
    try {
      let taskData = parsedPreview;
      if (!taskData) {
        taskData = await api.parseTask(inputText);
      }

      await api.createTask({
        title: taskData.title,
        duration: taskData.duration,
        deadline: taskData.deadline,
        priority: taskData.priority,
        flexible: true,
        preferred_time: taskData.preferred_time as any,
        optional: taskData.optional,
        dependencies: [],
      });

      toast('Task Scheduled!', `"${taskData.title}" placed into calendar.`, 'success');
      setInputText('');
      setParsedPreview(null);
      onTaskCreated();
    } catch (err) {
      console.error('Failed to create task:', err);
      toast('Failed to create task', 'Please try again.', 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-3xl relative overflow-hidden transition-all shadow-xl border border-yellow-500/20">
      <form onSubmit={handleSubmit} className="relative z-10">
        <div className="flex items-center space-x-2.5 bg-black/90 rounded-2xl px-4 py-3 border border-neutral-800 focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-400/25 transition-all">
          {isParsing ? (
            <Loader2 className="w-4 h-4 text-yellow-400 animate-spin shrink-0" />
          ) : (
            <Zap className="w-4 h-4 text-yellow-400 fill-current shrink-0" />
          )}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder='NLP Quick Add: e.g. "Prepare presentation for 90m high priority due tomorrow 5pm"...'
            className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none font-medium"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSubmitting}
            className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black text-xs font-black flex items-center space-x-1.5 transition-all shrink-0 shadow-md shadow-yellow-400/25 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Task</span>
          </button>
        </div>
      </form>

      {/* Preset suggestions chips */}
      {!parsedPreview && !inputText && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400">
          <span className="text-yellow-400 flex items-center text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-yellow-400 mr-1" />
            Try NLP:
          </span>
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputText(prompt)}
              className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-yellow-400/60 text-neutral-300 hover:text-yellow-300 transition-all text-[11px]"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Live Parsed Preview Badge */}
      {parsedPreview && (
        <div className="mt-3 px-4 py-3 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex flex-wrap items-center justify-between gap-2.5 text-xs animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center gap-2 text-neutral-100">
            <span className="font-bold text-yellow-300">{parsedPreview.title}</span>
            <span className="text-neutral-600">•</span>
            <span className="flex items-center text-neutral-300 font-mono">
              <Clock className="w-3.5 h-3.5 mr-1 text-yellow-400" />
              {parsedPreview.duration}m
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-300 font-mono text-[11px]">Due: {parsedPreview.deadline}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                parsedPreview.priority === 'high'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : parsedPreview.priority === 'medium'
                  ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {parsedPreview.priority}
            </span>
            {parsedPreview.optional && (
              <span className="px-2 py-0.5 rounded-md text-[10px] bg-neutral-800 text-neutral-300 font-medium border border-neutral-700">
                Optional
              </span>
            )}
            <span className="text-yellow-400 text-[11px] font-bold flex items-center ml-1">
              Press Enter <ArrowRight className="w-3 h-3 ml-1" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
