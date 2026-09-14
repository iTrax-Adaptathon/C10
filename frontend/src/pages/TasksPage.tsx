import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckSquare, Clock, AlertCircle, Filter, ArrowRight, LayoutGrid, List } from 'lucide-react';
import { api } from '../api/client';
import { Task, Priority, PreferredTime } from '../types';
import { QuickAdd } from '../components/QuickAdd';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTask(id);
      loadTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-7 h-7 text-indigo-600" />
            Task Management Studio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage constraint rankings, time buffers, dependency chains, and natural language quick add.
          </p>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              viewMode === 'list'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Eisenhower Grid</span>
          </button>
        </div>
      </div>

      <QuickAdd onTaskCreated={loadTasks} />

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span className="text-slate-600 font-medium">Priority:</span>
          {['all', 'high', 'medium', 'low'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-1 rounded-lg uppercase font-bold transition-all ${
                filterPriority === p
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks by title..."
          className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* View Mode 1: List View Table */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4">Title</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Deadline</th>
                <th className="py-3.5 px-4">Preferred Slot</th>
                <th className="py-3.5 px-4">Dependencies</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {t.title}
                    {t.optional && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                        Optional
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono">{t.duration} min</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        t.priority === 'high'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : t.priority === 'medium'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono">{t.deadline}</td>
                  <td className="py-3.5 px-4 text-slate-600 capitalize">{t.preferred_time}</td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {t.dependencies.length > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono border border-indigo-200">
                        {t.dependencies.join(', ')}
                      </span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(t.id)}
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
      ) : (
        /* View Mode 2: Eisenhower Matrix Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Urgent & Important (High Priority) */}
          <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center justify-between">
              <span>Do First (High Priority)</span>
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-mono">
                {filteredTasks.filter((t) => t.priority === 'high').length}
              </span>
            </h3>
            <div className="space-y-2">
              {filteredTasks.filter((t) => t.priority === 'high').map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{t.duration}m • Due: {t.deadline}</p>
                  </div>
                  <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule (Medium Priority) */}
          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
              <span>Schedule (Medium Priority)</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">
                {filteredTasks.filter((t) => t.priority === 'medium').length}
              </span>
            </h3>
            <div className="space-y-2">
              {filteredTasks.filter((t) => t.priority === 'medium').map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{t.duration}m • Due: {t.deadline}</p>
                  </div>
                  <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Flexible (Low Priority) */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-3 md:col-span-2">
            <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
              <span>Flexible / Buffer Tasks (Low Priority)</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                {filteredTasks.filter((t) => t.priority === 'low').length}
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredTasks.filter((t) => t.priority === 'low').map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{t.duration}m • Preferred: {t.preferred_time}</p>
                  </div>
                  <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

