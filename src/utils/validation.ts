export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

export function isPhone(v: string): boolean {
  return /^\+?[0-9\s-]{9,15}$/.test(v.trim());
}

export function required(v: unknown): boolean {
  return v !== undefined && v !== null && String(v).trim().length > 0;
}

export function passwordIssues(pw: string): string[] {
  const issues: string[] = [];
  if (pw.length < 8) issues.push('At least 8 characters');
  if (!/[A-Za-z]/.test(pw)) issues.push('At least one letter');
  if (!/[0-9]/.test(pw)) issues.push('At least one number');
  return issues;
}
