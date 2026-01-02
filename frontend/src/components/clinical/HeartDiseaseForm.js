import React, { useState, useMemo } from 'react';
import { 
  Activity, Heart, User, Ruler, Scale, 
  Droplets, Thermometer, Zap, AlertCircle, 
  CheckCircle, Info, TrendingUp, ShieldCheck, ArrowRight
} from 'lucide-react';

const HeartDiseaseForm = () => {
  const [formData, setFormData] = useState({
    age: "", gender: 1, height: "", weight: "",
    ap_hi: "", ap_lo: "", cholesterol: 1, gluc: 1,
    smoke: 0, alco: 0, active: 1
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bmi = useMemo(() => {
    if (formData.height > 0 && formData.weight > 0) {
      const heightInMeters = formData.height / 100;
      return (formData.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  }, [formData.height, formData.weight]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericValue = (name === 'age' || name === 'weight' || name === 'height' || name === 'ap_hi' || name === 'ap_lo') 
      ? (value === "" ? "" : parseFloat(value)) 
      : parseInt(value, 10);

    setFormData(prev => ({ ...prev, [name]: numericValue }));
  };

  const validate = () => {
    if (formData.age <= 0 || formData.age > 120) return "Valid age (1-120) required.";
    if (formData.height < 120 || formData.height > 220) return "Height (120-220cm) required.";
    if (formData.weight < 30 || formData.weight > 250) return "Weight (30-250kg) required.";
    if (formData.ap_hi < 70 || formData.ap_hi > 250) return "Systolic BP (70-250) required.";
    if (formData.ap_lo < 40 || formData.ap_lo > 150) return "Diastolic BP (40-150) required.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    const baseUri = process.env.REACT_APP_API_URI || 'http://localhost:5000';
    
    try {
      const response = await fetch(`${baseUri}/predict-clinical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("API Connection Failed.");
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 font-sans bg-slate-50 md:p-12">
      <div className="max-w-4xl mx-auto overflow-hidden bg-white border shadow-2xl rounded-3xl border-slate-200">
        
        {/* Header */}
        <div className="p-8 text-white bg-gradient-to-r from-blue-700 to-indigo-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-3 text-3xl italic font-extrabold tracking-tight">
                <Heart className="text-red-400 fill-current animate-pulse" />
                CARDIO-EXPLAINER <span className="font-light opacity-50">v2.0</span>
              </h2>
              <p className="mt-2 text-blue-100 opacity-80 uppercase text-[10px] font-bold tracking-[0.2em]">Explainable AI Diagnostic Engine</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 border-b border-slate-100">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div className="space-y-6">
              <h3 className="flex items-center gap-2 pb-2 text-sm text-lg font-bold tracking-wider uppercase border-b text-slate-800 border-slate-100">
                <User size={18} className="text-blue-600" /> Biometric Input
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="ml-1 text-xs font-bold text-slate-500">Age (Years)</label>
                  <input type="number" name="age" placeholder="e.g. 45" value={formData.age} onChange={handleChange} className="w-full p-3 border outline-none border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50/50" required />
                </div>
                <div className="space-y-1">
                  <label className="ml-1 text-xs font-bold text-slate-500">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 bg-white border outline-none border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500">
                    <option value={0}>Female</option>
                    <option value={1}>Male</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="flex items-center gap-1 ml-1 text-xs font-bold text-slate-500"><Ruler size={14}/> Height (cm)</label>
                  <input type="number" name="height" placeholder="170" value={formData.height} onChange={handleChange} className="w-full p-3 border outline-none border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div className="space-y-1">
                  <label className="flex items-center gap-1 ml-1 text-xs font-bold text-slate-500"><Scale size={14}/> Weight (kg)</label>
                  <input type="number" name="weight" placeholder="75" value={formData.weight} onChange={handleChange} className="w-full p-3 border outline-none border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="ml-1 text-xs font-bold text-slate-500">Systolic BP</label>
                  <input type="number" name="ap_hi" placeholder="120" value={formData.ap_hi} onChange={handleChange} className="w-full p-3 border outline-none border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div className="space-y-1">
                  <label className="ml-1 text-xs font-bold text-slate-500">Diastolic BP</label>
                  <input type="number" name="ap_lo" placeholder="80" value={formData.ap_lo} onChange={handleChange} className="w-full p-3 border outline-none border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="flex items-center gap-2 pb-2 text-sm text-lg font-bold tracking-wider uppercase border-b text-slate-800 border-slate-100">
                <Droplets size={18} className="text-blue-600" /> Lab Markers
              </h3>
              <div className="space-y-4">
                <select name="cholesterol" value={formData.cholesterol} onChange={handleChange} className="w-full p-3 bg-white border outline-none border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500">
                  <option value={1}>Cholesterol: Normal</option>
                  <option value={2}>Cholesterol: Elevated</option>
                  <option value={3}>Cholesterol: High</option>
                </select>
                <select name="gluc" value={formData.gluc} onChange={handleChange} className="w-full p-3 bg-white border outline-none border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500">
                  <option value={1}>Glucose: Normal</option>
                  <option value={2}>Glucose: Elevated</option>
                  <option value={3}>Glucose: High</option>
                </select>
              </div>

              <div className="p-4 space-y-4 border bg-slate-50 rounded-2xl border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Behavioral State</p>
                 <div className="grid grid-cols-3 gap-3">
                    {['smoke', 'alco', 'active'].map(field => (
                      <button key={field} type="button" onClick={() => setFormData(f => ({...f, [field]: f[field] ? 0 : 1}))} 
                        className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${formData[field] ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}>
                        {field.toUpperCase()}
                      </button>
                    ))}
                 </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="flex items-center justify-center w-full gap-2 py-4 mt-10 text-xs font-black tracking-widest text-white uppercase transition-all bg-indigo-600 shadow-xl rounded-2xl hover:bg-indigo-700 shadow-indigo-100">
            {loading ? <div className="w-4 h-4 border-2 rounded-full border-white/30 border-t-white animate-spin" /> : "Run XAI Diagnostic"}
          </button>
        </form>

        {/* redesigned Explainable Result Section */}
        {result && (
          <div className="p-8 space-y-8 duration-700 animate-in fade-in slide-in-from-bottom-4">
            {/* Top Score Card */}
            <div className={`p-8 rounded-[2rem] border flex flex-col md:flex-row items-center justify-between gap-6 ${result.prediction === 1 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className="flex items-center gap-6">
                <div className={`p-5 rounded-3xl shadow-lg ${result.prediction === 1 ? 'bg-red-500 text-white shadow-red-200' : 'bg-emerald-500 text-white shadow-emerald-200'}`}>
                  {result.prediction === 1 ? <AlertCircle size={40} /> : <CheckCircle size={40} />}
                </div>
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${result.prediction === 1 ? 'text-red-500' : 'text-emerald-600'}`}>Model Assessment</span>
                  <p className={`text-5xl font-black tracking-tighter ${result.prediction === 1 ? 'text-red-700' : 'text-emerald-800'}`}>{result.label}</p>
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur p-6 rounded-3xl border border-white min-w-[180px] text-center shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Confidence</p>
                <p className="text-4xl font-black text-slate-800">{(result.probability * 100).toFixed(1)}%</p>
              </div>
            </div>

            {/* Explanations Grid */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Risk Factors */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-black tracking-widest text-red-600 uppercase">
                  <TrendingUp size={16} /> Top Risk Factors
                </h4>
                <div className="space-y-3">
                  {result.explanations.top_risk_factors.map((item, idx) => (
                    <div key={idx} className="p-4 space-y-2 bg-white border shadow-sm rounded-2xl border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-700">{item.feature.replace('_', ' ')}</span>
                        <span className="text-[10px] font-bold text-red-500">+{item.impact.toFixed(3)}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(Math.abs(item.impact) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Protective Factors */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-black tracking-widest uppercase text-emerald-600">
                  <ShieldCheck size={16} /> Protective Factors
                </h4>
                <div className="space-y-3">
                  {result.explanations.top_protective_factors.map((item, idx) => (
                    <div key={idx} className="p-4 space-y-2 bg-white border shadow-sm rounded-2xl border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-700">{item.feature.replace('_', ' ')}</span>
                        <span className="text-[10px] font-bold text-emerald-500">{item.impact.toFixed(3)}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(Math.abs(item.impact) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl flex items-center gap-3 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
              <Info size={14} className="text-blue-400" />
              This diagnostic report uses SHAP values to explain feature influence on heart health.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeartDiseaseForm;