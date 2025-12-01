import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Message } from '../types';
import { Send, Loader2, ArrowLeft, SendIcon, Lightbulb } from 'lucide-react';
import Modal from './Modal';

const ChatInterface: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (sessionId) {
      loadMessages();
    }
  }, [sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const loadMessages = async () => {
    try {
      const res = await api.chat.getMessages(Number(sessionId));
      setMessages(res.messages);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !sessionId || isLoading) return;

    const userMsg: Message = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const res = await api.chat.sendMessage({
        session_id: Number(sessionId),
        message: userMsg.content
      });

      if (res.feedback) {
        setMessages(prev => {
          const newMessages = [...prev];
          let lastUserIndex = -1;
          for (let i = newMessages.length - 1; i >= 0; i--) {
            if (newMessages[i].role === 'user') {
              lastUserIndex = i;
              break;
            }
          }
          if (lastUserIndex !== -1) {
            newMessages[lastUserIndex] = {
              ...newMessages[lastUserIndex],
              feedback: res.feedback
            };
          }
          return newMessages;
        });
      }

      const botMsg: Message = {
        role: 'assistant',
        content: res.message,
        persona: res.persona
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error("Send failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleEndSession = async () => {
    setIsEndModalOpen(false);
    if (!sessionId) return;

    setIsEnding(true);
    try {
      const res = await api.chat.endSession({ session_id: Number(sessionId) });
      const lastAiMsg = messages.findLast(m => m.role === 'assistant');
      const personaName = lastAiMsg?.persona || "Counterpart";

      navigate(`/summary/${sessionId}`, {
        state: {
          summary: res.summary,
          evaluation: res.evaluation,
          messageCount: messages.length,
          persona: personaName,
          createdAt: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error("End session failed", err);
      setIsEnding(false);
    }
  };

  if (isEnding) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)] animate-fade-in">
        <div className="flex flex-col items-center gap-6 text-center px-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-100 dark:border-white/10 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Analyzing Session</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Please wait while we generate your performance insights...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] relative">
      <Modal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        title="End Simulation"
        footer={
          <>
            <button onClick={() => setIsEndModalOpen(false)} className="px-4 py-2 text-slate-500 font-medium">Cancel</button>
            <button onClick={handleEndSession} className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors">End & Evaluate</button>
          </>
        }
      >
        <p>Are you sure you want to end this session? You will receive a detailed performance evaluation.</p>
      </Modal>

      <div className="flex items-center justify-between py-4 px-2 sticky top-0 z-10 bg-slate-50 dark:bg-black">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              PerspectiQ Live
            </h2>
            <p className="text-xs text-slate-400">Session ID: {sessionId}</p>
          </div>
        </div>
        <button
          onClick={() => setIsEndModalOpen(true)}
          className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
        >
          End Session
        </button>
      </div>

      <div className="flex-1 bg-white dark:bg-black border border-slate-100 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-fade-in">
              <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-sm font-medium">The simulation is ready. Start speaking.</p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-slide-up space-y-2`}>
                <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
                  <div className={`max-w-[85%] md:max-w-[70%] ${isUser ? 'order-last' : ''}`}>
                    {!isUser && msg.persona && (
                      <div className="text-xs font-bold text-sky-600 dark:text-sky-400 ml-5 mb-2">{msg.persona}</div>
                    )}
                    <div className={`px-6 py-3 text-[16px] leading-relaxed shadow-sm ${isUser
                      ? 'bg-sky-500 text-white rounded-[2rem]'
                      : 'bg-slate-50 dark:bg-white/10 text-slate-800 dark:text-slate-200 dark:border-white/5 rounded-[2rem]'
                      }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>

                {/* Coach's Tip */}
                {isUser && msg.feedback && (
                  <div className="max-w-[85%] md:max-w-[70%] mr-2 animate-fade-in">
                    <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-500/20 rounded-xl p-3 flex gap-3 items-start">
                      <div className="bg-cyan-100 dark:bg-cyan-500/20 p-1.5 rounded-lg text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">Coach's Tip</span>
                          <span className="text-xs font-medium text-cyan-600/70 dark:text-cyan-500/70">• Score: {msg.feedback.score}/10</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug mb-2">
                          {msg.feedback.feedback}
                        </p>
                        {msg.feedback.suggested_response && (
                          <div className="mt-2 pt-2 border-t border-cyan-200 dark:border-cyan-500/30">
                            <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider block mb-1">Try saying:</span>
                            <p className="text-sm italic text-slate-600 dark:text-slate-400">
                              "{msg.feedback.suggested_response}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="px-6 py-5 bg-slate-50 dark:bg-white/10 border border-slate-100 dark:border-white/5 rounded-[2rem] rounded-tl-sm">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 md:p-6 bg-white dark:bg-black border-t border-slate-100 dark:border-white/5">
          <form onSubmit={handleSend} className="relative flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              disabled={isLoading}
              autoFocus
              rows={1}
              className="flex-1 pl-6 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-white/5 transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-md resize-none max-h-32 custom-scrollbar"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-3 bg-sky-500 text-white rounded-full hover:bg-sky-600 disabled:opacity-50 disabled:hover:bg-sky-500 transition-all shadow-lg shadow-sky-500/20 cursor-pointer mb-1"
            >
              <SendIcon className="w-6 h-6" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;