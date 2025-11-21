
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
  timestamp: Date;
  generatedImages?: string[]; // Array of base64 image strings
  isGeneratingImages?: boolean;
  cachedTranslations?: Record<string, string>; // Cache for TTS translations
  isTranslatingAudio?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export enum Language {
  ENGLISH = 'English',
  HINDI = 'Hindi',
  HINGLISH = 'Hinglish'
}

export type SourceText = 
  | 'All Scriptures' 
  | 'Bhagavad Gita' 
  | 'Rigveda' 
  | 'Yajurveda' 
  | 'Samaveda' 
  | 'Atharvaveda' 
  | 'Ramayana' 
  | 'Mahabharata' 
  | 'Puranas' 
  | 'Upanishads';

export type ToolkitMode = 
  | 'General Wisdom' 
  | 'Exact Reference' 
  | 'Sanskrit Shloka' 
  | 'Philosophical Angle' 
  | 'Scientific Parallel';
