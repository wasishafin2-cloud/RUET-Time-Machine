import React, { useState, useEffect } from 'react';
import { QuestionConfig, UserData } from '../types';

interface StepInputProps {
  config: QuestionConfig;
  value: any;
  onChange: (value: any) => void;
  onNext: () => void;
  isLast: boolean;
}

export const StepInput: React.FC<StepInputProps> = ({ config, value, onChange, onNext, isLast }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 150);
    return () => clearTimeout(timer);
  }, [config.id]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const handleSelectChange = (val: string) => {
    onChange(val);
    setTimeout(onNext, 400);
  };

  return (
    <div 
      className={`w-full max-w-2xl mx-auto transition-all duration-1000 cubic-bezier(0.19, 1, 0.22, 1) transform ${
        isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-12 blur-md'
      }`}
    >
      <div className="flex flex-col items-center text-center">
        <h2 className="text-4xl md:text-6xl font-[Manrope] font-bold text-[#1A1A1A] mb-4 tracking-tighter leading-none">
          {config.label}
        </h2>
        {config.subLabel && (
           <p className="text-lg md:text-xl font-[Playfair_Display] italic text-[#555] mb-16 max-w-lg">
             {config.subLabel}
           </p>
        )}

        <div className="w-full mb-16 min-h-[140px] flex flex-col justify-center items-center">
          {config.type === 'select' && config.options && (
            <div className="flex flex-wrap gap-4 justify-center max-w-3xl">
              {config.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelectChange(opt)}
                  className={`px-8 py-4 text-sm md:text-base tracking-widest font-[Manrope] font-bold uppercase transition-all duration-300 border-2 ${
                    value === opt 
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] scale-105 shadow-xl' 
                      : 'bg-white/50 text-[#1A1A1A] border-transparent hover:border-[#1A1A1A] hover:bg-white backdrop-blur-sm shadow-sm hover:shadow-md'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {config.type === 'slider' && config.marks && (
            <div className="w-full px-6 max-w-xl">
              <div className="relative pt-12 pb-6">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="25"
                  value={value ?? 50}
                  onChange={handleSliderChange}
                  className="z-20 relative"
                />
              </div>
              
              <div className="flex justify-between w-full mt-4">
                {config.marks.map((mark, idx) => {
                  const isActive = Math.abs((value ?? 50) - mark.value) <= 12.5;
                  return (
                    <div 
                      key={idx} 
                      className={`flex flex-col items-center transition-all duration-500 ${
                        isActive ? 'opacity-100' : 'opacity-40'
                      }`}
                      style={{ width: '33%' }}
                    >
                      <span className={`text-xs font-[Manrope] font-bold uppercase tracking-[0.15em] ${isActive ? 'text-[#1A1A1A]' : 'text-[#666]'}`}>
                        {mark.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={!value && config.type === 'select'}
          className={`
            group flex items-center gap-4 text-sm font-[Manrope] font-bold uppercase tracking-[0.2em] transition-all duration-500 px-8 py-4 rounded-full
            ${(config.type === 'slider' || value) 
              ? 'opacity-100 translate-y-0 cursor-pointer text-white bg-[#1A1A1A] hover:bg-black shadow-lg hover:shadow-2xl hover:scale-105' 
              : 'opacity-0 translate-y-4 cursor-not-allowed text-gray-400 bg-transparent'}
          `}
        >
          <span>{isLast ? 'Project Future' : 'Continue'}</span>
          <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </div>
  );
};