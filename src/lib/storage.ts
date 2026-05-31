import type {
  AnnotationRecord,
  AnnotationStore,
  AnnotatorId,
  AspectKey,
  SentimentLabel,
} from "./types";
import { ASPECTS, STORAGE_VERSION, storageKeyFor, ACTIVE_USER_KEY } from "./constants";

export function emptyLabels(): Record<AspectKey, SentimentLabel> {
  const labels = {} as Record<AspectKey, SentimentLabel>;
  for (const a of ASPECTS) labels[a] = "None";
  return labels;
}

export function emptyRecord(): AnnotationRecord {
  return { labels: emptyLabels(), saved: false, annotated_at: null };
}

export function emptyStore(annotator: AnnotatorId): AnnotationStore {
  return {
    annotator_id: annotator,
    version: STORAGE_VERSION,
    records: {},
    updated_at: new Date().toISOString(),
  };
}

export function loadStore(annotator: AnnotatorId): AnnotationStore {
  if (typeof window === "undefined") return emptyStore(annotator);
  try {
    const raw = window.localStorage.getItem(storageKeyFor(annotator));
    if (!raw) return emptyStore(annotator);
    const parsed = JSON.parse(raw) as AnnotationStore;
    if (!parsed || typeof parsed !== "object" || !parsed.records) {
      return emptyStore(annotator);
    }
    return parsed;
  } catch {
    return emptyStore(annotator);
  }
}

export function saveStore(store: AnnotationStore): void {
  if (typeof window === "undefined") return;
  store.updated_at = new Date().toISOString();
  window.localStorage.setItem(storageKeyFor(store.annotator_id), JSON.stringify(store));
}

export function getRecord(store: AnnotationStore, reviewId: string): AnnotationRecord {
  return store.records[reviewId] ?? emptyRecord();
}

export function setActiveUser(annotator: AnnotatorId): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_USER_KEY, annotator);
}

export function getActiveUser(): AnnotatorId | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(ACTIVE_USER_KEY);
  if (v === "researcher" || v === "expert_1" || v === "expert_2") return v;
  return null;
}

export function clearActiveUser(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACTIVE_USER_KEY);
}

export function countCompleted(store: AnnotationStore): number {
  return Object.values(store.records).filter((r) => r.saved).length;
}

// Merge two stores at the record level, keeping the newest annotated_at per review.
// Used to reconcile local cache with the server copy.
export function mergeStores(
  a: AnnotationStore,
  b: AnnotationStore
): AnnotationStore {
  const records: AnnotationStore["records"] = { ...a.records };
  for (const [reviewId, recB] of Object.entries(b.records)) {
    const recA = records[reviewId];
    if (!recA) {
      records[reviewId] = recB;
      continue;
    }
    const tA = recA.annotated_at ? Date.parse(recA.annotated_at) : 0;
    const tB = recB.annotated_at ? Date.parse(recB.annotated_at) : 0;
    records[reviewId] = tB >= tA ? recB : recA;
  }
  return {
    annotator_id: a.annotator_id,
    version: Math.max(a.version, b.version),
    records,
    updated_at: new Date().toISOString(),
  };
}
