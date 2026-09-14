from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime, date

class PriorityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class PreferredTimeEnum(str, Enum):
    ANY = "any"
    MORNING = "morning"     # 08:00 - 12:00
    AFTERNOON = "afternoon" # 12:00 - 17:00
    EVENING = "evening"   # 17:00 - 22:00

class StrategyEnum(str, Enum):
    PROTECT_DEADLINES = "protect_deadlines"
    BALANCE_WORKLOAD = "balance_workload"
    PROTECT_PREFERENCES = "protect_preferences"

class TaskStatusEnum(str, Enum):
    PENDING = "pending"
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CONFLICT = "conflict"

# --- Core Entities ---

class Task(BaseModel):
    id: str
    title: str
    duration: int  # minutes
    deadline: str  # ISO string or YYYY-MM-DD HH:MM
    priority: PriorityEnum = PriorityEnum.MEDIUM
    flexible: bool = True
    preferred_time: PreferredTimeEnum = PreferredTimeEnum.ANY
    optional: bool = False
    dependencies: List[str] = Field(default_factory=list) # task IDs
    status: TaskStatusEnum = TaskStatusEnum.PENDING
    scheduled_start: Optional[str] = None # ISO format
    scheduled_end: Optional[str] = None   # ISO format
    unscheduled_reason: Optional[str] = None
    is_split: bool = False
    parent_task_id: Optional[str] = None

class TaskCreate(BaseModel):
    title: str
    duration: int
    deadline: str
    priority: PriorityEnum = PriorityEnum.MEDIUM
    flexible: bool = True
    preferred_time: PreferredTimeEnum = PreferredTimeEnum.ANY
    optional: bool = False
    dependencies: List[str] = Field(default_factory=list)

class Event(BaseModel):
    id: str
    title: str
    start: str  # ISO string YYYY-MM-DD HH:MM
    end: str    # ISO string YYYY-MM-DD HH:MM
    fixed: bool = True
    category: Optional[str] = "general"

class AvailabilityWindow(BaseModel):
    id: str
    day_of_week: Optional[int] = None # 0=Mon, 6=Sun or None for specific date
    date_str: Optional[str] = None # YYYY-MM-DD
    start_time: str # HH:MM (e.g., "08:00")
    end_time: str   # HH:MM (e.g., "22:00")

# --- Impact Analysis & Tradeoff ---

class GraphNode(BaseModel):
    id: str
    label: str
    type: str # 'event' | 'task'
    status: str # 'changed' | 'direct_impact' | 'indirect_impact' | 'unaffected'
    detail: str

class GraphEdge(BaseModel):
    source: str
    target: str
    label: str

class ImpactAnalysis(BaseModel):
    target_id: str
    target_title: str
    directly_affected_tasks: List[str]
    indirectly_affected_tasks: List[str]
    displaced_blocks: List[Dict[str, Any]]
    deadline_risks: List[Dict[str, Any]]
    preference_violations: List[Dict[str, Any]]
    graph_nodes: List[GraphNode]
    graph_edges: List[GraphEdge]
    summary_text: str

class ReplanRequest(BaseModel):
    strategy: StrategyEnum
    modified_event: Optional[Event] = None
    tasks: Optional[List[Task]] = None
    events: Optional[List[Event]] = None
    pin_completed: bool = True

class HealthScore(BaseModel):
    overall: int # 0 to 100
    deadline_safety: int
    conflict_free: int
    workload_balance: int
    preference_fulfillment: int
    analysis: List[str]

class ScheduleResponse(BaseModel):
    scheduled_tasks: List[Task]
    unscheduled_tasks: List[Task]
    events: List[Event]
    health_score: HealthScore
    explanations: List[str]

class ReplanResponse(BaseModel):
    before_schedule: List[Task]
    after_schedule: List[Task]
    strategy_used: StrategyEnum
    health_score: HealthScore
    explanation: str
    moved_count: int
    modified_tasks: List[Dict[str, Any]]

class HistoryEntry(BaseModel):
    id: str
    timestamp: str
    trigger: str
    strategy: StrategyEnum
    affected_tasks_count: int
    health_score_before: int
    health_score_after: int
    explanation: str

class ParseRequest(BaseModel):
    text: str
    reference_date: Optional[str] = None
