let counter = 0;

/** Collision-safe id for demo/local entities (Firestore path uses crypto.randomUUID). */
export function uid(prefix = ''): string {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}${Date.now().toString(36)}${counter.toString(36)}${rand}`;
}

export function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return uid();
  }
}
