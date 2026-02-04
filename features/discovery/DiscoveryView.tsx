
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, FlaskConical, Clock, Scale } from 'lucide-react';
import { DiscoverySet, DiscoveryAlternative } from '../../types';
import { INITIAL_DISCOVERY_SETS } from '../../constants/mockData';

export const DiscoveryView: React.FC = () => {
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [discoverySets, setDiscoverySets] = useState(INITIAL_DISCOVERY_SETS);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);

  const activeSet = discoverySets[activeSetIndex];

  const handleDishChange = (dishId: string, alt: DiscoveryAlternative) => {
    setDiscoverySets(prev => prev.map((set, sIdx) => {
      if (sIdx !== activeSetIndex) return set;
      return {
        ...set,
        dishes: set.dishes.map(d => {
          if (d.id !== dishId) return d;
          const oldData: DiscoveryAlternative = { name: d.name, demand: d.demand, cookingTime: d.cookingTime, cost: d.cost };
          const newAlts = d.alternatives ? d.alternatives.filter(a => a.name !== alt.name).concat(oldData) : [oldData];
          return {
            ...d,
            name: alt.name,
            demand: alt.demand,
            cookingTime: alt.cookingTime,
            cost: alt.cost,
            alternatives: newAlts,
            width: Math.max(25, Math.min(60, d.width + (Math.random() - 0.5) * 10)),
            height: Math.max(25, Math.min(60, d.height + (Math.random() - 0.5) * 10)),
            x: Math.max(0, Math.min(100 - d.width, d.x + (Math.random() - 0.5) * 10)),
            y: Math.max(0, Math.min(100 - d.height, d.y + (Math.random() - 0.5) * 10)),
          };
        })
      };
    }));
    setEditingDishId(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#fcfaf8] overflow-y-auto custom-scrollbar p-10 font-sans">
      <div className="max-w-7xl mx-auto w-full space-y-12">
        <div className="flex items-center justify-between px-4">
          <div>
            <h2 className="text-6xl font-black text-slate-800 uppercase tracking-tighter">Discovery</h2>
            <p className="text-[12px] font-black text-slate-400 tracking-[0.6em] mt-3 uppercase">Box Lattice Intelligence Matrix</p>
          </div>
          <div className="flex gap-4">
             <button onClick={() => setActiveSetIndex(prev => (prev === 0 ? discoverySets.length - 1 : prev - 1))} className="p-5 bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-xl transition-all text-slate-400 hover:text-orange-500"><ChevronLeft size={28} /></button>
             <button onClick={() => setActiveSetIndex(prev => (prev === discoverySets.length - 1 ? 0 : prev + 1))} className="p-5 bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-xl transition-all text-slate-400 hover:text-orange-500"><ChevronRight size={28} /></button>
          </div>
        </div>

        <div className="relative">
          <motion.div key={activeSet.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="w-full h-[600px] bg-white border border-slate-200 rounded-[4rem] shadow-2xl relative overflow-visible p-12 canvas-grid">
            <div className="absolute top-8 left-12"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeSet.title}</span></div>
            <div className="w-full h-full relative border border-slate-100 rounded-[2rem] overflow-hidden">
                {activeSet.dishes.map(dish => (
                  <motion.div
                    key={dish.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute cursor-pointer group/rect"
                    style={{ left: `${dish.x}%`, top: `${dish.y}%`, width: `${dish.width}%`, height: `${dish.height}%`, backgroundColor: dish.color, opacity: 0.6, border: '2px solid black', zIndex: editingDishId === dish.id ? 50 : 10 }}
                    onClick={() => setEditingDishId(editingDishId === dish.id ? null : dish.id)}
                  >
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                       <span className="text-[11px] font-black text-black uppercase leading-none mb-1 opacity-90 drop-shadow-sm">{dish.name}</span>
                       <span className="text-[9px] font-black text-black uppercase opacity-60">Demand: {dish.demand}</span>
                    </div>
                    <AnimatePresence>
                      {editingDishId === dish.id && (
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-slate-900 text-white rounded-[2rem] shadow-3xl p-6 w-64 z-[100] border border-white/10 backdrop-blur-3xl" onClick={(e) => e.stopPropagation()}>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Swap with Alternatives</p>
                          <div className="space-y-3">
                             {dish.alternatives?.map((alt, idx) => (
                               <button key={idx} onClick={() => handleDishChange(dish.id, alt)} className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-orange-500 hover:border-orange-400 transition-all group">
                                  <p className="text-[10px] font-black uppercase tracking-tight mb-1">{alt.name}</p>
                                  <div className="flex justify-between items-center opacity-60 group-hover:opacity-100">
                                     <span className="text-[8px] font-bold uppercase">Demand: {alt.demand}</span>
                                     <span className="text-[8px] font-bold uppercase">${alt.cost}</span>
                                  </div>
                               </button>
                             ))}
                             <button onClick={() => setEditingDishId(null)} className="w-full mt-2 py-3 text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors">Close</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[3rem] shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-5">
           <table className="w-full text-left border-collapse">
              <thead><tr className="bg-slate-50 border-b border-slate-100"><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipe Item</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cooking Time</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ing. Cost</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Market Demand</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Profit Factor</th></tr></thead>
              <tbody>
                 {activeSet.dishes.map((dish, i) => (
                    <motion.tr key={dish.id} layout className={`group hover:bg-slate-50 transition-colors ${i !== activeSet.dishes.length - 1 ? 'border-b border-slate-50' : ''}`}>
                       <td className="px-8 py-6"><div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: dish.color }} /><span className="text-[12px] font-black text-slate-800 uppercase tracking-tight">{dish.name}</span></div></td>
                       <td className="px-8 py-6 text-center"><span className="text-[11px] font-bold text-slate-500 uppercase">{dish.cookingTime} Min</span></td>
                       <td className="px-8 py-6 text-center"><span className="text-[11px] font-black text-slate-800">${dish.cost.toFixed(2)}</span></td>
                       <td className="px-8 py-6 text-center"><div className="flex flex-col items-center"><span className="text-[12px] font-black text-slate-800">{dish.demand}%</span><div className="w-20 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${dish.demand}%` }} className="h-full bg-green-500" /></div></div></td>
                       <td className="px-8 py-6 text-right"><span className="px-4 py-1.5 rounded-full bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest">x{(Math.random() * 2 + 1.5).toFixed(1)} Yield</span></td>
                    </motion.tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};
