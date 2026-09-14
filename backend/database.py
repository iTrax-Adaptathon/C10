import os
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from models import Task, Event, AvailabilityWindow, TaskStatusEnum, PriorityEnum, PreferredTimeEnum, HistoryEntry, PreferredSlotsConfig

# Pre-populated canonical demo data
def get_canonical_demo_data():
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_str = today.strftime("%Y-%m-%d")
    tomorrow_str = (today + timedelta(days=1)).strftime("%Y-%m-%d")
    friday = today + timedelta(days=(4 - today.weekday()) % 7)
    friday_str = friday.strftime("%Y-%m-%d")

    events = [
        Event(
            id="evt-college",
            title="College",
            start=f"{today_str} 09:00",
            end=f"{today_str} 16:00",
            fixed=True,
            category="education"
        ),
        Event(
            id="evt-team-meeting",
            title="Team Meeting",
            start=f"{today_str} 18:00",
            end=f"{today_str} 19:00",
            fixed=True,
            category="work"
        )
    ]

    tasks = [
        Task(
            id="task-research",
            title="Research",
            duration=60,
            deadline=f"{today_str} 17:00",
            priority=PriorityEnum.HIGH,
            flexible=True,
            preferred_time=PreferredTimeEnum.MORNING,
            optional=False,
            dependencies=[],
            status=TaskStatusEnum.PENDING
        ),
        Task(
            id="task-electronics",
            title="Electronics Assignment",
            duration=120,
            deadline=f"{tomorrow_str} 18:00",
            priority=PriorityEnum.HIGH,
            flexible=True,
            preferred_time=PreferredTimeEnum.AFTERNOON,
            optional=False,
            dependencies=["task-research"],
            status=TaskStatusEnum.PENDING
        ),
        Task(
            id="task-submit",
            title="Submit Assignment",
            duration=30,
            deadline=f"{tomorrow_str} 20:00",
            priority=PriorityEnum.HIGH,
            flexible=True,
            preferred_time=PreferredTimeEnum.EVENING,
            optional=False,
            dependencies=["task-electronics"],
            status=TaskStatusEnum.PENDING
        ),
        Task(
            id="task-physics",
            title="Physics Revision",
            duration=60,
            deadline=f"{friday_str} 20:00",
            priority=PriorityEnum.MEDIUM,
            flexible=True,
            preferred_time=PreferredTimeEnum.AFTERNOON,
            optional=False,
            dependencies=[],
            status=TaskStatusEnum.PENDING
        ),
        Task(
            id="task-gym",
            title="Gym",
            duration=60,
            deadline=f"{today_str} 22:00",
            priority=PriorityEnum.LOW,
            flexible=True,
            preferred_time=PreferredTimeEnum.EVENING,
            optional=True,
            dependencies=[],
            status=TaskStatusEnum.PENDING
        )
    ]

    availability = [
        AvailabilityWindow(
            id="avail-default",
            day_of_week=None,
            date_str=today_str,
            start_time="08:00",
            end_time="22:00"
        ),
        AvailabilityWindow(
            id="avail-tomorrow",
            day_of_week=None,
            date_str=tomorrow_str,
            start_time="08:00",
            end_time="22:00"
        )
    ]

    return tasks, events, availability

class Database:
    def __init__(self):
        self.use_mongo = False
        self.mongo_client = None
        self.db = None
        
        # Try initializing MongoDB if MONGODB_URI is configured
        mongo_uri = os.environ.get("MONGODB_URI")
        if mongo_uri:
            try:
                from pymongo import MongoClient
                self.mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
                self.mongo_client.server_info()
                self.db = self.mongo_client["replan_db"]
                self.use_mongo = True
                print("Connected to MongoDB successfully.")
            except Exception as e:
                print(f"MongoDB connection failed: {e}. Falling back to In-Memory store.")
                self.use_mongo = False

        # In-Memory fallback store
        t, e, a = get_canonical_demo_data()
        self.in_memory_tasks: Dict[str, Task] = {task.id: task for task in t}
        self.in_memory_events: Dict[str, Event] = {evt.id: evt for evt in e}
        self.in_memory_availability: Dict[str, AvailabilityWindow] = {avail.id: avail for avail in a}
        self.in_memory_history: List[HistoryEntry] = []

    def reset_demo_data(self):
        t, e, a = get_canonical_demo_data()
        self.in_memory_tasks = {task.id: task for task in t}
        self.in_memory_events = {evt.id: evt for evt in e}
        self.in_memory_availability = {avail.id: avail for avail in a}
        self.in_memory_history = []
        return self.get_all_tasks(), self.get_all_events(), self.get_all_availability()

    # Tasks CRUD
    def get_all_tasks(self) -> List[Task]:
        return list(self.in_memory_tasks.values())

    def get_task(self, task_id: str) -> Optional[Task]:
        return self.in_memory_tasks.get(task_id)

    def save_task(self, task: Task) -> Task:
        self.in_memory_tasks[task.id] = task
        return task

    def update_tasks(self, tasks: List[Task]):
        for t in tasks:
            self.in_memory_tasks[t.id] = t

    def delete_task(self, task_id: str) -> bool:
        if task_id in self.in_memory_tasks:
            del self.in_memory_tasks[task_id]
            return True
        return False

    # Events CRUD
    def get_all_events(self) -> List[Event]:
        return list(self.in_memory_events.values())

    def get_event(self, event_id: str) -> Optional[Event]:
        return self.in_memory_events.get(event_id)

    def save_event(self, event: Event) -> Event:
        self.in_memory_events[event.id] = event
        return event

    def delete_event(self, event_id: str) -> bool:
        if event_id in self.in_memory_events:
            del self.in_memory_events[event_id]
            return True
        return False

    # Availability CRUD
    def get_all_availability(self) -> List[AvailabilityWindow]:
        return list(self.in_memory_availability.values())

    def get_availability(self, avail_id: str) -> Optional[AvailabilityWindow]:
        return self.in_memory_availability.get(avail_id)

    def save_availability(self, avail: AvailabilityWindow) -> AvailabilityWindow:
        if not avail.id:
            avail.id = f"avail-{uuid.uuid4().hex[:6]}"
        self.in_memory_availability[avail.id] = avail
        return avail

    def delete_availability(self, avail_id: str) -> bool:
        if avail_id in self.in_memory_availability:
            del self.in_memory_availability[avail_id]
            return True
        return False

    # Preferred Slots CRUD
    def get_preferred_slots(self) -> PreferredSlotsConfig:
        if not hasattr(self, 'in_memory_preferred_slots') or self.in_memory_preferred_slots is None:
            self.in_memory_preferred_slots = PreferredSlotsConfig()
        return self.in_memory_preferred_slots

    def save_preferred_slots(self, config: PreferredSlotsConfig) -> PreferredSlotsConfig:
        self.in_memory_preferred_slots = config
        return config

    # History CRUD
    def get_history(self) -> List[HistoryEntry]:
        return sorted(self.in_memory_history, key=lambda x: x.timestamp, reverse=True)

    def add_history_entry(self, entry: HistoryEntry):
        self.in_memory_history.append(entry)

db_instance = Database()
