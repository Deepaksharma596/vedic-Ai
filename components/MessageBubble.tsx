import React, { useState, useRef, useEffect } from 'react';
import { Message, Language } from '../types';
import { User, Bot, Sparkles, Volume2, VolumeX, Image as ImageIcon, Loader2, MoreHorizontal } from 'lucide-react';
import { TilakLoader } from './TilakLoader';

interface MessageBubbleProps {
  message: Message;
  onReadAloud: (message: Message, language: string) => void;
  onVisualize: (message: Message) => void;
  currentlyReadingId: string | null;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  onReadAloud, 
  onVisualize,
  currentlyReadingId 
}) => {
  const [showVoiceOptions, setShowVoiceOptions] = useState(false);
  const isUser = message.role === 'user';
  const isReading = currentlyReadingId === message.id;
  const hasImages = message.generatedImages && message.generatedImages.length > 0;
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowVoiceOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatText = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-saffron-200">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const handleLanguageSelect = (lang: string) => {
    setShowVoiceOptions(false);
    onReadAloud(message, lang);
  };

  return (
    <div className={`flex w-full mb-4 animate-slide-up ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col max-w-[95%] md:max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg border transition-transform duration-300 hover:scale-110 ease-material
            ${isUser 
              ? 'bg-stone-800 text-stone-400 border-stone-700' 
              : 'bg-gradient-to-br from-stone-800 to-stone-900 text-vedic-teal-400 border-stone-700'
            }`}>
            {isUser ? <User size={16} /> : <Bot size={16} />}
          </div>

          {/* Bubble */}
          <div 
            className={`relative p-5 rounded-2xl shadow-md text-sm md:text-base leading-relaxed backdrop-blur-sm transition-all duration-300
              ${isUser 
                ? 'bg-stone-800/80 text-stone-200 rounded-tr-sm border border-stone-700/50' 
                : 'bg-stone-900/40 text-stone-300 rounded-tl-sm border border-stone-800'
              }`}
          >
            <div className="whitespace-pre-wrap font-sans tracking-wide">
              {formatText(message.text)}
            </div>
            
            {message.isStreaming && (
               <span className="inline-block ml-2 align-middle opacity-80">
                 <TilakLoader size={16} />
               </span>
            )}
            
            {/* Generated Images Gallery */}
            {hasImages && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-in">
                {message.generatedImages!.map((img, idx) => (
                  <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-stone-700 shadow-lg group cursor-pointer">
                    <div className="absolute inset-0 bg-saffron-500/10 group-hover:bg-transparent transition-colors duration-300 z-10 pointer-events-none"></div>
                    <img 
                      src={img} 
                      alt={`Divine visualization ${idx + 1}`} 
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Image Generation Loader */}
            {message.isGeneratingImages && (
              <div className="mt-4 p-4 bg-stone-900/50 rounded-xl border border-dashed border-stone-700 flex items-center gap-4 animate-pulse">
                <TilakLoader size={20} />
                <span className="text-xs text-stone-500 font-serif italic tracking-wide">Conjuring visual forms...</span>
              </div>
            )}

            {/* Audio Translation Loader */}
            {message.isTranslatingAudio && (
              <div className="mt-3 flex items-center gap-2 text-xs text-vedic-teal-400/80 animate-pulse">
                <Loader2 size={12} className="animate-spin" />
                <span>Preparing holy speech...</span>
              </div>
            )}

            {/* Bot Actions */}
            {!isUser && !message.isStreaming && (
              <div className="flex items-center justify-start gap-3 mt-4 pt-3 border-t border-stone-800/50">
                 
                  {/* Read Aloud Button & Menu */}
                  <div className="relative" ref={menuRef}>
                    <button 
                      onClick={() => {
                        if (isReading) {
                           onReadAloud(message, ''); // Stop
                        } else {
                           setShowVoiceOptions(!showVoiceOptions);
                        }
                      }}
                      className={`p-1.5 rounded-full transition-all duration-300 active:scale-90 ease-material ${isReading ? 'bg-vedic-teal-900/30 text-vedic-teal-400 scale-110' : 'hover:bg-stone-800 text-stone-500 hover:text-stone-300'}`}
                      title={isReading ? "Stop Chanting" : "Chant Aloud"}
                    >
                      {isReading ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>

                    {/* Language Menu Popover - CSS Toggle for Smooth Open/Close */}
                    <div 
                      className={`absolute bottom-full left-0 mb-2 w-32 bg-stone-900 border border-stone-700 rounded-xl shadow-xl overflow-hidden z-50 origin-bottom-left
                        transition-all duration-300 ease-material
                        ${showVoiceOptions && !isReading 
                          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                          : 'opacity-0 scale-75 translate-y-2 pointer-events-none'}`}
                    >
                      <div className="bg-stone-950/50 px-3 py-2 text-[10px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-800">
                        Voice Language
                      </div>
                      <div className="p-1 space-y-0.5">
                        {[Language.ENGLISH, Language.HINDI, Language.HINGLISH].map((lang) => (
                          <button
                            key={lang}
                            onClick={() => handleLanguageSelect(lang)}
                            className="w-full text-left px-3 py-2 text-xs text-stone-300 hover:bg-stone-800 hover:text-white rounded-lg transition-colors active:bg-stone-700 ease-material"
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Visualize Button */}
                  <button 
                    onClick={() => onVisualize(message)}
                    className="p-1.5 rounded-full hover:bg-stone-800 text-stone-500 hover:text-saffron-400 transition-all duration-300 active:scale-90 ease-material"
                    title="Depict in images"
                    disabled={message.isGeneratingImages || hasImages}
                  >
                    {message.isGeneratingImages ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ImageIcon size={16} />
                    )}
                  </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};