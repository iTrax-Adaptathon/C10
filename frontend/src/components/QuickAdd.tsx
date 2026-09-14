import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Clock, AlertCircle, ArrowRight, Tag, Zap } from 'lucide-react';
import { api } from '../api/client';
import { Task } from '../types';

interface QuickAddProps {
  onTaskCreated: () => void;
}

export const QuickAdd: React.FC<QuickAddProps> = ({ onTaskCreated }) => {
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
    'Gym session 60m optional'
  ];

  // Debounce parsing preview
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
    }, 400);

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

      setInputText('');
      setParsedPreview(null);
      onTaskCreated();
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
      <form onSubmit={handleSubmit} className="relative z-10">
        <div className="flex items-center space-x-2 bg-slate-50 rounded-xl px-3.5 py-2 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder='Quick Add: "Finish report 90m high priority due tomorrow"...'
            className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSubmitting}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1 transition-all shrink-0 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </form>

      {/* Preset suggestions chips */}
      {!parsedPreview && !inputText && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
          <span className="text-slate-400 flex items-center">
            <Zap className="w-3 h-3 text-indigo-600 mr-1" />
            Try:
          </span>
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputText(prompt)}
              className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-700 transition-colors text-[10px]"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Live Parsed Preview Badge */}
      {parsedPreview && (
        <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-indigo-950">
            <span className="font-bold text-indigo-900">{parsedPreview.title}</span>
            <span className="text-indigo-300">•</span>
            <span className="flex items-center text-slate-600">
              <Clock className="w-3.5 h-3.5 mr-1 text-indigo-600" />
              {parsedPreview.duration}m
            </span>
            <span className="text-indigo-300">•</span>
            <span className="text-slate-600">Due: {parsedPreview.deadline}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${parsedPreview.priority === 'high'
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : parsedPreview.priority === 'medium'
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
            >
              {parsedPreview.priority}
            </span>
            {parsedPreview.optional && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700 font-medium border border-slate-300">
                Optional
              </span>
            )}
            <span className="text-indigo-600 text-[11px] font-semibold flex items-center ml-1">
              Press Enter <ArrowRight className="w-3 h-3 ml-1" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

