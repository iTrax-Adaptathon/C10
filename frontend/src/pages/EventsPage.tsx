import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Shield, Calendar } from 'lucide-react';
import { api } from '../api/client';
import { Event } from '../types';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const loadEvents = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !start || !end) return;

    try {
      await api.createEvent({
        title,
        start,
        end,
        fixed: true,
        category: 'general',
      });
      setTitle('');
      setStart('');
      setEnd('');
      loadEvents();
    } catch (err) {
      console.error('Failed to add event:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteEvent(id);
      loadEvents();
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Clock className="w-7 h-7 text-indigo-600" />
          Fixed Events Manager
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Fixed events act as immovable hard constraints in the deterministic scheduling engine.
        </p>
      </div>

      {/* Add Event Form */}
      <form onSubmit={handleAddEvent} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Add Fixed Event</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <input
            type="text"
            placeholder="Event Title (e.g. Team Meeting)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            placeholder="Start (YYYY-MM-DD HH:MM)"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <input
            type="text"
            placeholder="End (YYYY-MM-DD HH:MM)"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={!title || !start || !end}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Save Fixed Event</span>
        </button>
      </form>

      {/* Events List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
              <th className="py-3 px-4">Event Title</th>
              <th className="py-3 px-4">Start Time</th>
              <th className="py-3 px-4">End Time</th>
              <th className="py-3 px-4">Constraint</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {events.map((evt) => (
              <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-slate-900">{evt.title}</td>
                <td className="py-3.5 px-4 text-slate-600 font-mono">{evt.start}</td>
                <td className="py-3.5 px-4 text-slate-600 font-mono">{evt.end}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    Hard Constraint
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => handleDelete(evt.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
