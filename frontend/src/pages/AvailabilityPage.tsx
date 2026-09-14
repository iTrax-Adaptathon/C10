import React, { useState, useEffect } from 'react';
import { Settings2, Plus, Clock, Pencil, Save, X, Trash2, Check, RefreshCw, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';
import { api } from '../api/client';
import { AvailabilityWindow, PreferredSlotsConfig } from '../types';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function formatDisplayTime(hhmm: string): string {
  if (!hhmm) return '';
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const suffix = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${String(h).padStart(2, '0')}:${m} ${suffix}`;
}

const DEFAULT_PREFERRED_SLOTS: PreferredSlotsConfig = {
  morning: { start_time: '08:00', end_time: '12:00' },
  afternoon: { start_time: '12:00', end_time: '17:00' },
  evening: { start_time: '17:00', end_time: '22:00' },
};

export const AvailabilityPage: React.FC = () => {
  const [availability, setAvailability] = useState<AvailabilityWindow[]>([]);
  const [preferredSlots, setPreferredSlots] = useState<PreferredSlotsConfig>(DEFAULT_PREFERRED_SLOTS);
  const [loading, setLoading] = useState(true);
  
  // Availability edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScope, setEditScope] = useState<'default' | 'day' | 'date'>('default');
  const [editDayOfWeek, setEditDayOfWeek] = useState<number>(0);
  const [editDateStr, setEditDateStr] = useState<string>('');
  const [editStart, setEditStart] = useState('08:00');
  const [editEnd, setEditEnd] = useState('22:00');

  // Preferred Slots edit state
  const [editingPreferred, setEditingPreferred] = useState(false);
  const [mStart, setMStart] = useState('08:00');
  const [mEnd, setMEnd] = useState('12:00');
  const [aStart, setAStart] = useState('12:00');
  const [aEnd, setAEnd] = useState('17:00');
  const [eStart, setEStart] = useState('17:00');
  const [eEnd, setEEnd] = useState('22:00');

  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add form state
  const [showAdd, setShowAdd] = useState(false);
  const [newScope, setNewScope] = useState<'default' | 'day' | 'date'>('default');
  const [newDayOfWeek, setNewDayOfWeek] = useState<number>(0);
  const [newDate, setNewDate] = useState('');
  const [newStart, setNewStart] = useState('08:00');
  const [newEnd, setNewEnd] = useState('22:00');

  const loadData = async () => {
    try {
      setLoading(true);
      const [availData, prefData] = await Promise.all([
        api.getAvailability(),
        api.getPreferredSlots().catch(() => DEFAULT_PREFERRED_SLOTS),
      ]);
      setAvailability(availData);
      setPreferredSlots(prefData);

      setMStart(prefData.morning.start_time);
      setMEnd(prefData.morning.end_time);
      setAStart(prefData.afternoon.start_time);
      setAEnd(prefData.afternoon.end_time);
      setEStart(prefData.evening.start_time);
      setEEnd(prefData.evening.end_time);
    } catch (err) {
      console.error('Failed to load availability data:', err);
      setError('Failed to load availability windows.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const startEdit = (window: AvailabilityWindow) => {
    setEditingId(window.id);
    if (window.date_str) {
      setEditScope('date');
      setEditDateStr(window.date_str);
      setEditDayOfWeek(0);
    } else if (window.day_of_week != null) {
      setEditScope('day');
      setEditDayOfWeek(window.day_of_week);
      setEditDateStr('');
    } else {
      setEditScope('default');
      setEditDayOfWeek(0);
      setEditDateStr('');
    }
    setEditStart(window.start_time);
    setEditEnd(window.end_time);
    setError(null);
    setSuccessMsg(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
  };

  const handleSave = async (window: AvailabilityWindow) => {
    if (!editStart || !editEnd) {
      setError('Start and end times are required.');
      return;
    }
    if (editStart >= editEnd) {
      setError('End time must be after start time.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const updatedWindow: AvailabilityWindow = {
      ...window,
      start_time: editStart,
      end_time: editEnd,
      day_of_week: editScope === 'day' ? editDayOfWeek : null,
      date_str: editScope === 'date' ? editDateStr || null : null,
    };

    try {
      await api.updateAvailability(updatedWindow);
      setEditingId(null);
      setSuccessMsg('Working hours updated successfully.');
      await loadData();
    } catch (err) {
      console.error('Failed to update availability:', err);
      setError('Failed to save working hours.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.deleteAvailability(id);
      if (editingId === id) setEditingId(null);
      setSuccessMsg('Working window removed.');
      await loadData();
    } catch (err) {
      console.error('Failed to delete availability:', err);
      setError('Failed to delete working window.');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStart || !newEnd) return;
    if (newStart >= newEnd) {
      setError('End time must be after start time.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.createAvailability({
        day_of_week: newScope === 'day' ? newDayOfWeek : null,
        date_str: newScope === 'date' ? newDate || null : null,
        start_time: newStart,
        end_time: newEnd,
      });
      setShowAdd(false);
      setNewScope('default');
      setNewDate('');
      setNewStart('08:00');
      setNewEnd('22:00');
      setSuccessMsg('New working window added successfully.');
      await loadData();
    } catch (err) {
      console.error('Failed to create availability:', err);
      setError('Failed to add working window.');
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = async (startTime: string, endTime: string) => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (availability.length > 0) {
        const defaultWin = availability.find((w) => !w.date_str && w.day_of_week == null) || availability[0];
        await api.updateAvailability({
          ...defaultWin,
          start_time: startTime,
          end_time: endTime,
        });
      } else {
        await api.createAvailability({
          day_of_week: null,
          date_str: null,
          start_time: startTime,
          end_time: endTime,
        });
      }
      setSuccessMsg(`Preset applied: ${formatDisplayTime(startTime)} – ${formatDisplayTime(endTime)}`);
      await loadData();
    } catch (err) {
      console.error('Failed to apply preset:', err);
      setError('Failed to apply preset working hours.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferredSlots = async () => {
    if (mStart >= mEnd || aStart >= aEnd || eStart >= eEnd) {
      setError('Each time slot end time must be after its start time.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const newConfig: PreferredSlotsConfig = {
      morning: { start_time: mStart, end_time: mEnd },
      afternoon: { start_time: aStart, end_time: aEnd },
      evening: { start_time: eStart, end_time: eEnd },
    };

    try {
      await api.updatePreferredSlots(newConfig);
      setPreferredSlots(newConfig);
      setEditingPreferred(false);
      setSuccessMsg('Preferred time slots updated successfully.');
    } catch (err) {
      console.error('Failed to update preferred slots:', err);
      setError('Failed to save preferred time slots.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPreferredSlots = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.updatePreferredSlots(DEFAULT_PREFERRED_SLOTS);
      setPreferredSlots(DEFAULT_PREFERRED_SLOTS);
      setMStart('08:00');
      setMEnd('12:00');
      setAStart('12:00');
      setAEnd('17:00');
      setEStart('17:00');
      setEEnd('22:00');
      setEditingPreferred(false);
      setSuccessMsg('Preferred slots reset to default values.');
    } catch (err) {
      console.error('Failed to reset preferred slots:', err);
      setError('Failed to reset preferred time slots.');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateSchedule = async () => {
    setRecalculating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.generateSchedule();
      setSuccessMsg('Schedule successfully regenerated with updated working hours & preferences!');
    } catch (err) {
      console.error('Failed to regenerate schedule:', err);
      setError('Failed to recalculate schedule.');
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold tracking-wider uppercase">
            <Settings2 className="w-4 h-4" />
            <span>Time Boundaries & Allocation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Availability & Working Hours</h1>
          <p className="text-xs sm:text-sm text-indigo-200/90 max-w-xl">
            Configure your active working windows and preferred time slots. The scheduler places tasks strictly inside these boundaries.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRegenerateSchedule}
            disabled={recalculating}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-all border border-white/15 shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
            <span>{recalculating ? 'Recalculating...' : 'Recalculate Schedule'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAdd((v) => !v);
              setError(null);
              setSuccessMsg(null);
            }}
            className="px-4 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Window</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Quick Presets */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Quick Presets
          </h3>
          <span className="text-[11px] text-slate-400">One-click standard working hour boundaries</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => applyPreset('09:00', '17:00')}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 text-left transition-all group"
          >
            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 block">Standard Office</span>
            <span className="text-[11px] font-mono text-slate-500 font-medium">09:00 AM – 05:00 PM</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('08:00', '18:00')}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 text-left transition-all group"
          >
            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 block">Extended Workday</span>
            <span className="text-[11px] font-mono text-slate-500 font-medium">08:00 AM – 06:00 PM</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('08:00', '22:00')}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 text-left transition-all group"
          >
            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 block">Full Active Day</span>
            <span className="text-[11px] font-mono text-slate-500 font-medium">08:00 AM – 10:00 PM</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('12:00', '22:00')}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 text-left transition-all group"
          >
            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 block">Night Owl</span>
            <span className="text-[11px] font-mono text-slate-500 font-medium">12:00 PM – 10:00 PM</span>
          </button>
        </div>
      </div>

      {/* Add New Window Expandable Form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-gradient-to-br from-indigo-50/60 to-slate-50 p-6 rounded-3xl border border-indigo-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Add Custom Working Window
            </h3>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Scope</label>
              <select
                value={newScope}
                onChange={(e) => setNewScope(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="default">Default (All Days)</option>
                <option value="day">Specific Day of Week</option>
                <option value="date">Specific Date</option>
              </select>
            </div>

            {newScope === 'day' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Day of Week</label>
                <select
                  value={newDayOfWeek}
                  onChange={(e) => setNewDayOfWeek(parseInt(e.target.value, 10))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <option key={day} value={idx}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {newScope === 'date' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Start Time</label>
              <input
                type="time"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">End Time</label>
              <input
                type="time"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={saving || !newStart || !newEnd}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Window</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Main Working Hours List */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Configured Working Windows</h2>
            <p className="text-xs text-slate-500">Edit start and end hours for active daily task placement.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            {availability.length} {availability.length === 1 ? 'window' : 'windows'}
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Loading working hours...</span>
          </div>
        ) : availability.length === 0 ? (
          <div className="py-12 text-center space-y-3 border-2 border-dashed border-slate-200 rounded-2xl">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500">No working hours configured yet.</p>
            <button
              type="button"
              onClick={() => applyPreset('08:00', '22:00')}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              Apply Default (08:00 AM – 10:00 PM)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {availability.map((window) => {
              const isEditing = editingId === window.id;
              const scopeLabel = window.date_str
                ? `Specific Date: ${window.date_str}`
                : window.day_of_week != null
                  ? `Every ${DAYS_OF_WEEK[window.day_of_week] || `Day ${window.day_of_week}`}`
                  : 'Default Working Hours (All Days)';

              return (
                <div
                  key={window.id}
                  className={`p-5 rounded-2xl transition-all border ${
                    isEditing
                      ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50/80 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-lg">
                          {scopeLabel}
                        </span>
                      </div>
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(window)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                          title="Edit working hours"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        {availability.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDelete(window.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete window"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-4 space-y-4 pt-3 border-t border-indigo-100">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">Scope</label>
                          <select
                            value={editScope}
                            onChange={(e) => setEditScope(e.target.value as any)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                          >
                            <option value="default">Default (All Days)</option>
                            <option value="day">Specific Day of Week</option>
                            <option value="date">Specific Date</option>
                          </select>
                        </div>

                        {editScope === 'day' && (
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-600">Day of Week</label>
                            <select
                              value={editDayOfWeek}
                              onChange={(e) => setEditDayOfWeek(parseInt(e.target.value, 10))}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                            >
                              {DAYS_OF_WEEK.map((day, idx) => (
                                <option key={day} value={idx}>
                                  {day}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {editScope === 'date' && (
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-600">Date</label>
                            <input
                              type="date"
                              value={editDateStr}
                              onChange={(e) => setEditDateStr(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">Start Time</label>
                          <input
                            type="time"
                            value={editStart}
                            onChange={(e) => setEditStart(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600">End Time</label>
                          <input
                            type="time"
                            value={editEnd}
                            onChange={(e) => setEditEnd(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleSave(window)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{saving ? 'Saving…' : 'Save Changes'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={cancelEdit}
                          className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-slate-900 font-mono font-bold text-base sm:text-lg">
                        <Clock className="w-5 h-5 text-indigo-600 shrink-0" />
                        <span>
                          {formatDisplayTime(window.start_time)} – {formatDisplayTime(window.end_time)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Tasks are strictly scheduled within this daily timeframe.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Preferred Time Slots Editable Section */}
        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-4 mt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                Preferred Time Slot Definitions
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure start and end boundaries for Morning, Afternoon, and Evening preferences.
              </p>
            </div>
            {!editingPreferred ? (
              <button
                type="button"
                onClick={() => {
                  setEditingPreferred(true);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Preferred Slots</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetPreferredSlots}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title="Reset to default 8-12, 12-5, 5-10"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
              </div>
            )}
          </div>

          {editingPreferred ? (
            <div className="space-y-4 bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Morning Slot Edit */}
                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70 space-y-2">
                  <span className="text-xs font-bold text-amber-800 block">Morning Slot</span>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Start Time</label>
                    <input
                      type="time"
                      value={mStart}
                      onChange={(e) => setMStart(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">End Time</label>
                    <input
                      type="time"
                      value={mEnd}
                      onChange={(e) => setMEnd(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Afternoon Slot Edit */}
                <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/70 space-y-2">
                  <span className="text-xs font-bold text-blue-800 block">Afternoon Slot</span>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Start Time</label>
                    <input
                      type="time"
                      value={aStart}
                      onChange={(e) => setAStart(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">End Time</label>
                    <input
                      type="time"
                      value={aEnd}
                      onChange={(e) => setAEnd(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Evening Slot Edit */}
                <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200/70 space-y-2">
                  <span className="text-xs font-bold text-purple-800 block">Evening Slot</span>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Start Time</label>
                    <input
                      type="time"
                      value={eStart}
                      onChange={(e) => setEStart(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">End Time</label>
                    <input
                      type="time"
                      value={eEnd}
                      onChange={(e) => setEEnd(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSavePreferredSlots}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving…' : 'Save Preferred Slots'}</span>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setEditingPreferred(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-amber-700 block">Morning</span>
                <span className="text-sm font-mono text-slate-800 font-bold block">
                  {formatDisplayTime(preferredSlots.morning.start_time)} – {formatDisplayTime(preferredSlots.morning.end_time)}
                </span>
                <span className="text-[10px] text-slate-400">Early focus & morning task placement</span>
              </div>
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-blue-700 block">Afternoon</span>
                <span className="text-sm font-mono text-slate-800 font-bold block">
                  {formatDisplayTime(preferredSlots.afternoon.start_time)} – {formatDisplayTime(preferredSlots.afternoon.end_time)}
                </span>
                <span className="text-[10px] text-slate-400">Mid-day work & project tasks</span>
              </div>
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-xs font-bold text-purple-700 block">Evening</span>
                <span className="text-sm font-mono text-slate-800 font-bold block">
                  {formatDisplayTime(preferredSlots.evening.start_time)} – {formatDisplayTime(preferredSlots.evening.end_time)}
                </span>
                <span className="text-[10px] text-slate-400">Late study, gym, & wrap-up tasks</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
