import React from 'react';

interface TilakLoaderProps {
  size?: number;
  className?: string;
}

export const TilakLoader: React.FC<TilakLoaderProps> = ({ size = 40, className = '' }) => {
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size * 1.2 }}
    >
      <svg 
        viewBox="0 0 50 60" 
        className="w-full h-full overflow-visible"
        style={{ filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.4))' }}
      >
        <defs>
          <linearGradient id="saffronGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fb923c" /> {/* saffron-400 */}
            <stop offset="100%" stopColor="#ea580c" /> {/* saffron-600 */}
          </linearGradient>
        </defs>
        
        {/* U-Shape (Vaishnava Tilak base) */}
        <path
          d="M 15 10 L 15 35 Q 25 55 35 35 L 35 10"
          fill="none"
          stroke="url(#saffronGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          className="animate-[drawTilak_2s_ease-in-out_infinite]"
          strokeDasharray="100"
          strokeDashoffset="100"
        />
        
        {/* Central Mark (Sandalwood/Turmeric) */}
        <line
          x1="25"
          y1="45"
          x2="25"
          y2="20"
          stroke="#fed7aa" 
          strokeWidth="3"
          strokeLinecap="round"
          className="animate-[drawLine_2s_ease-in-out_infinite_0.4s] opacity-0"
        />
        
        {/* Bindu (Dot) */}
        <circle
          cx="25"
          cy="50"
          r="3"
          fill="#dc2626"
          className="animate-[fadeInOut_2s_ease-in-out_infinite_1s] opacity-0"
        />
      </svg>
      
      <style>{`
        @keyframes drawTilak {
          0% { stroke-dashoffset: 100; opacity: 0; }
          15% { opacity: 1; }
          50% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes drawLine {
          0% { stroke-dasharray: 0 25; opacity: 0; }
          40% { opacity: 1; }
          60% { stroke-dasharray: 25 0; }
          100% { opacity: 1; }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: scale(0); }
          60% { opacity: 1; transform: scale(1.3); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};