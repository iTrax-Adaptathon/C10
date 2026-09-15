import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Zap,
  X,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ChevronRight,
  Flame,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../types';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

interface FocusModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onTaskUpdated: () => void;
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onTaskUpdated
}) => {
  const { toast } = useToast();

  // Find active or first scheduled/pending task
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // default 25 min in seconds
  const [totalTime, setTotalTime] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isReplanning, setIsReplanning] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // Initialize selected task
  useEffect(() => {
    if (tasks.length > 0 && !selectedTaskId) {
      const scheduled = tasks.find((t) => t.status === 'scheduled' || t.status === 'pending');
      if (scheduled) {
        setSelectedTaskId(scheduled.id);
        const durationSec = Math.max((scheduled.duration || 25) * 60, 60);
        setTimeLeft(durationSec);
        setTotalTime(durationSec);
      }
    }
  }, [tasks, selectedTaskId]);

  const activeTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setShowCelebration(true);
      toast('Focus Session Complete! 🎉', `Great job working on ${activeTask?.title || 'your task'}.`, 'success');
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, activeTask, toast]);

  if (!isOpen) return null;

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    const target = tasks.find((t) => t.id === taskId);
    if (target) {
      const durationSec = Math.max((target.duration || 25) * 60, 60);
      setTimeLeft(durationSec);
      setTotalTime(durationSec);
      setIsRunning(false);
      setShowCelebration(false);
    }
  };

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setTimeLeft(totalTime);
  };

  // "Running Late" (+15 mins) Dynamic Micro-Replan
  const handleExtendAndReplan = async (addedMins: number) => {
    if (!activeTask) return;
    setIsReplanning(true);
    try {
      const updatedDuration = activeTask.duration + addedMins;
      await api.updateTask({
        ...activeTask,
        duration: updatedDuration
      });

      // Add to current timer
      setTimeLeft((prev) => prev + addedMins * 60);
      setTotalTime((prev) => prev + addedMins * 60);

      // Trigger automatic micro-replan of all subsequent tasks
      await api.replanSchedule('protect_deadlines');

      toast(
        `+${addedMins}m Added & Auto-Replanned!`,
        `Subsequent tasks shifted forward to maintain deadline safety.`,
        'replan'
      );
      onTaskUpdated();
    } catch (err) {
      console.error('Micro-replan failed:', err);
      toast('Could not re-schedule', 'Failed to auto-shift schedule.', 'warning');
    } finally {
      setIsReplanning(false);
    }
  };

  // Mark task completed
  const handleMarkCompleted = async () => {
    if (!activeTask) return;
    try {
      await api.updateTask({
        ...activeTask,
        status: 'completed'
      });
      setShowCelebration(true);
      setIsRunning(false);

      // Replan remaining tasks to compact calendar
      await api.replanSchedule('protect_deadlines');

      toast('Task Completed! 🎉', `Marked "${activeTask.title}" as complete. Calendar compacted!`, 'success');
      onTaskUpdated();

      setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
    } catch (err) {
      console.error('Mark completed failed:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
  const strokeDashoffset = 565.48 * (1 - progress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="relative w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-yellow-500/25 text-neutral-100 flex flex-col items-center"
      >
        {/* Top Controls */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-yellow-400">
              Live Focus HUD
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Task Selector */}
        <div className="w-full mt-4">
          <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block mb-1.5">
            Active Task in Focus
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => handleSelectTask(e.target.value)}
            className="w-full py-2.5 px-3.5 rounded-xl bg-black border border-neutral-800 text-xs font-bold text-white focus:border-yellow-400 focus:outline-none transition-colors"
          >
            {tasks
              .filter((t) => t.status !== 'completed')
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.duration}m) - Due {t.deadline.split(' ')[1] || t.deadline}
                </option>
              ))}
          </select>
        </div>

        {/* Circular Countdown Gauge */}
        <div className="relative my-8 flex items-center justify-center">
          <svg className="w-64 h-64 transform -rotate-90">
            {/* Background Track */}
            <circle
              cx="128"
              cy="128"
              r="90"
              className="text-neutral-900"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="128"
              cy="128"
              r="90"
              className="text-yellow-400 transition-all duration-500 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]"
              strokeWidth="10"
              strokeDasharray={565.48}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Time Display Centered */}
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-yellow-400 drop-shadow-md">
              {formatTime(timeLeft)}
            </span>
            <span className="text-xs text-neutral-400 font-medium mt-1">
              {isRunning ? 'Deep Work In Progress' : 'Paused / Ready'}
            </span>
            {activeTask && (
              <span className="px-2.5 py-1 rounded-md bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 text-[10px] font-bold mt-2 max-w-[180px] truncate">
                {activeTask.title}
              </span>
            )}
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleResetTimer}
            className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all shadow-sm border border-neutral-800"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={handleToggleTimer}
            className="px-8 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm flex items-center gap-2.5 shadow-xl shadow-yellow-400/25 transition-all hover:scale-105 active:scale-95"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>Pause Focus</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current ml-0.5" />
                <span>Start Focus</span>
              </>
            )}
          </button>

          <button
            onClick={handleMarkCompleted}
            className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-yellow-400 border border-yellow-400/30 hover:border-yellow-400 transition-all shadow-sm"
            title="Mark Complete"
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
        </div>

        {/* Running Late Micro-Replan Bar */}
        <div className="w-full mt-8 p-4 rounded-2xl bg-black border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="space-y-0.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-yellow-400 font-bold text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>Running Behind Schedule?</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Add time and automatically shift subsequent tasks forward.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExtendAndReplan(15)}
              disabled={isReplanning}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-black text-yellow-400 border border-yellow-400/30 flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>+15m Replan</span>
            </button>
            <button
              onClick={() => handleExtendAndReplan(30)}
              disabled={isReplanning}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-black text-yellow-400 border border-yellow-400/30 flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>+30m Replan</span>
            </button>
          </div>
        </div>

        {/* Celebration Overlay */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 rounded-3xl bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-10"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4 shadow-xl shadow-emerald-500/20">
                <Sparkles className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className="text-2xl font-bold text-white">Focus Session Crushed!</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6">
                Your schedule was dynamically compacted and upcoming tasks are ready.
              </p>
              <button
                onClick={() => setShowCelebration(false)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
              >
                Continue Flow
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
