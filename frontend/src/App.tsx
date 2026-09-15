import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { CommandBar } from './components/CommandBar';
import { DisruptionSimulator } from './components/DisruptionSimulator';
import { FocusModeModal } from './components/FocusModeModal';
import { ExportModal } from './components/ExportModal';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { SchedulePage } from './pages/SchedulePage';
import { EventsPage } from './pages/EventsPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { InsightsPage } from './pages/InsightsPage';
import { HistoryPage } from './pages/HistoryPage';
import { HealthScore, Task, Event } from './types';
import { api } from './api/client';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';

export const AppContent: React.FC = () => {
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  // Modals state
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [isChaosLabOpen, setIsChaosLabOpen] = useState(false);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const { toast } = useToast();

  const refreshData = useCallback(async () => {
    try {
      const res = await api.generateSchedule();
      setHealthScore(res.health_score);
      setTasks(res.scheduled_tasks.concat(res.unscheduled_tasks));
      setEvents(res.events);
    } catch (err) {
      console.warn('Connecting to backend API...');
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleResetDemo = async () => {
    try {
      await api.resetDemo();
      await refreshData();
      toast('Demo State Reset!', 'Restored canonical demo schedule and tasks.', 'info');
      navigate('/');
    } catch (err) {
      console.error('Failed to reset demo:', err);
    }
  };

  const handleStartGuidedDemo = () => {
    navigate('/');
  };

  const handleCommandExecute = async (action: string, payload?: any) => {
    if (action === 'reset_demo') {
      await handleResetDemo();
    } else if (action === 'open_chaos_lab') {
      setIsChaosLabOpen(true);
    } else if (action === 'open_focus_mode') {
      setIsFocusModeOpen(true);
    } else if (action === 'open_export') {
      setIsExportOpen(true);
    } else if (action === 'toggle_theme') {
      toggleTheme();
    } else if (action === 'move_team_meeting') {
      const allEvents = await api.getEvents();
      const tm = allEvents.find((e) => e.title.includes('Team Meeting'));
      if (tm) {
        const todayStr = tm.start.split(' ')[0];
        await api.updateEvent({
          ...tm,
          start: `${todayStr} 20:00`,
          end: `${todayStr} 21:00`,
        });
        await api.analyzeImpact(tm.id, `${todayStr} 20:00`, `${todayStr} 21:00`);
      }
      await refreshData();
      navigate('/');
    } else if (action === 'replan_deadlines') {
      await api.replanSchedule('protect_deadlines');
      await refreshData();
      toast('Replanned for Deadlines!', 'Strictly prioritized hard deadlines.', 'replan');
      navigate('/');
    } else if (action === 'replan_balanced') {
      await api.replanSchedule('balance_workload');
      await refreshData();
      toast('Workload Balanced!', 'Evenly distributed tasks to avoid burnout.', 'replan');
      navigate('/');
    } else if (action === 'replan_preferences') {
      await api.replanSchedule('protect_preferences');
      await refreshData();
      toast('Preferences Protected!', 'Honoring preferred working hours.', 'replan');
      navigate('/');
    } else if (action === 'nlp_command' && payload) {
      const parsed = await api.parseTask(payload);
      await api.createTask({
        title: parsed.title,
        duration: parsed.duration,
        deadline: parsed.deadline,
        priority: parsed.priority,
        flexible: true,
        preferred_time: parsed.preferred_time as any,
        optional: parsed.optional,
        dependencies: [],
      });
      await refreshData();
      toast('Task Created from NLP!', `"${parsed.title}" scheduled successfully.`, 'success');
      navigate('/tasks');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 flex flex-col font-sans relative transition-colors duration-200 bg-grid-pattern">
      <Navbar
        healthScore={healthScore}
        onResetDemo={handleResetDemo}
        onStartGuidedDemo={handleStartGuidedDemo}
        onOpenCommandBar={() => setIsCommandBarOpen(true)}
        onOpenChaosLab={() => setIsChaosLabOpen(true)}
        onOpenFocusMode={() => setIsFocusModeOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/availability" element={<AvailabilityPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>

      {/* Global Command Palette */}
      <CommandBar
        isOpen={isCommandBarOpen}
        onClose={() => setIsCommandBarOpen(false)}
        onCommandExecute={handleCommandExecute}
      />

      {/* Disruption Simulator (Chaos Lab) */}
      <DisruptionSimulator
        isOpen={isChaosLabOpen}
        onClose={() => setIsChaosLabOpen(false)}
        onScheduleUpdated={refreshData}
      />

      {/* Live Focus HUD & Pomodoro */}
      <FocusModeModal
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
        tasks={tasks}
        onTaskUpdated={refreshData}
      />

      {/* Calendar Sync & Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        tasks={tasks}
        events={events}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <AppContent />
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
