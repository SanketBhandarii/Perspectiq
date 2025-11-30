import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { SessionHistoryItem } from '../types';
import { Plus, Trash2, ArrowRight, MessageCircle, History, FileText, Search } from 'lucide-react';
import Modal from '../components/Modal';
const Dashboard: React.FC = () => {
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    fetchHistory();
  }, []);
  const fetchHistory = async () => {
    try {
      const res = await api.chat.getHistory();
      setSessions(res.sessions.reverse());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const confirmDelete = (sessionId: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSessionToDelete(sessionId);
      setDeleteModalOpen(true);
  };
  const handleExecuteDelete = async () => {
    if (!sessionToDelete) return;
    try {
      await api.chat.deleteSession(sessionToDelete);
      setSessions(prev => prev.filter(s => s.id !== sessionToDelete));
      setDeleteModalOpen(false);
      setSessionToDelete(null);
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="h-full flex flex-col lg:flex-row gap-8">
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Simulation"
        footer={
            <>
                <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 text-slate-500 font-medium">Cancel</button>
                <button onClick={handleExecuteDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Delete Permanently</button>
            </>
        }
      >
        <p>This action cannot be undone. This will permanently delete the chat history and its evaluation.</p>
      </Modal>
      <div className="lg:w-1/3 flex flex-col lg:h-full h-auto min-h-[300px] lg:min-h-0">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-sky-500" />
                History
            </h2>
            <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-slate-500">
                {sessions.length} Sessions
            </span>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {loading ? (
                [1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse" />
                ))
            ) : sessions.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                    <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No history yet</p>
                </div>
            ) : (
                sessions.map((session) => (
                    <div 
                        key={session.id} 
                        onClick={() => navigate(`/summary/${session.id}`)}
                        className="group p-4 bg-white dark:bg-black border border-slate-100 dark:border-white/10 rounded-2xl hover:border-sky-200 dark:hover:border-sky-500/30 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                ID #{session.id}
                            </span>
                            <span className="text-[10px] text-slate-400">
                                {new Date(session.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            {session.scenario || "Untitled Negotiation"}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {session.scenario ? "Review your negotiation performance and AI feedback." : "No description available."}
                        </p>
                        <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                             <button
                                onClick={(e) => confirmDelete(session.id, e)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                             >
                                <Trash2 className="w-3.5 h-3.5" />
                             </button>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
      <div className="lg:w-2/3 flex flex-col">
         <div className="bg-sky-500 dark:bg-sky-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl shadow-sky-500/20 relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl"></div>
            <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                    {greeting}.
                </h1>
                <p className="text-sky-100 text-lg md:text-xl max-w-lg leading-relaxed mb-8 font-medium">
                    Ready to challenge your negotiation skills? Your AI counterparts are waiting for you.
                </p>
                <Link
                    to="/setup"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-sky-600 rounded-2xl font-bold hover:bg-sky-50 transition-all"
                >
                    <Plus className="w-5 h-5" /> Start New Simulation
                </Link>
            </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-3xl hover:border-sky-100 dark:hover:border-sky-500/20 transition-colors group cursor-pointer">
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Quick Analysis</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">View the detailed analysis of your most recent negotiation session.</p>
            </div>
            <div className="p-6 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-3xl hover:border-sky-100 dark:hover:border-sky-500/20 transition-colors group cursor-pointer">
                <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Check Scenarios</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Generate with ai the scenarios</p>
            </div>
         </div>
      </div>
    </div>
  );
};
export default Dashboard;