import re
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from models import PriorityEnum, PreferredTimeEnum

def parse_natural_language_task(text: str, reference_date: Optional[str] = None) -> Dict[str, Any]:
    """Parses natural language task inputs into structured parameters."""
    ref_dt = datetime.now()
    if reference_date:
        try:
            ref_dt = datetime.fromisoformat(reference_date)
        except Exception:
            pass

    clean_text = text.strip()
    
    # 1. Duration Extraction
    duration = 60 # default 1 hour
    dur_match = re.search(r'(?:for\s+)?(\d+(?:\.\d+)?)\s*(?:hours|hour|hrs|hr)', clean_text, re.IGNORECASE)
    if dur_match:
        duration = int(float(dur_match.group(1)) * 60)
        clean_text = re.sub(r'(?:for\s+)?(\d+(?:\.\d+)?)\s*(?:hours|hour|hrs|hr)', '', clean_text, flags=re.IGNORECASE)
    else:
        dur_match_m = re.search(r'(?:for\s+)?(\d+)\s*(?:minutes|minute|mins|min)', clean_text, re.IGNORECASE)
        if dur_match_m:
            duration = int(dur_match_m.group(1))
            clean_text = re.sub(r'(?:for\s+)?(\d+)\s*(?:minutes|minute|mins|min)', '', clean_text, flags=re.IGNORECASE)

    # 2. Priority Extraction
    priority = PriorityEnum.MEDIUM
    if re.search(r'\b(high|urgent|critical|important)\b', clean_text, re.IGNORECASE):
        priority = PriorityEnum.HIGH
        clean_text = re.sub(r'\b(high|urgent|critical|important)\b\s*(priority)?', '', clean_text, flags=re.IGNORECASE)
    elif re.search(r'\b(low|trivial)\b', clean_text, re.IGNORECASE):
        priority = PriorityEnum.LOW
        clean_text = re.sub(r'\b(low|trivial)\b\s*(priority)?', '', clean_text, flags=re.IGNORECASE)

    # 3. Optional Flag
    optional = False
    if re.search(r'\b(optional|if possible|maybe)\b', clean_text, re.IGNORECASE):
        optional = True
        clean_text = re.sub(r'\b(optional|if possible|maybe)\b', '', clean_text, flags=re.IGNORECASE)

    # 4. Preferred Time Extraction
    preferred_time = PreferredTimeEnum.ANY
    if re.search(r'\b(morning|in the morning)\b', clean_text, re.IGNORECASE):
        preferred_time = PreferredTimeEnum.MORNING
        clean_text = re.sub(r'\b(morning|in the morning)\b', '', clean_text, flags=re.IGNORECASE)
    elif re.search(r'\b(afternoon|in the afternoon)\b', clean_text, re.IGNORECASE):
        preferred_time = PreferredTimeEnum.AFTERNOON
        clean_text = re.sub(r'\b(afternoon|in the afternoon)\b', '', clean_text, flags=re.IGNORECASE)
    elif re.search(r'\b(evening|night|in the evening)\b', clean_text, re.IGNORECASE):
        preferred_time = PreferredTimeEnum.EVENING
        clean_text = re.sub(r'\b(evening|night|in the evening)\b', '', clean_text, flags=re.IGNORECASE)

    # 5. Deadline Extraction
    deadline_dt = ref_dt + timedelta(days=1) # default tomorrow 18:00
    deadline_dt = deadline_dt.replace(hour=18, minute=0, second=0, microsecond=0)

    if re.search(r'\btomorrow\b', clean_text, re.IGNORECASE):
        target_day = ref_dt + timedelta(days=1)
        if preferred_time == PreferredTimeEnum.EVENING:
            deadline_dt = target_day.replace(hour=20, minute=0)
        else:
            deadline_dt = target_day.replace(hour=18, minute=0)
        clean_text = re.sub(r'\b(before|by)?\s*tomorrow\s*(morning|afternoon|evening)?\b', '', clean_text, flags=re.IGNORECASE)
    elif re.search(r'\btoday\b', clean_text, re.IGNORECASE):
        deadline_dt = ref_dt.replace(hour=22, minute=0)
        clean_text = re.sub(r'\b(before|by)?\s*today\b', '', clean_text, flags=re.IGNORECASE)
    elif re.search(r'\bfriday\b', clean_text, re.IGNORECASE):
        days_ahead = (4 - ref_dt.weekday()) % 7
        if days_ahead == 0:
            days_ahead = 7
        deadline_dt = (ref_dt + timedelta(days=days_ahead)).replace(hour=20, minute=0)
        clean_text = re.sub(r'\b(before|by)?\s*friday\b', '', clean_text, flags=re.IGNORECASE)

    # 6. Title Extraction
    title = clean_text.strip()
    title = re.sub(r'^(finish|do|complete|study|write|submit)\s+', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s+for\s*$', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s+before\s*$', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s+', ' ', title).strip()

    if not title:
        title = text.strip()

    # Capitalize title
    title = title[0].upper() + title[1:] if len(title) > 0 else "New Task"

    return {
        "title": title,
        "duration": duration,
        "deadline": deadline_dt.strftime("%Y-%m-%d %H:%M"),
        "priority": priority,
        "flexible": True,
        "preferred_time": preferred_time,
        "optional": optional,
        "dependencies": []
    }
