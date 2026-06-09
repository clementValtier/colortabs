export const HEX_RE = /^#[0-9a-fA-F]{6}$/;
export const isValidHex  = v => HEX_RE.test(v);
export const normalizeHex = v => { const s = v.trim(); return s.startsWith('#') ? s : `#${s}`; };

export function contrastColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000000' : '#ffffff';
}

export function findMatchingEntry(host, mappings) {
  const exact = mappings.find(m => !m.isRegex && m.pattern === host);
  if (exact) return { ...exact, isExact: true };
  for (const m of mappings) {
    if (!m.isRegex) continue;
    try {
      if (new RegExp(m.pattern).test(host)) return { ...m, isExact: false };
    } catch { /* invalid regex */ }
  }
  return null;
}
