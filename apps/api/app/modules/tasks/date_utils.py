import re
from datetime import date, datetime, timedelta, time
from zoneinfo import ZoneInfo


MONTHS = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}


def local_today(timezone: str | None) -> date:
    try:
        tz = ZoneInfo(timezone or "UTC")
    except Exception:
        tz = ZoneInfo("UTC")
    return datetime.now(tz).date()


def resolve_task_date(message: str, timezone: str | None = "UTC") -> date:
    text = message.lower().strip()
    today = local_today(timezone)

    if "yesterday" in text:
        return today - timedelta(days=1)

    if "tomorrow" in text:
        return today + timedelta(days=1)

    if "today" in text:
        return today

    month_day = re.search(
        r"\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})\b",
        text,
    )
    if month_day:
        month = MONTHS[month_day.group(1)]
        day = int(month_day.group(2))
        return date(today.year, month, day)

    day_month = re.search(
        r"\b(\d{1,2})\s+(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\b",
        text,
    )
    if day_month:
        day = int(day_month.group(1))
        month = MONTHS[day_month.group(2)]
        return date(today.year, month, day)

    return today


def should_filter_created_at(message: str) -> bool:
    text = message.lower()
    return any(token in text for token in ["saved", "added", "created", "logged", "captured"])


def utc_day_range_for_created_at(target: date, timezone: str | None = "UTC"):
    try:
        tz = ZoneInfo(timezone or "UTC")
    except Exception:
        tz = ZoneInfo("UTC")
    start_local = datetime.combine(target, time.min, tzinfo=tz)
    end_local = start_local + timedelta(days=1)
    return (
        start_local.astimezone(ZoneInfo("UTC")),
        end_local.astimezone(ZoneInfo("UTC")),
    )
