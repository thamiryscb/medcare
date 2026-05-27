function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function initialsFromName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function firstNameCode(name) {
  const normalized = normalizeText(name).replace(/[^a-z0-9]+/g, ' ').trim();
  const [first = 'paciente'] = normalized.split(/\s+/);
  return first.toUpperCase();
}

module.exports = { firstNameCode, initialsFromName, normalizeText };
