import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckSquare, Clock, AlertCircle, Filter, ArrowRight, LayoutGrid, List, Edit3, X, Save } from 'lucide-react';
import { api } from '../api/client';
import { Task, Priority, PreferredTime } from '../types';
import { QuickAdd } from '../components/QuickAdd';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State for Creating/Editing Task
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDuration, setFormDuration] = useState(60);
  const [formDeadline, setFormDeadline] = useState('');
  const [formPriority, setFormPriority] = useState<Priority>('medium');
  const [formPreferredTime, setFormPreferredTime] = useState<PreferredTime>('afternoon');
  const [formOptional, setFormOptional] = useState(false);

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

  const openCreateModal = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDuration(60);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFormDeadline(`${tomorrow.toISOString().split('T')[0]} 18:00`);
    setFormPriority('medium');
    setFormPreferredTime('afternoon');
    setFormOptional(false);
    setIsModalOpen(true);
  };

  const openEditModal = (t: Task) => {
    setEditingTask(t);
    setFormTitle(t.title);
    setFormDuration(t.duration);
    setFormDeadline(t.deadline);
    setFormPriority(t.priority);
    setFormPreferredTime(t.preferred_time);
    setFormOptional(t.optional);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      if (editingTask) {
        // Update existing task
        await api.updateTask({
          ...editingTask,
          title: formTitle,
          duration: Number(formDuration),
          deadline: formDeadline,
          priority: formPriority,
          preferred_time: formPreferredTime,
          optional: formOptional,
        });
      } else {
        // Create new task
        await api.createTask({
          title: formTitle,
          duration: Number(formDuration),
          deadline: formDeadline,
          priority: formPriority,
          flexible: true,
          preferred_time: formPreferredTime,
          optional: formOptional,
          dependencies: [],
        });
      }
      setIsModalOpen(false);
      loadTasks();
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const handlePriorityChange = async (taskId: string, newPriority: Priority) => {
    const taskToUpdate = tasks.find((t) => t.id === taskId);
    if (!taskToUpdate) return;
    try {
      const updated = await api.updateTask({ ...taskToUpdate, priority: newPriority });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error('Failed to update task priority:', err);
    }
  };

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
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-7 h-7 text-indigo-600" />
            Task Management Studio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage constraint rankings, time buffers, dependency chains, priority levels, and natural language quick add.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* New Task Button */}
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Task</span>
          </button>

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
      </div>

      {/* Quick Add Component */}
      <QuickAdd onTaskCreated={loadTasks} />

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span className="text-slate-600 font-medium">Filter Priority:</span>
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
                <th className="py-3.5 px-4">Priority Level</th>
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
                    <select
                      value={t.priority}
                      onChange={(e) => handlePriorityChange(t.id, e.target.value as Priority)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer outline-none border transition-all ${
                        t.priority === 'high'
                          ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                          : t.priority === 'medium'
                          ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      <option value="high" className="bg-white text-slate-900 font-sans">High Priority</option>
                      <option value="medium" className="bg-white text-slate-900 font-sans">Medium Priority</option>
                      <option value="low" className="bg-white text-slate-900 font-sans">Low Priority</option>
                    </select>
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
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit Task Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
                <div key={t.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{t.title}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{t.duration}m • Due: {t.deadline}</p>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <select
                      value={t.priority}
                      onChange={(e) => handlePriorityChange(t.id, e.target.value as Priority)}
                      className="px-2 py-0.5 text-[10px] font-bold rounded border border-rose-300 bg-rose-50 text-rose-700 uppercase outline-none cursor-pointer"
                    >
                      <option value="high">High</option>
                      <option value="medium">Med</option>
                      <option value="low">Low</option>
                    </select>
                    <button onClick={() => openEditModal(t)} className="text-slate-400 hover:text-indigo-600 p-1">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-rose-600 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                <div key={t.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{t.title}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{t.duration}m • Due: {t.deadline}</p>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <select
                      value={t.priority}
                      onChange={(e) => handlePriorityChange(t.id, e.target.value as Priority)}
                      className="px-2 py-0.5 text-[10px] font-bold rounded border border-amber-300 bg-amber-50 text-amber-700 uppercase outline-none cursor-pointer"
                    >
                      <option value="high">High</option>
                      <option value="medium">Med</option>
                      <option value="low">Low</option>
                    </select>
                    <button onClick={() => openEditModal(t)} className="text-slate-400 hover:text-indigo-600 p-1">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-rose-600 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                <div key={t.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{t.title}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{t.duration}m • Preferred: {t.preferred_time}</p>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <select
                      value={t.priority}
                      onChange={(e) => handlePriorityChange(t.id, e.target.value as Priority)}
                      className="px-2 py-0.5 text-[10px] font-bold rounded border border-emerald-300 bg-emerald-50 text-emerald-700 uppercase outline-none cursor-pointer"
                    >
                      <option value="high">High</option>
                      <option value="medium">Med</option>
                      <option value="low">Low</option>
                    </select>
                    <button onClick={() => openEditModal(t)} className="text-slate-400 hover:text-indigo-600 p-1">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-rose-600 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Task Creation & Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                {editingTask ? 'Edit Task Details' : 'Create New Task'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Prepare Electronics Assignment"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Priority Level Radio Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Priority Level</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormPriority('high')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center space-x-1.5 ${
                      formPriority === 'high'
                        ? 'bg-rose-100 text-rose-800 border-rose-300 ring-2 ring-rose-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🔴 High</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPriority('medium')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center space-x-1.5 ${
                      formPriority === 'medium'
                        ? 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🟡 Medium</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPriority('low')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center space-x-1.5 ${
                      formPriority === 'low'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🟢 Low</span>
                  </button>
                </div>
              </div>

              {/* Duration & Preferred Slot */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min={15}
                    max={480}
                    step={15}
                    required
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Time Slot</label>
                  <select
                    value={formPreferredTime}
                    onChange={(e) => setFormPreferredTime(e.target.value as PreferredTime)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 capitalize"
                  >
                    <option value="any">Any Time</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hard Deadline</label>
                <input
                  type="text"
                  required
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  placeholder="YYYY-MM-DD HH:MM (e.g. 2026-09-15 18:00)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Optional Toggle */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="optional-checkbox"
                  checked={formOptional}
                  onChange={(e) => setFormOptional(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="optional-checkbox" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Optional task (can be dropped if conflict occurs)
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingTask ? 'Save Changes' : 'Create Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
