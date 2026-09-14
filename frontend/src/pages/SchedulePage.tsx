import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { api } from '../api/client';
import { Task, Event } from '../types';

export const SchedulePage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await api.generateSchedule();
        setTasks(res.scheduled_tasks);
        setEvents(res.events);
      } catch (err) {
        console.error('Failed to load schedule:', err);
      }
    };
    fetchSchedule();
  }, []);

  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-400" />
            Schedule & Calendar View
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual hourly interval allocation for fixed events and flexible tasks.
          </p>
        </div>
      </div>

      {/* Hourly Timeline Grid */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-sm font-bold text-white uppercase tracking-wider">
            Today's Hour-by-Hour Grid (08:00 - 22:00)
          </span>
        </div>

        <div className="space-y-2">
          {hours.map((h) => {
            const timeStr = `${h < 10 ? '0' : ''}${h}:00`;
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

            return (
              <div key={h} className="flex items-start space-x-4 border-b border-slate-800/40 py-2">
                <span className="w-16 text-xs font-mono text-slate-400 shrink-0 mt-1">
                  {timeStr}
                </span>

                <div className="flex-1 space-y-1.5 min-h-[36px]">
                  {matchingEvts.map((e) => (
                    <div
                      key={e.id}
                      className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>{e.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {e.start.split(' ')[1]} - {e.end.split(' ')[1]} (Fixed)
                      </span>
                    </div>
                  ))}

                  {matchingTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/40 text-xs font-semibold text-blue-100 flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <span>{t.title}</span>
                      </div>
                      <span className="text-[10px] text-blue-300 font-mono">
                        {t.scheduled_start?.split(' ')[1]} - {t.scheduled_end?.split(' ')[1]} ({t.duration}m)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
