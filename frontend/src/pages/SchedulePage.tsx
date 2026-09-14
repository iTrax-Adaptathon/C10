import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, X, Save, RefreshCw, Check } from 'lucide-react';
import { api } from '../api/client';
import { Task, Event, PreferredTime, Priority } from '../types';

export const SchedulePage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM

  const openAddTaskForHour = (h: number) => {
    setActiveHourSlot(h);
    setNewTaskTitle('');
    setNewTaskDuration(60);
    setNewTaskPriority('medium');
    setSuccessMsg(null);
  };

  const handleCreateTaskForTimeline = async (e: React.FormEvent, h: number) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setSavingTask(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const timeStr = `${h < 10 ? '0' : ''}${h}:00`;
      
      const prefTime: PreferredTime = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';

      await api.createTask({
        title: newTaskTitle,
        duration: Number(newTaskDuration),
        deadline: `${todayStr} 22:00`,
        priority: newTaskPriority,
        flexible: true,
        preferred_time: prefTime,
        optional: false,
        dependencies: [],
      });

      setActiveHourSlot(null);
      setNewTaskTitle('');
      setSuccessMsg(`Task "${newTaskTitle}" created & placed into schedule!`);
      await fetchSchedule();
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setSavingTask(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-indigo-600" />
            Schedule & Calendar View
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visual hourly interval allocation for fixed events and flexible tasks. Click any hour slot to add a task directly.
          </p>
        </div>
        <button
          onClick={fetchSchedule}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-xs shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Timeline</span>
        </button>
      </div>

      {successMsg && (
        <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Hourly Timeline Grid */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Today's Hour-by-Hour Timeline Grid (08:00 - 22:00)
          </span>
          <span className="text-[11px] text-slate-500">
            Hover or click <span className="font-semibold text-indigo-600">+ Add Task</span> on any slot
          </span>
        </div>

        <div className="space-y-3">
          {hours.map((h) => {
            const timeStr = `${h < 10 ? '0' : ''}${h}:00`;
            const displayTime = h === 12 ? '12:00 PM' : h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`;

            // Find events starting in this hour
            const matchingEvts = events.filter((e) => {
              const st = e.start.split(' ')[1];
              return st && st.startsWith(`${h < 10 ? '0' : ''}${h}`);
            });

            // Find tasks starting in this hour
            const matchingTasks = tasks.filter((t) => {
              const st = t.scheduled_start?.split(' ')[1];
              return st && st.startsWith(`${h < 10 ? '0' : ''}${h}`);
            });

            const isAddingSlot = activeHourSlot === h;

            return (
              <div key={h} className="group border-b border-slate-100/90 pb-3 pt-1">
                <div className="flex items-start space-x-4">
                  <div className="w-20 text-xs font-mono font-bold text-slate-500 shrink-0 mt-2">
                    {timeStr}
                    <span className="block text-[10px] text-slate-400 font-sans font-medium">{displayTime}</span>
                  </div>

                  <div className="flex-1 space-y-2 min-h-[44px]">
                    {matchingEvts.map((e) => (
                      <div
                        key={e.id}
                        className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-900 flex items-center justify-between shadow-2xs"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                          <span>{e.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-600 font-mono">
                          {e.start.split(' ')[1]} - {e.end.split(' ')[1]} (Fixed Constraint)
                        </span>
                      </div>
                    ))}

                    {matchingTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs font-semibold text-indigo-950 flex items-center justify-between shadow-2xs"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                          <span>{t.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-white text-indigo-700 border border-indigo-200">
                            {t.priority}
                          </span>
                          <span className="text-[10px] text-indigo-700 font-mono">
                            {t.scheduled_start?.split(' ')[1]} - {t.scheduled_end?.split(' ')[1]} ({t.duration}m)
                          </span>
                        </div>
                      </div>
                    ))}

                    {matchingEvts.length === 0 && matchingTasks.length === 0 && !isAddingSlot && (
                      <div className="flex items-center justify-between py-1 px-3 rounded-xl bg-slate-50/50 border border-dashed border-slate-200/80 text-xs text-slate-400">
                        <span>Free Time Window</span>
                        <button
                          type="button"
                          onClick={() => openAddTaskForHour(h)}
                          className="opacity-80 group-hover:opacity-100 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Task at {timeStr}</span>
                        </button>
                      </div>
                    )}

                    {matchingEvts.length > 0 || matchingTasks.length > 0 ? (
                      !isAddingSlot && (
                        <div className="flex justify-end pt-0.5">
                          <button
                            type="button"
                            onClick={() => openAddTaskForHour(h)}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add task into {timeStr} slot</span>
                          </button>
                        </div>
                      )
                    ) : null}

                    {/* Inline Task Creation Form for this hour */}
                    {isAddingSlot && (
                      <form
                        onSubmit={(e) => handleCreateTaskForTimeline(e, h)}
                        className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-200 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-900 uppercase">
                            Add Task into {timeStr} Timeline Slot
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveHourSlot(null)}
                            className="text-slate-400 hover:text-slate-600 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <input
                            type="text"
                            required
                            placeholder="Task Title (e.g. Study Physics)"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                          />
                          <select
                            value={newTaskDuration}
                            onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                          >
                            <option value={30}>30 minutes</option>
                            <option value={60}>60 minutes (1 hr)</option>
                            <option value={90}>90 minutes (1.5 hrs)</option>
                            <option value={120}>120 minutes (2 hrs)</option>
                          </select>
                          <select
                            value={newTaskPriority}
                            onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                          >
                            <option value="high">🔴 High Priority</option>
                            <option value="medium">🟡 Medium Priority</option>
                            <option value="low">🟢 Low Priority</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            disabled={savingTask || !newTaskTitle.trim()}
                            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{savingTask ? 'Placing Task...' : 'Save & Place Task'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveHourSlot(null)}
                            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
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
