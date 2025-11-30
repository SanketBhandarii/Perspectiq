import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Message } from '../types';
import { Send, Loader2, ArrowLeft, SendIcon } from 'lucide-react';
import Modal from './Modal';

const ChatInterface: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

    try {
      const res = await api.chat.sendMessage({
        session_id: Number(sessionId),
        message: userMsg.content
      });

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

  const handleEndSession = async () => {
    setIsEndModalOpen(false);
    if (!sessionId) return;
    
    try {
      await api.chat.endSession({ session_id: Number(sessionId) });
      navigate(`/summary/${sessionId}`);
    } catch (err) {
      console.error("End session failed", err);
    }
  };

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

      <div className="flex items-center justify-between py-4 px-2">
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
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                  <div className={`max-w-[85%] md:max-w-[70%] ${isUser ? 'order-last' : ''}`}>
                     
                     {!isUser && msg.persona && (
                       <div className="text-xs font-bold text-sky-600 dark:text-sky-400 ml-5 mb-2">{msg.persona}</div>
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
            <form onSubmit={handleSend} className="relative flex items-center gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your response..."
                disabled={isLoading}
                autoFocus
                className="flex-1 pl-6 pr-14 py-4 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-md"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="p-3 bg-sky-500 text-white rounded-full hover:bg-sky-600 disabled:opacity-50 disabled:hover:bg-sky-500 transition-all shadow-lg shadow-sky-500/20 cursor-pointer"
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