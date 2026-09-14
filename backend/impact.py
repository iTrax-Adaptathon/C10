from typing import List, Dict, Any, Tuple
from datetime import datetime
from models import (
    Task, Event, ImpactAnalysis, GraphNode, GraphEdge, PreferredTimeEnum
)
from scheduler import parse_dt, format_dt, DeterministicScheduler

def calculate_impact(
    target_item_id: str,
    new_start_str: str,
    new_end_str: str,
    current_tasks: List[Task],
    current_events: List[Event]
) -> ImpactAnalysis:
    """Computes direct and indirect impacts, deadline risks, displaced blocks, and graph visualization."""
    
    # 1. Locate modified item
    target_title = "Modified Item"
    target_is_event = False
    for e in current_events:
        if e.id == target_item_id:
            target_title = e.title
            target_is_event = True
            break
    if not target_is_event:
        for t in current_tasks:
            if t.id == target_item_id:
                target_title = t.title
                break

    new_st = parse_dt(new_start_str)
    new_et = parse_dt(new_end_str)

    directly_affected_ids: List[str] = []
    displaced_blocks: List[Dict[str, Any]] = []

    # Check direct overlaps with scheduled tasks
    for t in current_tasks:
        if t.id == target_item_id:
            continue
        if t.scheduled_start and t.scheduled_end:
            t_st = parse_dt(t.scheduled_start)
            t_et = parse_dt(t.scheduled_end)

            # Check interval overlap
            if max(new_st, t_st) < min(new_et, t_et):
                directly_affected_ids.append(t.id)
                displaced_blocks.append({
                    "task_id": t.id,
                    "task_title": t.title,
                    "original_start": t.scheduled_start,
                    "original_end": t.scheduled_end,
                    "reason": f"Directly overlaps with updated '{target_title}' ({new_start_str} - {new_end_str})"
                })

    # Calculate indirect dependency cascades
    indirectly_affected_ids: List[str] = []
    task_map = {t.id: t for t in current_tasks}

    queue = list(directly_affected_ids)
    visited = set(directly_affected_ids)

    while queue:
        curr_id = queue.pop(0)
        # Find tasks that depend on curr_id
        for t in current_tasks:
            if curr_id in t.dependencies and t.id not in visited and t.id != target_item_id:
                indirectly_affected_ids.append(t.id)
                visited.add(t.id)
                queue.append(t.id)

    # Deadline risks & Preference violations estimation
    deadline_risks: List[Dict[str, Any]] = []
    preference_violations: List[Dict[str, Any]] = []

    for t_id in visited:
        if t_id in task_map:
            t = task_map[t_id]
            dl_dt = parse_dt(t.deadline)

            # Estimate shift delay
            shift_minutes = (new_et - new_st).total_seconds() / 60.0
            if t.scheduled_end:
                est_end = parse_dt(t.scheduled_end) + (new_et - new_st)
                if est_end > dl_dt:
                    deadline_risks.append({
                        "task_id": t.id,
                        "task_title": t.title,
                        "deadline": t.deadline,
                        "estimated_completion": format_dt(est_end),
                        "severity": "high",
                        "message": f"High Risk: Shifted task may miss deadline of {t.deadline}"
                    })
                elif (dl_dt - est_end).total_seconds() < 3600:
                    deadline_risks.append({
                        "task_id": t.id,
                        "task_title": t.title,
                        "deadline": t.deadline,
                        "estimated_completion": format_dt(est_end),
                        "severity": "medium",
                        "message": f"Tight Window: Shifted completion is within 1h of deadline ({t.deadline})"
                    })

            if t.preferred_time != PreferredTimeEnum.ANY:
                preference_violations.append({
                    "task_id": t.id,
                    "task_title": t.title,
                    "preferred": t.preferred_time.value,
                    "message": f"Task preferred in {t.preferred_time.value} may be displaced into a non-preferred time slot."
                })

    # Build Graph representation
    nodes: List[GraphNode] = []
    edges: List[GraphEdge] = []

    # Node for trigger item
    nodes.append(GraphNode(
        id=target_item_id,
        label=target_title,
        type="event" if target_is_event else "task",
        status="changed",
        detail=f"Moved to {new_start_str} - {new_end_str}"
    ))

    # Directly affected nodes
    for dir_id in directly_affected_ids:
        t = task_map.get(dir_id)
        if t:
            nodes.append(GraphNode(
                id=t.id,
                label=t.title,
                type="task",
                status="direct_impact",
                detail=f"Overlapped (Original: {t.scheduled_start})"
            ))
            edges.append(GraphEdge(
                source=target_item_id,
                target=t.id,
                label="Overlaps"
            ))

    # Indirectly affected nodes
    for indir_id in indirectly_affected_ids:
        t = task_map.get(indir_id)
        if t:
            nodes.append(GraphNode(
                id=t.id,
                label=t.title,
                type="task",
                status="indirect_impact",
                detail="Dependency chain shift"
            ))
            # Find parent in visited
            for parent_id in t.dependencies:
                if parent_id in visited or parent_id == target_item_id:
                    edges.append(GraphEdge(
                        source=parent_id,
                        target=t.id,
                        label="Depends on"
                    ))

    summary = (
        f"Moving '{target_title}' directly displaces {len(directly_affected_ids)} task(s) "
        f"and indirectly affects {len(indirectly_affected_ids)} dependent task(s). "
        f"{len(deadline_risks)} deadline risk(s) detected."
    )

    return ImpactAnalysis(
        target_id=target_item_id,
        target_title=target_title,
        directly_affected_tasks=directly_affected_ids,
        indirectly_affected_tasks=indirectly_affected_ids,
        displaced_blocks=displaced_blocks,
        deadline_risks=deadline_risks,
        preference_violations=preference_violations,
        graph_nodes=nodes,
        graph_edges=edges,
        summary_text=summary
    )
