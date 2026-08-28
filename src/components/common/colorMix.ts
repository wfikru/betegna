/** Blend two hex colors (t = weight of colorA). */
export function mixHex(a: string, b: string, t: number): string {
  const pa = a.replace('#', '');
  const pb = b.replace('#', '');
  const ch = (s: string, i: number) => parseInt(s.slice(i, i + 2), 16);
  const r = Math.round(ch(pa, 0) * t + ch(pb, 0) * (1 - t));
  const g = Math.round(ch(pa, 2) * t + ch(pb, 2) * (1 - t));
  const bl = Math.round(ch(pa, 4) * t + ch(pb, 4) * (1 - t));
  return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
