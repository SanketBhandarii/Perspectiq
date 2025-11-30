import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { generateScenario } from '../services/geminiService';
import { Persona, StartSessionRequest } from '../types';
import { Loader2, Sparkles, Check, ChevronRight, User, Users, Briefcase, Brain, ArrowLeft } from 'lucide-react';
import Modal from './Modal';

type Mode = 'classic' | 'custom';

const SessionWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<Mode>('classic');
  const [loading, setLoading] = useState(false);
  const [personas, setPersonas] = useState<Record<string, Persona>>({});
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Classic Mode State
  const [selectedPersonaKey, setSelectedPersonaKey] = useState<string>('');

  // Custom Mode State
  const [userRole, setUserRole] = useState('');
  const [partnerRole, setPartnerRole] = useState('');
  const [userPersonality, setUserPersonality] = useState('');
  const [partnerPersonality, setPartnerPersonality] = useState('');

  // Shared State
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

  const handleNext = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(prev => prev - 1);
  };

  const handleGenerateScenario = async () => {
    let roleForScenario = '';

    if (mode === 'classic') {
      if (!selectedPersonaKey) {
        setErrorMessage("Please select a persona first.");
        setShowError(true);
        return;
      }
      roleForScenario = personas[selectedPersonaKey].role;
    } else {
      if (!partnerRole) {
        setErrorMessage("Please define the partner's role first.");
        setShowError(true);
        return;
      }
      roleForScenario = partnerRole;
    }

    setGeneratingScenario(true);
    try {
      const generated = await generateScenario(roleForScenario, "Hard");
      setScenario(generated);
    } catch (e) {
      console.error(e);
      setErrorMessage("Failed to generate scenario.");
      setShowError(true);
    } finally {
      setGeneratingScenario(false);
    }
  };

  const handleStartSession = async () => {
    setLoading(true);
    try {
      let payload: StartSessionRequest;

      if (mode === 'classic') {
        payload = {
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
      } else {
        payload = {
          scenario,
          user_role: userRole,
          partner_role: partnerRole,
          user_personality: userPersonality,
          partner_personality: partnerPersonality
        };
      }

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
    { id: 1, title: "Mode Selection" },
    { id: 2, title: mode === 'classic' ? "Select Opponent" : "Role Setup" },
    { id: 3, title: "Scenario Setup" },
    { id: 4, title: "Fine-tuning" } // Only for Classic really, but we can keep it for consistency or hide it
  ];

  // Adjust steps based on mode
  const currentSteps = mode === 'classic'
    ? steps
    : [
      { id: 1, title: "Mode Selection" },
      { id: 2, title: "Role Setup" },
      { id: 3, title: "Scenario Setup" }
    ];

  const canProceed = () => {
    if (step === 1) return true; // Mode selection is always valid (default classic)

    if (mode === 'classic') {
      if (step === 2) return !!selectedPersonaKey;
      if (step === 3) return !!scenario;
      return true;
    } else {
      // Custom Mode
      if (step === 2) return !!userRole && !!partnerRole && !!userPersonality && !!partnerPersonality;
      if (step === 3) return !!scenario;
      return true;
    }
  };

  const isLastStep = mode === 'classic' ? step === 4 : step === 3;

  return (
    <div className="max-w-4xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col pb-4">
      <Modal
        isOpen={showError}
        onClose={() => setShowError(false)}
        title="Attention"
        footer={<button onClick={() => setShowError(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium">Close</button>}
      >
        <p>{errorMessage}</p>
      </Modal>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-slate-50 dark:bg-black/95 backdrop-blur-sm py-4 z-30 px-4 md:px-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New Session</h1>
        </div>
        <button onClick={() => navigate('/dashboard')} className="p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-10 px-4">
        <div className="relative flex justify-between">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-white/10 -z-10 -translate-y-1/2 rounded-full"></div>
          <div className="absolute top-1/2 left-0 h-0.5 bg-sky-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / (currentSteps.length - 1)) * 100}%` }}></div>
          {currentSteps.map((s) => (
            <div key={s.id} className="flex flex-col items-center bg-slate-50 dark:bg-black px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= s.id
                ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-500/30'
                : 'bg-white dark:bg-black border-slate-300 dark:border-white/20 text-slate-400'
                }`}>
                {step > s.id ? <Check className="w-5 h-5" /> : <span className="text-sm font-bold">{s.id}</span>}
              </div>
              <span className={`mt-2 text-xs text-center font-semibold tracking-wide uppercase hidden md:block ${step >= s.id ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'
                }`}>{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white dark:bg-white/5 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none p-4 md:p-10 flex flex-col relative overflow-hidden mb-8 mx-2 md:mx-0">

        {/* Step 1: Mode Selection */}
        {step === 1 && (
          <div className="flex-1 animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Choose your path</h2>
            <p className="text-slate-500 mb-8 text-lg">How do you want to practice today?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Classic Mode Card */}
              <button
                onClick={() => setMode('classic')}
                className={`p-6 md:p-8 rounded-2xl border-2 text-left transition-all duration-300 group hover:shadow-xl ${mode === 'classic'
                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/10 ring-1 ring-sky-500'
                  : 'border-slate-200 dark:border-white/10 hover:border-sky-300 dark:hover:border-white/30 bg-white dark:bg-black'
                  }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${mode === 'classic' ? 'bg-sky-500 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}>
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Classic Scenarios</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Practice with pre-configured personas like the "Angry Customer" or "Strict Manager". Best for quick practice.
                </p>
              </button>

              {/* Custom Mode Card */}
              <button
                onClick={() => setMode('custom')}
                className={`p-6 md:p-8 rounded-2xl border-2 text-left transition-all duration-300 group hover:shadow-xl ${mode === 'custom'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 ring-1 ring-purple-500'
                  : 'border-slate-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-white/30 bg-white dark:bg-black'
                  }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${mode === 'custom' ? 'bg-purple-500 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}>
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Custom Simulation</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Define your own role and your partner's personality. Perfect for specific real-world situations you're facing.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Role Selection (Classic or Custom) */}
        {step === 2 && mode === 'classic' && (
          <div className="flex-1 animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Select Opponent</h2>
            <p className="text-slate-500 mb-8 text-lg">Who do you want to challenge?</p>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(personas).map(([key, persona]: [string, Persona]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPersonaKey(key)}
                  className={`w-full text-left p-4 md:p-6 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group cursor-pointer ${selectedPersonaKey === key
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
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${selectedPersonaKey === key ? 'bg-sky-500 border-sky-500 text-white' : 'border-slate-300 dark:border-white/20'
                    }`}>
                    {selectedPersonaKey === key && <Check className="w-4 h-4" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && mode === 'custom' && (
          <div className="flex-1 animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Define Roles</h2>
            <p className="text-slate-500 mb-8 text-lg">Tell us who is talking to whom.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* User Role Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-sky-600 dark:text-sky-400">
                  <User className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Your Character</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Your Role</label>
                  <input
                    type="text"
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    placeholder="e.g. Junior Developer"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black focus:ring-2 focus:ring-sky-500/20 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Your Personality</label>
                  <textarea
                    value={userPersonality}
                    onChange={(e) => setUserPersonality(e.target.value)}
                    placeholder="e.g. Shy, avoids conflict, detail-oriented..."
                    className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black focus:ring-2 focus:ring-sky-500/20 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Partner Role Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
                  <Briefcase className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Partner's Character</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Partner Role</label>
                  <input
                    type="text"
                    value={partnerRole}
                    onChange={(e) => setPartnerRole(e.target.value)}
                    placeholder="e.g. Senior Product Manager"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Partner Personality</label>
                  <textarea
                    value={partnerPersonality}
                    onChange={(e) => setPartnerPersonality(e.target.value)}
                    placeholder="e.g. Pushy, demanding, impatient, results-driven..."
                    className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black focus:ring-2 focus:ring-purple-500/20 outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Scenario Setup (Shared) */}
        {((step === 3 && mode === 'classic') || (step === 3 && mode === 'custom')) && (
          <div className="flex-1 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Set the context</h2>
            <p className="text-slate-500 mb-8 text-md">Define the situation or let AI generate a challenging one.</p>
            <div className="space-y-6">
              <div className="relative group">
                <div className="rounded-2xl opacity-20 transition duration-200 blur"></div>
                <textarea
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  className="relative w-full h-56 p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black outline-none transition-all resize-none text-slate-900 dark:text-white text-md placeholder:text-slate-400 leading-relaxed"
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
            </div>
          </div>
        )}

        {/* Step 4: Fine-tuning (Classic Only) */}
        {step === 4 && mode === 'classic' && (
          <div className="flex-1 animate-fade-in">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Behavioral Settings</h2>
            <p className="text-slate-500 mb-8 text-lg">Tune the difficulty and hidden agendas.</p>
            <div className="space-y-8 max-w-xl">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-base font-semibold text-slate-900 dark:text-white">Frustration Level</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${frustration < 0.4 ? 'bg-green-100 text-green-700' : frustration < 0.7 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
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

      {/* Bottom Navigation Bar */}
      <div className="sticky bottom-0 max-xl:-bottom-4 w-full bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-slate-200 dark:border-white/10 p-3 md:p-4 z-40">
        <div className="flex justify-between items-center">
          <div>
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-4 md:px-6 py-2 md:py-3 text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-white transition-colors text-sm md:text-base"
              >
                Back
              </button>
            )}
          </div>
          <div>
            {!isLastStep ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-6 md:px-8 py-2 md:py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer text-sm md:text-base"
              >
                Continue <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            ) : (
              <button
                onClick={handleStartSession}
                disabled={loading || !canProceed()}
                className="px-6 md:px-8 py-2 md:py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 text-sm md:text-base"
              >
                {loading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : "Start Simulation"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionWizard;