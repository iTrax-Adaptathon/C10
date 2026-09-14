import uuid
import copy
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware

from models import (
    Task, TaskCreate, Event, AvailabilityWindow, ReplanRequest,
    ReplanResponse, ScheduleResponse, ImpactAnalysis, HistoryEntry,
    ParseRequest, StrategyEnum, HealthScore, PreferredSlotsConfig
)
from database import db_instance
from scheduler import DeterministicScheduler, format_dt, parse_dt
from impact import calculate_impact
from nlp import parse_natural_language_task

app = FastAPI(
    title="Replan API",
    description="Intelligent Adaptive Scheduling Engine Backend",
    version="1.0.0"
)

# Enable CORS for local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "app": "Replan Backend",
        "tagline": "Plans change. Your schedule adapts.",
        "status": "operational",
        "mongo_connected": db_instance.use_mongo
    }

# --- Tasks API ---

@app.get("/tasks", response_model=List[Task])
def get_tasks():
    return db_instance.get_all_tasks()

@app.post("/tasks", response_model=Task)
def create_task(task_in: TaskCreate):
    new_task = Task(
        id=f"task-{uuid.uuid4().hex[:6]}",
        title=task_in.title,
        duration=task_in.duration,
        deadline=task_in.deadline,
        priority=task_in.priority,
        flexible=task_in.flexible,
        preferred_time=task_in.preferred_time,
        optional=task_in.optional,
        dependencies=task_in.dependencies
    )
    return db_instance.save_task(new_task)

