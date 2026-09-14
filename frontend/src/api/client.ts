import { Task, Event, AvailabilityWindow, ImpactAnalysis, ReplanResponse, Strategy, HealthScore, HistoryEntry } from '../types';

const API_BASE = '/api';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`Fetch to ${endpoint} failed, checking client-side fallback...`, err);
    throw err;
  }
}

export const api = {
  getTasks: async (): Promise<Task[]> => {
    return fetchJson<Task[]>('/tasks');
  },

  createTask: async (task: Omit<Task, 'id' | 'status'>): Promise<Task> => {
    return fetchJson<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  updateTask: async (task: Task): Promise<Task> => {
    return fetchJson<Task>(`/tasks/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  },

  deleteTask: async (id: string): Promise<void> => {
    return fetchJson<void>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  getEvents: async (): Promise<Event[]> => {
    return fetchJson<Event[]>('/events');
  },

  createEvent: async (event: Omit<Event, 'id'>): Promise<Event> => {
    return fetchJson<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },

  updateEvent: async (event: Event): Promise<Event> => {
    return fetchJson<Event>(`/events/${event.id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
  },

  deleteEvent: async (id: string): Promise<void> => {
    return fetchJson<void>(`/events/${id}`, {
      method: 'DELETE',
    });
  },

  getAvailability: async (): Promise<AvailabilityWindow[]> => {
    return fetchJson<AvailabilityWindow[]>('/availability');
  },

  generateSchedule: async (strategy: Strategy = 'protect_deadlines') => {
    return fetchJson<{
      scheduled_tasks: Task[];
      unscheduled_tasks: Task[];
      events: Event[];
      health_score: HealthScore;
      explanations: string[];
    }>(`/schedule/generate?strategy=${strategy}`, {
      method: 'POST',
    });
  },

  analyzeImpact: async (targetId: string, newStart: string, newEnd: string): Promise<ImpactAnalysis> => {
    return fetchJson<ImpactAnalysis>('/schedule/impact', {
      method: 'POST',
      body: JSON.stringify({
        target_id: targetId,
        new_start: newStart,
        new_end: newEnd,
      }),
    });
  },

  replanSchedule: async (strategy: Strategy, modifiedEvent?: Event): Promise<ReplanResponse> => {
    return fetchJson<ReplanResponse>('/schedule/replan', {
      method: 'POST',
      body: JSON.stringify({
        strategy,
        modified_event: modifiedEvent,
      }),
    });
  },

  getHistory: async (): Promise<HistoryEntry[]> => {
    return fetchJson<HistoryEntry[]>('/schedule/history');
  },

  parseTask: async (text: string) => {
    return fetchJson<{
      title: string;
      duration: number;
      deadline: string;
      priority: 'low' | 'medium' | 'high';
      flexible: boolean;
      preferred_time: string;
      optional: boolean;
      dependencies: string[];
    }>('/parse', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  resetDemo: async () => {
    return fetchJson<{
      status: string;
      message: string;
      tasks: Task[];
      events: Event[];
      health_score: HealthScore;
    }>('/demo/reset', {
      method: 'POST',
    });
  },
};
