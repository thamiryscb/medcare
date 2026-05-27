const CHECKLIST_ID_SEPARATOR = '__';

function pad(value) {
  return String(value).padStart(2, '0');
}

function todayLocalDate() {
  return toLocalDateString(new Date());
}

function toLocalDateString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toLocalDateString(date);
}

function normalizeDate(value) {
  if (!value) return todayLocalDate();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  throw new Error('Date must use YYYY-MM-DD format');
}

function nowIso() {
  return new Date().toISOString();
}

function compareTime(left, right) {
  return left.localeCompare(right);
}

function buildChecklistItemId(date, medicationId, scheduleId) {
  return [date, medicationId, scheduleId].join(CHECKLIST_ID_SEPARATOR);
}

function parseChecklistItemId(itemId) {
  const parts = String(itemId || '').split(CHECKLIST_ID_SEPARATOR);
  if (parts.length !== 3) {
    throw new Error('Invalid checklist item id');
  }

  return {
    date: parts[0],
    medicationId: parts[1],
    scheduleId: parts[2],
  };
}

module.exports = {
  addDays,
  buildChecklistItemId,
  compareTime,
  normalizeDate,
  nowIso,
  parseChecklistItemId,
  todayLocalDate,
  toLocalDateString,
};
