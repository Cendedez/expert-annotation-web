"use client";

import { useRouter } from "next/navigation";
import { ANNOTATORS } from "@/lib/constants";
import { setActiveUser } from "@/lib/storage";
import type { AnnotatorId } from "@/lib/types";

export default function LandingPage() {
  const router = useRouter();

  function choose(id: AnnotatorId) {
    setActiveUser(id);
    router.push("/annotate");
  }

  return (
    <main className="landing">
      <div className="card landing-card">
        <h1>Anotasi ABSA Hotel Santika</h1>
        <p className="subtitle">
          Validasi label Aspect-Based Sentiment Analysis oleh domain expert.
          Silakan pilih identitas Anda untuk memulai.
        </p>

        <div className="user-list">
          {ANNOTATORS.map((a) => (
            <button
              key={a.id}
              className="user-option"
              onClick={() => choose(a.id)}
            >
              <span>
                <span className="label">{a.label}</span>
                <br />
                <span className="desc">{a.description}</span>
              </span>
              <span className="arrow">→</span>
            </button>
          ))}
        </div>

        <p className="muted" style={{ fontSize: "0.8rem", marginTop: 24 }}>
          Setiap user mengerjakan 100 review yang sama. Jawaban disimpan otomatis
          di browser ini (localStorage) dan dapat diekspor ke CSV.
        </p>
      </div>
    </main>
  );
}
