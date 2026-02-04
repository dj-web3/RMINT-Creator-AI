
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Target, Filter, Clock, User } from 'lucide-react';
import { StepGroup } from '../../types';
import { ActionIcon } from '../../utils/ui-helpers';

interface TimelineViewProps {
  stepGroups: StepGroup[];
  chefPool: string[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ stepGroups, chefPool }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('22 JAN');
  const [hoveredGroup, setHoveredGroup] = useState<StepGroup | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const hours = Array.from({ length: 13 }, (_, i) => 7 + i); // 7 AM to 7 PM
  const dates = ['20 JAN', '21 JAN', '22 JAN', '23 JAN', '24 JAN'];
  const formatHour = (h: number) => {
    if (h === 12) return '12 PM';
    if (h > 12) return `${h - 12} PM`;
    return `${h} AM`;
  };
  
  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden font-sans">
      <div className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
             {dates.map(d => (<button key={d} onClick={() => setSelectedDate(d)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${selectedDate === d ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>{d}</button>))}
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl w-96 shadow-inner">
             <Search size={14} className="text-slate-400" />
             <input type="text" placeholder="Search operational steps..." className="bg-transparent text-[11px] font-bold focus:outline-none w-full" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest"><Target size={14}/> Accuracy: 98%</div>
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest"><Filter size={14} /> Refine</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#f0f1f3] p-6 space-y-1">
        <div className="min-w-[1400px] flex flex-col gap-0.5 shadow-2xl rounded-2xl overflow-hidden border border-slate-200">
          <div className="flex h-12 bg-slate-100 items-center border-b border-slate-200">
             <div className="w-64 border-r border-slate-200 px-8 font-black text-[10px] uppercase text-slate-500 tracking-widest">Team Role</div>
             <div className="flex-1 flex h-full">
               {hours.map(h => (<div key={h} className="flex-1 border-r border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 bg-slate-50/50">{formatHour(h)}</div>))}
             </div>
          </div>
          
          {chefPool.map(chef => (
            <div key={chef} className="flex h-24 bg-white border-b border-slate-200 items-center hover:bg-slate-50 transition-colors group">
              <div className="w-64 border-r border-slate-200 px-8 flex items-center gap-4">
                 <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shadow-inner group-hover:bg-white transition-colors"><User size={24} /></div>
                 <div><p className="text-[12px] font-black text-slate-800 uppercase leading-none tracking-tight">{chef}</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Active Shift</p></div>
              </div>
              <div className="flex-1 flex h-full relative">
                 {hours.map(h => (<div key={h} className="flex-1 border-r border-slate-100/40 h-full" />))}
                 <div className="absolute inset-0 p-2 flex items-center">
                    {stepGroups.filter(g => g.assignedChef === chef && (!searchQuery || g.label.toLowerCase().includes(searchQuery.toLowerCase()))).map((g, i) => {
                      const widthPercent = (g.durationMinutes || 60) / 720 * 100;
                      return (
                        <motion.div 
                          key={g.id} 
                          onMouseEnter={(e) => { setHoveredGroup(g); setTooltipPos({ x: e.clientX, y: e.clientY }); }}
                          onMouseLeave={() => setHoveredGroup(null)}
                          className="h-16 mx-1 rounded-xl border shadow-xl flex flex-col justify-center px-5 gap-0.5 transition-all hover:ring-4 hover:ring-slate-100 cursor-pointer" 
                          style={{ backgroundColor: g.color || '#fff', borderColor: 'rgba(0,0,0,0.05)', width: `${widthPercent}%`, position: 'relative' }}
                        >
                           <div className="flex items-center gap-2 mb-1">
                                <ActionIcon type="cooking" size={10} className="text-slate-400" />
                                <span className="text-[11px] font-black uppercase text-slate-900 truncate leading-none tracking-tighter">{g.label}</span>
                           </div>
                           <div className="flex items-center gap-2 opacity-60">
                                <Clock size={10} className="text-slate-500" />
                                <span className="text-[8px] font-black uppercase text-slate-500">{g.durationMinutes} MIN</span>
                           </div>
                        </motion.div>
                      );
                    })}
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {hoveredGroup && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', left: tooltipPos.x + 20, top: tooltipPos.y - 120 }}
            className="z-[200] w-72 bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-2xl border border-white/10 backdrop-blur-3xl pointer-events-none"
          >
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Task Details</p>
            <h4 className="text-xl font-black uppercase tracking-tighter leading-none mb-4">{hoveredGroup.label}</h4>
            <div className="space-y-3">
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Chef</span>
                    <span className="text-[10px] font-black uppercase text-orange-400">{hoveredGroup.assignedChef}</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Start</span>
                    <span className="text-[10px] font-black uppercase text-white">{hoveredGroup.startTime}</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Duration</span>
                    <span className="text-[10px] font-black uppercase text-white">{hoveredGroup.durationMinutes}m</span>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
