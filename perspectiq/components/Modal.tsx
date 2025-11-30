import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border border-slate-100 dark:border-dark-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-dark-border">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-6 py-6 text-slate-600 dark:text-slate-300">
          {children}
        </div>
        
        {footer && (
          <div className="bg-slate-50 dark:bg-black/20 px-6 py-4 flex justify-end gap-3 border-t border-slate-100 dark:border-dark-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;