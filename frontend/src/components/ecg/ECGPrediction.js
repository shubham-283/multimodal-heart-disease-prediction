import React, { useState, useEffect } from 'react';
import { saveReportSection } from "../../utils/reportStore";
import { fileOrBlobToBase64 } from "../../utils/imageToBase64";
import { Activity, Upload, FileText, Database, Zap, AlertCircle, Download, BarChart3 } from 'lucide-react';

const ECGPredictionForm = () => {
  const [recordHea, setRecordHea] = useState(null);
  const [recordDat, setRecordDat] = useState(null);
  const [lead, setLead] = useState(0);
  const [predictionImage, setPredictionImage] = useState(null);
  const [diagnostics, setDiagnostics] = useState({ label: null, probabilities: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const CLASS_COLORS = {
    "MI": "bg-red-600 border-red-700 text-white",
    "STTC": "bg-orange-500 border-orange-600 text-white",
    "CD": "bg-purple-600 border-purple-700 text-white",
    "HYP": "bg-green-600 border-green-700 text-white",
    "NORM": "bg-blue-600 border-blue-700 text-white"
  };

  const leadLabels = ["L-I", "L-II", "L-III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"];

  useEffect(() => {
    return () => { if (predictionImage) URL.revokeObjectURL(predictionImage); };
  }, [predictionImage]);

  const handleFileChange = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      setter(file);
      setError("");
      setPredictionImage(null);
      setDiagnostics({ label: null, probabilities: {} });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recordHea || !recordDat) {
      setError("Both .hea and .dat files are required.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append('record_hea', recordHea);
    formData.append('record_dat', recordDat);

    const baseUri = process.env.REACT_APP_API_URI || 'http://localhost:8000';
    const url = `${baseUri}/predict-image-upload?lead=${lead}`;

    try {
      const response = await fetch(url, { method: 'POST', body: formData });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Server error");
      }

      const label = response.headers.get('X-Predicted-Class');
      const probs = {};
      for (let pair of response.headers.entries()) {
        if (pair[0].startsWith('x-prob-')) {
          const className = pair[0].replace('x-prob-', '').toUpperCase();
          probs[className] = parseFloat(pair[1]);
        }
      }

      setDiagnostics({ label, probabilities: probs });
      const imageBlob = await response.blob();
      const base64Image = await fileOrBlobToBase64(imageBlob);
      setPredictionImage(base64Image);

      saveReportSection("ecg", {
        lead,
        label,
        probabilities: probs,
        image: base64Image
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen p-4 font-sans bg-slate-50 text-slate-900 md:p-8">
      <div className="mx-auto space-y-6 max-w-7xl">


        {/* SECTION 1: CONFIGURATION (COMPACT FOOTER) */}
        <section className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="grid items-end grid-cols-1 gap-10 lg:grid-cols-12">

            <div className="space-y-4 lg:col-span-3">
              <label className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-slate-400">
                <Upload className="w-4 h-4" /> 1. Upload Binary Pair
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all ${recordHea ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:border-indigo-300 bg-slate-50'}`}>
                  <FileText className={`w-6 h-6 mx-auto mb-1 ${recordHea ? 'text-green-600' : 'text-slate-400'}`} />
                  <p className="text-[9px] font-bold text-slate-500 truncate">{recordHea ? recordHea.name : "HEADER (.HEA)"}</p>
                  <input type="file" accept=".hea" onChange={(e) => handleFileChange(e, setRecordHea)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <div className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all ${recordDat ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:border-indigo-300 bg-slate-50'}`}>
                  <Database className={`w-6 h-6 mx-auto mb-1 ${recordDat ? 'text-green-600' : 'text-slate-400'}`} />
                  <p className="text-[9px] font-bold text-slate-500 truncate">{recordDat ? recordDat.name : "DATA (.DAT)"}</p>
                  <input type="file" accept=".dat" onChange={(e) => handleFileChange(e, setRecordDat)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="space-y-4 lg:col-span-6">
              <label className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-slate-400">
                <Activity className="w-4 h-4" /> 2. Target Channel (0-11)
              </label>
              <div className="grid grid-cols-6 gap-2">
                {leadLabels.map((label, i) => (
                  <button key={i} type="button" onClick={() => setLead(i)} className={`py-2.5 text-[10px] font-black rounded-xl border transition-all ${lead === i ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3">
              <button type="submit" disabled={loading || !recordHea || !recordDat} className="flex items-center justify-center w-full gap-3 py-5 text-sm font-black tracking-widest text-white uppercase transition-all shadow-xl bg-slate-900 hover:bg-indigo-700 rounded-2xl disabled:bg-slate-100 disabled:text-slate-300">
                {loading ? <div className="w-5 h-5 border-2 rounded-full border-white/30 border-t-white animate-spin" /> : <><Zap className="w-5 h-5" /> Run Diagnostic</>}
              </button>
            </div>
          </form>
        </section>


        {/* SECTION 2: VISUALIZATION (MAXIMIZED) */}
        <section className="bg-white border border-slate-200 rounded-[2rem] shadow-xl overflow-hidden min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-100">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight uppercase text-slate-800">
                  ECG Analysis: <span className="text-indigo-600">{leadLabels[lead]}</span>
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">High-Resolution Waveform Output</p>
              </div>
            </div>
            {predictionImage && (
              <button onClick={() => {
                const link = document.createElement('a');
                link.href = predictionImage;
                link.download = `ECG_Full_Analysis.png`;
                link.click();
              }} className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100">
                <Download className="w-4 h-4" /> Export Full Resolution
              </button>
            )}
          </div>

          <div className="flex flex-col items-center justify-center flex-1 p-6 bg-slate-50/50">
            {predictionImage ? (
              <div className="w-full space-y-8 duration-700 animate-in fade-in zoom-in-95">
                {/* Large Rectangular Image Container */}
                <div className="bg-white p-3 border border-slate-200 shadow-2xl rounded-[1.5rem] w-full">
                  <img src={predictionImage} alt="ECG Plot" className="object-contain w-full h-auto rounded-lg" />
                </div>

                {/* Compact Results Bar directly under Image */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white p-8 rounded-[1.5rem] border border-slate-200 shadow-sm">
                  <div className={`lg:col-span-3 p-6 rounded-2xl border-2 flex flex-col items-center justify-center text-center ${CLASS_COLORS[diagnostics.label] || 'bg-slate-100'}`}>
                    <span className="text-[10px] font-black uppercase opacity-70 mb-1">Primary Finding</span>
                    <p className="text-4xl font-black">{diagnostics.label}</p>
                  </div>

                  <div className="space-y-4 lg:col-span-9">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold tracking-wider uppercase text-slate-500">Classification Confidence</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                      {Object.entries(diagnostics.probabilities).map(([name, val]) => (
                        <div key={name} className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-400">{name}</span>
                            <span className="text-indigo-600">{(val * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full transition-all duration-1000 bg-indigo-600" style={{ width: `${val * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center group">
                <div className="w-24 h-24 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6 transition-transform group-hover:scale-110">
                  <Zap className="w-10 h-10 text-slate-200" />
                </div>
                <p className="text-2xl italic font-black tracking-tight text-slate-300">Waiting for signal execution...</p>
              </div>
            )}
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-3 p-5 text-sm font-bold text-red-600 border-2 border-red-100 bg-red-50 rounded-2xl animate-in slide-in-from-top-4">
            <AlertCircle className="flex-shrink-0 w-5 h-5" /> Error: {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ECGPredictionForm;