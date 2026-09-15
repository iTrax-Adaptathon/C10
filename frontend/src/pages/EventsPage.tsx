import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Pencil, Save, X, Shield, Calendar, Check } from 'lucide-react';
import { api } from '../api/client';
import { Event } from '../types';
import { useToast } from '../context/ToastContext';

export const EventsPage: React.FC = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [saving, setSaving] = useState(false);

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
      toast('Fixed Event Added!', `"${title}" locked into calendar.`, 'success');
      loadEvents();
    } catch (err) {
      console.error('Failed to add event:', err);
    }
  };

  const startEdit = (evt: Event) => {
    setEditingId(evt.id);
    setEditTitle(evt.title);
    setEditStart(evt.start);
    setEditEnd(evt.end);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (evt: Event) => {
    if (!editTitle || !editStart || !editEnd) return;
    setSaving(true);
    try {
      await api.updateEvent({
        ...evt,
        title: editTitle,
        start: editStart,
        end: editEnd,
      });
      setEditingId(null);
      toast('Event Updated!', `"${editTitle}" time updated.`, 'info');
      await loadEvents();
    } catch (err) {
      console.error('Failed to update event:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteEvent(id);
      if (editingId === id) setEditingId(null);
      toast('Event Removed', 'Fixed constraint deleted from scheduler.', 'info');
      loadEvents();
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
          <Clock className="w-7 h-7 text-yellow-400" />
          Fixed Events & Hard Commitments
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Fixed events act as immovable hard constraints in the deterministic scheduling engine.
        </p>
      </div>

      {/* Add Event Form */}
      <form onSubmit={handleAddEvent} className="glass-panel p-6 rounded-3xl border border-yellow-500/20 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Add Fixed Event Constraint
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <input
            type="text"
            placeholder="Event Title (e.g. Team Meeting)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="glass-input rounded-xl px-3.5 py-2 font-medium focus:outline-none focus:border-yellow-400 placeholder:text-neutral-500"
          />
          <input
            type="text"
            placeholder="Start (YYYY-MM-DD HH:MM)"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="glass-input rounded-xl px-3.5 py-2 font-mono focus:outline-none focus:border-yellow-400 placeholder:text-neutral-500"
          />
          <input
            type="text"
            placeholder="End (YYYY-MM-DD HH:MM)"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="glass-input rounded-xl px-3.5 py-2 font-mono focus:outline-none focus:border-yellow-400 placeholder:text-neutral-500"
          />
        </div>
        <button
          type="submit"
          disabled={!title || !start || !end}
          className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black text-xs font-black flex items-center space-x-1.5 transition-all shadow-md shadow-yellow-400/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Save Fixed Event</span>
        </button>
      </form>

      {/* Events List */}
      <div className="glass-panel rounded-3xl border border-yellow-500/20 shadow-lg overflow-hidden">
        <div className="p-4 bg-[#0b0b0e] border-b border-neutral-800 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Active Fixed Commitments ({events.length})
          </span>
          <span className="text-[11px] text-neutral-400 font-mono">Locked calendar intervals</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0a0a0d] border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Event Title</th>
                <th className="py-3 px-4">Start Time</th>
                <th className="py-3 px-4">End Time</th>
                <th className="py-3 px-4">Constraint Type</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {events.map((evt) => {
                const isEditing = editingId === evt.id;

                if (isEditing) {
                  return (
                    <tr key={evt.id} className="bg-yellow-400/10">
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="glass-input rounded-lg px-2 py-1 text-xs text-white focus:border-yellow-400"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editStart}
                          onChange={(e) => setEditStart(e.target.value)}
                          className="glass-input rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-yellow-400"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editEnd}
                          onChange={(e) => setEditEnd(e.target.value)}
                          className="glass-input rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-yellow-400"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-yellow-400 font-bold">Editing Constraint</span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleSaveEdit(evt)}
                          disabled={saving}
                          className="px-2.5 py-1 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300 text-xs hover:text-white"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={evt.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center space-x-2">
                      <Shield className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{evt.title}</span>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400 font-mono">{evt.start}</td>
                    <td className="py-3.5 px-4 text-neutral-400 font-mono">{evt.end}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 text-neutral-300 uppercase tracking-wider border border-neutral-800">
                        Immovable Slot
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => startEdit(evt)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-yellow-400 hover:bg-neutral-800 transition-colors"
                          title="Edit Event"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(evt.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
