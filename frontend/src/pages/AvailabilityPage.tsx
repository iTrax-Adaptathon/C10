import React, { useState, useEffect } from 'react';
import { Settings2, Plus, Clock, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { AvailabilityWindow } from '../types';

export const AvailabilityPage: React.FC = () => {
  const [availability, setAvailability] = useState<AvailabilityWindow[]>([]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('22:00');

  useEffect(() => {
    const loadAvail = async () => {
      try {
        const data = await api.getAvailability();
        setAvailability(data);
      } catch (err) {
        console.error('Failed to load availability:', err);
      }
    };
    loadAvail();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-blue-400" />
          Availability & Working Hours
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure active working windows for task placement and daily boundaries.
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Default Working Windows</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-blue-400 block">Daily Active Hours</span>
            <div className="flex items-center space-x-2 text-sm text-white font-mono font-bold">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>08:00 AM – 10:00 PM</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Tasks are strictly allocated within available free slots inside this daily range.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-emerald-400 block">Preferred Time Slots</span>
            <div className="text-xs text-slate-300 space-y-1">
              <p>• Morning: 08:00 – 12:00</p>
              <p>• Afternoon: 12:00 – 17:00</p>
              <p>• Evening: 17:00 – 22:00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
