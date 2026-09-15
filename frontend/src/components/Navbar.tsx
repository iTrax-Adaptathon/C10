import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Clock,
  Settings2,
  BarChart3,
  History,
  Sparkles,
  RefreshCw,
  Activity,
  Search,
  Zap,
  Sun,
  Moon,
  Target,
  Share2,
  AlertTriangle
} from 'lucide-react';
import { HealthScore } from '../types';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  healthScore?: HealthScore | null;
  onResetDemo?: () => void;
  onStartGuidedDemo?: () => void;
  onOpenCommandBar?: () => void;
  onOpenChaosLab?: () => void;
  onOpenFocusMode?: () => void;
  onOpenExport?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  healthScore,
  onResetDemo,
  onStartGuidedDemo,
  onOpenCommandBar,
  onOpenChaosLab,
  onOpenFocusMode,
  onOpenExport
}) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/schedule', label: 'Schedule', icon: Calendar },
    { path: '/events', label: 'Events', icon: Clock },
    { path: '/availability', label: 'Availability', icon: Settings2 },
    { path: '/insights', label: 'Insights', icon: BarChart3 },
    { path: '/history', label: 'History', icon: History },
  ];

  const getHealthBadgeStyle = (score: number) => {
    if (score >= 80) return 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40';
    if (score >= 60) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-yellow-500/20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Left: Brand Logo & Tagline */}
          <div className="flex items-center space-x-3 shrink-0">
            <NavLink to="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-black shadow-lg shadow-yellow-500/25 group-hover:scale-105 transition-transform shrink-0 font-black">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="text-lg font-extrabold tracking-tight text-white leading-none">
                    Replan
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-yellow-400 text-black border border-yellow-300 leading-none">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-yellow-400/70 hidden xl:block font-mono mt-0.5">
                  Adaptive Schedule Engine
                </p>
              </div>
            </NavLink>
          </div>

          {/* Center: Main Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 overflow-x-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center space-x-1.5 shrink-0 ${
                    isActive
                      ? 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/40 shadow-sm font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right: Actions Cluster */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Quick Command Bar Trigger */}
            <button
              onClick={onOpenCommandBar}
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-yellow-500/20 text-neutral-400 hover:text-yellow-300 text-xs transition-all"
              title="Open Command Palette (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs hidden md:inline">Command...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-black text-[9px] font-mono text-yellow-400 border border-yellow-500/30 shadow-xs">
                ⌘K
              </kbd>
            </button>

            {/* Focus Mode Button */}
            <button
              onClick={onOpenFocusMode}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-yellow-400/30 text-yellow-400 text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 shadow-xs hover:border-yellow-400"
              title="Launch Live Focus HUD & Pomodoro"
            >
              <Target className="w-3.5 h-3.5 text-yellow-400" />
              <span className="hidden md:inline">Focus HUD</span>
            </button>

            {/* Disruption Simulator Button (Chaos Lab) */}
            <button
              onClick={onOpenChaosLab}
              className="px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-extrabold transition-all flex items-center space-x-1.5 shrink-0 shadow-md shadow-yellow-400/25 active:scale-95"
              title="What-If Disruption Simulator"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="hidden md:inline">Chaos Lab</span>
            </button>

            {/* Calendar Export Button */}
            <button
              onClick={onOpenExport}
              className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-yellow-400 border border-yellow-500/20 transition-all shrink-0"
              title="Export to .ICS Calendar or Markdown"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Health Score Pill */}
            {healthScore && (
              <div
                className={`hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${getHealthBadgeStyle(
                  healthScore.overall
                )}`}
                title={`Safety: ${healthScore.deadline_safety}% | Conflict Free: ${healthScore.conflict_free}% | Preference: ${healthScore.preference_fulfillment}%`}
              >
                <Activity className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                <span className="font-mono">Health {healthScore.overall}%</span>
              </div>
            )}

            {/* Reset Button */}
            <button
              onClick={onResetDemo}
              title="Reset canonical demo data"
              className="p-1.5 rounded-xl text-neutral-400 hover:text-yellow-400 hover:bg-neutral-900 transition-colors border border-yellow-500/20 shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Medium/Mobile Navigation Bar */}
        <div className="lg:hidden flex items-center justify-around py-2 border-t border-yellow-500/20 overflow-x-auto space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`px-2 py-1 rounded-lg text-xs flex items-center space-x-1 shrink-0 ${
                  isActive
                    ? 'text-yellow-400 bg-yellow-400/15 font-bold border border-yellow-400/30'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[11px]">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </header>
  );
};
