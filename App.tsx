import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppState, UserData, QuestionConfig, ProjectionResult } from './types';
import { StepInput } from './components/StepInput';
import { generateProjection } from './services/geminiService';

const QUESTIONS: QuestionConfig[] = [
  {
    id: 'department',
    label: 'Department',
    subLabel: 'Your academic identity base.',
    type: 'select',
    options: ['CSE', 'EEE', 'ME', 'CE', 'ARCH', 'ETE', 'MTE', 'GCE', 'URP', 'IPE', 'CFPE']
  },
  {
    id: 'semester',
    label: 'Current Semester',
    subLabel: 'Where you stand in the timeline.',
    type: 'select',
    options: ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2']
  },
  {
    id: 'currentCGPA',
    label: 'Current CGPA',
    subLabel: 'The number that defines your options in BD.',
    type: 'select',
    options: ['< 2.75', '2.75 - 3.00', '3.00 - 3.25', '3.25 - 3.50', '3.50 - 3.75', '3.75+']
  },
  {
    id: 'careerGoal',
    label: 'Primary Ambition',
    subLabel: 'What are you actually chasing?',
    type: 'select',
    options: ['BCS / Govt Job', 'Study Abroad (MSc/PhD)', 'Corporate / Dev Job', 'Entrepreneurship', 'No Clue']
  },
  {
    id: 'studyConsistency',
    label: 'Study Habits',
    subLabel: 'Be honest about your routine.',
    type: 'slider',
    marks: [
      { label: 'Night Before Exam', value: 0 },
      { label: 'Weekly Effort', value: 50 },
      { label: 'Daily Grind', value: 100 }
    ]
  },
  {
    id: 'campusLife',
    label: 'Campus Social Engagement',
    subLabel: 'Tong, politics, clubs, or library?',
    type: 'slider',
    marks: [
      { label: 'Ghost / Dorm', value: 0 },
      { label: 'Balanced', value: 50 },
      { label: 'Tong Legend', value: 100 }
    ]
  },
  {
    id: 'skillBuilding',
    label: 'Skills Outside Syllabus',
    subLabel: 'Coding, design, communication, etc.',
    type: 'slider',
    marks: [
      { label: 'Zero', value: 0 },
      { label: 'Dabbler', value: 50 },
      { label: 'Pro', value: 100 }
    ]
  },
  {
    id: 'classAttendance',
    label: 'Class Attendance',
    subLabel: 'The proxy discipline metric.',
    type: 'slider',
    marks: [
      { label: 'Proxy Master', value: 0 },
      { label: 'Selective', value: 50 },
      { label: 'First Bench', value: 100 }
    ]
  },
  {
    id: 'dailyScreenTime',
    label: 'Digital Distraction',
    subLabel: 'Reels, Gaming, Scrolling.',
    type: 'slider',
    marks: [
      { label: 'Locked In', value: 0 },
      { label: 'Average', value: 50 },
      { label: 'Brain Rot', value: 100 }
    ]
  }
];

