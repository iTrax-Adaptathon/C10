from datetime import datetime, timedelta, time
from typing import List, Dict, Tuple, Optional, Set
import copy
from models import (
    Task, Event, AvailabilityWindow, TaskStatusEnum, PriorityEnum,
    PreferredTimeEnum, HealthScore, StrategyEnum
)

def parse_dt(dt_str: str) -> datetime:
    """Parses various ISO and standard date formats."""
    dt_str = dt_str.strip()
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(dt_str, fmt)
        except ValueError:
            pass
    try:
        return datetime.fromisoformat(dt_str)
    except Exception:
        return datetime.now()

def format_dt(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d %H:%M")

class Interval:
    def __init__(self, start: datetime, end: datetime, label: str = "free"):
        self.start = start
        self.end = end
        self.label = label

    @property
    def duration_minutes(self) -> float:
        return (self.end - self.start).total_seconds() / 60.0

    def __repr__(self):
        return f"Interval({format_dt(self.start)} -> {format_dt(self.end)}, '{self.label}')"

class DeterministicScheduler:
    def __init__(self, tasks: List[Task], events: List[Event], availability: List[AvailabilityWindow]):
        self.tasks = copy.deepcopy(tasks)
        self.events = copy.deepcopy(events)
        self.availability = copy.deepcopy(availability)

    def get_date_range(self) -> Tuple[datetime, datetime]:
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        # Look 7 days ahead by default
        max_date = today + timedelta(days=7)
        for t in self.tasks:
            try:
                td = parse_dt(t.deadline)
                if td > max_date:
                    max_date = td
            except Exception:
                pass
        return today, max_date

    def compute_free_intervals(self) -> List[Interval]:
        """Calculates available free time slots by taking availability and subtracting fixed events."""
        start_date, end_date = self.get_date_range()
        raw_intervals: List[Interval] = []

        # 1. Map availability to actual date windows
        curr_date = start_date
        while curr_date <= end_date:
            date_str = curr_date.strftime("%Y-%m-%d")
            # Find explicit availability or fallback to 08:00 - 22:00
            matching_avails = [a for a in self.availability if a.date_str == date_str]
            if not matching_avails:
                matching_avails = [a for a in self.availability if a.date_str is None]

            if matching_avails:
                for a in matching_avails:
                    try:
                        sh, sm = map(int, a.start_time.split(":"))
                        eh, em = map(int, a.end_time.split(":"))
                        win_start = curr_date.replace(hour=sh, minute=sm)
                        win_end = curr_date.replace(hour=eh, minute=em)
                        if win_end > win_start:
                            raw_intervals.append(Interval(win_start, win_end, "avail"))
                    except Exception:
                        pass
            else:
                win_start = curr_date.replace(hour=8, minute=0)
                win_end = curr_date.replace(hour=22, minute=0)
                raw_intervals.append(Interval(win_start, win_end, "avail"))

            curr_date += timedelta(days=1)

        # 2. Subtract fixed events
        free_intervals: List[Interval] = []
        fixed_event_intervals = []
        for e in self.events:
            try:
                st = parse_dt(e.start)
                et = parse_dt(e.end)
                if et > st:
                    fixed_event_intervals.append(Interval(st, et, e.title))
            except Exception:
                pass

        for avail in raw_intervals:
            curr_slots = [avail]
            for event_slot in fixed_event_intervals:
                next_slots = []
                for slot in curr_slots:
                    # Check overlap
                    if event_slot.end <= slot.start or event_slot.start >= slot.end:
                        next_slots.append(slot)
                    else:
                        # Overlap exists, split slot
                        if slot.start < event_slot.start:
                            next_slots.append(Interval(slot.start, event_slot.start, slot.label))
                        if slot.end > event_slot.end:
                            next_slots.append(Interval(event_slot.end, slot.end, slot.label))
                curr_slots = next_slots
            free_intervals.extend(curr_slots)

        # Filter out tiny intervals (< 15 mins) and sort
        free_intervals = [i for i in free_intervals if i.duration_minutes >= 15]
        free_intervals.sort(key=lambda x: x.start)
        return free_intervals

    def topological_sort_tasks(self, tasks_to_sort: List[Task]) -> List[Task]:
        """Topologically sorts tasks according to dependency constraints."""
        task_map = {t.id: t for t in tasks_to_sort}
        in_degree: Dict[str, int] = {t.id: 0 for t in tasks_to_sort}
        adj_list: Dict[str, List[str]] = {t.id: [] for t in tasks_to_sort}

        for t in tasks_to_sort:
            for dep_id in t.dependencies:
                if dep_id in task_map:
                    adj_list[dep_id].append(t.id)
                    in_degree[t.id] += 1

        # Priority queue / sort helper
        def task_sort_key(task_id: str):
            t = task_map[task_id]
            p_val = {"high": 3, "medium": 2, "low": 1}.get(t.priority, 1)
            d_val = parse_dt(t.deadline).timestamp()
            return (-p_val, d_val, t.duration)

        ready_queue = [t_id for t_id, deg in in_degree.items() if deg == 0]
        sorted_tasks = []

        while ready_queue:
            ready_queue.sort(key=task_sort_key)
            curr_id = ready_queue.pop(0)
            sorted_tasks.append(task_map[curr_id])

            for nxt_id in adj_list[curr_id]:
                in_degree[nxt_id] -= 1
                if in_degree[nxt_id] == 0:
                    ready_queue.append(nxt_id)

        # Append any cyclic tasks remaining
        scheduled_ids = {t.id for t in sorted_tasks}
        for t in tasks_to_sort:
            if t.id not in scheduled_ids:
                sorted_tasks.append(t)

        return sorted_tasks

    def matches_preference(self, start_dt: datetime, pref: PreferredTimeEnum) -> bool:
        if pref == PreferredTimeEnum.ANY:
            return True
        h = start_dt.hour
        if pref == PreferredTimeEnum.MORNING and 8 <= h < 12:
            return True
        if pref == PreferredTimeEnum.AFTERNOON and 12 <= h < 17:
            return True
        if pref == PreferredTimeEnum.EVENING and 17 <= h < 22:
            return True
        return False

    def schedule(self, strategy: StrategyEnum = StrategyEnum.PROTECT_DEADLINES) -> Tuple[List[Task], List[Task], HealthScore]:
        """Main deterministic scheduling solver."""
        free_intervals = self.compute_free_intervals()
        sorted_tasks = self.topological_sort_tasks(self.tasks)

        scheduled_tasks: List[Task] = []
        unscheduled_tasks: List[Task] = []
        end_times_map: Dict[str, datetime] = {}

        # Reset task statuses
        for t in sorted_tasks:
            t.status = TaskStatusEnum.PENDING
            t.scheduled_start = None
            t.scheduled_end = None
            t.unscheduled_reason = None

        # Strategy-specific adjustments
        if strategy == StrategyEnum.PROTECT_DEADLINES:
            # Under protect deadlines, prioritize tasks with upcoming deadlines and high priority
            sorted_tasks.sort(key=lambda t: (
                0 if t.priority == PriorityEnum.HIGH else (1 if t.priority == PriorityEnum.MEDIUM else 2),
                parse_dt(t.deadline).timestamp()
            ))

        for task in sorted_tasks:
            # 1. Determine earliest start time based on dependencies
            earliest_start = datetime.now()
            dep_failed = False
            for dep_id in task.dependencies:
                if dep_id in end_times_map:
                    if end_times_map[dep_id] > earliest_start:
                        earliest_start = end_times_map[dep_id]
                else:
                    # Prerequisite task was not scheduled successfully!
                    dep_failed = True
                    task.status = TaskStatusEnum.CONFLICT
                    task.unscheduled_reason = f"Prerequisite task ({dep_id}) could not be scheduled."
                    unscheduled_tasks.append(task)
                    break

            if dep_failed:
                continue

            deadline_dt = parse_dt(task.deadline)
            duration_mins = task.duration

            # 2. Search candidate free intervals
            placed = False

            # If strategy is Protect Preferences, search preferred intervals first
            candidate_intervals = list(free_intervals)
            if strategy == StrategyEnum.PROTECT_PREFERENCES and task.preferred_time != PreferredTimeEnum.ANY:
                pref_intervals = [i for i in candidate_intervals if self.matches_preference(i.start, task.preferred_time)]
                other_intervals = [i for i in candidate_intervals if not self.matches_preference(i.start, task.preferred_time)]
                candidate_intervals = pref_intervals + other_intervals

            for idx, slot in enumerate(candidate_intervals):
                # Calculate valid start within this slot
                actual_start = max(slot.start, earliest_start)
                actual_end = actual_start + timedelta(minutes=duration_mins)

                if actual_end <= slot.end and actual_end <= deadline_dt:
                    # Successfully placed task contiguously!
                    task.scheduled_start = format_dt(actual_start)
                    task.scheduled_end = format_dt(actual_end)
                    task.status = TaskStatusEnum.SCHEDULED
                    scheduled_tasks.append(task)
                    end_times_map[task.id] = actual_end
                    placed = True

                    # Update remaining free interval in original free_intervals list
                    for orig_idx, orig_slot in enumerate(free_intervals):
                        if orig_slot.start <= actual_start and orig_slot.end >= actual_end:
                            new_slots = []
                            if orig_slot.start < actual_start:
                                new_slots.append(Interval(orig_slot.start, actual_start, orig_slot.label))
                            if orig_slot.end > actual_end:
                                new_slots.append(Interval(actual_end, orig_slot.end, orig_slot.label))
                            free_intervals[orig_idx:orig_idx+1] = new_slots
                            break
                    break

            # Task splitting fallback if task is flexible and wasn't placed contiguously
            if not placed and task.flexible and duration_mins > 45:
                # Try splitting task into chunks of minimum 30 minutes
                rem_duration = duration_mins
                chunks = []
                temp_free = copy.deepcopy(free_intervals)

                for orig_idx, slot in enumerate(temp_free):
                    actual_start = max(slot.start, earliest_start)
                    avail_mins = (slot.end - actual_start).total_seconds() / 60.0

                    if avail_mins >= 30:
                        chunk_dur = min(rem_duration, int(avail_mins))
                        chunk_end = actual_start + timedelta(minutes=chunk_dur)

                        if chunk_end <= deadline_dt:
                            chunks.append((actual_start, chunk_end, chunk_dur))
                            rem_duration -= chunk_dur
                            earliest_start = chunk_end

                        if rem_duration <= 0:
                            break

                if rem_duration == 0 and chunks:
                    # Successfully split and scheduled!
                    task.scheduled_start = format_dt(chunks[0][0])
                    task.scheduled_end = format_dt(chunks[-1][1])
                    task.status = TaskStatusEnum.SCHEDULED
                    task.is_split = True
                    scheduled_tasks.append(task)
                    end_times_map[task.id] = chunks[-1][1]
                    placed = True

                    # Update free_intervals
                    for c_start, c_end, _ in chunks:
                        for orig_idx, orig_slot in enumerate(free_intervals):
                            if orig_slot.start <= c_start and orig_slot.end >= c_end:
                                new_slots = []
                                if orig_slot.start < c_start:
                                    new_slots.append(Interval(orig_slot.start, c_start, orig_slot.label))
                                if orig_slot.end > c_end:
                                    new_slots.append(Interval(c_end, orig_slot.end, orig_slot.label))
                                free_intervals[orig_idx:orig_idx+1] = new_slots
                                break

            if not placed:
                task.status = TaskStatusEnum.CONFLICT
                if task.optional and strategy == StrategyEnum.PROTECT_DEADLINES:
                    task.unscheduled_reason = "Deprioritized optional task to safeguard critical deadlines."
                else:
                    task.unscheduled_reason = f"No available free time window before deadline ({task.deadline})."
                unscheduled_tasks.append(task)

        health_score = self.compute_health_score(scheduled_tasks, unscheduled_tasks)
        return scheduled_tasks, unscheduled_tasks, health_score

    def compute_health_score(self, scheduled: List[Task], unscheduled: List[Task]) -> HealthScore:
        total_tasks = len(scheduled) + len(unscheduled)
        if total_tasks == 0:
            return HealthScore(
                overall=100,
                deadline_safety=100,
                conflict_free=100,
                workload_balance=100,
                preference_fulfillment=100,
                analysis=["All schedules clear and optimal."]
            )

        # 1. Deadline safety
        safe_count = 0
        for t in scheduled:
            if t.scheduled_end:
                end_dt = parse_dt(t.scheduled_end)
                dl_dt = parse_dt(t.deadline)
                if (dl_dt - end_dt).total_seconds() >= 1800: # 30 mins buffer
                    safe_count += 1
        deadline_safety = int((safe_count / max(1, len(scheduled))) * 100) if scheduled else 0

        # 2. Conflict free score
        conflict_free = 100 if len(unscheduled) == 0 else int(max(0, 100 - (len(unscheduled) * 25)))

        # 3. Workload balance (hours per day)
        daily_hours: Dict[str, float] = {}
        for t in scheduled:
            if t.scheduled_start:
                st = parse_dt(t.scheduled_start)
                d_str = st.strftime("%Y-%m-%d")
                daily_hours[d_str] = daily_hours.get(d_str, 0.0) + (t.duration / 60.0)

        if len(daily_hours) <= 1:
            workload_balance = 85
        else:
            hrs = list(daily_hours.values())
            avg = sum(hrs) / len(hrs)
            variance = sum((x - avg) ** 2 for x in hrs) / len(hrs)
            workload_balance = int(max(40, 100 - (variance * 10)))

        # 4. Preference fulfillment
        pref_met = 0
        for t in scheduled:
            if t.scheduled_start and t.preferred_time != PreferredTimeEnum.ANY:
                st = parse_dt(t.scheduled_start)
                if self.matches_preference(st, t.preferred_time):
                    pref_met += 1
            elif t.preferred_time == PreferredTimeEnum.ANY:
                pref_met += 1
        preference_fulfillment = int((pref_met / max(1, len(scheduled))) * 100) if scheduled else 100

        overall = int(
            0.35 * deadline_safety +
            0.35 * conflict_free +
            0.15 * workload_balance +
            0.15 * preference_fulfillment
        )

        analysis = []
        if len(unscheduled) > 0:
            analysis.append(f"{len(unscheduled)} task(s) could not be scheduled due to tight windows.")
        if deadline_safety < 100:
            analysis.append("Some tasks are scheduled close to their strict deadlines.")
        if preference_fulfillment == 100:
            analysis.append("100% of preferred time slots honored.")
        else:
            analysis.append(f"Preference score at {preference_fulfillment}%. Some tasks placed outside preferred slots.")

        return HealthScore(
            overall=overall,
            deadline_safety=deadline_safety,
            conflict_free=conflict_free,
            workload_balance=workload_balance,
            preference_fulfillment=preference_fulfillment,
            analysis=analysis
        )
