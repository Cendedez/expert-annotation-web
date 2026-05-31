import type { AnnotationStore, AnnotatorId } from "./types";

export type SyncState = "idle" | "syncing" | "synced" | "offline" | "disabled";

// Pull the server store for an annotator.
// Returns: { store } on success, null if disabled/unavailable.
export async function pullStore(
  annotator: AnnotatorId
): Promise<AnnotationStore | null> {
  try {
    const res = await fetch(`/api/annotations?annotator=${annotator}`, {
      method: "GET",
      cache: "no-store",
    });
    if (res.status === 503) return null; // sync disabled
    if (!res.ok) return null;
    const data = await res.json();
    return (data.store as AnnotationStore | null) ?? null;
  } catch {
    return null;
  }
}

// Push a store to the server. Server merges and returns the merged store.
// Returns merged store on success, null if disabled/unavailable.
export async function pushStore(
  annotator: AnnotatorId,
  store: AnnotationStore
): Promise<AnnotationStore | null> {
  try {
    const res = await fetch(`/api/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ annotator, store }),
    });
    if (res.status === 503) return null;
    if (!res.ok) return null;
    const data = await res.json();
    return (data.store as AnnotationStore | null) ?? null;
  } catch {
    return null;
  }
}

// Fetch live progress for all annotators.
export async function fetchProgress(): Promise<
  Record<string, { completed: number; updated_at: string | null }> | null
> {
  try {
    const res = await fetch(`/api/progress`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.progress ?? null;
  } catch {
    return null;
  }
}
