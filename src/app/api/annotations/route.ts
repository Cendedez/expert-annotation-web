import { NextRequest, NextResponse } from "next/server";
import { getSupabase, ANNOTATIONS_TABLE } from "@/lib/supabaseServer";
import type { AnnotationStore, AnnotatorId, AnnotationRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_IDS: AnnotatorId[] = ["researcher", "expert_1", "expert_2"];

function isValidId(id: string | null): id is AnnotatorId {
  return id !== null && (VALID_IDS as string[]).includes(id);
}

// Merge two stores at the record level, keeping the newest annotated_at per review.
function mergeRecords(
  a: Record<string, AnnotationRecord>,
  b: Record<string, AnnotationRecord>
): Record<string, AnnotationRecord> {
  const out: Record<string, AnnotationRecord> = { ...a };
  for (const [reviewId, recB] of Object.entries(b)) {
    const recA = out[reviewId];
    if (!recA) {
      out[reviewId] = recB;
      continue;
    }
    const tA = recA.annotated_at ? Date.parse(recA.annotated_at) : 0;
    const tB = recB.annotated_at ? Date.parse(recB.annotated_at) : 0;
    out[reviewId] = tB >= tA ? recB : recA;
  }
  return out;
}

// GET /api/annotations?annotator=expert_1  -> returns the server store
export async function GET(req: NextRequest) {
  const annotator = req.nextUrl.searchParams.get("annotator");
  if (!isValidId(annotator)) {
    return NextResponse.json({ error: "invalid annotator" }, { status: 400 });
  }

  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json(
      { error: "sync_disabled", message: "Supabase belum dikonfigurasi." },
      { status: 503 }
    );
  }

  const { data, error } = await sb
    .from(ANNOTATIONS_TABLE)
    .select("store")
    .eq("annotator_id", annotator)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ store: data?.store ?? null });
}

// POST /api/annotations  body: { annotator, store }
// Merges incoming store with the server copy, persists, and returns the merged store.
export async function POST(req: NextRequest) {
  let body: { annotator?: string; store?: AnnotationStore };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const annotator = body.annotator ?? null;
  const incoming = body.store;
  if (!isValidId(annotator) || !incoming || typeof incoming !== "object") {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  if (incoming.annotator_id !== annotator) {
    return NextResponse.json({ error: "annotator mismatch" }, { status: 400 });
  }

  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json(
      { error: "sync_disabled", message: "Supabase belum dikonfigurasi." },
      { status: 503 }
    );
  }

  // Load existing server store (if any) and merge.
  const { data: existing, error: readErr } = await sb
    .from(ANNOTATIONS_TABLE)
    .select("store")
    .eq("annotator_id", annotator)
    .maybeSingle();

  if (readErr) {
    return NextResponse.json({ error: readErr.message }, { status: 500 });
  }

  const serverStore = (existing?.store as AnnotationStore | undefined) ?? null;

  const mergedRecords = serverStore
    ? mergeRecords(serverStore.records ?? {}, incoming.records ?? {})
    : incoming.records ?? {};

  const merged: AnnotationStore = {
    annotator_id: annotator,
    version: incoming.version ?? 1,
    records: mergedRecords,
    updated_at: new Date().toISOString(),
  };

  const { error: upErr } = await sb
    .from(ANNOTATIONS_TABLE)
    .upsert(
      { annotator_id: annotator, store: merged, updated_at: merged.updated_at },
      { onConflict: "annotator_id" }
    );

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  return NextResponse.json({ store: merged });
}
