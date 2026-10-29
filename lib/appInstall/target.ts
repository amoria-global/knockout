/**
 * A page that knows which app screen matches it (an event page knows its event id) registers that route here, and the
 * wizard's "Open in the app" button uses it. Nothing registered means the app opens on its home screen.
 */
let target: string | null = null;
const listeners = new Set<() => void>();

export function setAppTarget(path: string | null): void {
  if (target === path) return;
  target = path;
  listeners.forEach((l) => l());
}

export function getAppTarget(): string | null {
  return target;
}

export function subscribeAppTarget(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
