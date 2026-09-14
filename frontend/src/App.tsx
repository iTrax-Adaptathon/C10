import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { CommandBar } from './components/CommandBar';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { SchedulePage } from './pages/SchedulePage';
import { EventsPage } from './pages/EventsPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { InsightsPage } from './pages/InsightsPage';
import { HistoryPage } from './pages/HistoryPage';
import { HealthScore } from './types';
import { api } from './api/client';

export const AppContent: React.FC = () => {
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const navigate = useNavigate();

  const fetchHealth = async () => {
    try {
      const res = await api.generateSchedule();
      setHealthScore(res.health_score);
    } catch (err) {
      console.warn('Backend server connecting...');
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleResetDemo = async () => {
    try {
      await api.resetDemo();
      await fetchHealth();
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
    } else if (action === 'move_team_meeting') {
      const events = await api.getEvents();
      const tm = events.find((e) => e.title.includes('Team Meeting'));
      if (tm) {
        const todayStr = tm.start.split(' ')[0];
        await api.updateEvent({
          ...tm,
          start: `${todayStr} 20:00`,
          end: `${todayStr} 21:00`,
        });
        await api.analyzeImpact(tm.id, `${todayStr} 20:00`, `${todayStr} 21:00`);
      }
      navigate('/');
    } else if (action === 'replan_balanced') {
      await api.replanSchedule('balance_workload');
      await fetchHealth();
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
      await fetchHealth();
      navigate('/tasks');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative">
      <Navbar
        healthScore={healthScore}
        onResetDemo={handleResetDemo}
        onStartGuidedDemo={handleStartGuidedDemo}
        onOpenCommandBar={() => setIsCommandBarOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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

      <CommandBar
        isOpen={isCommandBarOpen}
        onClose={() => setIsCommandBarOpen(false)}
        onCommandExecute={handleCommandExecute}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;

