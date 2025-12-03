import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'saffron';
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, unit, icon, color = 'primary' }) => {
  const colors = {
    primary: 'border-l-blue-500 text-blue-400',
    accent: 'border-l-cyan-500 text-cyan-400',
    success: 'border-l-emerald-500 text-emerald-400',
    warning: 'border-l-amber-500 text-amber-400',
    danger: 'border-l-red-500 text-red-500',
    saffron: 'border-l-orange-500 text-orange-400',
  };

  const colorClass = colors[color];

  return (
    <div className={`
      relative pl-4 pr-3 py-2 border-l-2 bg-white/[0.02] hover:bg-white/[0.04] 
      transition-colors duration-300 group ${colorClass}
    `}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5 group-hover:text-gray-400 transition-colors">
            {label}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-tech font-bold text-gray-100 group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all">
              {value}
            </span>
            {unit && <span className="text-[10px] text-gray-500 font-mono">{unit}</span>}
          </div>
        </div>
        {icon && (
          <div className="opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 transform">
            {icon}
          </div>
        )}
      </div>
      
      {/* Decorative dots */}
      <div className="absolute right-2 top-2 w-0.5 h-0.5 bg-gray-700 rounded-full"></div>
      <div className="absolute right-2 bottom-2 w-0.5 h-0.5 bg-gray-700 rounded-full"></div>
    </div>
  );
};