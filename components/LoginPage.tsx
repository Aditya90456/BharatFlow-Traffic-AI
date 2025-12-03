
import React, { useState } from 'react';
import { GlobeAltIcon, FingerPrintIcon, ArrowRightIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface LoginPageProps {
  onLogin: () => void;
  onNavigateToSignUp: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigateToSignUp }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock login delay to simulate server handshake
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-[#050508] bg-mesh flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-saffron/50 to-transparent"></div>
      
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-saffron/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Login Container */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-700 fill-mode-forwards">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-saffron to-red-600 flex items-center justify-center shadow-[0_0_40px_rgba(255,153,51,0.2)] mb-6 group border border-white/10 relative overflow-hidden">
               <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
               <GlobeAltIcon className="w-10 h-10 text-white animate-pulse relative z-10" />
            </div>
            <h1 className="text-4xl font-tech font-bold tracking-[0.2em] text-white text-center leading-tight">
              BHARAT<span className="text-saffron">FLOW</span>
            </h1>
            <div className="flex items-center gap-2 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-mono text-accent tracking-widest opacity-80 uppercase">
                  Smart Traffic Command Core
                </span>
            </div>
        </div>

        {/* Login Card */}
        <div className="glass rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
           
           {/* HUD Corner Accents */}
           <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-accent/50 rounded-tl-lg"></div>
           <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-accent/50 rounded-tr-lg"></div>
           <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-accent/50 rounded-bl-lg"></div>
           <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-accent/50 rounded-br-lg"></div>

           <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              
              <div className="space-y-2">
                <label className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                    <span>Operator ID</span>
                    <span className="text-gray-600">REQ: OPR-LEVEL-5</span>
                </label>
                <div className="relative group">
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-700 focus:border-accent/80 focus:ring-1 focus:ring-accent/50 outline-none transition-all font-mono"
                      placeholder="ENTER ID"
                      required
                    />
                    <ShieldCheckIcon className="w-4 h-4 text-gray-600 absolute left-3 top-3.5 group-focus-within:text-accent transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                    <span>Access Key</span>
                    <span className="text-gray-600">ENCRYPTION: AES-256</span>
                </label>
                <div className="relative group">
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-700 focus:border-accent/80 focus:ring-1 focus:ring-accent/50 outline-none transition-all font-mono tracking-widest"
                      placeholder="••••••••"
                      required
                    />
                    <FingerPrintIcon className="w-4 h-4 text-gray-600 absolute left-3 top-3.5 group-focus-within:text-accent transition-colors" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-accent/20 to-blue-600/20 hover:from-accent/30 hover:to-blue-600/30 border border-accent/50 text-accent font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all group disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] relative overflow-hidden"
              >
                {isLoading ? (
                  <>
                     <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                     <span className="animate-pulse">Handshaking...</span>
                  </>
                ) : (
                  <>
                    <FingerPrintIcon className="w-5 h-5" />
                    <span>Initialize Session</span>
                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

           </form>

           {/* Sign Up Link */}
           <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col gap-2">
              <button 
                onClick={onNavigateToSignUp}
                className="text-[10px] text-gray-500 hover:text-white transition-colors font-mono tracking-wider"
              >
                NEW OPERATOR? <span className="text-accent underline underline-offset-4">REGISTER ACCESS</span>
              </button>
              <p className="text-[9px] text-gray-600 font-mono leading-relaxed mt-2">
                <span className="text-red-900/80 mr-1">WARNING:</span>
                UNAUTHORIZED ACCESS TO THIS TRAFFIC CONTROL GRID IS A PUNISHABLE OFFENSE.
              </p>
           </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-col items-center gap-2 opacity-60">
           <div className="h-px w-20 bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
           <div className="text-[10px] text-gray-500 font-mono text-center">
             GOVERNMENT OF INDIA <br/> SMART CITY MISSION v3.0.1
           </div>
        </div>
      </div>
    </div>
  );
};
