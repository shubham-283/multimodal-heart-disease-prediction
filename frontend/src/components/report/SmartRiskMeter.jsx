import React from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

const getNeedleRotation = (value) => {
  // Map 0–100 → -90deg to +90deg
  return -90 + (value * 180) / 100;
};

const SmartRiskMeter = ({ result }) => {
  if (!result || !result.status) {
    return (
      <div className="p-6 border rounded-3xl bg-slate-50 text-center">
        <AlertCircle className="mx-auto mb-2 text-slate-400" />
        <p className="font-bold text-slate-400">Risk analysis pending</p>
      </div>
    );
  }

  if (result.status === "NO_DATA") {
    return (
      <div className="p-6 border rounded-3xl bg-slate-50 text-center">
        <AlertCircle className="mx-auto mb-2 text-slate-400" />
        <p className="font-bold text-slate-400">
          No diagnostic data available
        </p>
      </div>
    );
  }

  const rotation = getNeedleRotation(result.confidence);

  return (
    <div className="space-y-6 print-section">
      {/* ===== SPEEDOMETER ===== */}
      <div className="relative w-full max-w-xs mx-auto">
        <div className="relative h-40 overflow-hidden">
          {/* Gauge Background */}
          <div className="absolute inset-0 rounded-t-full bg-slate-200" />

          {/* LOW */}
          <div className="absolute inset-0 rounded-t-full border-[16px] border-emerald-500 clip-low" />

          {/* MODERATE */}
          <div className="absolute inset-0 rounded-t-full border-[16px] border-orange-500 clip-moderate" />

          {/* HIGH */}
          <div className="absolute inset-0 rounded-t-full border-[16px] border-red-600 clip-high" />

          {/* Needle */}
          <div
            className="absolute bottom-0 left-1/2 w-1 h-32 bg-slate-800 origin-bottom transition-transform duration-1000"
            style={{ transform: `rotate(${rotation}deg)` }}
          />

          {/* Needle Center */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 rounded-full" />
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs font-bold mt-2 text-slate-500">
          <span>LOW</span>
          <span>MODERATE</span>
          <span>HIGH</span>
        </div>

        <p className="text-center mt-2 text-lg font-black">
          {result.confidence}%
        </p>

        <p
          className={`text-center text-sm font-bold uppercase ${result.level === "HIGH"
            ? "text-red-600"
            : result.level === "MODERATE"
              ? "text-orange-600"
              : "text-emerald-600"
            }`}
        >
          {result.level} RISK
        </p>
      </div>

      {/* ===== STATUS ===== */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          {result.status === "COMPLETE" ? (
            <CheckCircle className="text-emerald-600" />
          ) : (
            <AlertCircle className="text-orange-500" />
          )}
          <span className="font-bold">
            {result.status === "COMPLETE"
              ? "All diagnostic modules completed"
              : "Partial analysis – accuracy may be limited"}
          </span>
        </div>

        <ul className="ml-6 list-disc text-slate-600">
          {result.completed?.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>

        {result.pending?.length > 0 && (
          <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
            <p className="text-xs font-black uppercase text-yellow-700 mb-1">
              Recommended for higher accuracy
            </p>
            <ul className="list-disc ml-5 text-yellow-800 text-sm">
              {result.pending.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartRiskMeter;