// Interactive Background Component
const InteractiveBackground = () => {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#F0F0EE]">
      {/* Dynamic gradients that move with mouse */}
      <div 
        className="absolute w-[120vw] h-[120vw] bg-[radial-gradient(circle_at_center,rgba(200,200,210,0.15),transparent_60%)] blur-3xl transition-transform duration-1000 ease-out"
        style={{ 
          top: '50%', 
          left: '50%', 
          transform: `translate(-50%, -50%) translate(${(mousePos.x - 50) * -0.5}px, ${(mousePos.y - 50) * -0.5}px)` 
        }}
      />
      <div 
        className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay pointer-events-none"
      />
      
      {/* Animated Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-indigo-100/30 to-transparent blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-stone-200/40 to-transparent blur-[100px] animate-float" />
    </div>
  );
};

const FadeInSection: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      });
    }, { threshold: 0.1 });
    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      {children}
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<AppState>(AppState.LANDING);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userData, setUserData] = useState<Partial<UserData>>({});
  const [projection, setProjection] = useState<ProjectionResult | null>(null);
  const [processingPhase, setProcessingPhase] = useState(0);
  const [finalMessageState, setFinalMessageState] = useState<'hidden' | 'visible' | 'faded'>('hidden');

  const handleStart = () => {
    setState(AppState.INPUT);
  };

  const handleInputChange = (value: any) => {
    const key = QUESTIONS[currentQuestionIndex].id;
    setUserData(prev => ({ ...prev, [key]: value }));
  };

  const handleNextStep = async () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setState(AppState.PROCESSING);
      
      const cycleInterval = setInterval(() => {
        setProcessingPhase(p => (p < 2 ? p + 1 : p));
      }, 2000);

      try {
        const result = await generateProjection(userData as UserData);
        setProjection(result);
        
        setTimeout(() => {
          clearInterval(cycleInterval);
          setState(AppState.RESULTS);
        }, 5500); 
      } catch (error) {
        clearInterval(cycleInterval);
        console.error(error);
        alert("An error occurred. Please refresh.");
      }
    }
  };

  useEffect(() => {
    if (state === AppState.RESULTS) {
      setTimeout(() => setFinalMessageState('visible'), 2000);
      setTimeout(() => setFinalMessageState('faded'), 8000);
    }
  }, [state]);

  const renderLanding = () => (
    <div className="flex flex-col justify-center min-h-screen px-6 md:px-12 max-w-6xl mx-auto relative z-10">
      <div className="max-w-5xl animate-fade-in-up">
        <h1 className="text-6xl md:text-9xl font-[Manrope] font-bold tracking-tighter text-[#1A1A1A] mb-8 leading-[0.9] mix-blend-darken">
          RUET<br />TIME MACHINE
        </h1>
        <div className="h-px w-32 bg-[#1A1A1A] mb-12"></div>
        <p className="text-xl md:text-3xl text-[#444] font-[Playfair_Display] italic max-w-xl mb-16 leading-relaxed">
          CGPA. Habits. The Job Market.<br />
          See the future you are currently building.
        </p>
        <button
          onClick={handleStart}
          className="group relative inline-flex items-center text-sm font-[Manrope] font-bold uppercase tracking-[0.2em] text-[#1A1A1A] hover:text-[#000] transition-colors"
        >
          <span className="border-b-2 border-[#1A1A1A] pb-1">Start Projection</span>
          <svg className="w-5 h-5 ml-3 transition-transform duration-500 group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </div>
  );

  const renderInput = () => (
    <div className="flex flex-col min-h-screen relative z-10">
      {/* Refined Progress Indicator */}
      <div className="fixed top-0 left-0 w-full h-1.5 z-50">
        <div 
          className="h-full bg-[#1A1A1A] transition-all duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)]"
          style={{ width: `${((currentQuestionIndex + 1) / QUESTIONS.length) * 100}%` }}
        ></div>
      </div>

      <div className="flex-grow flex items-center justify-center px-6 py-12">
        <StepInput
          key={currentQuestionIndex}
          config={QUESTIONS[currentQuestionIndex]}
          value={userData[QUESTIONS[currentQuestionIndex].id]}
          onChange={handleInputChange}
          onNext={handleNextStep}
          isLast={currentQuestionIndex === QUESTIONS.length - 1}
        />
      </div>
    </div>
  );

  const renderProcessing = () => {
    const messages = [
      "Analyzing semester trajectory...",
      "Factoring in BD job market saturation...",
      "Calculating CGPA probabilities...",
      "Projecting 5 years forward..."
    ];

    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 relative z-10">
        <div className="w-full max-w-2xl text-center">
          <div className="h-24 mb-12 flex items-center justify-center overflow-hidden relative">
            {messages.map((msg, idx) => (
              <p
                key={idx}
                className={`absolute w-full text-3xl md:text-5xl font-[Playfair_Display] italic text-[#1A1A1A] transition-all duration-1000 transform ${
                  idx === processingPhase 
                    ? 'opacity-100 translate-y-0 blur-0' 
                    : idx < processingPhase 
                      ? 'opacity-0 -translate-y-12 blur-sm' 
                      : 'opacity-0 translate-y-12 blur-sm'
                }`}
              >
                {msg}
              </p>
            ))}
          </div>
          <div className="h-[2px] w-full bg-[#D1D1D1] overflow-hidden rounded-full">
             <div className="h-full bg-[#1A1A1A] animate-[loading_2.5s_ease-in-out_infinite] w-1/4"></div>
          </div>
        </div>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); width: 60%; }
            100% { transform: translateX(400%); }
          }
        `}</style>
      </div>
    );
  };

  const renderResults = () => {
    if (!projection) return null;

    return (
      <div className="min-h-screen text-[#1A1A1A] relative z-10">
        <div className="max-w-4xl mx-auto px-6 py-32 md:py-40">
          
          <FadeInSection>
            <div className="mb-32 text-center">
              <h1 className="text-5xl md:text-8xl font-[Playfair_Display] italic font-medium mb-8 leading-[0.9]">
                The Probable<br/>Future
              </h1>
              <div className="inline-block border border-[#1A1A1A] rounded-full px-6 py-2">
                <p className="text-[#1A1A1A] text-xs font-[Manrope] uppercase tracking-[0.2em] font-bold">
                  {userData.department} • {userData.currentCGPA} CGPA • {userData.careerGoal}
                </p>
              </div>
            </div>
          </FadeInSection>

          <FadeInSection delay={200}>
            <div className="mb-24 p-8 md:p-12 bg-white/40 backdrop-blur-sm border border-white/50 rounded-3xl shadow-sm">
              <div className="flex items-baseline justify-between mb-8 border-b border-[#1A1A1A]/10 pb-6">
                 <h2 className="text-sm font-[Manrope] font-bold uppercase tracking-widest text-[#1A1A1A]">Career Reality</h2>
                 <span className="text-sm font-[Manrope] font-semibold text-[#1A1A1A]">{projection.career.incomeRange}</span>
              </div>
              
              <h3 className="text-3xl md:text-5xl font-[Manrope] font-medium text-[#1A1A1A] mb-8 leading-tight tracking-tight">
                {projection.career.title}
              </h3>
              <p className="text-[#333] font-[Inter] text-lg md:text-2xl leading-relaxed font-light max-w-3xl">
                {projection.career.description}
              </p>
              
              <div className="mt-10">
                <span className="inline-block px-5 py-2 bg-[#1A1A1A] text-white rounded-full text-xs font-[Manrope] uppercase tracking-wider font-bold">
                  {projection.career.satisfaction}
                </span>
              </div>
            </div>
          </FadeInSection>

          <FadeInSection delay={300}>
            <div className="mb-24 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/40 backdrop-blur-sm border border-white/50 p-10 rounded-3xl">
                <div className="border-b border-[#1A1A1A]/10 pb-4 mb-6">
                  <h2 className="text-xs font-[Manrope] font-bold uppercase tracking-widest text-[#1A1A1A] opacity-60">Competence & Market Value</h2>
                </div>
                <p className="text-[#1A1A1A] font-[Inter] text-xl leading-relaxed mb-6">
                  {projection.skills.depth}
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#1A1A1A]"></div>
                  <p className="text-[#555] text-sm italic font-[Playfair_Display]">
                    {projection.skills.confidence}
                  </p>
                </div>
              </div>
              
              <div className="bg-white/40 backdrop-blur-sm border border-white/50 p-10 rounded-3xl">
                 <div className="border-b border-[#1A1A1A]/10 pb-4 mb-6">
                  <h2 className="text-xs font-[Manrope] font-bold uppercase tracking-widest text-[#1A1A1A] opacity-60">Daily Life 2029</h2>
                </div>
                <ul className="space-y-8">
                  <li>
                    <span className="block text-xs font-[Manrope] font-bold uppercase tracking-wider text-[#888] mb-2">Living Situation</span>
                    <span className="text-[#1A1A1A] font-[Inter] text-lg">{projection.dailyLife.living}</span>
                  </li>
                  <li>
                    <span className="block text-xs font-[Manrope] font-bold uppercase tracking-wider text-[#888] mb-2">Routine</span>
                    <span className="text-[#1A1A1A] font-[Inter] text-lg">{projection.dailyLife.routine}</span>
                  </li>
                </ul>
              </div>
            </div>
          </FadeInSection>

          <FadeInSection delay={400}>
            <div className="mb-32">
              <div className="bg-[#E5E5E0] p-12 md:p-20 rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                
                <h2 className="text-center text-xs font-[Manrope] font-bold uppercase tracking-[0.3em] text-[#1A1A1A] mb-16 relative z-10">
                  Internal State
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 text-center relative z-10">
                   <div>
                      <p className="text-4xl md:text-5xl font-[Playfair_Display] italic text-[#1A1A1A] mb-4">
                        {projection.internalState.stress}
                      </p>
                      <p className="text-xs font-[Manrope] text-[#666] uppercase tracking-wide font-bold">Stress Baseline</p>
                   </div>
                   <div>
                      <p className="text-4xl md:text-5xl font-[Playfair_Display] italic text-[#1A1A1A] mb-4">
                        {projection.internalState.regret}
                      </p>
                      <p className="text-xs font-[Manrope] text-[#666] uppercase tracking-wide font-bold">Regret Level</p>
                   </div>
                </div>

                <div className="mt-20 text-center pt-12 border-t border-[#1A1A1A]/10 relative z-10">
                   <p className="text-2xl md:text-4xl font-[Manrope] font-medium leading-tight text-[#1A1A1A] tracking-tight">
                     "{projection.internalState.momentum}"
                   </p>
                </div>
              </div>
            </div>
          </FadeInSection>

          {/* Ending Line */}
          <div className={`text-center transition-all duration-1000 transform ${
              finalMessageState === 'hidden' ? 'opacity-0 translate-y-4' : 
              finalMessageState === 'visible' ? 'opacity-100 translate-y-0' : 'opacity-40 blur-[2px]'
            }`}>
            <p className="text-3xl md:text-4xl text-[#1A1A1A] font-[Playfair_Display] italic">
               {finalMessageState === 'visible' || finalMessageState === 'hidden' 
                 ? "This future isn't dramatic." 
                 : "It accumulates quietly."}
            </p>
          </div>
          
          <div className="h-40"></div>
        </div>
      </div>
    );
  };

  return (
    <>
      <InteractiveBackground />
      {state === AppState.LANDING && renderLanding()}
      {state === AppState.INPUT && renderInput()}
      {state === AppState.PROCESSING && renderProcessing()}
      {state === AppState.RESULTS && renderResults()}
    </>
  );
}