"""
Prepare 100 review sample for expert annotation.

- Reads the labeled dataset to find reviews that have >= 1 aspect labeled.
- Samples 100 review_ids with a FIXED random seed (reproducible).
- Joins with the clean dataset to get the display text/metadata.
- Writes src/data/annotation_reviews.json WITHOUT any label info.

The output JSON only contains:
    ID_Review, Platform, Nama_Hotel, Review_Date, Text_Review

Run from the project root:
    python scripts/prepare-annotation-sample.py
"""

import csv
import json
import os
import random

# --- configuration ---
SEED = 42
SAMPLE_SIZE = 100
ASPECTS = ["Kenyamanan", "Kebersihan", "Pelayanan", "Harga", "Lokasi", "Fasilitas", "Makanan"]

# Resolve paths relative to the ABSA project root (two levels up from this script).
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)                 # expert-annotation-web
ABSA_ROOT = os.path.dirname(PROJECT_ROOT)                  # ABSA Hotel Santika

LABELED_CSV = os.path.join(ABSA_ROOT, "Data Labeling", "dataset_absa_labeled.csv")
CLEAN_CSV = os.path.join(ABSA_ROOT, "Data Preprocessing", "dataset_absa_santika_clean.csv")
OUT_JSON = os.path.join(PROJECT_ROOT, "src", "data", "annotation_reviews.json")


def read_csv(path):
    with open(path, encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def main():
    labeled = read_csv(LABELED_CSV)
    clean = read_csv(CLEAN_CSV)

    # Build clean lookup by review id (clean uses lowercase column names).
    clean_map = {}
    for row in clean:
        rid = (row.get("review_id") or row.get("\ufeffreview_id") or "").strip()
        if rid:
            clean_map[rid] = row

    # Keep only labeled reviews that have at least one non-empty aspect
    # AND exist in the clean dataset.
    eligible_ids = []
    for row in labeled:
        rid = str(row.get("ID_Review", "")).strip()
        if not rid or rid not in clean_map:
            continue
        has_aspect = any((row.get(a) or "").strip() for a in ASPECTS)
        if has_aspect:
            eligible_ids.append(rid)

    eligible_ids = sorted(set(eligible_ids), key=lambda x: int(x))
    print(f"Eligible reviews (>=1 aspect & in clean): {len(eligible_ids)}")

    # Reproducible sampling.
    rng = random.Random(SEED)
    if len(eligible_ids) <= SAMPLE_SIZE:
        sampled = eligible_ids
    else:
        sampled = rng.sample(eligible_ids, SAMPLE_SIZE)
    sampled = sorted(sampled, key=lambda x: int(x))

    # Build output using clean dataset for display fields (no labels included).
    out = []
    for rid in sampled:
        c = clean_map[rid]
        out.append({
            "ID_Review": rid,
            "Platform": (c.get("platform") or "").strip(),
            "Nama_Hotel": (c.get("hotel_name") or "").strip(),
            "Review_Date": (c.get("date") or "").strip(),
            "Text_Review": (c.get("text_review") or "").strip(),
        })

    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(out)} reviews to {OUT_JSON}")
    print(f"Seed={SEED} (sampling is reproducible)")


if __name__ == "__main__":
    main()
