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
