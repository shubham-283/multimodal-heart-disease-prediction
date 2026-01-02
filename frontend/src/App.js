import React, { useState } from 'react';
import { Heart, Activity, Stethoscope, ShieldCheck, ChevronRight, Menu, Settings } from 'lucide-react';
import HeartDiseaseForm from "./components/clinical/HeartDiseaseForm";
import ECGPredictionForm from "./components/ecg/ECGPrediction";
import ArcadeStenosis from "./components/stenosis/ArcadeStenosis";

function App() {
  const [activeTab, setActiveTab] = useState('clinical');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const modules = [
    {
      id: 'clinical',
      name: 'Clinical Risk',
      fullTitle: 'Cardiovascular Risk Assessment',
      icon: Heart,
      component: HeartDiseaseForm,
      tagline: 'Standardized vital-sign analytics',
      theme: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      id: 'ecg',
      name: 'ECG Analysis',
      fullTitle: '12-Lead ECG Interpretation',
      icon: Activity,
      component: ECGPredictionForm,
      tagline: 'Deep-learning waveform mapping',
      theme: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      id: 'stenosis',
      name: 'Stenosis Detection',
      fullTitle: 'Angiographic Automated Analysis',
      icon: Stethoscope,
      component: ArcadeStenosis,
      tagline: 'Vessel segmentation core',
      theme: 'text-emerald-600',
      bg: 'bg-emerald-50'
    }
  ];

  const currentModule = modules.find(m => m.id === activeTab);
  const ActiveComponent = currentModule.component;

  return (
    <div className="flex h-screen bg-[#FDFDFD] text-slate-900 font-sans antialiased overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col z-50`}>
        <div className="flex items-center gap-3 p-6">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 shadow-lg rounded-xl shrink-0 shadow-blue-200">
            <Heart className="w-6 h-6 text-white fill-current" />
          </div>
          {isSidebarOpen && <span className="text-xl font-black tracking-tighter uppercase">Cardio<span className="text-blue-600">AI</span></span>}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {modules.map((m) => {
            const Icon = m.icon;
            const isActive = activeTab === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveTab(m.id)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${
                  isActive 
                    ? `${m.bg} ${m.theme}` 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                <Icon className={`w-6 h-6 shrink-0 ${isActive ? 'scale-110' : ''}`} />
                {isSidebarOpen && (
                  <div className="text-left">
                    <p className="text-sm font-bold leading-none">{m.name}</p>
                    <p className={`text-[10px] mt-1 font-medium ${isActive ? 'text-slate-500' : 'text-slate-300'}`}>
                      {m.id === 'clinical' ? 'Biometrics' : m.id === 'ecg' ? 'Signal' : 'Imaging'}
                    </p>
                  </div>
                )}
                {isActive && isSidebarOpen && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100`}>
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            {isSidebarOpen && <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Clinical Protocol v2.6</span>}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="flex items-center justify-between h-20 px-8 border-b bg-white/80 backdrop-blur-md border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 transition-colors rounded-lg hover:bg-slate-100 text-slate-400">
              <Menu className="w-5 h-5" />
            </button>
            <div className="h-6 w-[1px] bg-slate-200 mx-2" />
            <div>
              <h2 className="text-sm font-black tracking-tight uppercase text-slate-900">{currentModule.fullTitle}</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{currentModule.tagline}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="items-center hidden gap-2 sm:flex">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">GPU Engine Active</span>
            </div>
            <button className="p-2 transition-colors text-slate-400 hover:text-blue-600">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Dynamic Content Scrollbox */}
        <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto duration-700 animate-in fade-in">
            <ActiveComponent />
          </div>
        </main>

      </div>
    </div>
  );
}

export default App;