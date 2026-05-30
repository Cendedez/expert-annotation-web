"use client";

import { useEffect, useState } from "react";
import { ANNOTATORS } from "@/lib/constants";
import { loadStore, countCompleted } from "@/lib/storage";
import type { AnnotatorId } from "@/lib/types";

interface UserProgress {
  id: AnnotatorId;
  label: string;
  completed: number;
  total: number;
}

export default function ProgressDashboard() {
  const [progress, setProgress] = useState<UserProgress[]>([]);

  useEffect(() => {
    const results: UserProgress[] = ANNOTATORS.map((a) => {
      const store = loadStore(a.id);
      return {
        id: a.id,
        label: a.label,
        completed: countCompleted(store),
        total: 100,
      };
    });
    setProgress(results);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {progress.map((p) => {
        const pct = Math.round((p.completed / p.total) * 100);
        return (
          <div key={p.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <strong>{p.label}</strong>
                <span className="muted" style={{ marginLeft: 8, fontSize: "0.85rem" }}>
                  ({p.id})
                </span>
              </div>
              <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                {p.completed}/{p.total}
              </span>
            </div>
            <div className="progress-bar">
              <span style={{ width: `${pct}%` }} />
            </div>
            <div className="muted" style={{ fontSize: "0.8rem", marginTop: 6 }}>
              {pct}% selesai
            </div>
          </div>
        );
      })}

      <div className="card" style={{ background: "var(--primary-soft)" }}>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "#2a4a6b" }}>
          <strong>Catatan:</strong> Dashboard ini hanya menampilkan progress dari
          data yang tersimpan di browser <em>ini</em>. Untuk melihat progress
          expert di perangkat mereka, minta mereka kirim file Backup JSON, lalu
          import di browser ini menggunakan halaman masing-masing expert.
        </p>
      </div>
    </div>
  );
}
