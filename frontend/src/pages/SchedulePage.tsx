import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  X,
  Save,
  RefreshCw,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Layers,
  Filter
} from 'lucide-react';
import { api } from '../api/client';
import { Task, Event, PreferredTime, Priority } from '../types';
import { useToast } from '../context/ToastContext';

export const SchedulePage: React.FC = () => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Day filter: 0 = Today, 1 = Tomorrow, 2 = Day After
  const [dayOffset, setDayOffset] = useState<number>(0);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Quick Add for specific hour slot state
  const [activeHourSlot, setActiveHourSlot] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState(60);
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [savingTask, setSavingTask] = useState(false);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await api.generateSchedule();
      setTasks(res.scheduled_tasks);
      setEvents(res.events);
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const getTargetDate = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  const selectedDateStr = getTargetDate(dayOffset);

  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM

  const openAddTaskForHour = (h: number) => {
    setActiveHourSlot(h);
    setNewTaskTitle('');
    setNewTaskDuration(60);
    setNewTaskPriority('medium');
  };

  const handleCreateTaskForTimeline = async (e: React.FormEvent, h: number) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setSavingTask(true);
    try {
      const prefTime: PreferredTime = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';

      await api.createTask({
        title: newTaskTitle,
        duration: Number(newTaskDuration),
        deadline: `${selectedDateStr} 22:00`,
        priority: newTaskPriority,
        flexible: true,
        preferred_time: prefTime,
        optional: false,
        dependencies: [],
      });

      setActiveHourSlot(null);
      setNewTaskTitle('');
      toast('Task Added!', `"${newTaskTitle}" scheduled for ${selectedDateStr}.`, 'success');
      await fetchSchedule();
    } catch (err) {
      console.error('Failed to create task:', err);
      toast('Error', 'Failed to schedule task.', 'warning');
    } finally {
      setSavingTask(false);
    }
  };

  // Day label
  const dayLabel = dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Tomorrow' : `+${dayOffset} Days`;

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <CalendarIcon className="w-7 h-7 text-yellow-400" />
              Interactive Calendar Timeline
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Visual interval distribution for deterministic tasks & fixed commitments. Click any empty slot to schedule.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Day Selector Buttons */}
          <div className="flex items-center p-1 rounded-2xl glass-panel border border-yellow-500/20 text-xs font-bold">
            <button
              onClick={() => setDayOffset(0)}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                dayOffset === 0
                  ? 'bg-yellow-400 text-black font-black shadow-md shadow-yellow-400/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDayOffset(1)}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                dayOffset === 1
                  ? 'bg-yellow-400 text-black font-black shadow-md shadow-yellow-400/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Tomorrow
            </button>
            <button
              onClick={() => setDayOffset(2)}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                dayOffset === 2
                  ? 'bg-yellow-400 text-black font-black shadow-md shadow-yellow-400/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Day +2
            </button>
          </div>

          <button
            onClick={fetchSchedule}
            disabled={loading}
            className="p-2 rounded-2xl glass-panel border border-yellow-500/20 text-neutral-300 hover:text-yellow-400 transition-all shadow-xs"
            title="Refresh Schedule"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hourly Timeline Grid */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-yellow-500/20 shadow-xl space-y-4">
        {/* Timeline Header Subbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {dayLabel} ({selectedDateStr}) • 08:00 - 22:00 Timeline
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-yellow-400/10 text-yellow-400 border border-yellow-500/30 font-bold">
              15 Hours Range
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-neutral-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-neutral-600" /> Fixed Event
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-sm shadow-yellow-400/50" /> Scheduled Task
            </span>
          </div>
        </div>

        {/* Hourly Slot Rows */}
        <div className="space-y-3 pt-2">
          {hours.map((h) => {
            const timeStr = `${h < 10 ? '0' : ''}${h}:00`;
            const displayTime = h === 12 ? '12:00 PM' : h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`;

            // Time Window Category
            const timeWindow = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';

            // Find events starting in this hour for selected date
            const matchingEvts = events.filter((e) => {
              const parts = e.start.split(' ');
              const datePart = parts[0];
              const st = parts[1];
              const matchesDate = !datePart || datePart === selectedDateStr;
              return matchesDate && st && st.startsWith(`${h < 10 ? '0' : ''}${h}`);
            });

            // Find tasks starting in this hour for selected date
            const matchingTasks = tasks.filter((t) => {
              const parts = t.scheduled_start?.split(' ') || [];
              const datePart = parts[0];
              const st = parts[1];
              const matchesDate = !datePart || datePart === selectedDateStr;
              return matchesDate && st && st.startsWith(`${h < 10 ? '0' : ''}${h}`);
            });

            const isAddingSlot = activeHourSlot === h;
            const isEmptySlot = matchingEvts.length === 0 && matchingTasks.length === 0;

            return (
              <div
                key={h}
                className="group border-b border-neutral-800/60 pb-3 pt-1 hover:border-yellow-500/30 transition-colors"
              >
                <div className="flex items-start space-x-4">
                  {/* Hour Indicator */}
                  <div className="w-20 text-xs font-mono font-bold text-neutral-400 shrink-0 mt-2">
                    <span className="text-yellow-400 font-extrabold">{timeStr}</span>
                    <span className="block text-[10px] text-neutral-400 font-sans font-medium">
                      {displayTime}
                    </span>
                    <span className="text-[9px] font-semibold text-neutral-500 block uppercase">
                      {timeWindow}
                    </span>
                  </div>

                  {/* Slot Items */}
                  <div className="flex-1 space-y-2 min-h-[44px]">
                    {/* Render Events */}
                    {matchingEvts.map((e) => (
                      <div
                        key={e.id}
                        className="p-3.5 rounded-2xl bg-[#0d0d10] border border-neutral-800 text-xs font-semibold text-white flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-8 rounded-full bg-neutral-600 shrink-0" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white text-xs">{e.title}</span>
                              <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-700 font-medium">
                                Fixed Commitment
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-400 font-mono mt-0.5 block">
                              {e.start.split(' ')[1]} - {e.end.split(' ')[1]}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-neutral-400 px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800">
                          Locked
                        </span>
                      </div>
                    ))}

                    {/* Render Tasks */}
                    {matchingTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-2xl bg-yellow-400/[0.04] border border-yellow-500/30 text-xs font-semibold text-white flex items-center justify-between shadow-sm hover:border-yellow-400/60 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-2 h-8 rounded-full shrink-0 ${
                              t.priority === 'high'
                                ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                                : t.priority === 'medium'
                                ? 'bg-yellow-400 shadow-sm shadow-yellow-400/50'
                                : 'bg-neutral-500'
                            }`}
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white text-xs">{t.title}</span>
                              <span
                                className={`text-[9px] uppercase px-2 py-0.5 rounded-md font-extrabold ${
                                  t.priority === 'high'
                                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                    : t.priority === 'medium'
                                    ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
                                    : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                                }`}
                              >
                                {t.priority}
                              </span>
                              {t.is_split && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 font-bold">
                                  Split
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-neutral-400 font-mono mt-0.5 block">
                              {t.scheduled_start?.split(' ')[1]} - {t.scheduled_end?.split(' ')[1]} ({t.duration}m)
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-neutral-400 font-mono block">
                            Due: {t.deadline.split(' ')[1] || t.deadline}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Inline Task Quick-Creator when active */}
                    {isAddingSlot && (
                      <form
                        onSubmit={(e) => handleCreateTaskForTimeline(e, h)}
                        className="p-4 rounded-2xl bg-[#0e0e12] border border-yellow-400/40 space-y-3 animate-in fade-in duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-yellow-400">
                            Schedule Task at {timeStr}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveHourSlot(null)}
                            className="text-neutral-400 hover:text-white p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Task title (e.g. Physics Revision)..."
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            className="sm:col-span-2 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-yellow-400 placeholder:text-neutral-500"
                            autoFocus
                          />
                          <select
                            value={newTaskDuration}
                            onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                            className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-yellow-400"
                          >
                            <option value={30}>30 mins</option>
                            <option value={45}>45 mins</option>
                            <option value={60}>60 mins (1h)</option>
                            <option value={90}>90 mins (1.5h)</option>
                            <option value={120}>120 mins (2h)</option>
                          </select>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setActiveHourSlot(null)}
                            className="px-3 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={savingTask || !newTaskTitle.trim()}
                            className="px-4 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black shadow-md shadow-yellow-400/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Slot</span>
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Empty Slot Placeholder with Quick-Add trigger */}
                    {isEmptySlot && !isAddingSlot && (
                      <div
                        onClick={() => openAddTaskForHour(h)}
                        className="h-10 rounded-2xl border border-dashed border-neutral-800 hover:border-yellow-500/40 flex items-center justify-between px-3 text-neutral-500 hover:text-yellow-400 hover:bg-yellow-400/5 transition-all cursor-pointer"
                      >
                        <span className="text-[11px] font-medium">Free Interval</span>
                        <span className="text-[10px] font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-3 h-3 text-yellow-400" /> Book Slot
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
