
import React, { useState } from 'react';
import { ClockView } from './ClockView';
import { TimelineView } from './TimelineView';
import { StepGroup } from '../../types';

interface PlanProps {
  stepGroups: StepGroup[];
  chefPool: string[];
}

export const PlanView: React.FC<PlanProps> = ({ stepGroups, chefPool }) => {
  const [planSubTab, setPlanSubTab] = useState<'clock' | 'timeline'>('timeline');

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      <div className="absolute top-6 right-10 z-[60] bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center scale-90 origin-right">
        <button onClick={() => setPlanSubTab('clock')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${planSubTab === 'clock' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>Clock View</button>
        <button onClick={() => setPlanSubTab('timeline')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${planSubTab === 'timeline' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>Timeline View</button>
      </div>
      {planSubTab === 'clock' ? (
        <ClockView stepGroups={stepGroups} chefPool={chefPool} />
      ) : (
        <TimelineView stepGroups={stepGroups} chefPool={chefPool} />
      )}
    </div>
  );
};
