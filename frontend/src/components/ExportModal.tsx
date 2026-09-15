import React, { useState } from 'react';
import {
  Download,
  Calendar,
  Copy,
  Check,
  FileCode,
  Share2,
  X,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Task, Event } from '../types';
import { useToast } from '../context/ToastContext';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  events: Event[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  tasks,
  events
}) => {
  const { toast } = useToast();
  const [copiedStandup, setCopiedStandup] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  if (!isOpen) return null;

  // Format RFC 5545 iCalendar Date (YYYYMMDDTHHMMSSZ)
  const formatIcsDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      if (isNaN(d.getTime())) return '';
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    } catch {
      return '';
    }
  };

  // Generate .ICS file content
  const generateIcsContent = () => {
    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Replan Adaptive Schedule Engine//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Replan Adaptive Schedule'
    ];

    // Add Events
    events.forEach((evt) => {
      const dtStart = formatIcsDate(evt.start);
      const dtEnd = formatIcsDate(evt.end);
      if (dtStart && dtEnd) {
        ics.push(
          'BEGIN:VEVENT',
          `UID:replan-evt-${evt.id}@replan.app`,
          `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
          `DTSTART:${dtStart}`,
          `DTEND:${dtEnd}`,
          `SUMMARY:[Fixed Event] ${evt.title}`,
          `DESCRIPTION:Fixed calendar commitment (${evt.category || 'general'})`,
          'STATUS:CONFIRMED',
          'END:VEVENT'
        );
      }
    });

    // Add Scheduled Tasks
    tasks
      .filter((t) => t.scheduled_start && t.scheduled_end)
      .forEach((t) => {
        const dtStart = formatIcsDate(t.scheduled_start!);
        const dtEnd = formatIcsDate(t.scheduled_end!);
        if (dtStart && dtEnd) {
          ics.push(
            'BEGIN:VEVENT',
            `UID:replan-task-${t.id}@replan.app`,
            `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
            `DTSTART:${dtStart}`,
            `DTEND:${dtEnd}`,
            `SUMMARY:[Task] ${t.title}`,
            `DESCRIPTION:Priority: ${t.priority.toUpperCase()} | Duration: ${t.duration}m | Deadline: ${t.deadline}`,
            'STATUS:CONFIRMED',
            'END:VEVENT'
          );
        }
      });

    ics.push('END:VCALENDAR');
    return ics.join('\r\n');
  };

  const handleDownloadIcs = () => {
    const content = generateIcsContent();
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `replan_schedule_${new Date().toISOString().split('T')[0]}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast(
      'Calendar (.ics) Exported!',
      'Open the downloaded file to sync with Google Calendar, Outlook, or Apple Calendar.',
      'success'
    );
  };

  // Generate Daily Standup Markdown
  const generateStandupMarkdown = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    let md = `## 📅 Today's Adapted Schedule (${todayStr})\n\n`;

    md += `### 🔒 Fixed Commitments:\n`;
    events.forEach((e) => {
      md += `- **${e.start.split(' ')[1]} - ${e.end.split(' ')[1]}**: ${e.title}\n`;
    });

    md += `\n### ⚡ Focus & Tasks:\n`;
    const scheduled = tasks.filter((t) => t.scheduled_start);
    if (scheduled.length > 0) {
      scheduled.forEach((t) => {
        const time = t.scheduled_start ? t.scheduled_start.split(' ')[1] : '';
        const priorityBadge = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢';
        md += `- [ ] **${time}** (${t.duration}m) ${priorityBadge} ${t.title} *(Due: ${t.deadline.split(' ')[1] || t.deadline})*\n`;
      });
    } else {
      tasks.slice(0, 5).forEach((t) => {
        md += `- [ ] ${t.title} (${t.duration}m)\n`;
      });
    }

    md += `\n*Generated with Replan Schedule Adaptation Engine*`;
    return md;
  };

  const handleCopyStandup = async () => {
    const md = generateStandupMarkdown();
    await navigator.clipboard.writeText(md);
    setCopiedStandup(true);
    toast('Copied to Clipboard!', 'Daily standup markdown is ready to paste into Slack or Discord.', 'success');
    setTimeout(() => setCopiedStandup(false), 2500);
  };

  const handleCopyJson = async () => {
    const data = { tasks, events, exportDate: new Date().toISOString() };
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedJson(true);
    toast('JSON Copied!', 'Raw schedule snapshot copied to clipboard.', 'info');
    setTimeout(() => setCopiedJson(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="relative w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-yellow-500/30 text-neutral-100"
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white">Sync & Export Schedule</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Export your adapted schedule to calendars or team channels.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Options */}
        <div className="mt-6 space-y-3.5">
          {/* Option 1: .ICS iCalendar */}
          <div className="p-4 rounded-2xl bg-[#0d0d10] border border-neutral-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/15 text-yellow-400 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">iCalendar (.ics) File</h4>
                <p className="text-[11px] text-neutral-400">
                  Import into Google Calendar, Apple Calendar, or Outlook.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadIcs}
              className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black flex items-center gap-1.5 shadow-md shadow-yellow-400/20 transition-all shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>

          {/* Option 2: Daily Standup Markdown */}
          <div className="p-4 rounded-2xl bg-[#0d0d10] border border-neutral-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/15 text-yellow-400 flex items-center justify-center shrink-0">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Daily Standup Markdown</h4>
                <p className="text-[11px] text-neutral-400">
                  Formatted checklist for Slack, Discord, or status meetings.
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyStandup}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white text-xs font-bold border border-neutral-700 flex items-center gap-1.5 transition-all shrink-0"
            >
              {copiedStandup ? (
                <>
                  <Check className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-yellow-400 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Option 3: Raw JSON Snapshot */}
          <div className="p-4 rounded-2xl bg-[#0d0d10] border border-neutral-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/15 text-yellow-400 flex items-center justify-center shrink-0">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Schedule Snapshot (JSON)</h4>
                <p className="text-[11px] text-neutral-400">
                  Raw backup of all tasks, events, and timestamps.
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyJson}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white text-xs font-bold border border-neutral-700 flex items-center gap-1.5 transition-all shrink-0"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-yellow-400 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
