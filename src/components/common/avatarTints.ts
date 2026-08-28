/** Deterministic avatar tint set (brand-adjacent, WCAG-friendly). */
export interface AvatarTint {
  bg: string;
  border: string;
  fg: string;
}

export const BENTO_TINTS: AvatarTint[] = [
  { bg: '#DCEFE5', border: '#BFE0CF', fg: '#0B5D3B' },
  { bg: '#E4EDFA', border: '#CBDDF4', fg: '#1E4E8C' },
  { bg: '#FBEEDB', border: '#F5DCBB', fg: '#8A5A0B' },
  { bg: '#F3E4F5', border: '#E6CCEA', fg: '#6B2E77' },
  { bg: '#E0F0F2', border: '#C3E2E7', fg: '#0E6B77' },
  { bg: '#F7E3E0', border: '#F0C9C3', fg: '#933A2E' },
  { bg: '#E7E9F8', border: '#D0D4F0', fg: '#39418F' },
  { bg: '#E5F0DC', border: '#CCE3BB', fg: '#3E6B1F' },
];
