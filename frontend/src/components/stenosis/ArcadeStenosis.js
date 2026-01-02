import React, { useState, useEffect } from 'react';
import { Upload, Activity, Shield, AlertCircle, CheckCircle, Image as ImageIcon, Search, Zap } from 'lucide-react';

const ArcadeStenosis = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [metrics, setMetrics] = useState({ detected: null, probability: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError("");
      setResultImage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select an angiography image first.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append('file', selectedFile);

    const baseUri = process.env.REACT_APP_API_URI || 'http://localhost:8000';

    try {
      const response = await fetch(`${baseUri}/predict-image-arcade`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Analysis failed. Please ensure the image is a valid angiogram.");

      const detected = response.headers.get("X-Stenosis-Detected") === "true";
      const probability = response.headers.get("X-Probability");

      setMetrics({ detected, probability });

      const imageBlob = await response.blob();
      setResultImage(URL.createObjectURL(imageBlob));

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 font-sans bg-gray-50 text-slate-800 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Upload Section */}
          <section className="p-8 space-y-6 bg-white border border-gray-100 shadow-sm lg:col-span-5 rounded-3xl">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              <h2 className="text-lg font-bold text-slate-900">Input Parameters</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div 
                className={`group relative border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 ${
                  previewUrl 
                    ? 'border-blue-200 bg-blue-50/30' 
                    : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-white'
                }`}
              >
                {previewUrl ? (
                  <div className="space-y-4">
                    <img src={previewUrl} alt="Preview" className="mx-auto border-4 border-white shadow-xl rounded-2xl max-h-64" />
                    <p className="text-xs font-bold text-blue-600">Scan Loaded Successfully</p>
                  </div>
                ) : (
                  <div className="py-8 space-y-4">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto transition-transform bg-white border border-gray-100 shadow-sm rounded-2xl group-hover:scale-110">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-700">Drop angiography scan here</p>
                      <p className="text-xs text-slate-400">Supports DICOM, PNG, and JPG formats</p>
                    </div>
                  </div>
                )}
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  accept="image/*"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 text-sm text-red-600 border border-red-100 bg-red-50 rounded-2xl">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || !selectedFile}
                className={`w-full py-4 px-6 font-black tracking-widest text-white uppercase transition-all rounded-2xl flex items-center justify-center gap-3 ${
                  loading 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-slate-900 hover:bg-blue-600 active:scale-95 shadow-lg shadow-slate-200'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 rounded-full border-white/30 border-t-white animate-spin"></div>
                    Processing Signal...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" /> Analyze Vessels
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Results Section */}
          <section className="lg:col-span-7 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col min-h-[500px]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
              <h2 className="text-lg font-bold text-slate-900">Diagnostic Results</h2>
            </div>
            
            {resultImage ? (
              <div className="flex-grow space-y-8 duration-500 animate-in fade-in slide-in-from-bottom-4">
                <div className="relative overflow-hidden border border-gray-100 shadow-2xl group rounded-3xl">
                  <img src={resultImage} alt="Annotated Result" className="w-full h-auto" />
                  <div className="absolute px-4 py-2 border shadow-sm top-4 right-4 bg-white/90 backdrop-blur-md border-white/20 rounded-2xl">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">AI Annotated Output</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className={`p-6 rounded-3xl border transition-all ${
                    metrics.detected 
                      ? 'bg-red-50 border-red-100' 
                      : 'bg-emerald-50 border-emerald-100'
                  }`}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Condition Status</p>
                    <div className="flex items-center gap-3">
                      <p className={`text-2xl font-black ${metrics.detected ? 'text-red-600' : 'text-emerald-700'}`}>
                        {metrics.detected ? "STENOSIS DETECTED" : "UNOBSTRUCTED"}
                      </p>
                      {metrics.detected ? (
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      ) : (
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6 border border-gray-100 bg-gray-50 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Probability Index</p>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-black text-slate-900">
                        {(parseFloat(metrics.probability) * 100).toFixed(2)}%
                      </p>
                      <div className="flex-grow h-2 overflow-hidden bg-gray-200 rounded-full">
                        <div 
                          className="h-full transition-all duration-1000 bg-blue-600 rounded-full" 
                          style={{ width: `${parseFloat(metrics.probability) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border border-blue-100 bg-blue-50 rounded-2xl">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <p className="text-xs italic leading-relaxed text-blue-800">
                    Automated finding should be used as a primary screening tool. Clinical confirmation by a qualified cardiologist is required for final diagnosis.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-grow p-12 space-y-4 text-center border-2 border-gray-100 border-dashed rounded-3xl bg-gray-50/50">
                <div className="p-4 bg-white shadow-sm rounded-2xl">
                  <Search className="w-10 h-10 text-gray-200" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-400">Awaiting Analysis</p>
                  <p className="text-xs text-gray-300">Upload a vessel scan to begin automated detection</p>
                </div>
              </div>
            )}
          </section>
        </div>
        
        <footer className="py-4 text-center">
          <p className="text-[10px] text-gray-400 font-medium">ARCADE V2.0 // PROTECTED CLINICAL INTERFACE // 2026</p>
        </footer>
      </div>
    </div>
  );
};

export default ArcadeStenosis;