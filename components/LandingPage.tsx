
import React from 'react';
import { GlobeAltIcon, ArrowRightIcon, CpuChipIcon, ChartBarIcon, ShieldCheckIcon, UserPlusIcon } from '@heroicons/react/24/outline';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignUp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin, onNavigateToSignUp }) => {
  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans overflow-x-hidden selection:bg-accent selection:text-black">
      
      {/* Background Mesh */}
      <div className="fixed inset-0 bg-mesh opacity-40 pointer-events-none"></div>
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent z-50"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 backdrop-blur-md border-b border-white/5 bg-[#050508]/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-saffron to-red-600 flex items-center justify-center shadow-lg shadow-saffron/20 group-hover:scale-110 transition-transform duration-500">
              <GlobeAltIcon className="w-6 h-6 text-white group-hover:rotate-180 transition-transform duration-700" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-tech font-bold tracking-widest leading-none">
                BHARAT<span className="text-saffron">FLOW</span>
              </span>
              <span className="text-[9px] text-gray-400 font-mono tracking-[0.3em] uppercase">
                AI Traffic Grid
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Live Map', 'Public Data', 'API'].map((item) => (
              <a key={item} href="#" className="text-sm font-medium text-gray-400 hover:text-accent transition-colors relative group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full"></span>
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
             <button 
                onClick={onNavigateToSignUp}
                className="text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider hidden sm:block"
             >
                Register
             </button>
             <button 
                onClick={onNavigateToLogin}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent/50 transition-all group"
             >
                <span className="text-sm font-bold tracking-wide">Access Grid</span>
                <ArrowRightIcon className="w-4 h-4 text-accent group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Text Content */}
          <div className="space-y-8 z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-500/30 text-blue-400 text-xs font-mono tracking-wider">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              SYSTEM V3.0 ONLINE
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold leading-tight">
              Traffic Intelligence <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron via-white to-green-500 animate-pulse-glow">
                Reimagined.
              </span>
            </h1>
            
            <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
              BharatFlow leverages Gemini 2.5 generative AI to optimize traffic signal phases in real-time, reducing congestion in Indian metropolitan cities by up to 40%.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={onNavigateToLogin}
                className="px-8 py-4 bg-accent text-black font-bold rounded-lg hover:bg-cyan-300 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 group"
              >
                <span>Initialize Dashboard</span>
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                 onClick={onNavigateToSignUp}
                 className="px-8 py-4 bg-transparent border border-white/20 text-white font-bold rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2 group"
              >
                <span>Request Clearance</span>
                <UserPlusIcon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </div>

            <div className="pt-12 flex items-center gap-8 text-gray-500">
              <div>
                <div className="text-2xl font-tech font-bold text-white">30+</div>
                <div className="text-xs uppercase tracking-wider">Cities</div>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div>
                <div className="text-2xl font-tech font-bold text-white">12ms</div>
                <div className="text-xs uppercase tracking-wider">Latency</div>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div>
                <div className="text-2xl font-tech font-bold text-white">AI-Native</div>
                <div className="text-xs uppercase tracking-wider">Architecture</div>
              </div>
            </div>
          </div>

          {/* Hero Visual / Mini-Map Representation */}
          <div className="relative h-[600px] hidden lg:block perspective-1000">
             {/* Abstract Holographic Globe/Grid */}
             <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 to-saffron/10 rounded-full blur-3xl animate-pulse"></div>
             
             <div className="relative w-full h-full border border-white/10 bg-black/40 backdrop-blur-sm rounded-2xl overflow-hidden p-4 shadow-2xl transform rotate-y-12 transition-transform hover:rotate-y-0 duration-1000">
                <div className="absolute top-0 left-0 w-full h-1 bg-accent"></div>
                
                {/* Mock UI Elements */}
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                  <div className="text-xs font-mono text-accent">LIVE FEED: MUMBAI_NORTH</div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 h-[400px]">
                   <div className="bg-white/5 rounded-lg border border-white/10 p-4 flex flex-col justify-between group hover:border-accent/50 transition-colors">
                      <CpuChipIcon className="w-8 h-8 text-saffron mb-4" />
                      <div>
                        <div className="text-2xl font-bold">98.4%</div>
                        <div className="text-xs text-gray-500 uppercase">Optimization Score</div>
                      </div>
                   </div>
                   <div className="bg-white/5 rounded-lg border border-white/10 p-4 flex flex-col justify-between group hover:border-accent/50 transition-colors">
                      <ChartBarIcon className="w-8 h-8 text-green-500 mb-4" />
                      <div>
                        <div className="text-2xl font-bold">-42%</div>
                        <div className="text-xs text-gray-500 uppercase">Wait Time Red.</div>
                      </div>
                   </div>
                   <div className="col-span-2 bg-white/5 rounded-lg border border-white/10 p-4 relative overflow-hidden group hover:border-accent/50 transition-colors">
                      <div className="absolute inset-0 bg-mesh opacity-30"></div>
                      <ShieldCheckIcon className="w-8 h-8 text-blue-500 mb-4 relative z-10" />
                      <div className="relative z-10">
                        <div className="text-xl font-bold">Gov. Certified</div>
                        <div className="text-xs text-gray-500 uppercase">AES-256 Encrypted</div>
                      </div>
                   </div>
                </div>

                {/* Scanning Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-accent/50 blur-sm animate-scan-vertical"></div>
             </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/50 backdrop-blur-lg py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="text-xs text-gray-600 font-mono">
             © 2024 BharatFlow AI Systems. All rights reserved.
           </div>
           <div className="flex gap-6 text-xs text-gray-500">
             <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
             <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
             <a href="#" className="hover:text-white transition-colors">Govt. Compliance</a>
           </div>
        </div>
      </footer>
    </div>
  );
};
