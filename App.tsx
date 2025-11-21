import React, { useState, useRef, useEffect } from 'react';
import { Send, Scroll, Book, RefreshCcw, Bookmark, Sparkles, ChevronDown, Play, GitBranch, FileText, Atom, Search, PenTool, Brain, Scale, Library, History, Settings, X, Clock, ChevronRight } from 'lucide-react';
import { Message, ChatState, Language, SourceText, ToolkitMode } from './types';
import { sendMessageStream, initializeChat, generateIllustrations, translateForTTS } from './services/geminiService';
import { MessageBubble } from './components/MessageBubble';
import { DisclaimerModal } from './components/DisclaimerModal';
import { TilakLoader } from './components/TilakLoader';

function App() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null
  });

  const [inputText, setInputText] = useState('');
  const [currentlyReadingId, setCurrentlyReadingId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  // Feature States
  const [activeSource, setActiveSource] = useState<SourceText>('All Scriptures');
  const [activeMode, setActiveMode] = useState<ToolkitMode>('General Wisdom');
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const [showToolkitMenu, setShowToolkitMenu] = useState(false);
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Touch Handling Refs
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);
  const touchEndRef = useRef<{ x: number, y: number } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speechSynth = useRef<SpeechSynthesis>(window.speechSynthesis);
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  
  const sourceMenuRef = useRef<HTMLDivElement>(null);
  const toolkitMenuRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  // Initialize chat on mount
  useEffect(() => {
    initializeChat();
    return () => {
      if (speechSynth.current) {
        speechSynth.current.cancel();
      }
    };
  }, []);

  // Click outside handler for menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sourceMenuRef.current && !sourceMenuRef.current.contains(event.target as Node)) {
        setShowSourceMenu(false);
      }
      if (toolkitMenuRef.current && !toolkitMenuRef.current.contains(event.target as Node)) {
        setShowToolkitMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Touch Handlers for Swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    
    const xDiff = touchStartRef.current.x - touchEndRef.current.x;
    const yDiff = touchStartRef.current.y - touchEndRef.current.y;
    
    // Ensure swipe is predominantly horizontal
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      // Swipe Right (finger moves left to right) -> Open Sidebar
      // Threshold: 50% of screen width
      const threshold = window.innerWidth * 0.5;
      
      if (xDiff < -threshold) {
        setIsSidebarOpen(true);
      }
      
      // Swipe Left (finger moves right to left) -> Close Sidebar
      // Lower threshold for closing for better UX
      if (xDiff > 50 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    }
    
    // Reset refs
    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const startChat = async (text: string) => {
    if (!text.trim() || state.isLoading) return;
    
    setShowSuggestions(false);
    speechSynth.current.cancel();
    setCurrentlyReadingId(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date()
    };

    const botMessageId = (Date.now() + 1).toString();
    const initialBotMessage: Message = {
      id: botMessageId,
      role: 'model',
      text: '',
      isStreaming: true,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage, initialBotMessage],
      isLoading: true,
      error: null
    }));

    setInputText('');
    if (inputRef.current) inputRef.current.style.height = 'auto';

    try {
      const stream = sendMessageStream(userMessage.text, activeSource, activeMode);
      let fullResponse = '';
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, text: fullResponse } 
              : msg
          )
        }));
      }

      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, isStreaming: false } 
            : msg
        ),
        isLoading: false
      }));

    } catch (error) {
      console.error(error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "Hari Om. I encountered a momentary disturbance. Please try asking again."
      }));
    }
  };

  const handleSend = () => {
    startChat(inputText);
  };

  const handleSuggestionClick = (text: string) => {
    startChat(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    if (confirm("Do you wish to clear the slate and begin anew?")) {
      speechSynth.current.cancel();
      setCurrentlyReadingId(null);
      initializeChat();
      setState({
        messages: [],
        isLoading: false,
        error: null
      });
      setShowSuggestions(true);
      setActiveSource('All Scriptures');
      setActiveMode('General Wisdom');
    }
  };

  // Speak helper
  const speakText = (text: string, id: string, language: string) => {
    const cleanText = text.replace(/[*_#`]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9; 
    utterance.pitch = 1.0;
    
    const voices = speechSynth.current.getVoices();
    let targetVoice = null;

    const hasDevanagari = /[\u0900-\u097F]/.test(text);

    if (hasDevanagari) {
       targetVoice = voices.find(v => v.lang === 'hi-IN') || 
                     voices.find(v => v.lang.startsWith('hi'));
    } else {
       targetVoice = voices.find(v => v.lang === 'en-IN') || 
                     voices.find(v => v.lang === 'hi-IN');
    }

    if (!targetVoice) {
       targetVoice = voices.find(v => v.lang.startsWith('en'));
    }

    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    utterance.onend = () => setCurrentlyReadingId(null);
    utterance.onerror = () => setCurrentlyReadingId(null);

    currentUtterance.current = utterance;
    setCurrentlyReadingId(id);
    speechSynth.current.speak(utterance);
  };

  const handleReadAloud = async (message: Message, language: string) => {
    if (currentlyReadingId === message.id || !language) {
      speechSynth.current.cancel();
      setCurrentlyReadingId(null);
      return;
    }

    speechSynth.current.cancel();

    if (message.cachedTranslations && message.cachedTranslations[language]) {
      speakText(message.cachedTranslations[language], message.id, language);
      return;
    }
    
    const text = message.text;
    const hasDevanagari = /[\u0900-\u097F]/.test(text);
    let needsTranslation = false;

    if (language === Language.HINDI && !hasDevanagari) needsTranslation = true;
    else if (language === Language.HINGLISH) needsTranslation = true;
    else if (language === Language.ENGLISH && hasDevanagari) needsTranslation = true;

    if (!needsTranslation) {
       speakText(text, message.id, language);
       return;
    }

    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.id === message.id ? { ...msg, isTranslatingAudio: true } : msg
      )
    }));

    try {
      const translatedText = await translateForTTS(message.text, language);
      
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === message.id 
            ? { 
                ...msg, 
                isTranslatingAudio: false, 
                cachedTranslations: { ...(msg.cachedTranslations || {}), [language]: translatedText } 
              } 
            : msg
        )
      }));

      speakText(translatedText, message.id, language);

    } catch (error) {
      console.error("Translation error", error);
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === message.id ? { ...msg, isTranslatingAudio: false } : msg
        )
      }));
      speakText(message.text, message.id, language);
    }
  };

  const handleVisualize = async (message: Message) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.id === message.id ? { ...msg, isGeneratingImages: true } : msg
      )
    }));

    try {
      const images = await generateIllustrations(message.text);
      
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === message.id 
            ? { ...msg, isGeneratingImages: false, generatedImages: images } 
            : msg
        )
      }));
    } catch (error) {
      console.error("Failed to generate images", error);
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === message.id ? { ...msg, isGeneratingImages: false } : msg
        )
      }));
      alert("I apologize, I could not conjure the vision at this moment.");
    }
  };

  const sourceOptions: SourceText[] = [
    'All Scriptures', 'Bhagavad Gita', 'Rigveda', 'Yajurveda', 'Samaveda', 
    'Atharvaveda', 'Ramayana', 'Mahabharata', 'Puranas', 'Upanishads'
  ];

  const toolkitOptions: { mode: ToolkitMode, icon: React.ReactNode, label: string }[] = [
    { mode: 'General Wisdom', icon: <Sparkles size={18} />, label: 'General Wisdom' },
    { mode: 'Exact Reference', icon: <Search size={18} />, label: 'Find Exact Reference' },
    { mode: 'Sanskrit Shloka', icon: <PenTool size={18} />, label: 'Draw Out Exact Shloka' },
    { mode: 'Philosophical Angle', icon: <Brain size={18} />, label: 'Philosophical Angle' },
    { mode: 'Scientific Parallel', icon: <Atom size={18} />, label: 'Scientific Parallel' }
  ];

  return (
    <div 
      className="flex flex-col h-screen bg-stone-950 text-stone-200 font-sans overflow-hidden relative transition-colors duration-1000 ease-in-out"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-900 via-black to-stone-950 opacity-80 pointer-events-none z-0"></div>
      
      <DisclaimerModal />

      {/* SIDEBAR OVERLAY */}
      <div 
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] transition-opacity duration-500 ease-material
        ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* SIDEBAR */}
      <div className={`fixed top-0 left-0 h-full w-[80%] max-w-xs bg-stone-950 border-r border-stone-800 z-50 shadow-2xl transform transition-transform duration-500 ease-material-decelerate
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between border-b border-stone-900">
            <h2 className="font-serif font-bold text-2xl tracking-tight">
              <span className="text-saffron-100">VED</span>
              <span className="text-vedic-teal-400">IQ</span>
            </h2>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-stone-500 hover:text-stone-300 rounded-full hover:bg-stone-900 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* History Section */}
            <div>
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 px-2">History</h3>
              <div className="space-y-1">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-stone-900/50 border border-stone-800/50 hover:bg-stone-900 hover:border-saffron-900/30 transition-all group">
                  <div className="p-2 rounded-lg bg-stone-800 text-stone-400 group-hover:text-saffron-400 group-hover:bg-stone-800/80 transition-colors">
                    <Clock size={16} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm text-stone-300 font-medium group-hover:text-white truncate">Current Session</p>
                    <p className="text-[10px] text-stone-500">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  <ChevronRight size={14} className="text-stone-600 group-hover:text-stone-400" />
                </button>
                
                {/* Placeholder History Item */}
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-stone-900/30 transition-colors group opacity-60">
                  <div className="p-2 rounded-lg bg-stone-900 text-stone-600">
                    <History size={16} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm text-stone-500 font-medium truncate">The Nature of Atman</p>
                    <p className="text-[10px] text-stone-700">Yesterday</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Bookmarks Section */}
            <div>
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 px-2">Bookmarks</h3>
              <div className="text-center py-8 border border-dashed border-stone-800 rounded-xl bg-stone-900/20">
                <Bookmark size={24} className="mx-auto text-stone-700 mb-2" />
                <p className="text-xs text-stone-500">No sacred verses saved yet.</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-stone-900">
             <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-stone-900 transition-colors text-stone-400 hover:text-vedic-teal-400">
                <Settings size={18} />
                <span className="text-sm font-medium">Settings</span>
             </button>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header className="flex-none h-20 bg-transparent flex items-center px-6 justify-between z-20">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={handleReset}>
          <h1 className="font-serif font-bold text-3xl tracking-tight">
            <span className="text-saffron-100">VED</span>
            <span className="text-vedic-teal-400">IQ</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-stone-900/60 backdrop-blur-md rounded-full border border-stone-800 text-xs font-medium text-stone-400">
             <div className="w-4 h-4 rounded-full flex items-center justify-center border border-saffron-500/50 text-saffron-500 text-[8px]">ॐ</div>
             <span>Vedic Mode</span>
             <Sparkles size={10} className="text-vedic-teal-400 ml-1" />
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-stone-400 hover:text-saffron-200 transition-colors"
          >
            <Bookmark size={24} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative z-10 scroll-smooth flex flex-col">
        <div className="max-w-3xl mx-auto px-4 w-full flex-1 flex flex-col">
          
          {showSuggestions ? (
            <div className="flex-1 flex flex-col justify-center animate-fade-in">
              <div className="mb-8">
                 <h2 className="text-saffron-100/90 text-lg font-serif font-medium tracking-wide mb-6 opacity-80">MAIN CONTENT</h2>
                 <div className="space-y-4">
                    <button 
                      onClick={() => handleSuggestionClick("What is dharma according to the Gita?")}
                      className="w-full group p-6 rounded-2xl bg-stone-900/40 border border-stone-800 hover:bg-stone-900/60 hover:border-saffron-900/30 transition-all duration-300 flex items-center gap-5 text-left backdrop-blur-sm active:scale-[0.98] ease-material origin-center"
                    >
                       <div className="p-3 rounded-xl bg-stone-800/50 text-stone-400 group-hover:text-saffron-400 group-hover:bg-stone-800 transition-colors">
                          <GitBranch size={24} strokeWidth={1.5} />
                       </div>
                       <div>
                         <p className="text-stone-200 text-lg font-light group-hover:text-white">What is dharma according to the Gita?</p>
                       </div>
                    </button>

                    <button 
                      onClick={() => handleSuggestionClick("Explain the concept of Karma.")}
                      className="w-full group p-6 rounded-2xl bg-stone-900/40 border border-stone-800 hover:bg-stone-900/60 hover:border-saffron-900/30 transition-all duration-300 flex items-center gap-5 text-left backdrop-blur-sm active:scale-[0.98] ease-material origin-center"
                    >
                       <div className="p-3 rounded-xl bg-stone-800/50 text-stone-400 group-hover:text-vedic-teal-400 group-hover:bg-stone-800 transition-colors">
                          <Atom size={24} strokeWidth={1.5} />
                       </div>
                       <div>
                         <p className="text-stone-200 text-lg font-light group-hover:text-white">Explain the concept of Karma.</p>
                       </div>
                    </button>

                    <button 
                      onClick={() => handleSuggestionClick("Meaning of a specific shloka?")}
                      className="w-full group p-6 rounded-2xl bg-stone-900/40 border border-stone-800 hover:bg-stone-900/60 hover:border-saffron-900/30 transition-all duration-300 flex items-center gap-5 text-left backdrop-blur-sm active:scale-[0.98] ease-material origin-center"
                    >
                       <div className="p-3 rounded-xl bg-stone-800/50 text-stone-400 group-hover:text-saffron-400 group-hover:bg-stone-800 transition-colors">
                          <FileText size={24} strokeWidth={1.5} />
                       </div>
                       <div>
                         <p className="text-stone-200 text-lg font-light group-hover:text-white">Meaning of a specific shloka?</p>
                       </div>
                    </button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-8">
               {state.messages.map((msg) => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  onReadAloud={handleReadAloud}
                  onVisualize={handleVisualize}
                  currentlyReadingId={currentlyReadingId}
                />
              ))}
              
              {state.error && (
                <div className="p-4 mb-4 bg-red-900/20 border border-red-800/30 text-red-300 rounded-xl text-center text-sm backdrop-blur-sm animate-scale-in origin-bottom">
                  {state.error}
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>
      </main>

      <footer className="flex-none p-6 pb-8 z-20 relative">
        <div className="max-w-3xl mx-auto relative">
          
          {/* Source Focus Dropdown */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30" ref={sourceMenuRef}>
             <button 
                onClick={() => setShowSourceMenu(!showSourceMenu)}
                className="flex items-center gap-2 px-5 py-2 bg-stone-900/90 rounded-full border border-saffron-500/20 shadow-lg backdrop-blur-md cursor-pointer hover:border-saffron-500/40 transition-all duration-300 group active:scale-95 ease-material"
             >
                <span className="text-xs text-saffron-500 font-medium whitespace-nowrap uppercase tracking-wider">Source:</span>
                <span className="text-xs text-stone-300 group-hover:text-white whitespace-nowrap font-medium">{activeSource}</span>
                <ChevronDown size={14} className={`text-stone-500 group-hover:text-stone-300 transition-transform duration-300 ease-material ${showSourceMenu ? 'rotate-180' : ''}`} />
             </button>

             {/* Source Menu */}
             <div 
               className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-stone-900/95 border border-stone-700 rounded-2xl shadow-2xl overflow-hidden glass-panel origin-bottom
                 transition-all duration-300 ease-material
                 ${showSourceMenu 
                   ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                   : 'opacity-0 scale-75 translate-y-4 pointer-events-none'}`}
             >
               <div className="max-h-72 overflow-y-auto py-1 custom-scrollbar">
                 {sourceOptions.map((option) => (
                   <button
                     key={option}
                     onClick={() => {
                       setActiveSource(option);
                       setShowSourceMenu(false);
                     }}
                     className={`w-full text-left px-5 py-3 text-sm transition-colors border-b border-stone-800/50 last:border-0 active:bg-stone-800
                       ${activeSource === option ? 'text-saffron-400 bg-stone-800/80 font-medium' : 'text-stone-300 hover:bg-stone-800 hover:text-white'}`}
                   >
                     {option}
                   </button>
                 ))}
               </div>
             </div>
          </div>

          {/* Input Bar */}
          <div className="relative flex items-center gap-2 bg-stone-900/70 p-2 pl-4 rounded-full border border-stone-800 
            focus-within:border-stone-700 focus-within:bg-stone-900 focus-within:shadow-[0_0_30px_rgba(0,0,0,0.5)]
            transition-all duration-500 ease-material shadow-xl backdrop-blur-xl"
          >
            {/* Toolkit (Chakra) Button & Menu */}
            <div className="relative flex-shrink-0" ref={toolkitMenuRef}>
              <button 
                onClick={() => setShowToolkitMenu(!showToolkitMenu)}
                className={`p-2.5 rounded-full transition-all duration-300 active:scale-90 ease-material hover:bg-stone-800 ${activeMode !== 'General Wisdom' ? 'text-vedic-teal-400' : 'text-saffron-500/80'}`}
                title="Vedic Toolkit"
              >
                {activeMode === 'General Wisdom' ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin-slow">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 2v20"/>
                    <path d="M2 12h20"/>
                    <path d="m4.93 4.93 14.14 14.14"/>
                    <path d="m19.07 4.93-14.14 14.14"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                ) : (
                   toolkitOptions.find(t => t.mode === activeMode)?.icon
                )}
              </button>

               {/* Toolkit Menu */}
               <div 
                 className={`absolute bottom-full left-0 mb-4 w-72 bg-stone-900/95 border border-stone-700 rounded-2xl shadow-2xl overflow-hidden z-40 glass-panel origin-bottom-left
                   transition-all duration-300 ease-material
                   ${showToolkitMenu 
                     ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                     : 'opacity-0 scale-50 translate-y-8 pointer-events-none'}`}
               >
                  <div className="px-5 py-3 text-[10px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-800 bg-stone-950/30">
                    Select Response Mode
                  </div>
                  <div className="p-1.5">
                    {toolkitOptions.map((option) => (
                      <button
                        key={option.mode}
                        onClick={() => {
                          setActiveMode(option.mode);
                          setShowToolkitMenu(false);
                        }}
                        className={`w-full flex items-center gap-4 px-4 py-3 text-sm rounded-xl transition-all duration-200 mb-1 last:mb-0 active:scale-95 ease-material
                          ${activeMode === option.mode 
                            ? 'bg-vedic-teal-900/20 text-vedic-teal-400 font-medium shadow-sm' 
                            : 'text-stone-300 hover:bg-stone-800 hover:text-white'}`}
                      >
                        <span className={activeMode === option.mode ? 'text-vedic-teal-400' : 'text-stone-500 group-hover:text-white'}>
                          {option.icon}
                        </span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            <textarea
              ref={inputRef}
              value={inputText}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={`Ask regarding ${activeSource}...`}
              className="w-full bg-transparent border-none focus:ring-0 p-3 text-stone-200 placeholder:text-stone-500 resize-none max-h-[120px] min-h-[44px] leading-relaxed text-base transition-all duration-300"
              rows={1}
            />
            
            <button
              onClick={handleSend}
              disabled={state.isLoading || !inputText.trim()}
              className="p-3 rounded-full bg-vedic-teal-400 text-stone-950 hover:bg-vedic-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_0_15px_rgba(45,212,191,0.3)] hover:shadow-[0_0_25px_rgba(45,212,191,0.5)] hover:scale-105 active:scale-90 ease-material flex-shrink-0 mr-1"
            >
              {state.isLoading ? (
                 <TilakLoader size={20} className="w-5 h-5" />
              ) : (
                 <Play size={20} fill="currentColor" className="ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;