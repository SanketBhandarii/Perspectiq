import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MessageSquare, BarChart3, ArrowRight, BrainCircuit } from 'lucide-react';
const Landing: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
      <section className="text-center py-24 px-4 max-w-5xl mx-auto animate-fade-in">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-sm font-semibold mb-8 border border-sky-100 dark:border-sky-500/20 shadow-sm">
          <BrainCircuit className="w-4 h-4 mr-2" />
          The Future of Soft Skills Training
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-8 leading-tight">
          Master the Art of <br />
          <span className="text-sky-500">Stakeholder Influence</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
          A high-fidelity simulation environment. Practice difficult conversations with realistic AI personas before the stakes get high.
        </p>
        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <Link
            to="/dashboard"
            className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full font-bold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            Enter Simulation <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
      <section className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4 pb-24">
        <div className="bg-white dark:bg-white/5 p-10 rounded-[2rem] border border-slate-100 dark:border-white/5 hover:border-sky-100 dark:hover:border-sky-500/20 transition-colors shadow-sm">
          <div className="w-14 h-14 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl flex items-center justify-center mb-8">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Risk-Free Zone</h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg">
            Test strategies with angry engineers or demanding executives without risking actual professional relationships.
          </p>
        </div>
        <div className="bg-white dark:bg-white/5 p-10 rounded-[2rem] border border-slate-100 dark:border-white/5 hover:border-indigo-100 dark:hover:border-indigo-500/20 transition-colors shadow-sm">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-8">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Deep Personas</h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg">
            Powered by Gemini 2.5, personas have hidden agendas, specific frustration triggers, and unique goals.
          </p>
        </div>
        <div className="bg-white dark:bg-white/5 p-10 rounded-[2rem] border border-slate-100 dark:border-white/5 hover:border-emerald-100 dark:hover:border-emerald-500/20 transition-colors shadow-sm">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-8">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Instant Analysis</h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg">
            Get a detailed evaluation after every session. Understand exactly what worked and how to improve.
          </p>
        </div>
      </section>
    </div>
  );
};
export default Landing;