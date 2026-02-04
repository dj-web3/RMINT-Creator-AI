
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat } from 'lucide-react';
import { StepGroup } from '../../types';

interface ClockViewProps {
  stepGroups: StepGroup[];
  chefPool: string[];
}

export const ClockView: React.FC<ClockViewProps> = ({ stepGroups, chefPool }) => {
  const [clockScale, setClockScale] = useState<1 | 12>(12);
  const [focusHour, setFocusHour] = useState<number>(10); // Default 10 AM
  const colors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24'];
  const [hoveredTask, setHoveredTask] = useState<StepGroup | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const hoursRange = Array.from({ length: 13 }, (_, i) => 8 + i); // 8 AM to 8 PM

  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH} ${period}`;
  };

  return (
    <div className="flex-1 bg-[#fcfaf8] flex flex-col pt-12 relative overflow-hidden" onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}>
      <div className="w-full flex flex-col items-center px-10">
        <div className="text-center mb-8 shrink-0">
          <h2 className="text-5xl font-black text-slate-800 uppercase tracking-tighter">Kitchen Pulse</h2>
          <p className="text-[10px] font-black text-slate-400 tracking-[0.5em] mt-3 uppercase">Load Management System</p>
        </div>

        <div className="flex items-center gap-4 mb-8 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button onClick={() => setClockScale(1)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${clockScale === 1 ? 'bg-white shadow-lg text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>1 Hour View</button>
          <button onClick={() => setClockScale(12)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${clockScale === 12 ? 'bg-white shadow-lg text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>12 Hour View</button>
        </div>

        {clockScale === 1 && (
          <div className="w-[600px] mb-12 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-4 px-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Focus Duration: {formatHour(focusHour)} - {formatHour(focusHour + 1)}</span>
            </div>
            <div className="relative h-12 w-full bg-slate-100 rounded-full flex items-center p-1 border border-slate-200">
               <motion.div 
                 className="absolute h-10 bg-orange-500 rounded-full shadow-lg shadow-orange-100 z-0" 
                 layoutId="activeHourIndicator"
                 transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                 style={{ left: `${((focusHour - 8) / 12) * 100}%`, width: `${(1/12) * 100}%` }}
               />
               {hoursRange.slice(0, -1).map(h => (
                 <button 
                   key={h} 
                   onClick={() => setFocusHour(h)} 
                   className={`relative z-10 flex-1 h-full flex items-center justify-center text-[10px] font-black uppercase transition-colors ${focusHour === h ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   {h % 12 || 12}
                 </button>
               ))}
            </div>
          </div>
        )}

        <div className="relative flex items-center justify-center" style={{ width: '560px', height: '560px' }}>
          <svg viewBox="0 0 800 800" className="w-full h-full drop-shadow-3xl overflow-visible">
            {Array.from({ length: 12 }, (_, i) => ({ label: (i === 0 ? 12 : i).toString(), angle: (i * 30 - 90) })).map((tick, i) => (
              <g key={i}>
                <line x1={400 + Math.cos(tick.angle * Math.PI/180) * 360} y1={400 + Math.sin(tick.angle * Math.PI/180) * 360} x2={400 + Math.cos(tick.angle * Math.PI/180) * 375} y2={400 + Math.sin(tick.angle * Math.PI/180) * 375} stroke="#e2e8f0" strokeWidth="3" />
                <text x={400 + Math.cos(tick.angle * Math.PI/180) * 395} y={400 + Math.sin(tick.angle * Math.PI/180) * 395} textAnchor="middle" dominantBaseline="middle" className="text-[14px] font-black fill-slate-300 font-sans">{tick.label}{clockScale === 1 ? 'm' : ''}</text>
              </g>
            ))}
            {chefPool.map((chef, chefIdx) => {
              const r = 140 + chefIdx * 58;
              return (
                <g key={chef}>
                  <circle cx="400" cy="400" r={r} fill="none" stroke={colors[chefIdx % colors.length]} strokeWidth="44" className="opacity-[0.08]" />
                  {stepGroups.filter(g => g.assignedChef === chef).map((group, gIdx) => {
                    const sweepAngle = (group.durationMinutes || 30) / (clockScale * 60) * 360;
                    const startAngle = -90 + (gIdx * 45); 
                    const endAngle = startAngle + sweepAngle;
                    const pathData = `M ${400 + r * Math.cos(startAngle * Math.PI/180)} ${400 + r * Math.sin(startAngle * Math.PI/180)} A ${r} ${r} 0 ${sweepAngle <= 180 ? "0" : "1"} 1 ${400 + r * Math.cos(endAngle * Math.PI/180)} ${400 + r * Math.sin(endAngle * Math.PI/180)}`;
                    return (<path key={group.id} d={pathData} fill="none" stroke={colors[chefIdx % colors.length]} strokeWidth="44" strokeLinecap="butt" onMouseEnter={() => setHoveredTask(group)} onMouseLeave={() => setHoveredTask(null)} className="cursor-pointer transition-opacity hover:opacity-80" />);
                  })}
                </g>
              );
            })}
            <circle cx="400" cy="400" r={120} fill="white" className="shadow-2xl" />
            <foreignObject x="300" y="300" width="200" height="200">
              <div className="w-full h-full flex flex-col items-center justify-center text-center">
                <ChefHat className="text-orange-500 mb-2" size={32} />
                <span className="text-[28px] font-black text-slate-800 uppercase tracking-tighter">{clockScale === 12 ? '10:45 AM' : '45 MIN'}</span>
              </div>
            </foreignObject>
          </svg>
        </div>
      </div>
      <AnimatePresence>
        {hoveredTask && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ position: 'fixed', left: mousePos.x + 20, top: mousePos.y + 20 }} className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-2xl border border-white/10 w-[240px] z-[400] backdrop-blur-2xl pointer-events-none">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
              <div className="w-2.5 h-10 rounded-full" style={{ backgroundColor: hoveredTask.color }} />
              <div>
                <h4 className="text-[11px] font-black uppercase">{hoveredTask.label}</h4>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{hoveredTask.assignedChef}</p>
              </div>
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-500">Execution Time</span>
              <span>{hoveredTask.durationMinutes}M</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
