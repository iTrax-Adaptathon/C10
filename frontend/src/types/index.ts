export type Priority = 'low' | 'medium' | 'high';
export type PreferredTime = 'any' | 'morning' | 'afternoon' | 'evening';
export type Strategy = 'protect_deadlines' | 'balance_workload' | 'protect_preferences';
export type TaskStatus = 'pending' | 'scheduled' | 'completed' | 'conflict';

export interface Task {
  id: string;
  title: string;
  duration: number; // minutes
  deadline: string;
  priority: Priority;
  flexible: boolean;
  preferred_time: PreferredTime;
  optional: boolean;
  dependencies: string[];
  status: TaskStatus;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  unscheduled_reason?: string | null;
  is_split?: boolean;
  parent_task_id?: string | null;
}

export interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  fixed: boolean;
  category?: string;
}

export interface AvailabilityWindow {
  id: string;
  day_of_week?: number | null;
  date_str?: string | null;
  start_time: string;
  end_time: string;
}

export interface TimeSlotRange {
  start_time: string;
  end_time: string;
}

export interface PreferredSlotsConfig {
  morning: TimeSlotRange;
  afternoon: TimeSlotRange;
  evening: TimeSlotRange;
}

export interface HealthScore {
  overall: number;
  deadline_safety: number;
  conflict_free: number;
  workload_balance: number;
  preference_fulfillment: number;
  analysis: string[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  status: string;
  detail: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

export interface ImpactAnalysis {
  target_id: string;
  target_title: string;
  directly_affected_tasks: string[];
  indirectly_affected_tasks: string[];
  displaced_blocks: Array<{
    task_id: string;
    task_title: string;
    original_start: string;
    original_end: string;
    reason: string;
  }>;
  deadline_risks: Array<{
    task_id: string;
    task_title: string;
    deadline: string;
    estimated_completion: string;
    severity: string;
    message: string;
  }>;
  preference_violations: Array<{
    task_id: string;
    task_title: string;
    preferred: string;
    message: string;
  }>;
  graph_nodes: GraphNode[];
  graph_edges: GraphEdge[];
  summary_text: string;
}

export interface ReplanResponse {
  before_schedule: Task[];
  after_schedule: Task[];
  strategy_used: Strategy;
  health_score: HealthScore;
  explanation: string;
  moved_count: number;
  modified_tasks: Array<{
    task_id: string;
    title: string;
    old_start?: string;
    new_start?: string;
    old_end?: string;
    new_end?: string;
    old_status: string;
    new_status: string;
    reason: string;
  }>;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  trigger: string;
  strategy: Strategy;
  affected_tasks_count: number;
  health_score_before: number;
  health_score_after: number;
  explanation: string;
}
