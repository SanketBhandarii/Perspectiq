import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { LoginRequest } from '../types';
import { Loader2, BrainCircuit, ArrowRight, AlertCircle } from 'lucide-react';
const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    role: '',
    age: 0
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.login(formData);
      login(res.token, res.user_id, res.username, res.role);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('Username already taken')) {
        setError('Username already taken. Please choose another.');
      } else if (err.message && err.message.includes('Username exists but role/age mismatch')) {
        setError('Username exists but details mismatch. Check role/age or pick a new username.');
      } else {
        setError('Connection failed. Verify backend status.');
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background dark:bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-dark-surface p-10 rounded-[2rem] shadow-2xl shadow-sky-900/5 dark:shadow-none border border-slate-100 dark:border-dark-border animate-fade-in">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Terminal</h2>
        <p className="text-slate-500 mb-8">Enter your credentials to begin simulation.</p>
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-start gap-3 text-red-600 dark:text-red-400 animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              placeholder="e.g. Alien"
              className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-black text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all font-medium"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
             <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Role</label>
                <input
                  type="text"
                  required
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g. Product Manager"
                  className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-black text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all font-medium"
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  placeholder="e.g. 32"
                  className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-black text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all font-medium"
                />
             </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-all flex justify-center items-center shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 hover:-translate-y-0.5 cursor-pointer mt-2"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <span className="flex items-center gap-2">Enter Simulation <ArrowRight className="w-4 h-4" /></span>}
          </button>
        </form>
      </div>
    </div>
  );
};
export default Login;