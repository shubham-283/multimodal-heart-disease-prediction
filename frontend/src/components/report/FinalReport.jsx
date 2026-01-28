import React, { useEffect, useState } from "react";
import { getReport, clearReport } from "../../utils/reportStore";
import { calculateSmartRisk } from "../../utils/calculateSmartRisk";
import { Activity, AlertCircle } from "lucide-react";
import SmartRiskMeter from "./SmartRiskMeter";

const FinalReport = () => {
    const [report, setReport] = useState(null);

    useEffect(() => {
        const stored = getReport();
        setReport(stored && Object.keys(stored).length > 0 ? stored : null);
    }, []);

    // No data state
    if (!report) {
        return (
            <div className="p-12 text-center text-slate-400">
                No diagnostic data available.
                <p className="text-sm mt-2">
                    Please complete at least one diagnostic module.
                </p>
            </div>
        );
    }

    const smartRisk = calculateSmartRisk(report);
    const openPrintView = (report) => {
        const win = window.open("", "_Cardiovascular_Report");

        win.document.write(`
    <html>
      <head>
        <title>Cardiovascular Risk Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 30px;
            color: #111;
          }
          h1, h2, h3 {
            margin-bottom: 10px;
          }
          section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          img {
            max-width: 100%;
            margin-top: 10px;
            border: 1px solid #ccc;
          }
          .risk {
            font-size: 28px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>

        <h1>Integrated Cardiovascular Risk Report</h1>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>

        <section>
          <h2>Overall Risk Level</h2>
          <p class="risk">${calculateSmartRisk(report).level}</p>
        </section>

        ${report.clinical
                ? `
          <section>
            <h2>Clinical Assessment</h2>
            <p>Prediction: ${report.clinical.label}</p>
            <p>Confidence: ${(report.clinical.probability * 100).toFixed(1)}%</p>
            <p>BMI: ${report.clinical.bmi}</p>
          </section>`
                : ""
            }

        ${report.ecg?.image
                ? `
          <section>
            <h2>ECG Analysis</h2>
            <p>Predicted Class: ${report.ecg.label}</p>
            <img src="${report.ecg.image}" />
          </section>`
                : ""
            }

        ${report.stenosis?.image
                ? `
          <section>
            <h2>Angiography Analysis</h2>
            <p>Status: ${report.stenosis.detected
                    ? "Stenosis Detected"
                    : "No Significant Obstruction"
                }</p>
            <img src="${report.stenosis.image}" />
          </section>`
                : ""
            }

        <section>
          <h3>Disclaimer</h3>
          <p>
            This report is generated using AI-based models and must be
            validated by a qualified cardiologist before clinical use.
          </p>
        </section>

        <script>
          window.onload = () => {
            window.print();
          };
        </script>

      </body>
    </html>
  `);

        win.document.close();
    };


    return (
        <div className="space-y-10 print-container">

            {/* ================= RISK METER ================= */}
            <Section title="Integrated Cardiovascular Risk Assessment">
                <SmartRiskMeter result={smartRisk} />
            </Section>

            {/* ================= RISK SUMMARY ================= */}
            {smartRisk?.level && (
                <div
                    className={`p-8 rounded-3xl border print-section ${smartRisk.level === "HIGH"
                        ? "bg-red-50 border-red-200"
                        : smartRisk.level === "MODERATE"
                            ? "bg-orange-50 border-orange-200"
                            : "bg-emerald-50 border-emerald-200"
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <Activity className="w-8 h-8" />
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                Overall Risk Level
                            </p>
                            <h1
                                className={`text-4xl font-black ${smartRisk.level === "HIGH"
                                    ? "text-red-700"
                                    : smartRisk.level === "MODERATE"
                                        ? "text-orange-700"
                                        : "text-emerald-700"
                                    }`}
                            >
                                {smartRisk.level}
                            </h1>
                            <p className="text-xs mt-1 text-slate-600">
                                Confidence based on completed tests
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= CLINICAL ================= */}
            {report.clinical && (
                <Section title="Clinical Risk Assessment">
                    <p><strong>Prediction:</strong> {report.clinical.label}</p>
                    <p>
                        <strong>Confidence:</strong>{" "}
                        {(report.clinical.probability * 100).toFixed(1)}%
                    </p>
                    <p><strong>BMI:</strong> {report.clinical.bmi}</p>
                </Section>
            )}

            {/* ================= ECG ================= */}
            {report.ecg?.image && (
                <Section title="ECG Analysis Result">
                    <p className="mb-2 font-bold">
                        Predicted Class: {report.ecg.label}
                    </p>
                    <img
                        src={report.ecg.image}
                        alt="ECG Prediction"
                        className="rounded-2xl border shadow-xl max-w-full"
                    />
                </Section>
            )}

            {/* ================= STENOSIS ================= */}
            {report.stenosis?.image && (
                <Section title="Coronary Angiography Analysis">
                    <p className="mb-2 font-bold">
                        Status:{" "}
                        {report.stenosis.detected
                            ? "Stenosis Detected"
                            : "No Significant Obstruction"}
                    </p>
                    <img
                        src={report.stenosis.image}
                        alt="Stenosis Detection"
                        className="rounded-2xl border shadow-xl max-w-full"
                    />
                </Section>
            )}

            {/* ================= DISCLAIMER ================= */}
            <div className="flex items-start gap-3 p-4 border border-blue-100 bg-blue-50 rounded-2xl print-section">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed">
                    This report is generated using AI-based predictive models and is
                    intended for clinical decision support only. Final diagnosis must be
                    confirmed by a qualified cardiologist.
                </p>
            </div>

            {/* ================= ACTION BUTTONS ================= */}
            <div className="flex gap-4 no-print">
                <button
                    onClick={() => openPrintView(report)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold"
                >
                    Download Full Report (PDF)
                </button>

                <button
                    onClick={() => {
                        clearReport();
                        setReport(null);
                    }}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold"
                >
                    Clear Report
                </button>
            </div>
        </div>
    );
};

const Section = ({ title, children }) => (
    <div className="p-8 bg-white rounded-3xl border shadow-sm print-section">
        <h3 className="text-lg font-black mb-4 uppercase tracking-wider">
            {title}
        </h3>
        {children}
    </div>
);

export default FinalReport;
