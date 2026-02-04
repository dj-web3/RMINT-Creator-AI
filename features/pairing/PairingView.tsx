
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, Layout, Filter, Flame, Wine, ChefHat } from 'lucide-react';

export const PairingView: React.FC = () => {
  const flavorPoints = [
    { label: 'SWEET', color: '#f472b6', x: 0, y: -220, icon: <Sparkles size={16}/> },
    { label: 'SOUR', color: '#fbbf24', x: 190, y: -110, icon: <ChevronRight size={16}/> },
    { label: 'SALTY', color: '#60a5fa', x: 190, y: 110, icon: <Layout size={16}/> },
    { label: 'BITTER', color: '#4ade80', x: 0, y: 220, icon: <Filter size={16}/> },
    { label: 'UMAMI', color: '#f87171', x: -190, y: 110, icon: <Flame size={16}/> },
    { label: 'FATTY', color: '#a78bfa', x: -190, y: -110, icon: <Wine size={16}/> }
  ];
  return (
    <div className="flex-1 flex bg-[#fdfaf7] overflow-hidden items-center justify-center relative">
      <div className="absolute top-10 left-10 z-50">
        <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800 mb-1 leading-none">Flavor Graph</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Molecular Pairing Lattice: Makhani Base</p>
        </div>
      </div>
      <div className="relative w-[900px] h-[900px] flex items-center justify-center">
        <svg viewBox="-450 -450 900 900" className="absolute w-full h-full overflow-visible">
          <circle cx="0" cy="0" r="320" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="10 10" className="opacity-40" />
          {flavorPoints.map((p, i) => (
            <g key={p.label}>
              <line x1="0" y1="0" x2={p.x} y2={p.y} stroke="#e2e8f0" strokeWidth="2" strokeDasharray="5 5" />
              {flavorPoints.map((p2, j) => (j > i ? <line key={`${i}-${j}`} x1={p.x} y1={p.y} x2={p2.x} y2={p2.y} stroke="#f1f5f9" strokeWidth="1.5" /> : null))}
            </g>
          ))}
        </svg>
        <div className="relative z-10 w-48 h-48 bg-white rounded-[4rem] shadow-2xl border-4 border-slate-900 flex flex-col items-center justify-center p-8 text-center"><ChefHat className="text-orange-500 mb-2" size={38}/><p className="text-[16px] font-black uppercase text-slate-800 leading-tight">BUTTER<br/>CHICKEN</p></div>
        {flavorPoints.map(p => (
          <motion.div key={p.label} whileHover={{ scale: 1.1 }} className="absolute flex flex-col items-center group cursor-pointer" style={{ transform: `translate(${p.x}px, ${p.y}px)` }}>
            <div className="w-14 h-14 rounded-[1.8rem] shadow-xl flex items-center justify-center text-white mb-3 transition-all" style={{ backgroundColor: p.color }}>{p.icon}</div>
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest bg-white/80 backdrop-blur px-3 py-1 rounded-full border border-slate-100">{p.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
