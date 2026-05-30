import type { AnnotatorId, AspectKey, SentimentLabel } from "./types";

// Order matters: this is the order aspects are shown in the form and in CSV.
export const ASPECTS: AspectKey[] = [
  "Lokasi",
  "Kenyamanan",
  "Pelayanan",
  "Kebersihan",
  "Harga",
  "Makanan",
  "Fasilitas",
];

export const SENTIMENTS: SentimentLabel[] = ["None", "positif", "negatif", "netral"];

export const ANNOTATORS: { id: AnnotatorId; label: string; description: string }[] = [
  {
    id: "researcher",
    label: "Researcher",
    description: "Peneliti utama proyek ABSA.",
  },
  {
    id: "expert_1",
    label: "Hengky Kurniadi",
    description: "Domain expert 1.",
  },
  {
    id: "expert_2",
    label: "John Doe",
    description: "Domain expert 2.",
  },
];

export const STORAGE_VERSION = 1;

export const ACTIVE_USER_KEY = "absa_active_annotator";

export function storageKeyFor(annotator: AnnotatorId): string {
  return `absa_annotation_${annotator}`;
}

// Human-readable sentiment options for the dropdown.
export const SENTIMENT_OPTIONS: { value: SentimentLabel; label: string }[] = [
  { value: "None", label: "None (tidak dibahas)" },
  { value: "positif", label: "positif" },
  { value: "negatif", label: "negatif" },
  { value: "netral", label: "netral" },
];
