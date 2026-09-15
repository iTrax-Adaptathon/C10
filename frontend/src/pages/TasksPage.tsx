import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  CheckSquare,
  Clock,
  AlertCircle,
  Filter,
  ArrowRight,
  LayoutGrid,
  List,
  Edit3,
  X,
  Save,
  Link as LinkIcon,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Sparkles,
  Flame,
  CheckCircle2,
  Zap,
  Target
} from 'lucide-react';
import { api } from '../api/client';
import { Task, Priority, PreferredTime } from '../types';
import { QuickAdd } from '../components/QuickAdd';
import { useToast } from '../context/ToastContext';

export const TasksPage: React.FC = () => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');
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
  const [formDependencies, setFormDependencies] = useState<string[]>([]);

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
    setFormDependencies([]);
    setIsModalOpen(true);
  };

  const openEditModal = (t: Task) => {
    setEditingTask(t);
    setFormTitle(t.title);
    setFormDuration(t.duration);
    setFormDeadline(t.deadline);
    setFormPriority(t.priority);
    setFormPreferredTime(t.preferred_time || 'any');
    setFormOptional(t.optional);
    setFormDependencies(t.dependencies || []);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      if (editingTask) {
        await api.updateTask({
          ...editingTask,
          title: formTitle,
          duration: Number(formDuration),
          deadline: formDeadline,
          priority: formPriority,
          preferred_time: formPreferredTime,
          optional: formOptional,
          dependencies: formDependencies,
        });
        toast('Task Updated!', `"${formTitle}" updated successfully.`, 'success');
      } else {
        await api.createTask({
          title: formTitle,
          duration: Number(formDuration),
          deadline: formDeadline,
          priority: formPriority,
          flexible: true,
          preferred_time: formPreferredTime,
          optional: formOptional,
          dependencies: formDependencies,
        });
        toast('Task Created!', `"${formTitle}" added to tasks.`, 'success');
      }
      setIsModalOpen(false);
      loadTasks();
    } catch (err) {
      console.error('Failed to save task:', err);
      toast('Error', 'Failed to save task.', 'warning');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTask(id);
      toast('Task Deleted', 'Removed from schedule constraints.', 'info');
      loadTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handlePriorityChange = async (taskId: string, newPriority: Priority) => {
    const t = tasks.find((item) => item.id === taskId);
    if (!t) return;
    try {
      await api.updateTask({ ...t, priority: newPriority });
      toast('Priority Updated', `${t.title} changed to ${newPriority}.`, 'info');
      loadTasks();
    } catch (err) {
      console.error('Failed to update priority:', err);
    }
  };

  const toggleDependency = (depId: string) => {
    setFormDependencies((prev) =>
      prev.includes(depId) ? prev.filter((d) => d !== depId) : [...prev, depId]
    );
  };

  // Filter and search
  const filteredTasks = tasks.filter((t) => {
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchesQuery = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesQuery;
  });

  // Eisenhower Matrix Categorization
  const getQuadrant = (task: Task): 1 | 2 | 3 | 4 => {
    // Q1: High priority & not optional
    if (task.priority === 'high' && !task.optional) return 1;
    // Q2: Medium priority & not optional
    if (task.priority === 'medium' && !task.optional) return 2;
    // Q3: High/medium priority but flexible/split
    if (task.flexible && !task.optional && task.priority !== 'low') return 3;
    // Q4: Low priority or optional
    return 4;
  };

  const q1Tasks = filteredTasks.filter((t) => getQuadrant(t) === 1);
  const q2Tasks = filteredTasks.filter((t) => getQuadrant(t) === 2);
  const q3Tasks = filteredTasks.filter((t) => getQuadrant(t) === 3);
  const q4Tasks = filteredTasks.filter((t) => getQuadrant(t) === 4);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-yellow-400" />
            Task Management Studio
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Deterministic dependency graphs, preferred time slots, and 4-quadrant Eisenhower prioritization.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-2xl glass-panel border border-yellow-500/20 text-xs font-bold">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-yellow-400 text-black font-extrabold shadow-sm shadow-yellow-400/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                viewMode === 'matrix'
                  ? 'bg-yellow-400 text-black font-extrabold shadow-sm shadow-yellow-400/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Eisenhower Matrix</span>
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black flex items-center space-x-1.5 shadow-md shadow-yellow-400/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Quick Add NLP Bar */}
      <QuickAdd onTaskCreated={loadTasks} />

      {/* Toolbar / Filters */}
      <div className="glass-panel p-4 rounded-2xl border border-yellow-500/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-yellow-400 shrink-0" />
          <span className="font-semibold text-neutral-400">Filter Priority:</span>
          {['all', 'high', 'medium', 'low'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition-all ${
                filterPriority === p
                  ? 'bg-yellow-400 text-black font-extrabold shadow-xs'
                  : 'bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800'
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
          className="w-full sm:w-64 glass-input rounded-xl px-3.5 py-1.5 text-xs focus:outline-none focus:border-yellow-400 placeholder:text-neutral-500"
        />
      </div>

      {/* View Mode 1: List View Table */}
      {viewMode === 'list' && (
        <div className="glass-panel rounded-3xl border border-yellow-500/20 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0b0b0e] border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Priority Level</th>
                  <th className="py-3.5 px-4">Deadline</th>
                  <th className="py-3.5 px-4">Preferred Slot</th>
                  <th className="py-3.5 px-4">Dependencies</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {t.title}
                      {t.optional && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-neutral-900 text-neutral-400 border border-neutral-700">
                          Optional
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400 font-mono">{t.duration} min</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={t.priority}
                        onChange={(e) => handlePriorityChange(t.id, e.target.value as Priority)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer outline-none border transition-all ${
                          t.priority === 'high'
                            ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                            : t.priority === 'medium'
                            ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40'
                            : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                        }`}
                      >
                        <option value="high" className="bg-neutral-950 text-amber-300">High Priority</option>
                        <option value="medium" className="bg-neutral-950 text-yellow-300">Medium Priority</option>
                        <option value="low" className="bg-neutral-950 text-neutral-300">Low Priority</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400 font-mono">{t.deadline}</td>
                    <td className="py-3.5 px-4 text-neutral-400 capitalize">
                      {t.preferred_time || 'any'}
                    </td>
                    <td className="py-3.5 px-4">
                      {t.dependencies && t.dependencies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {t.dependencies.map((depId) => {
                            const depTask = tasks.find((x) => x.id === depId);
                            return (
                              <span
                                key={depId}
                                className="px-2 py-0.5 rounded bg-yellow-400/10 text-yellow-400 text-[10px] font-semibold border border-yellow-500/30"
                              >
                                {depTask ? depTask.title : depId}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-neutral-500 italic text-[11px]">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openEditModal(t)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-yellow-400 hover:bg-neutral-800 transition-colors"
                          title="Edit Task"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
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
        </div>
      )}

      {/* View Mode 2: Eisenhower Matrix (4-Quadrant) */}
      {viewMode === 'matrix' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Quadrant 1: Do First */}
          <div className="glass-panel p-6 rounded-3xl border border-amber-500/40 space-y-4 shadow-md bg-amber-500/[0.04]">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400/60" />
                <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wide">
                  Q1: Do First (Urgent & Critical)
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                {q1Tasks.length} Tasks
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">Hard deadlines requiring immediate execution.</p>
            <div className="space-y-2">
              {q1Tasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-2xl bg-[#0c0c0f] border border-neutral-800 hover:border-amber-400/40 transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{t.title}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {t.duration}m • Due: {t.deadline.split(' ')[1] || t.deadline}
                    </span>
                  </div>
                  <button
                    onClick={() => openEditModal(t)}
                    className="p-1 text-neutral-400 hover:text-yellow-400"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quadrant 2: Schedule (Deep Work) */}
          <div className="glass-panel p-6 rounded-3xl border border-yellow-500/40 space-y-4 shadow-md bg-yellow-500/[0.03]">
            <div className="flex items-center justify-between pb-3 border-b border-yellow-500/20">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm shadow-yellow-400/60" />
                <h3 className="text-sm font-extrabold text-yellow-400 uppercase tracking-wide">
                  Q2: Schedule (Important, Not Urgent)
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">
                {q2Tasks.length} Tasks
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">High leverage work scheduled into open focus intervals.</p>
            <div className="space-y-2">
              {q2Tasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-2xl bg-[#0c0c0f] border border-neutral-800 hover:border-yellow-400/40 transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{t.title}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {t.duration}m • Preferred: {t.preferred_time || 'any'}
                    </span>
                  </div>
                  <button
                    onClick={() => openEditModal(t)}
                    className="p-1 text-neutral-400 hover:text-yellow-400"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quadrant 3: Delegate / Quick Win */}
          <div className="glass-panel p-6 rounded-3xl border border-neutral-800 space-y-4 shadow-md bg-neutral-900/30">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-neutral-400" />
                <h3 className="text-sm font-extrabold text-neutral-300 uppercase tracking-wide">
                  Q3: Delegate / Compress (Flexible)
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-neutral-800 text-neutral-300 border border-neutral-700">
                {q3Tasks.length} Tasks
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">Flexible tasks that the scheduler can easily shift or split.</p>
            <div className="space-y-2">
              {q3Tasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-2xl bg-[#0c0c0f] border border-neutral-800 hover:border-neutral-700 transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{t.title}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">{t.duration}m</span>
                  </div>
                  <button
                    onClick={() => openEditModal(t)}
                    className="p-1 text-neutral-400 hover:text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quadrant 4: Eliminate / Optional */}
          <div className="glass-panel p-6 rounded-3xl border border-neutral-800/80 space-y-4 shadow-md bg-neutral-950/40">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-neutral-600" />
                <h3 className="text-sm font-extrabold text-neutral-400 uppercase tracking-wide">
                  Q4: Buffer / Optional (Drop on Conflict)
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-neutral-900 text-neutral-400 border border-neutral-800">
                {q4Tasks.length} Tasks
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">Optional or buffer tasks dropped if calendar gets crowded.</p>
            <div className="space-y-2">
              {q4Tasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-2xl bg-[#0c0c0f] border border-neutral-800 hover:border-neutral-700 transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{t.title}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">{t.duration}m • Optional</span>
                  </div>
                  <button
                    onClick={() => openEditModal(t)}
                    className="p-1 text-neutral-400 hover:text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Task Creation & Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel rounded-3xl border border-yellow-500/30 shadow-2xl w-full max-w-lg overflow-hidden my-8 text-neutral-100">
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-[#0b0b0e]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-yellow-400" />
                {editingTask ? 'Edit Task & Dependencies' : 'Create New Task'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Prepare Electronics Assignment"
                  className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-yellow-400 font-medium placeholder:text-neutral-500"
                />
              </div>

              {/* Priority Level Radio Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">Priority Level</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormPriority('high')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center space-x-1.5 ${
                      formPriority === 'high'
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 ring-2 ring-amber-400/30 font-extrabold'
                        : 'bg-neutral-900/60 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
                    }`}
                  >
                    <span>⚡ High</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPriority('medium')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center space-x-1.5 ${
                      formPriority === 'medium'
                        ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/50 ring-2 ring-yellow-400/30 font-extrabold'
                        : 'bg-neutral-900/60 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
                    }`}
                  >
                    <span>🟡 Medium</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPriority('low')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center space-x-1.5 ${
                      formPriority === 'low'
                        ? 'bg-neutral-700 text-neutral-200 border-neutral-600 ring-2 ring-neutral-500/30 font-extrabold'
                        : 'bg-neutral-900/60 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
                    }`}
                  >
                    <span>⚪ Low</span>
                  </button>
                </div>
              </div>

              {/* Duration & Preferred Slot */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min={15}
                    max={480}
                    step={15}
                    required
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-yellow-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Preferred Time Slot</label>
                  <select
                    value={formPreferredTime}
                    onChange={(e) => setFormPreferredTime(e.target.value as PreferredTime)}
                    className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-yellow-400 font-medium capitalize"
                  >
                    <option value="any">Any Time</option>
                    <option value="morning">🌅 Morning</option>
                    <option value="afternoon">☀️ Afternoon</option>
                    <option value="evening">🌙 Evening</option>
                  </select>
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Hard Deadline (YYYY-MM-DD HH:MM)</label>
                <input
                  type="text"
                  required
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  placeholder="2026-09-16 18:00"
                  className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-yellow-400 placeholder:text-neutral-600"
                />
              </div>

              {/* Prerequisite Task Dependencies Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-300 flex items-center justify-between">
                  <span>Prerequisite Task Dependencies</span>
                  <span className="text-[10px] text-neutral-400 font-normal">Must finish before starting</span>
                </label>
                <div className="p-3 bg-[#0a0a0d] rounded-xl border border-neutral-800 max-h-36 overflow-y-auto space-y-1.5">
                  {tasks
                    .filter((t) => !editingTask || t.id !== editingTask.id)
                    .map((otherTask) => {
                      const isSelected = formDependencies.includes(otherTask.id);
                      return (
                        <label
                          key={otherTask.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${
                            isSelected
                              ? 'bg-yellow-400/15 border-yellow-400/40 text-yellow-300 font-bold'
                              : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2 text-xs">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleDependency(otherTask.id)}
                              className="w-3.5 h-3.5 accent-yellow-400 rounded border-neutral-700 bg-neutral-900"
                            />
                            <span>{otherTask.title}</span>
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono">{otherTask.duration}m</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Optional Checkbox */}
              <label className="flex items-center space-x-2 text-xs text-neutral-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formOptional}
                  onChange={(e) => setFormOptional(e.target.checked)}
                  className="w-4 h-4 accent-yellow-400 rounded border-neutral-700 bg-neutral-900"
                />
                <span>Optional Task (Can be dropped if schedule becomes overconstrained)</span>
              </label>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black shadow-md shadow-yellow-400/20 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
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
