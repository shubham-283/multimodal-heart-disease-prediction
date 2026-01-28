// src/utils/calculateSmartRisk.js

export const calculateSmartRisk = (report) => {
  let weightedRisk = 0;
  let weightSum = 0;

  const completed = [];
  const allModules = [
    "Clinical Risk Assessment",
    "ECG Analysis",
    "Angiography"
  ];

  // ---------- CLINICAL ----------
  if (report?.clinical?.probability != null) {
    const p = clamp(report.clinical.probability);
    weightedRisk += p * 0.25;
    weightSum += 0.25;
    completed.push("Clinical Risk Assessment");
  }

  // ---------- ECG (Severity aware) ----------
  if (report?.ecg) {
    const ECG_SEVERITY = {
      MI: 1.0,
      STTC: 0.7,
      CD: 0.6,
      HYP: 0.5,
      NORM: 0.1
    };

    const severity = ECG_SEVERITY[report.ecg.label] ?? 0.3;
    const prob = clamp(report.ecg.probability ?? 0.5);

    weightedRisk += prob * severity * 0.35;
    weightSum += 0.35;
    completed.push("ECG Analysis");
  }

  // ---------- ANGIOGRAPHY ----------
  if (report?.stenosis?.probability != null) {
    const p = clamp(report.stenosis.probability);
    weightedRisk += p * 0.40;
    weightSum += 0.40;
    completed.push("Angiography");
  }

  if (weightSum === 0) {
    return {
      status: "NO_DATA",
      level: null,
      confidence: 0,
      completed: [],
      pending: allModules
    };
  }

  const confidence = Math.round((weightedRisk / weightSum) * 100);

  let level = "LOW";
  if (confidence >= 70) level = "HIGH";
  else if (confidence >= 40) level = "MODERATE";

  return {
    status: completed.length === 3 ? "COMPLETE" : "PARTIAL",
    level,
    confidence,
    completed,
    pending: allModules.filter(m => !completed.includes(m))
  };
};

const clamp = (v) => Math.min(1, Math.max(0, v));
