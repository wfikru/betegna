/**
 * One-shot "which tab should the fresh shell open on" hint, consumed by the
 * tab navigators when they mount after a role switch. Prevents the remounted
 * navigator from rehydrating whatever stack state the browser history holds.
 */
let landing: string | null = null;

export function setRoleLanding(tab: string | null): void {
  landing = tab;
}

export function consumeRoleLanding(): string | null {
  const value = landing;
  landing = null;
  return value;
}
