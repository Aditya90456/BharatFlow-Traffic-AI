
import React, { useState } from 'react';
import { GlobeAltIcon, UserPlusIcon, ArrowRightIcon, IdentificationIcon, BuildingLibraryIcon, KeyIcon } from '@heroicons/react/24/outline';

interface SignUpPageProps {
  onSignUp: () => void;
  onNavigateToLogin: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onSignUp, onNavigateToLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    department: 'traffic',
    badgeId: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock registration delay
    setTimeout(() => {
      setIsLoading(false);
      onSignUp();
    }, 2000);
  };

  return (
    <div className="min-h-screen w-full bg-[#050508] bg-mesh flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.2)] mb-4 border border-white/10">
               <UserPlusIcon className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h1 className="text-3xl font-tech font-bold tracking-[0.1em] text-white text-center">
              OPERATOR <span className="text-green-500">REGISTRY</span>
            </h1>
            <p className="text-xs font-mono text-gray-500 tracking-wider mt-2 uppercase">
              Request Security Clearance Level 1
            </p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
           
           {/* Decor Corners */}
           <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500/50 rounded-tl"></div>
           <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500/50 rounded-tr"></div>
           <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500/50 rounded-bl"></div>
           <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500/50 rounded-br"></div>

           <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              
              {/* Name Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Officer Name</label>
                <div className="relative group">
                    <input 
                      type="text" 
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 pl-10 text-white placeholder-gray-700 focus:border-green-500/80 focus:ring-1 focus:ring-green-500/50 outline-none transition-all font-sans"
                      placeholder="Ex: Rajesh Kumar"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      required
                    />
                    <IdentificationIcon className="w-4 h-4 text-gray-600 absolute left-3 top-3 group-focus-within:text-green-500 transition-colors" />
                </div>
              </div>

              {/* Department Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Department</label>
                <div className="relative group">
                    <select 
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 pl-10 text-white focus:border-green-500/80 focus:ring-1 focus:ring-green-500/50 outline-none transition-all font-sans appearance-none"
                      value={formData.department}
                      onChange={e => setFormData({...formData, department: e.target.value})}
                    >
                      <option value="traffic">Traffic Control (TC)</option>
                      <option value="police">City Police (CP)</option>
                      <option value="municipal">Municipal Corp (MC)</option>
                      <option value="emergency">Emergency Response (ER)</option>
                    </select>
                    <BuildingLibraryIcon className="w-4 h-4 text-gray-600 absolute left-3 top-3 group-focus-within:text-green-500 transition-colors" />
                </div>
              </div>

              {/* Badge ID */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Badge Number</label>
                <div className="relative group">
                    <input 
                      type="text" 
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 pl-10 text-white placeholder-gray-700 focus:border-green-500/80 focus:ring-1 focus:ring-green-500/50 outline-none transition-all font-mono uppercase"
                      placeholder="XX-0000-YY"
                      value={formData.badgeId}
                      onChange={e => setFormData({...formData, badgeId: e.target.value})}
                      required
                    />
                    <IdentificationIcon className="w-4 h-4 text-gray-600 absolute left-3 top-3 group-focus-within:text-green-500 transition-colors" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Set Password</label>
                <div className="relative group">
                    <input 
                      type="password" 
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 pl-10 text-white placeholder-gray-700 focus:border-green-500/80 focus:ring-1 focus:ring-green-500/50 outline-none transition-all font-mono"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      required
                    />
                    <KeyIcon className="w-4 h-4 text-gray-600 absolute left-3 top-3 group-focus-within:text-green-500 transition-colors" />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 border border-green-500/50 text-green-400 font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all group disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              >
                {isLoading ? (
                  <>
                     <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                     <span className="animate-pulse">Generating Identity...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Application</span>
                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
           </form>

           {/* Back to Login */}
           <div className="mt-6 pt-4 border-t border-white/5 text-center">
              <button 
                onClick={onNavigateToLogin}
                className="text-xs text-gray-400 hover:text-white transition-colors font-mono"
              >
                ALREADY CLEARED? <span className="text-green-500 underline underline-offset-4">LOGIN HERE</span>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
