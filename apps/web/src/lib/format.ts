import type { Member } from "@family/core";
import { format, type Dictionary } from "@family/i18n";

/** Wrap in Unicode LTR isolates so "1905 – 1980" is not reversed inside Arabic text. */
export const ltr = (value: string) => (value ? `\u2066${value}\u2069` : value);

export const lifeSpan = (m: Member, dict: Dictionary) => {
  const from = m.birthYear ? String(m.birthYear) : "";
  const to = m.deathYear ? String(m.deathYear) : m.isDeceased ? "…" : "";
  if (from && to) return ltr(format(dict.common.yearsRange, { from, to }));
  if (to) return `${dict.common.died} ${ltr(to)}`;
  return from;
};

export const deceasedLabel = (m: Member, dict: Dictionary) =>
  m.gender === "female" ? dict.common.deceasedF : dict.common.deceased;
