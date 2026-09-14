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
  Zap
} from 'lucide-react';
import { HealthScore } from '../types';

interface NavbarProps {
  healthScore?: HealthScore | null;
  onResetDemo?: () => void;
  onStartGuidedDemo?: () => void;
  onOpenCommandBar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  healthScore,
  onResetDemo,
  onStartGuidedDemo,
  onOpenCommandBar
}) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/schedule', label: 'Schedule', icon: Calendar },
    { path: '/events', label: 'Events', icon: Clock },
    { path: '/availability', label: 'Availability', icon: Settings2 },
    { path: '/insights', label: 'Insights', icon: BarChart3 },
    { path: '/history', label: 'History', icon: History },
  ];

  const getHealthBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Left: Brand Logo & Tagline */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                  Replan
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 leading-none">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden xl:block font-medium mt-0.5">
                Adaptive Schedule Engine
              </p>
            </div>
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
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center space-x-1.5 shrink-0 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right: Actions Cluster */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Quick Command Bar Trigger */}
            <button
              onClick={onOpenCommandBar}
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-600 text-xs transition-all"
              title="Open Command Palette (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 text-xs hidden md:inline">Command...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white text-[9px] font-mono text-slate-500 border border-slate-200 shadow-xs">
                ⌘K
              </kbd>
            </button>

            {/* Health Score Pill */}
            {healthScore && (
              <div
                className={`hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${getHealthBadgeColor(
                  healthScore.overall
                )}`}
                title={`Safety: ${healthScore.deadline_safety}% | Conflict Free: ${healthScore.conflict_free}% | Preference: ${healthScore.preference_fulfillment}%`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Health {healthScore.overall}%</span>
              </div>
            )}

            {/* Interactive Demo Button */}
            <button
              onClick={onStartGuidedDemo}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all flex items-center space-x-1.5 shrink-0"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Interactive Demo</span>
              <span className="sm:hidden">Demo</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={onResetDemo}
              title="Reset canonical demo data"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Medium/Mobile Navigation Bar */}
        <div className="lg:hidden flex items-center justify-around py-2 border-t border-slate-200 overflow-x-auto space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`px-2 py-1 rounded-lg text-xs flex items-center space-x-1 shrink-0 ${
                  isActive ? 'text-indigo-700 bg-indigo-50 font-semibold border border-indigo-200' : 'text-slate-600 hover:text-slate-900'
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



