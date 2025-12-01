import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { generateSummary } from '../services/geminiService';
import { Message, SessionHistoryItem } from '../types';
import { CheckCircle2, RefreshCcw, LayoutGrid, FileText, Sparkles, MessageSquare, Calendar, User, Clock, BrainCircuit, Lightbulb } from 'lucide-react';

const Summary: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const state = location.state as {
    summary?: string;
    evaluation?: string;
    messageCount?: number;
    persona?: string;
    createdAt?: string;
  } | null;

  const [loading, setLoading] = useState(!state?.summary);
  const [sessionData, setSessionData] = useState<SessionHistoryItem | null>(
    state?.summary ? {
      id: Number(sessionId),
      scenario: "Loading...",
      personas: [state.persona || "Counterpart"],
      created_at: state.createdAt || new Date().toISOString(),
      summary: state.summary,
      evaluation: state.evaluation || "",
      message_count: state.messageCount || 0,
      persona: state.persona || "Counterpart"
    } : null
  );

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
      if (!sessionData) setLoading(true);

      const historyRes = await api.chat.getHistory();
      const session = historyRes.sessions.find(s => s.id === Number(sessionId));

      if (session) {
        setSessionData(prev => ({
          ...session,
          summary: state?.summary || session.summary,
          evaluation: state?.evaluation || session.evaluation
        }));
      }

      const messagesRes = await api.chat.getMessages(Number(sessionId));
      setMessages(messagesRes.messages);

      if (session && !session.summary && !state?.summary && messagesRes.messages.length > 0) {
        const transcript = messagesRes.messages.map(m => `${m.role}: ${m.content}`).join('\n');
        const summary = await generateSummary(transcript);
        setGeneratedSummary(summary);

        // Also generate evaluation if missing
        let evaluation = session.evaluation;
        if (!evaluation || evaluation === "Evaluation pending...") {
          try {
            const evalRes = await api.chat.generateEvaluation(Number(sessionId));
            evaluation = evalRes.evaluation;
            setSessionData(prev => prev ? ({ ...prev, evaluation }) : null);
          } catch (e) {
            console.error("Failed to generate evaluation", e);
          }
        }

        await api.chat.saveSummary(Number(sessionId), summary, evaluation || "Evaluation pending...");
      } else if (session && (!session.evaluation || session.evaluation === "Evaluation pending...")) {
        // If summary exists but evaluation is pending, try to generate it
        try {
          const evalRes = await api.chat.generateEvaluation(Number(sessionId));
          const evaluation = evalRes.evaluation;
          setSessionData(prev => prev ? ({ ...prev, evaluation }) : null);

          // Update the saved summary with the new evaluation
          await api.chat.saveSummary(Number(sessionId), session.summary || state?.summary || "", evaluation);
        } catch (e) {
          console.error("Failed to generate evaluation", e);
        }
      }

    } catch (err) {
      console.error("Failed to load session details", err);
    } finally {
      setLoading(false);
    }
  };

  const renderInsights = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n').filter(line => line.trim());

    return (
      <ul className="space-y-4">
        {lines.map((line, idx) => {
          const cleanLine = line.replace(/^[\*\-•\.]\s*/, '').trim();
          const parts = cleanLine.split(/(\*\*.*?\*\*|\*.*?\*)/g);

          return (
            <li key={idx} className="flex items-start gap-3 text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="mt-2 w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />
              <span>
                {parts.map((part, i) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    const innerText = part.slice(2, -2);
                    const innerParts = innerText.split(/(\*.*?\*)/g);
                    return (
                      <strong key={i} className="font-bold text-slate-800 dark:text-slate-100">
                        {innerParts.map((subPart, j) => {
                          if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length > 2) {
                            return <em key={j} className="italic text-slate-700 dark:text-slate-200">{subPart.slice(1, -1)}</em>;
                          }
                          return subPart;
                        })}
                      </strong>
                    );
                  }
                  if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                    return <em key={i} className="italic text-slate-700 dark:text-slate-200">{part.slice(1, -1)}</em>;
                  }
                  return part;
                })}
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="flex flex-col items-center gap-6 text-center px-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-100 dark:border-white/10 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            <Sparkles className="w-6 h-6 text-sky-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Analyzing Session</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Generating executive summary and actionable insights from your conversation...
            </p>
          </div>
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
    <div className="max-w-5xl mx-auto space-y-8 pb-10 w-full overflow-hidden px-4 md:px-0">
      <div className="bg-white dark:bg-black rounded-[2rem] p-8 md:p-10 border border-slate-100 dark:border-white/10 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden">
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
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 dark:border-white/10 pb-1">
        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-4 px-4 text-sm font-bold transition-all relative ${activeTab === 'summary'
            ? 'text-sky-500'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
        >
          Analysis
          {activeTab === 'summary' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-sky-500 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('conversation')}
          className={`pb-4 px-4 text-sm font-bold transition-all relative ${activeTab === 'conversation'
            ? 'text-sky-500'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
        >
          Conversation
          {activeTab === 'conversation' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-sky-500 rounded-t-full" />
          )}
        </button>
      </div>

      <div className="animate-fade-in">
        {activeTab === 'summary' ? (
          <div className="bg-white dark:bg-black rounded-[2rem] p-4 md:p-8 border border-slate-100 dark:border-white/10 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-6">
              <div className="bg-sky-50 dark:bg-sky-500/10 p-2.5 rounded-xl text-sky-600 dark:text-sky-400">
                <FileText className="w-6 h-6" />
              </div>
              Chat Analysis
            </h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center justify-center gap-2">
                  Summary
                </h3>
                <div className="prose dark:prose-invert max-w-none w-full break-words bg-slate-50 dark:bg-white/5 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base md:text-lg whitespace-pre-wrap break-words">
                    {displaySummary}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-sky-500" />
                  Key Actionable Insights
                </h3>
                <div className="prose dark:prose-invert max-w-none w-full break-words bg-slate-50 dark:bg-white/5 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                  {sessionData.evaluation ? (
                    renderInsights(sessionData.evaluation)
                  ) : (
                    <p className="text-slate-500 italic">Insights are being generated...</p>
                  )}
                </div>
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

            <div className="p-6 md:p-10 space-y-8 max-h-[600px] overflow-y-auto custom-scrollbar">
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

                      <div className={`px-6 py-4 text-[16px] leading-relaxed shadow-sm ${isUser
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

      <div className="flex flex-col md:flex-row justify-center gap-4 pt-8">
        <Link
          to="/dashboard"
          className="px-8 py-4 bg-white dark:bg-black text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 rounded-full font-bold transition-colors flex items-center justify-center gap-2 w-full md:w-auto"
        >
          <LayoutGrid className="w-5 h-5" /> Dashboard
        </Link>
        <Link
          to="/setup"
          className="px-10 py-4 bg-sky-500 text-white hover:bg-sky-600 rounded-full font-bold shadow-xl shadow-sky-500/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-1 w-full md:w-auto"
        >
          <RefreshCcw className="w-5 h-5" /> Simulate
        </Link>
      </div>
    </div>
  );
};

export default Summary;