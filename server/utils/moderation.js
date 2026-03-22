const FLAGGED_TERMS = [
  "nude",
  "explicit",
  "minor",
  "underage",
  "rape",
  "kill",
  "doxx",
];

export function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function getModerationFlags(message) {
  const normalized = normalizeText(message).toLowerCase();
  const matchedTerms = FLAGGED_TERMS.filter((term) => normalized.includes(term));

  return {
    blocked: matchedTerms.length > 0,
    matchedTerms,
  };
}
