import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { generateScenario } from '../services/geminiService';
import { Persona, StartSessionRequest } from '../types';
import { Loader2, Sparkles, Check, ChevronRight } from 'lucide-react';
import Modal from './Modal';

const SessionWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [personas, setPersonas] = useState<Record<string, Persona>>({});
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [selectedPersonaKey, setSelectedPersonaKey] = useState<string>('');
  const [scenario, setScenario] = useState('');
  const [frustration, setFrustration] = useState(0.5);
  const [goals, setGoals] = useState('');
  const [motivations, setMotivations] = useState('');

  const [generatingScenario, setGeneratingScenario] = useState(false);

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const res = await api.chat.getPersonas();
        setPersonas(res.personas);
      } catch (err) {
        console.error("Failed to load personas", err);
      }
    };
    fetchPersonas();
  }, []);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleGenerateScenario = async () => {
    if (!selectedPersonaKey) {
        setErrorMessage("Please select a persona first before generating a scenario.");
        setShowError(true);
        return;
    }
    setGeneratingScenario(true);
    const role = personas[selectedPersonaKey].role;
    const generated = await generateScenario(role, "Hard");
    setScenario(generated);
    setGeneratingScenario(false);
  };

  const handleStartSession = async () => {
    setLoading(true);
    try {
      const payload: StartSessionRequest = {
        scenario,
        personas: [selectedPersonaKey],
        persona_configs: {
          [selectedPersonaKey]: {
            frustration,
            goals,
            motivations
          }
        }
      };
      
      const res = await api.chat.startSession(payload);
      navigate(`/chat/${res.session_id}`);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to start session. Please try again.");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: "Select Opponent" },
    { id: 2, title: "Scenario Setup" },
    { id: 3, title: "Fine-tuning" }
  ];

  const canProceed = () => {
      if (step === 1) return !!selectedPersonaKey;
      if (step === 2) return !!scenario;
      return true;
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <Modal 
        isOpen={showError} 
        onClose={() => setShowError(false)} 
        title="Attention"
        footer={<button onClick={() => setShowError(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium">Close</button>}
      >
        <p>{errorMessage}</p>
      </Modal>

      <div className="flex items-center justify-between mb-8 sticky top-0 bg-white/95 dark:bg-black/95 backdrop-blur-sm py-4 z-30">
         <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Simulation</h1>
         </div>
         <div className="flex gap-3">
             {step > 1 && (
                 <button onClick={handleBack} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                     Back
                 </button>
             )}
             {step < 3 ? (
                 <button 
                    onClick={handleNext} 
                    disabled={!canProceed()}
                    className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-full text-sm font-semibold shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
                 >
                     Continue <ChevronRight className="w-4 h-4" />
                 </button>
             ) : (
                 <button 
                    onClick={handleStartSession} 
                    disabled={loading}
                    className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full text-sm font-semibold shadow-lg disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                 >
                     {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Simulation"}
                 </button>
             )}
         </div>
      </div>
      
      <div className="mb-10 px-4">
        <div className="relative flex justify-between">
           <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-white/10 -z-10 -translate-y-1/2 rounded-full"></div>
           <div className="absolute top-1/2 left-0 h-0.5 bg-sky-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
           
           {steps.map((s) => (
               <div key={s.id} className="flex flex-col items-center bg-slate-50 dark:bg-black px-2">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                       step >= s.id 
                       ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-500/30' 
                       : 'bg-white dark:bg-black border-slate-300 dark:border-white/20 text-slate-400'
                   }`}>
                       {step > s.id ? <Check className="w-5 h-5" /> : <span className="text-sm font-bold">{s.id}</span>}
                   </div>
                   <span className={`mt-2 text-xs font-semibold tracking-wide uppercase ${
                       step >= s.id ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'
                   }`}>{s.title}</span>
               </div>
           ))}
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 md:p-10 min-h-[500px] flex flex-col relative overflow-hidden">
          
          {step === 1 && (
            <div className="flex-1 animate-fade-in">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Who are you speaking with?</h2>
              <p className="text-slate-500 mb-8 text-lg">Select the persona you want to challenge today.</p>
              
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(personas).map(([key, persona]: [string, Persona]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPersonaKey(key)}
                    className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                      selectedPersonaKey === key
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/10'
                        : 'border-slate-100 dark:border-white/10 hover:border-sky-200 dark:hover:border-white/20 bg-white dark:bg-black'
                    }`}
                  >
                    <div>
                      <div className={`font-bold text-xl mb-1 ${selectedPersonaKey === key ? 'text-sky-700 dark:text-sky-400' : 'text-slate-900 dark:text-white'}`}>
                        {persona.name}
                      </div>
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full inline-block mt-2">{persona.role}</div>
                      <p className="text-slate-400 text-sm mt-3 leading-relaxed max-w-md">{persona.description}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        selectedPersonaKey === key ? 'bg-sky-500 border-sky-500 text-white' : 'border-slate-300 dark:border-white/20'
                    }`}>
                        {selectedPersonaKey === key && <Check className="w-4 h-4" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 animate-fade-in">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Set the context</h2>
              <p className="text-slate-500 mb-8 text-lg">Define the situation or let AI generate a challenging one.</p>
              
              <div className="space-y-6">
                <div className="relative group">
                  <div className="rounded-2xl opacity-20 transition duration-200 blur"></div>
                  <textarea
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    className="relative w-full h-56 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black outline-none transition-all resize-none text-slate-900 dark:text-white text-lg placeholder:text-slate-400 leading-relaxed"
                    placeholder="Describe the situation here... For example: 'I need to tell the Engineering Lead that we are cutting the QA cycle by 2 weeks.'"
                  />
                  <div className="absolute bottom-4 right-4">
                     <button
                        onClick={handleGenerateScenario}
                        disabled={generatingScenario}
                        className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all cursor-pointer disabled:opacity-70 disabled:hover:scale-100"
                    >
                        {generatingScenario ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Generate with AI
                    </button>
                  </div>
                </div>
                
                <div className="bg-sky-50 dark:bg-sky-500/10 p-4 rounded-xl border border-sky-100 dark:border-sky-500/20">
                    <p className="text-sm text-sky-700 dark:text-sky-300 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Tip: Use the AI generator to create complex, realistic scenarios based on the selected persona's role.</span>
                    </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex-1 animate-fade-in">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Behavioral Settings</h2>
              <p className="text-slate-500 mb-8 text-lg">Tune the difficulty and hidden agendas.</p>
              
              <div className="space-y-8 max-w-xl">
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-base font-semibold text-slate-900 dark:text-white">Frustration Level</label>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      frustration < 0.4 ? 'bg-green-100 text-green-700' : frustration < 0.7 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {(frustration * 100).toFixed(0)}% Intensity
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={frustration}
                    onChange={(e) => setFrustration(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                      <span>Calm</span>
                      <span>Annoyed</span>
                      <span>Furious</span>
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Specific Goals</label>
                     <input
                       type="text"
                       value={goals}
                       onChange={(e) => setGoals(e.target.value)}
                       placeholder="e.g. Protect team work-life balance"
                       className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black focus:bg-white dark:focus:bg-white/5 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Hidden Motivations</label>
                     <input
                       type="text"
                       value={motivations}
                       onChange={(e) => setMotivations(e.target.value)}
                       placeholder="e.g. Worried about upcoming performance review"
                       className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black focus:bg-white dark:focus:bg-white/5 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                     />
                   </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default SessionWizard;