
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, FlaskConical, Clock, Scale, Sparkles, AlertCircle } from 'lucide-react';
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
            // Dramatic shift in position and size when swapped as requested
            width: Math.max(20, Math.min(70, d.width + (Math.random() - 0.5) * 25)),
            height: Math.max(20, Math.min(70, d.height + (Math.random() - 0.5) * 25)),
            x: Math.max(0, Math.min(100 - d.width, d.x + (Math.random() - 0.5) * 35)),
            y: Math.max(0, Math.min(100 - d.height, d.y + (Math.random() - 0.5) * 35)),
          };
        })
      };
    }));
    setEditingDishId(null);
  };

  // Slow, smooth transition configuration (2000ms as requested)
  const springTransition = {
    type: "spring" as const,
    stiffness: 25, // Slightly lower stiffness for slower motion
    damping: 20,    // Balanced damping for a smooth stop over 2 seconds
    duration: 2.0
  };

  const getRiskDetails = (demand: number) => {
    if (demand > 94) return { label: 'Low', color: 'bg-emerald-500', score: Math.floor(Math.random() * 15) + 5 };
    if (demand > 85) return { label: 'Medium', color: 'bg-amber-500', score: Math.floor(Math.random() * 20) + 35 };
    return { label: 'High', color: 'bg-rose-500', score: Math.floor(Math.random() * 30) + 65 };
  };

  return (
    <div className="flex-1 flex flex-col bg-[#fcfaf8] overflow-y-auto custom-scrollbar p-10 font-sans">
      <div className="max-w-7xl mx-auto w-full space-y-12">
        <div className="flex items-center justify-between px-4">
          <div>
            <h2 className="text-6xl font-black text-slate-800 uppercase tracking-tighter leading-none">Discovery</h2>
            <p className="text-[12px] font-black text-slate-400 tracking-[0.6em] mt-4 uppercase">Neural Lattice Intelligence Matrix</p>
          </div>
          <div className="flex gap-4">
             <button 
               onClick={() => { setEditingDishId(null); setActiveSetIndex(prev => (prev === 0 ? discoverySets.length - 1 : prev - 1)); }} 
               className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all text-slate-400 hover:text-orange-500 active:scale-95"
             >
                <ChevronLeft size={32} />
             </button>
             <button 
               onClick={() => { setEditingDishId(null); setActiveSetIndex(prev => (prev === discoverySets.length - 1 ? 0 : prev + 1)); }} 
               className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all text-slate-400 hover:text-orange-500 active:scale-95"
             >
                <ChevronRight size={32} />
             </button>
          </div>
        </div>

        <div className="relative">
          {/* Outer container remains stable, children handle the shifting animation */}
          <div className="w-full h-[650px] bg-white border border-slate-200 rounded-[5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] relative overflow-visible p-16">
            <div className="absolute top-10 left-16 flex items-center gap-3 z-20">
              <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
              <motion.span 
                key={activeSet.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[12px] font-black text-slate-800 uppercase tracking-[0.3em]"
              >
                {activeSet.title}
              </motion.span>
            </div>
            
            <div className="w-full h-full relative border border-slate-50 rounded-[3.5rem] bg-slate-50/30 overflow-visible">
                <AnimatePresence mode="popLayout">
                  {activeSet.dishes.map(dish => (
                    <motion.div
                      key={dish.id} 
                      layout 
                      initial={{ opacity: 0, scale: 0.8 }} 
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={springTransition}
                      className="absolute cursor-pointer backdrop-blur-md hover:backdrop-blur-xl transition-all overflow-visible group/rect"
                      style={{ 
                        left: `${dish.x}%`, 
                        top: `${dish.y}%`, 
                        width: `${dish.width}%`, 
                        height: `${dish.height}%`, 
                        backgroundColor: `${dish.color}66`, // Translucency
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '2.5rem', // Curved corners
                        zIndex: editingDishId === dish.id ? 100 : 10 
                      }}
                      onClick={() => setEditingDishId(editingDishId === dish.id ? null : dish.id)}
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                         <motion.span layout="position" className="text-[13px] font-black text-slate-900 uppercase leading-tight mb-2 drop-shadow-sm">{dish.name}</motion.span>
                         <motion.div layout="position" className="flex items-center gap-2 bg-white/40 px-3 py-1 rounded-full border border-white/20">
                           <Sparkles size={10} className="text-orange-600" />
                           <span className="text-[9px] font-black text-slate-800 uppercase opacity-80">{dish.demand}% Demand</span>
                         </motion.div>
                      </div>

                      <AnimatePresence>
                        {editingDishId === dish.id && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 10 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className={`absolute left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] p-8 w-72 z-[200] border border-white/10 backdrop-blur-3xl 
                              ${dish.y > 50 ? 'bottom-full mb-6' : 'top-full mt-6'}`} // Improved positioning to avoid container clipping
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between mb-6">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Market Swaps</p>
                              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            </div>
                            <div className="space-y-4">
                               {dish.alternatives?.map((alt, idx) => (
                                 <button 
                                   key={idx} 
                                   onClick={() => handleDishChange(dish.id, alt)} 
                                   className="w-full text-left p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-orange-600 hover:border-orange-500 transition-all group flex flex-col gap-1"
                                 >
                                    <p className="text-[12px] font-black uppercase tracking-tight text-white group-hover:text-white">{alt.name}</p>
                                    <div className="flex justify-between items-center opacity-50 group-hover:opacity-100 transition-opacity">
                                       <div className="flex items-center gap-1.5">
                                          <Scale size={10} />
                                          <span className="text-[9px] font-bold uppercase">{alt.demand}% Demand</span>
                                       </div>
                                       <span className="text-[10px] font-black uppercase text-orange-400 group-hover:text-white">${alt.cost}</span>
                                    </div>
                                 </button>
                               ))}
                               <button 
                                 onClick={() => setEditingDishId(null)} 
                                 className="w-full mt-4 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                               >
                                 Close
                               </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[4rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000">
           <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Menu Items</th>
                  <th className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Prep Window</th>
                  <th className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Unit Margin</th>
                  <th className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Demand</th>
                  <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {activeSet.dishes.map((dish) => {
                    const risk = getRiskDetails(dish.demand);
                    return (
                      <motion.tr 
                        key={dish.id} 
                        layout 
                        transition={springTransition}
                        className="group hover:bg-slate-50/80 transition-colors"
                      >
                         <td className="px-12 py-8">
                            <div className="flex items-center gap-5">
                               <span className="text-[14px] font-black text-slate-800 uppercase tracking-tight">{dish.name}</span>
                            </div>
                         </td>
                         <td className="px-8 py-8 text-center">
                            <div className="flex items-center justify-center gap-2 text-slate-500">
                               <Clock size={14} />
                               <span className="text-[11px] font-black uppercase">{dish.cookingTime}m</span>
                            </div>
                         </td>
                         <td className="px-8 py-8 text-center">
                            <span className="text-[13px] font-black text-slate-900 bg-slate-100 px-4 py-2 rounded-2xl">${dish.cost.toFixed(2)}</span>
                         </td>
                         <td className="px-8 py-8 text-center">
                            <div className="flex flex-col items-center">
                               <span className="text-[14px] font-black text-slate-800 mb-2">{dish.demand}%</span>
                               <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                  <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: `${dish.demand}%` }} 
                                    transition={{ ...springTransition, delay: 0.2 }}
                                    className="h-full bg-orange-500 rounded-full" 
                                  />
                               </div>
                            </div>
                         </td>
                         <td className="px-12 py-8 text-right">
                            <div className="inline-flex items-center gap-3">
                               <span className="text-[14px] font-black text-slate-800">{risk.score}</span>
                               <div className={`${risk.color} text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm`}>
                                  <AlertCircle size={12} />
                                  <span className="text-[9px] font-black uppercase tracking-widest">{risk.label}</span>
                               </div>
                            </div>
                         </td>
                      </motion.tr>
                    );
                 })}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};
