import React, { useState, useEffect, useRef } from 'react';
import { GlobeAltIcon, ArrowRightIcon, CpuChipIcon, SparklesIcon, ServerStackIcon, CameraIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

const FeatureCard: React.FC<{ icon: React.FC<any>, title: string, description: string, step: string }> = ({ icon: Icon, title, description, step }) => (
  <div className="relative pl-16">
    <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-surfaceHighlight border border-white/10 flex items-center justify-center">
      <div className="w-10 h-10 rounded-full bg-background border border-accent/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-accent" />
      </div>
      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-black flex items-center justify-center text-xs font-bold font-mono">
        {step}
      </div>
    </div>
    <h3 className="text-xl font-bold font-tech mb-2 text-white">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{description}</p>
  </div>
);


export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraActive(true);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setCameraError("Camera access denied. Please check your browser permissions.");
            setIsCameraActive(false);
        }
    } else {
        setCameraError("Camera access is not supported by your browser.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    streamRef.current = null;
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
        if (streamRef.current) {
            stopCamera();
        }
    };
  }, []);

  return (
    <div className="bg-background text-white font-sans overflow-x-hidden selection:bg-accent selection:text-black">
      
      {/* --- AMBIENT BACKGROUND FX --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-mesh opacity-40"></div>
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-background via-background/50 to-transparent"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-background via-background/50 to-transparent"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-saffron/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>
      
      {/* --- HERO SECTION --- */}
      <main className="relative min-h-screen flex items-center justify-center p-6 z-10 overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000 fill-mode-forwards z-10">
            <div className="flex items-center gap-4">
               <div className="relative w-16 h-16">
                  <div className="absolute inset-0 bg-gradient-to-br from-saffron to-red-600 rounded-xl blur opacity-60"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-saffron to-red-600 rounded-xl flex items-center justify-center border border-white/10">
                     <GlobeAltIcon className="w-8 h-8 text-white" />
                  </div>
               </div>
               <h1 className="text-4xl font-tech font-bold tracking-[0.15em] text-white leading-tight">
                 BHARAT<span className="text-saffron">FLOW</span>
               </h1>
             </div>
            
            <h2 className="text-5xl md:text-7xl font-bold font-tech tracking-tight leading-[1.05]">
              The Operating System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron via-white to-green-500">Indian Roads</span>
            </h2>
            
            <p className="text-lg text-gray-400 max-w-lg leading-relaxed border-l-2 border-accent pl-6">
              BharatFlow leverages <strong className="text-white">Gemini 2.5 generative AI</strong> to optimize traffic in real-time, reducing congestion and emissions in our nation's most complex urban grids.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={() => onNavigate('DASHBOARD')}
                className="px-8 py-4 bg-accent text-black font-bold font-tech text-lg rounded-lg hover:bg-cyan-300 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] flex items-center gap-3 group translate-y-0 hover:-translate-y-1"
              >
                <span>Initialize Dashboard</span>
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
          
          <div className="relative h-[500px] w-full hidden lg:flex items-center justify-center animate-in fade-in zoom-in-90 duration-1000 fill-mode-forwards">
            <GlobeAltIcon className="absolute w-full h-full text-white/5 opacity-50"/>
            <div className="font-mono text-xs uppercase text-center text-gray-500">
               <p>[LIVE DATA WEAVE]</p>
               <p>VISUALIZING PAN-INDIA GRID</p>
            </div>
            {/* Animated Data Weave - Abstract representation */}
            <svg className="absolute w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{stopColor: 'rgba(255,153,51,0.5)', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: 'rgba(255,153,51,0)', stopOpacity: 1}} />
                    </linearGradient>
                    <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor: 'rgba(6,182,212,0.5)', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: 'rgba(6,182,212,0)', stopOpacity: 1}} />
                    </linearGradient>
                </defs>
                <path d="M0 150 Q 250 50, 500 150 T 1000 150" stroke="url(#grad1)" strokeWidth="2" className="animate-[pulse_4s_ease-in-out_infinite]" />
                <path d="M0 350 Q 250 450, 500 350 T 1000 350" stroke="url(#grad1)" strokeWidth="2" className="animate-[pulse_4s_ease-in-out_infinite_1s]" />
                <path d="M150 0 Q 50 250, 150 500 T 150 1000" stroke="url(#grad2)" strokeWidth="2" className="animate-[pulse_3s_ease-in-out_infinite]" />
                <path d="M350 0 Q 450 250, 350 500 T 350 1000" stroke="url(#grad2)" strokeWidth="2" className="animate-[pulse_3s_ease-in-out_infinite_0.5s]" />
            </svg>
          </div>
        </div>
      </main>

      {/* --- PROBLEM / SOLUTION --- */}
      <section className="py-24 relative z-10 bg-surface border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-bold font-tech mb-4 text-white">From Gridlock to Grid Flow</h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">Our system transforms chaotic urban arteries into intelligent, self-optimizing networks.</p>
            
            <div className="mt-16 grid md:grid-cols-2 gap-8 items-center">
                <div className="p-8 rounded-2xl bg-black/30 border border-red-500/20 text-left">
                    <h3 className="text-2xl font-tech font-bold text-red-400 mb-4">The Chaos</h3>
                    <ul className="space-y-3 text-gray-400">
                        <li className="flex items-start gap-3"><span className="text-red-500 mt-1">●</span><span>Static, pre-timed signals causing unnecessary stops and idling.</span></li>
                        <li className="flex items-start gap-3"><span className="text-red-500 mt-1">●</span><span>Inability to adapt to real-time events like accidents or VIP movement.</span></li>
                        <li className="flex items-start gap-3"><span className="text-red-500 mt-1">●</span><span>Increased carbon emissions and fuel wastage from constant stop-go traffic.</span></li>
                    </ul>
                </div>
                <div className="p-8 rounded-2xl bg-black/30 border border-green-500/20 text-left">
                    <h3 className="text-2xl font-tech font-bold text-green-400 mb-4">The Order</h3>
                    <ul className="space-y-3 text-gray-400">
                        <li className="flex items-start gap-3"><span className="text-green-500 mt-1">●</span><span>Dynamic signal phasing that creates "green waves" for smoother commutes.</span></li>
                        <li className="flex items-start gap-3"><span className="text-green-500 mt-1">●</span><span>AI-powered predictive analysis to anticipate and mitigate congestion.</span></li>
                        <li className="flex items-start gap-3"><span className="text-green-500 mt-1">●</span><span>Up to 40% reduction in travel time and a significant drop in urban pollution.</span></li>
                    </ul>
                </div>
            </div>
        </div>
      </section>
      
      {/* --- HOW IT WORKS --- */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
               <h2 className="text-4xl md:text-5xl font-bold font-tech mb-4">A 3-Step Intelligence Cycle</h2>
               <p className="text-lg text-gray-400">BharatFlow operates on a continuous loop of data collection, AI analysis, and real-time action.</p>
            </div>
            
            <div className="relative flex flex-col gap-24">
              {/* Connecting Line */}
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-surfaceHighlight via-accent to-surfaceHighlight hidden md:block"></div>

              <FeatureCard 
                step="01" 
                icon={ServerStackIcon} 
                title="SENSE: The Digital Twin" 
                description="We create a high-fidelity digital replica of your city's road network, processing thousands of data points per second from virtual sensors to understand the real-time traffic pulse."
              />
              <FeatureCard 
                step="02" 
                icon={SparklesIcon} 
                title="ANALYZE: The Gemini Core" 
                description="Our powerful Gemini 2.5 AI model analyzes the complete traffic snapshot, identifying current and potential bottlenecks with superhuman speed and accuracy."
              />
              <FeatureCard 
                step="03" 
                icon={CpuChipIcon} 
                title="ACT: Edge Optimization" 
                description="Optimized signal timings are securely relayed to the traffic grid. Changes are made in milliseconds, creating a responsive system that adapts faster than traffic can build."
              />
            </div>
        </div>
      </section>

      {/* --- LIVE AI DEMO --- */}
      <section className="py-24 relative z-10 bg-surface border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-4xl md:text-5xl font-bold font-tech mb-4">See The AI In Action</h2>
                <p className="text-lg text-gray-400">
                    Activate your camera for a live demonstration of our core object recognition technology. Your video is processed locally on your device and is never stored or transmitted.
                </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
                <div className="aspect-video bg-black rounded-2xl border border-white/10 shadow-2xl relative flex items-center justify-center p-2 overflow-hidden glass">
                    <video 
                        ref={videoRef} autoPlay playsInline muted
                        className={`w-full h-full object-cover rounded-lg transition-opacity duration-500 ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
                    />

                    {!isCameraActive && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-10">
                            {cameraError ? (
                                <div className="text-red-400 font-mono text-sm space-y-2">
                                    <p>ERROR: {cameraError}</p>
                                    <p>Please enable camera permissions in your browser settings and refresh.</p>
                                </div>
                            ) : (
                                <button 
                                    onClick={startCamera}
                                    className="px-8 py-4 bg-accent text-black font-bold font-tech text-lg rounded-lg hover:bg-cyan-300 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] flex items-center gap-3 group translate-y-0 hover:-translate-y-1"
                                >
                                    <CameraIcon className="w-6 h-6" />
                                    <span>Activate Camera Feed</span>
                                </button>
                            )}
                        </div>
                    )}
                    
                    {isCameraActive && (
                        <div className="absolute inset-0 pointer-events-none z-20 animate-in fade-in duration-500">
                            <div className="absolute w-1/3 h-1/4 top-[20%] left-[15%] border-2 border-accent rounded animate-pulse-glow">
                                <span className="absolute -top-5 left-0 bg-accent text-black text-[10px] font-mono px-1.5 py-0.5 rounded">VEHICLE [CAR] 98%</span>
                            </div>
                            <div className="absolute w-1/4 h-1/3 top-[50%] left-[60%] border-2 border-saffron rounded animate-pulse-glow" style={{ animationDelay: '0.5s' }}>
                                <span className="absolute -top-5 left-0 bg-saffron text-black text-[10px] font-mono px-1.5 py-0.5 rounded">VEHICLE [AUTO] 91%</span>
                            </div>
                            <div className="absolute top-4 left-4 text-xs font-mono text-green-400 bg-black/50 px-2 py-1 rounded">ANALYZING...</div>
                            <button 
                                onClick={stopCamera}
                                className="absolute bottom-4 right-4 px-4 py-2 bg-red-600/80 text-white text-xs font-bold rounded hover:bg-red-500 transition-colors pointer-events-auto"
                            >
                                Deactivate
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
            <ShieldCheckIcon className="w-16 h-16 text-accent mx-auto mb-6 opacity-50" />
            <h2 className="text-4xl md:text-5xl font-bold font-tech mb-6">Take Command of The Grid</h2>
            <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
                Access the secure command dashboard to view a live digital twin of a major Indian city. This is a restricted, high-security government terminal.
            </p>
            <button 
                onClick={() => onNavigate('DASHBOARD')}
                className="px-10 py-5 bg-accent text-black font-bold font-tech text-xl rounded-lg hover:bg-cyan-300 transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] flex items-center gap-3 group translate-y-0 hover:-translate-y-1 mx-auto"
              >
                <span>Authorize & Launch</span>
                <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
            </button>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 bg-black/30 py-12 text-center text-xs text-gray-600 font-mono">
         <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
            <div className="flex items-center gap-2 opacity-50">
               <GlobeAltIcon className="w-4 h-4" />
               <span>BHARATFLOW AI SYSTEMS</span>
            </div>
            <div className="flex gap-8">
               <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
               <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
               <a href="#" className="hover:text-white transition-colors">Contact Support</a>
            </div>
            <p>© 2024 A Government of India Smart City Initiative.</p>
         </div>
      </footer>
    </div>
  );
};
