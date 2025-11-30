import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { generateSummary } from '../services/geminiService';
import { Message, SessionHistoryItem } from '../types';
import { CheckCircle2, RefreshCcw, LayoutGrid, FileText, Sparkles, MessageSquare, Calendar, User, Clock } from 'lucide-react';

const Summary: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionHistoryItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'conversation'>('summary');
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchData();
    }
  }, [sessionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const historyRes = await api.chat.getHistory();
      const session = historyRes.sessions.find(s => s.id === Number(sessionId));
      
      if (session) {
        setSessionData(session);
      }

      const messagesRes = await api.chat.getMessages(Number(sessionId));
      setMessages(messagesRes.messages);

      if (session && !session.summary && messagesRes.messages.length > 0) {
          const transcript = messagesRes.messages.map(m => `${m.role}: ${m.content}`).join('\n');
          const summary = await generateSummary(transcript);
          setGeneratedSummary(summary);
          
          await api.chat.saveSummary(Number(sessionId), summary, "Evaluation pending...");
      }

    } catch (err) {
      console.error("Failed to load session details", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Session Not Found</h2>
        <Link to="/dashboard" className="text-sky-500 hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  const displaySummary = sessionData.summary || generatedSummary || "No summary available for this session yet.";

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      
      <div className="bg-white dark:bg-black rounded-[2rem] p-8 md:p-10 border border-slate-100 dark:border-white/10 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 to-indigo-500"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div> 
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {sessionData.persona}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(sessionData.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" />
                        {sessionData.message_count} Messages
                    </div>
                </div>
            </div>
            
            <div className="flex gap-3">
                <button 
                    onClick={() => setActiveTab('summary')}
                    className={`px-6 py-2.5 rounded-full font-semibold transition-all ${
                        activeTab === 'summary' 
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg' 
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                >
                    Analysis
                </button>
                <button 
                    onClick={() => setActiveTab('conversation')}
                    className={`px-6 py-2.5 rounded-full font-semibold transition-all ${
                        activeTab === 'conversation' 
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg' 
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                >
                    Conversation
                </button>
            </div>
        </div>
      </div>

      <div className="animate-fade-in">
        {activeTab === 'summary' ? (
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-black rounded-[2rem] p-8 border border-slate-100 dark:border-white/10 shadow-sm h-full">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-8">
                    <div className="bg-sky-50 dark:bg-sky-500/10 p-2.5 rounded-xl text-sky-600 dark:text-sky-400">
                    <FileText className="w-6 h-6" />
                    </div>
                    Executive Summary
                </h2>
                <div className="prose dark:prose-invert max-w-none">
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg whitespace-pre-wrap">
                        {displaySummary}
                    </p>
                </div>
                </div>

                <div className="bg-white dark:bg-black rounded-[2rem] p-8 border border-slate-100 dark:border-white/10 shadow-sm h-full">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-8">
                        <div className="bg-purple-50 dark:bg-purple-500/10 p-2.5 rounded-xl text-purple-600 dark:text-purple-400">
                        <Sparkles className="w-6 h-6" />
                        </div>
                        AI Insights
                    </h2>
                    <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 text-center">
                        <p className="text-slate-500 dark:text-slate-400">
                            Detailed performance metrics and behavioral analysis are generated alongside the summary.
                        </p>
                    </div>
                </div>
            </div>
        ) : (
            <div className="bg-white dark:bg-black rounded-[2rem] border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-slate-400" />
                        Chat History
                    </h2>
                </div>
                <div className="p-6 md:p-10 space-y-8 max-h-[800px] overflow-y-auto custom-scrollbar">
                    {messages.map((msg, idx) => {
                        const isUser = msg.role === 'user';
                        return (
                            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] md:max-w-[70%] ${isUser ? 'order-last' : ''}`}>
                                    {!isUser && (
                                        <div className="text-xs font-bold text-sky-600 dark:text-sky-400 ml-5 mb-2">
                                            {msg.persona || sessionData.persona || "Counterpart"}
                                        </div>
                                    )}
                                    <div className={`px-6 py-4 text-[16px] leading-relaxed shadow-sm ${
                                        isUser 
                                        ? 'bg-sky-500 text-white rounded-[2rem] rounded-tr-sm' 
                                        : 'bg-slate-50 dark:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-white/5 rounded-[2rem] rounded-tl-sm'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
      </div>

      <div className="flex justify-center gap-4 pt-8">
         <Link 
           to="/dashboard"
           className="px-8 py-4 bg-white dark:bg-black text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 rounded-full font-bold transition-colors flex items-center gap-2"
         >
           <LayoutGrid className="w-5 h-5" /> Dashboard
         </Link>
         <Link 
           to="/setup"
           className="px-10 py-4 bg-sky-500 text-white hover:bg-sky-600 rounded-full font-bold shadow-xl shadow-sky-500/20 transition-all flex items-center gap-2 hover:-translate-y-1"
         >
           <RefreshCcw className="w-5 h-5" /> Simulate
         </Link>
      </div>
    </div>
  );
};

export default Summary;