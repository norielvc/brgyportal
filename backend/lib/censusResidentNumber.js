function normalizeCensusResidentNumber(value) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const stripped = raw.replace(/^#?\s*/i, "").replace(/^sr\s*/i, "");
  const digits = stripped.replace(/\D/g, "");
  if (!digits) return stripped;

  const num = parseInt(digits, 10);
  if (!Number.isFinite(num) || num < 0) return stripped;
  if (num > 99999) return String(num);

  return String(num).padStart(5, "0");
}

module.exports = { normalizeCensusResidentNumber };
