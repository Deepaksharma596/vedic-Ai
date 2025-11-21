import React, { useState } from 'react';
import { BookOpen, X } from 'lucide-react';

export const DisclaimerModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-500 animate-fade-in">
      <div className="bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-800 animate-scale-in origin-center">
        <div className="bg-gradient-to-r from-saffron-700 to-saffron-800 p-6 flex justify-between items-start">
          <div className="flex items-center gap-4 text-white">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/20">
                <BookOpen size={24} />
            </div>
            <div>
                <h2 className="text-xl font-serif font-bold tracking-wide">Hari Om</h2>
                <p className="text-saffron-100 text-sm opacity-90">Pranam & Welcome</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-white/60 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full active:scale-90 ease-material duration-200"
          >
            <X size={22} />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <p className="text-stone-300 leading-relaxed font-light">
            I am a specialized humble assistant designed to share wisdom solely from the sacred texts of Sanatana Dharma.
          </p>
          
          <div className="bg-stone-950/50 rounded-xl p-4 border border-saffron-900/20">
            <h3 className="text-saffron-500 font-semibold text-xs mb-3 uppercase tracking-widest border-b border-saffron-900/20 pb-2">Sacred Knowledge Base</h3>
            <ul className="space-y-2.5 text-sm text-stone-400">
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-saffron-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
                The 4 Vedas
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-saffron-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
                10 Principal Puranas
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-saffron-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
                6 Vedangas
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-saffron-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
                Itihasas (Ramayana & Mahabharata)
              </li>
            </ul>
          </div>

          <p className="text-xs text-stone-500 text-center italic">
            "Satyameva Jayate" — Truth alone triumphs.
          </p>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-3.5 bg-stone-100 text-stone-900 font-semibold rounded-xl hover:bg-white hover:scale-[1.02] transition-all shadow-lg hover:shadow-xl active:scale-[0.98] ease-material duration-300"
          >
            Begin Spiritual Journey
          </button>
        </div>
      </div>
    </div>
  );
};