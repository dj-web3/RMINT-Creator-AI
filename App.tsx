
import React, { useState } from 'react';
import { ChefHat, Layout, BoxSelect, CalendarDays, Wine, UtensilsCrossed } from 'lucide-react';
import { CreateMenuView } from './features/create-menu/CreateMenuView';
import { CreateGuideView } from './features/create-guide/CreateGuideView';
import { CreatePlanView } from './features/create-plan/CreatePlanView';
import { PairingView } from './features/pairing/PairingView';
import { DiscoveryView } from './features/discovery/DiscoveryView';
import { 
  MOCK_BUTTER_CHICKEN_INGREDIENTS, 
  INITIAL_NODES, 
  INITIAL_EDGES, 
  INITIAL_STEP_GROUPS 
} from './constants/mockData';
import { ChefCategory } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create-menu' | 'create-guide' | 'create-plan' | 'pairing' | 'discovery'>('create-menu');
  const [ingredients, setIngredients] = useState(MOCK_BUTTER_CHICKEN_INGREDIENTS);
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [edges, setEdges] = useState(INITIAL_EDGES);
  const [stepGroups, setStepGroups] = useState(INITIAL_STEP_GROUPS);
  
  const chefPool = [ChefCategory.SOUS, ChefCategory.STATION, ChefCategory.JUNIOR, ChefCategory.TRAINEE];

  return (
    <div className="flex flex-col h-screen w-full bg-[#fcfaf8] text-slate-900 select-none font-sans overflow-hidden">
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <div className="bg-orange-500 p-2 rounded-xl text-white shadow shadow-orange-100 ring-2 ring-orange-50"><ChefHat size={18} /></div>
          <h1 className="text-sm font-black tracking-tight text-slate-800 uppercase">CHEF STUDIO</h1>
          <nav className="flex items-center gap-1 ml-6 bg-slate-50 p-1 rounded-lg scale-90">
            {[
              { id: 'create-menu', label: 'Create Menu', icon: Layout },
              { id: 'create-guide', label: 'Create Guide', icon: BoxSelect },
              { id: 'create-plan', label: 'Create Plan', icon: CalendarDays },
              { id: 'pairing', label: 'Pairing', icon: Wine }, 
              { id: 'discovery', label: 'Discovery', icon: UtensilsCrossed }
            ].map(tab => (
              <button 
                key={tab.id} onClick={() => setActiveTab(tab.id as any)} 
                className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <tab.icon size={12} /> {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {activeTab === 'create-menu' && (
          <CreateMenuView
            nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges}
            stepGroups={stepGroups} setStepGroups={setStepGroups}
            ingredients={ingredients} setIngredients={setIngredients}
          />
        )}
        {activeTab === 'create-guide' && (
          <CreateGuideView nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} stepGroups={stepGroups} />
        )}
        {activeTab === 'create-plan' && (
          <CreatePlanView stepGroups={stepGroups} chefPool={chefPool} />
        )}
        {activeTab === 'pairing' && <PairingView dishName={nodes[0]?.label} />}
        {activeTab === 'discovery' && <DiscoveryView dishName={nodes[0]?.label} />}
      </div>
    </div>
  );
};

export default App;