@app.put("/tasks/{task_id}", response_model=Task)
def update_task(task_id: str, updated_task: Task):
    existing = db_instance.get_task(task_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_instance.save_task(updated_task)

@app.delete("/tasks/{task_id}")
def delete_task(task_id: str):
    success = db_instance.delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success", "deleted_id": task_id}

# --- Events API ---

@app.get("/events", response_model=List[Event])
def get_events():
    return db_instance.get_all_events()

@app.post("/events", response_model=Event)
def create_event(event: Event):
    if not event.id:
        event.id = f"evt-{uuid.uuid4().hex[:6]}"
    return db_instance.save_event(event)

@app.put("/events/{event_id}", response_model=Event)
def update_event(event_id: str, updated_event: Event):
    existing = db_instance.get_event(event_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Event not found")
    return db_instance.save_event(updated_event)

@app.delete("/events/{event_id}")
def delete_event(event_id: str):
    success = db_instance.delete_event(event_id)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"status": "success", "deleted_id": event_id}

# --- Availability API ---

@app.get("/availability", response_model=List[AvailabilityWindow])
def get_availability():
    return db_instance.get_all_availability()

@app.post("/availability", response_model=AvailabilityWindow)
def create_availability(avail: AvailabilityWindow):
    if not avail.id:
        avail.id = f"avail-{uuid.uuid4().hex[:6]}"
    return db_instance.save_availability(avail)

@app.put("/availability/{avail_id}", response_model=AvailabilityWindow)
def update_availability(avail_id: str, updated_avail: AvailabilityWindow):
    existing = db_instance.get_availability(avail_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Availability window not found")
    updated_avail.id = avail_id
    return db_instance.save_availability(updated_avail)

@app.delete("/availability/{avail_id}")
def delete_availability(avail_id: str):
    success = db_instance.delete_availability(avail_id)
    if not success:
        raise HTTPException(status_code=404, detail="Availability window not found")
    return {"status": "success", "deleted_id": avail_id}

# --- Preferred Slots API ---

@app.get("/preferred-slots", response_model=PreferredSlotsConfig)
def get_preferred_slots():
    return db_instance.get_preferred_slots()

@app.put("/preferred-slots", response_model=PreferredSlotsConfig)
def update_preferred_slots(config: PreferredSlotsConfig):
    return db_instance.save_preferred_slots(config)

# --- Scheduler API ---

@app.post("/schedule/generate", response_model=ScheduleResponse)
def generate_schedule(strategy: StrategyEnum = StrategyEnum.PROTECT_DEADLINES):
    tasks = db_instance.get_all_tasks()
    events = db_instance.get_all_events()
    avail = db_instance.get_all_availability()
    pref_slots = db_instance.get_preferred_slots()

    scheduler = DeterministicScheduler(tasks, events, avail, pref_slots)
    scheduled, unscheduled, health = scheduler.schedule(strategy=strategy)

    # Persist updated scheduled tasks back to DB
    all_processed = scheduled + unscheduled
    db_instance.update_tasks(all_processed)

    explanations = [
        f"Generated schedule using '{strategy.value}' strategy.",
        f"{len(scheduled)} tasks placed successfully, {len(unscheduled)} conflicting/unscheduled."
    ]

    return ScheduleResponse(
        scheduled_tasks=scheduled,
        unscheduled_tasks=unscheduled,
        events=events,
        health_score=health,
        explanations=explanations
    )

@app.post("/schedule/impact", response_model=ImpactAnalysis)
def analyze_schedule_impact(
    target_id: str = Body(...),
    new_start: str = Body(...),
    new_end: str = Body(...)
):
    tasks = db_instance.get_all_tasks()
    events = db_instance.get_all_events()

    impact = calculate_impact(
        target_item_id=target_id,
        new_start_str=new_start,
        new_end_str=new_end,
        current_tasks=tasks,
        current_events=events
    )
    return impact

@app.post("/schedule/replan", response_model=ReplanResponse)
def replan_schedule(req: ReplanRequest):
    # Capture before state
    before_tasks = copy.deepcopy(db_instance.get_all_tasks())
    
    # Update modified event if present in request
    if req.modified_event:
        db_instance.save_event(req.modified_event)

    tasks = db_instance.get_all_tasks()
    events = db_instance.get_all_events()
    avail = db_instance.get_all_availability()
    pref_slots = db_instance.get_preferred_slots()

    # Calculate initial health score before replan
    init_scheduler = DeterministicScheduler(before_tasks, events, avail, pref_slots)
    _, _, init_health = init_scheduler.schedule(strategy=req.strategy)

    # Run deterministic replan with selected trade-off strategy
    scheduler = DeterministicScheduler(tasks, events, avail, pref_slots)
    after_scheduled, after_unscheduled, new_health = scheduler.schedule(strategy=req.strategy)

    all_after = after_scheduled + after_unscheduled
    db_instance.update_tasks(all_after)

    # Calculate moved/modified tasks delta
    before_map = {t.id: t for t in before_tasks}
    moved_count = 0
    modified_details = []

    for t in all_after:
        old_t = before_map.get(t.id)
        if old_t:
            if old_t.scheduled_start != t.scheduled_start or old_t.scheduled_end != t.scheduled_end or old_t.status != t.status:
                moved_count += 1
                modified_details.append({
                    "task_id": t.id,
                    "title": t.title,
                    "old_start": old_t.scheduled_start,
                    "new_start": t.scheduled_start,
                    "old_end": old_t.scheduled_end,
                    "new_end": t.scheduled_end,
                    "old_status": old_t.status.value,
                    "new_status": t.status.value,
                    "reason": t.unscheduled_reason or f"Rescheduled under strategy '{req.strategy.value}'"
                })

    explanation = (
        f"Applied strategy '{req.strategy.value.upper()}'. "
        f"Preserved completed and pinned items. Shifted {moved_count} affected task(s) with minimal movement. "
        f"Schedule Health Score updated from {init_health.overall} to {new_health.overall}."
    )

    # Log to History
    history_entry = HistoryEntry(
        id=f"hist-{uuid.uuid4().hex[:6]}",
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        trigger=f"Event update ({req.modified_event.title if req.modified_event else 'Manual trigger'})",
        strategy=req.strategy,
        affected_tasks_count=moved_count,
        health_score_before=init_health.overall,
        health_score_after=new_health.overall,
        explanation=explanation
    )
    db_instance.add_history_entry(history_entry)

    return ReplanResponse(
        before_schedule=before_tasks,
        after_schedule=all_after,
        strategy_used=req.strategy,
        health_score=new_health,
        explanation=explanation,
        moved_count=moved_count,
        modified_tasks=modified_details
    )

@app.get("/schedule/history", response_model=List[HistoryEntry])
def get_schedule_history():
    return db_instance.get_history()

# --- NLP Task Parsing API ---

@app.post("/parse")
def parse_task_text(req: ParseRequest):
    parsed = parse_natural_language_task(req.text, req.reference_date)
    return parsed

# --- Demo Helper API ---

@app.post("/demo/reset")
def reset_demo():
    tasks, events, avail = db_instance.reset_demo_data()
    # Generate canonical schedule
    scheduler = DeterministicScheduler(tasks, events, avail)
    scheduled, unscheduled, health = scheduler.schedule(strategy=StrategyEnum.PROTECT_DEADLINES)
    db_instance.update_tasks(scheduled + unscheduled)
    return {
        "status": "success",
        "message": "Demo state reset to canonical prompt scenario.",
        "tasks": db_instance.get_all_tasks(),
        "events": db_instance.get_all_events(),
        "health_score": health
    }
