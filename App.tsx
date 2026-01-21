
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Play, 
  Clock, 
  Layout, 
  Upload,
  User,
  Scissors,
  Zap,
  Flame,
  Thermometer,
  Timer,
  Square,
  Youtube,
  CheckCircle2,
  Loader2,
  RefreshCw,
  BoxSelect,
  Layers,
  Wine,
  Sparkles,
  UtensilsCrossed,
  Info,
  ChefHat,
  X,
  Search,
  ChevronRight,
  ChevronLeft,
  FileText,
  Video,
  Image as ImageIcon,
  Grid,
  TrendingUp,
  ArrowRightLeft,
  DollarSign,
  Send,
  PlusCircle,
  Maximize,
  Hand,
  Edit2,
  UserPlus,
  CalendarDays,
  Snowflake
} from 'lucide-react';
import { 
  Ingredient, 
  Node, 
  Edge, 
  ChefCategory,
  ActionIconType,
  SubStep,
  StepGroup,
  TasteKey,
  PairingItem,
  DiscoverySet,
  DiscoveryDish
} from './types';
import { processChefPrompt, analyzeCookingVideo } from './services/geminiService';

const getIngImage = (name: string) => `https://loremflickr.com/320/240/food,${encodeURIComponent(name.toLowerCase().split(' ').pop() || name)}?lock=${Math.floor(Math.random() * 1000)}`;

const NODE_WIDTH = 180;

const MOCK_INGREDIENTS: Ingredient[] = [
  { id: 'ing_mutton', name: 'Mutton Keema', quantity: '200g', image: getIngImage('minced meat') },
  { id: 'ing_garlic', name: 'Garlic', quantity: '7 cloves', image: getIngImage('garlic') },
  { id: 'ing_ginger', name: 'Ginger', quantity: '5g', image: getIngImage('ginger') },
  { id: 'ing_onion', name: 'Shallots', quantity: '20g', image: getIngImage('onion') },
  { id: 'ing_pottukadalai', name: 'Roasted Gram', quantity: '40g', image: getIngImage('roasted gram') },
];

const ActionIcon: React.FC<{ type: ActionIconType; size?: number; className?: string }> = ({ type, size = 16, className }) => {
  switch (type) {
    case 'cooking': return <Flame size={size} className={className} />;
    case 'resting': return <Snowflake size={size} className={className} />;
    case 'waiting': return <Timer size={size} className={className} />;
    case 'baking': return <Square size={size} className={className} />;
    default: return <Zap size={size} className={className} />;
  }
};

const useCanvasTransform = () => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const delta = -e.deltaY * 0.002;
      setScale((prev) => Math.min(Math.max(prev + delta, 0.2), 3));
    } else {
      setOffset((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };
  return { scale, offset, handleWheel, setOffset, setScale };
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'playground' | 'spaces' | 'plan' | 'pairing' | 'discovery'>('playground');
  const [planSubTab, setPlanSubTab] = useState<'clock' | 'timeline'>('clock');
  const [ingredients, setIngredients] = useState<Ingredient[]>(MOCK_INGREDIENTS);
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'root', type: 'input', label: 'KITCHEN ORIGIN', image: getIngImage('chef origin'), quantity: 'START', x: 100, y: 300, content: 'Initialize your culinary workflow here.' }
  ]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [stepGroups, setStepGroups] = useState<StepGroup[]>([]);
  const [chefPool, setChefPool] = useState<string[]>([ChefCategory.JUNIOR, ChefCategory.TRAINEE, ChefCategory.STATION, ChefCategory.SOUS]);

  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [actionPrompt, setActionPrompt] = useState('');
  const [ingredientPrompt, setIngredientPrompt] = useState('');
  
  const pgCanvas = useCanvasTransform();

  const executeActionInstant = async () => {
    if (selectedNodeIds.length === 0 || !actionPrompt) return;
    const selectedItems = nodes.filter(n => selectedNodeIds.includes(n.id));
    const maxX = Math.max(...selectedItems.map(n => n.x));
    const avgY = selectedItems.reduce((acc, n) => acc + n.y, 0) / selectedItems.length;
    const newNodeId = `node-${Date.now()}`;
    const newNode: Node = { id: newNodeId, type: 'action-result', label: actionPrompt, quantity: '1 batch', image: getIngImage(actionPrompt), x: maxX + 220, y: avgY, subSteps: [] };
    const newEdges: Edge[] = selectedItems.map((n, i) => ({ id: `edge-${Date.now()}-${i}`, sourceId: n.id, targetId: newNodeId, action: 'Process', iconType: 'default' }));
    setNodes(prev => [...prev, newNode]);
    setEdges(prev => [...prev, ...newEdges]);
    setSelectedNodeIds([]);
    setActionPrompt('');
    processChefPrompt(actionPrompt, { selectedItems }).then(result => {
      setNodes(prev => prev.map(n => n.id === newNodeId ? { ...n, label: result.resultName, subSteps: result.subSteps, quantity: result.quantity, duration: result.duration } : n));
    }).catch(console.error);
  };

  const createStepGroup = () => {
    if (selectedNodeIds.length === 0) return;
    const label = prompt("Enter Heading for this Step:") || "Step Sequence";
    const startTime = "08:00 am";
    const newGroup: StepGroup = { id: `group-${Date.now()}`, label, nodeIds: [...selectedNodeIds], color: '#fef3c7', assignedChef: ChefCategory.STATION, startTime, durationMinutes: 20 };
    setStepGroups(prev => [...prev, newGroup]);
    setSelectedNodeIds([]);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#fcfaf8] text-slate-900 select-none font-sans overflow-hidden">
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <div className="bg-orange-500 p-2 rounded-xl text-white shadow shadow-orange-100 ring-2 ring-orange-50"><ChefHat size={18} /></div>
          <h1 className="text-sm font-black tracking-tight text-slate-800">CHEF STUDIO</h1>
          <nav className="flex items-center gap-1 ml-6 bg-slate-50 p-1 rounded-lg scale-90">
            {[
              { id: 'playground', label: 'Playground', icon: Layout }, 
              { id: 'spaces', label: 'Spaces', icon: BoxSelect }, 
              { id: 'plan', label: 'Plan', icon: CalendarDays },
              { id: 'pairing', label: 'Pairing', icon: Wine }, 
              { id: 'discovery', label: 'Discovery', icon: UtensilsCrossed }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><tab.icon size={12} /> {tab.label}</button>
            ))}
          </nav>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {activeTab === 'playground' && (
          <>
            <SidebarLeft ingredients={ingredients} setIngredients={setIngredients} ingredientPrompt={ingredientPrompt} setIngredientPrompt={setIngredientPrompt} />
            <div className="flex-1 relative overflow-hidden canvas-grid cursor-grab active:cursor-grabbing" onDragOver={(e) => e.preventDefault()} onWheel={pgCanvas.handleWheel}>
              <motion.div className="w-full h-full relative origin-top-left pointer-events-none" animate={{ x: pgCanvas.offset.x, y: pgCanvas.offset.y, scale: pgCanvas.scale }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                <PlaygroundCanvas nodes={nodes} edges={edges} selectedNodeIds={selectedNodeIds} handleToggleSelection={(id) => setSelectedNodeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} updateNodeQuantity={(id, qty) => setNodes(prev => prev.map(n => n.id === id ? { ...n, quantity: qty } : n))} />
              </motion.div>
              {selectedNodeIds.length > 0 && <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-4 border border-slate-200 flex items-center gap-4 w-[500px] z-[60] animate-in fade-in slide-in-from-bottom-2"><div className="bg-orange-500 text-white p-2.5 rounded-xl shadow shadow-orange-100"><Scissors size={18}/></div><div className="flex-1"><p className="text-[9px] font-black text-slate-400 uppercase mb-0.5 px-1 tracking-widest">Recipe Prompt</p><input type="text" placeholder={`Instruction for ${selectedNodeIds.length} items...`} className="w-full bg-slate-100/50 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-300" value={actionPrompt} onChange={(e) => setActionPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && executeActionInstant()} /></div><div className="flex flex-col gap-1"><button onClick={executeActionInstant} className="bg-slate-900 text-white px-5 py-2 rounded-lg font-black text-[9px] uppercase hover:bg-black">Combine</button><button onClick={createStepGroup} className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-black text-[9px] uppercase hover:bg-indigo-700">Group Step</button></div></div>}
            </div>
            <SidebarRight stepGroups={stepGroups} setStepGroups={setStepGroups} nodes={nodes} />
          </>
        )}
        {activeTab === 'spaces' && <SpacesView nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} />}
        {activeTab === 'plan' && (
          <div className="flex-1 flex flex-col h-full bg-white relative">
            <div className="absolute top-6 right-10 z-[60] bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center scale-90 origin-right">
              <button onClick={() => setPlanSubTab('clock')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${planSubTab === 'clock' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>Clock View</button>
              <button onClick={() => setPlanSubTab('timeline')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${planSubTab === 'timeline' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>Timeline View</button>
            </div>
            {planSubTab === 'clock' ? (
              <TimeView stepGroups={stepGroups} setStepGroups={setStepGroups} nodes={nodes} chefPool={chefPool} setChefPool={setChefPool} />
            ) : (
              <TimelineView stepGroups={stepGroups} setStepGroups={setStepGroups} chefPool={chefPool} />
            )}
          </div>
        )}
        {activeTab === 'pairing' && <PairingView />}
        {activeTab === 'discovery' && <DiscoveryView />}
      </div>
    </div>
  );
};

const SidebarLeft: React.FC<{ ingredients: Ingredient[], setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>, ingredientPrompt: string, setIngredientPrompt: React.Dispatch<React.SetStateAction<string>> }> = ({ ingredients, setIngredients, ingredientPrompt, setIngredientPrompt }) => {
  const handleAdd = () => { if (!ingredientPrompt) return; setIngredients(prev => [{ id: `i-${Date.now()}`, name: ingredientPrompt, image: getIngImage(ingredientPrompt), quantity: '1 unit' }, ...prev]); setIngredientPrompt(''); };
  return (
    <div className="w-56 border-r border-slate-200 bg-white flex flex-col z-10 shadow-xl shadow-slate-200/50">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between"><h2 className="font-black text-slate-800 uppercase tracking-tighter text-[10px]">Ingredients</h2></div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">{ingredients.map(ing => (<div key={ing.id} draggable onDragStart={(e) => e.dataTransfer.setData('ingredient', JSON.stringify(ing))} className="group relative flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-xl cursor-grab hover:border-orange-500 hover:shadow-lg transition-all"><img src={ing.image} className="w-9 h-9 rounded-lg object-cover" /><div className="flex-1 overflow-hidden"><p className="font-black text-[10px] text-slate-900 truncate">{ing.name}</p><p className="text-[8px] text-slate-400 font-bold uppercase">{ing.quantity}</p></div></div>))}</div>
      <div className="p-3 border-t border-slate-100 bg-slate-50/30"><div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1"><input type="text" placeholder="Add..." className="flex-1 px-2 py-1 text-[10px] bg-transparent focus:outline-none font-black" value={ingredientPrompt} onChange={(e) => setIngredientPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} /><button onClick={handleAdd} className="bg-slate-900 text-white p-1.5 rounded-md hover:bg-orange-600 transition-colors"><Plus size={12} /></button></div></div>
    </div>
  );
};

const PlaygroundCanvas: React.FC<{ nodes: Node[], edges: Edge[], selectedNodeIds: string[], handleToggleSelection: (id: string) => void, updateNodeQuantity: (id: string, qty: string) => void }> = ({ nodes, edges, selectedNodeIds, handleToggleSelection, updateNodeQuantity }) => {
  return (
    <div className="w-full h-full relative pointer-events-none">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '4000px', minHeight: '4000px' }}>
        <defs><marker id="arrowhead" markerWidth="6" markerHeight="3" refX="5" refY="1.5" orient="auto"><polygon points="0 0, 6 1.5, 0 3" fill="#cbd5e1" /></marker></defs>
        {edges.map(edge => {
          const source = nodes.find(n => n.id === edge.sourceId); const target = nodes.find(n => n.id === edge.targetId);
          if (!source || !target) return null;
          const startX = source.x + NODE_WIDTH; const startY = source.y + 60; const endX = target.x; const endY = target.y + 60;
          return (<g key={edge.id}><path d={`M ${startX} ${startY} C ${(startX+endX)/2} ${startY}, ${(startX+endX)/2} ${endY}, ${endX} ${endY}`} stroke="#cbd5e1" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" /><g transform={`translate(${(startX+endX)/2 - 35}, ${(startY+endY)/2 - 12})`}><rect width="70" height="24" rx="12" fill="white" stroke="#e2e8f0" strokeWidth="1" className="shadow-sm"/><foreignObject width="70" height="24"><div className="w-full h-full flex items-center justify-center gap-1 px-2"><ActionIcon type={edge.iconType} size={10} className="text-orange-500" /><span className="text-[8px] font-black text-slate-800 uppercase truncate">{edge.action}</span></div></foreignObject></g></g>);
        })}
      </svg>
      {nodes.map(node => (<div key={node.id} className={`absolute w-[180px] bg-white rounded-2xl border-2 transition-all cursor-pointer shadow-sm p-4 pointer-events-auto ${selectedNodeIds.includes(node.id) ? 'border-orange-500 ring-4 ring-orange-100 z-20 scale-105 shadow-orange-100' : 'border-white hover:border-orange-100 z-10'}`} style={{ left: node.x, top: node.y }} onClick={(e) => { e.stopPropagation(); handleToggleSelection(node.id); }}>{node.image && (<div className="relative h-20 w-full overflow-hidden rounded-xl bg-slate-50 mb-3 shadow-inner"><img src={node.image} className="w-full h-full object-cover group-hover:scale-110" />{node.duration && (<div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-[8px] px-2 py-1 rounded-full font-black"><Clock size={9} className="inline mr-1" />{node.duration}m</div>)}</div>)}<p className="font-black text-[10px] text-slate-800 truncate uppercase tracking-tighter mb-2">{node.label}</p><div className="flex items-center gap-1.5 bg-slate-50 rounded p-1.5 border border-slate-100"><span className="text-[7px] font-black text-slate-400 uppercase">Qty</span><input type="text" value={node.quantity} onClick={(e) => e.stopPropagation()} onChange={(e) => updateNodeQuantity(node.id, e.target.value)} className="bg-transparent text-[9px] font-black text-slate-900 w-full focus:outline-none" /></div></div>))}
    </div>
  );
};

const SidebarRight: React.FC<{ stepGroups: StepGroup[], setStepGroups: React.Dispatch<React.SetStateAction<StepGroup[]>>, nodes: Node[] }> = ({ stepGroups, setStepGroups, nodes }) => {
  const chefs = Object.values(ChefCategory);
  const updateChef = (groupId: string, chef: ChefCategory) => { setStepGroups(prev => prev.map(g => g.id === groupId ? { ...g, assignedChef: chef } : g)); };
  return (
    <div className="w-72 border-l border-slate-200 bg-white flex flex-col z-10 shadow-2xl">
      <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/20"><UtensilsCrossed size={16} className="text-orange-500" /><h2 className="font-black text-slate-800 uppercase text-[10px]">Method Panel</h2></div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {stepGroups.map((group, idx) => (<div key={group.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group/card hover:shadow-lg transition-all"><div className="p-4 bg-slate-900 text-white flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-6 h-6 bg-orange-500 text-white rounded-lg flex items-center justify-center text-[9px] font-black">{idx + 1}</div><h3 className="text-[10px] font-black uppercase tracking-tight truncate w-32">{group.label}</h3></div></div><div className="p-4"><p className="text-[8px] font-black text-slate-400 uppercase mb-3 tracking-widest flex items-center gap-1">Trace</p><div className="space-y-3 mb-5 pl-2 border-l-2 border-slate-100 ml-2">{nodes.filter(n => group.nodeIds.includes(n.id)).map((node, nIdx) => (<div key={node.id} className="relative"><p className="text-[10px] font-black text-slate-800 leading-tight">{node.label}</p></div>))}</div><div className="pt-4 border-t border-slate-50"><div className="flex flex-wrap gap-1">{chefs.map(chef => (<button key={chef} onClick={() => updateChef(group.id, chef)} className={`px-2 py-1.5 rounded-full text-[7px] font-black uppercase transition-all ${group.assignedChef === chef ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{chef.split(' ')[0]}</button>))}</div></div></div></div>))}
      </div>
    </div>
  );
};

const TimeView: React.FC<{ stepGroups: StepGroup[], setStepGroups: React.Dispatch<React.SetStateAction<StepGroup[]>>, nodes: Node[], chefPool: string[], setChefPool: React.Dispatch<React.SetStateAction<string[]>> }> = ({ stepGroups, setStepGroups, nodes, chefPool, setChefPool }) => {
  const [clockScale, setClockScale] = useState<1 | 12>(12);
  const [focusHour, setFocusHour] = useState<number>(8); 
  
  const colors = ['#f472b6', '#a78bfa', '#22d3ee', '#8b5cf6', '#fbbf24', '#34d399', '#f87171', '#60a5fa'];
  const baseRadius = 140;
  const ringWidth = 44;
  const gap = 14;

  const [activeChefIndex, setActiveChefIndex] = useState<number | null>(null);
  const [hoveredTask, setHoveredTask] = useState<StepGroup | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const formatHour = (h: number) => {
    const displayH = h % 12 || 12;
    const period = h >= 12 ? 'PM' : 'AM';
    return `${displayH}:00 ${period}`;
  };

  const getTicks = () => {
    if (clockScale === 1) {
        return [
            { label: '60', angle: -90 },
            { label: '15', angle: 0 },
            { label: '30', angle: 90 },
            { label: '45', angle: 180 }
        ];
    }
    return Array.from({ length: 12 }, (_, i) => {
      const val = i === 0 ? 12 : i;
      return { label: val.toString(), angle: (i * (360 / 12) - 90) };
    });
  };

  const hourRange = Array.from({ length: 13 }, (_, i) => 8 + i); // 8 AM to 8 PM

  return (
    <div className="flex-1 bg-[#fcfaf8] overflow-y-auto custom-scrollbar flex flex-col pt-20 relative" onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}>
      <div className="w-full flex flex-col items-center p-10">
        <div className="text-center mb-6 shrink-0">
          <h2 className="text-5xl font-black tracking-tighter text-slate-800 uppercase leading-none">Kitchen Pulse</h2>
          <p className="text-[11px] font-black text-slate-400 tracking-[0.6em] mt-4 uppercase">Load Management System</p>
        </div>

        <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 scale-90">
                {[1, 12].map(s => (
                    <button key={s} onClick={() => setClockScale(s as any)} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${clockScale === s ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>{s}H View</button>
                ))}
            </div>

            {clockScale === 1 && (
                <div className="w-[800px] flex flex-col items-center gap-6 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between w-full px-2">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Focus</span>
                           <span className="text-lg font-black text-slate-800">{formatHour(focusHour)} — {formatHour(focusHour + 1)}</span>
                        </div>
                        <div className="bg-orange-50 px-5 py-2 rounded-2xl border border-orange-100 shadow-sm flex items-center justify-center">
                           <span className="text-[11px] font-black text-orange-600 uppercase tracking-tight">1 HOUR INTERVAL</span>
                        </div>
                    </div>

                    <div className="relative w-full h-16 flex items-center justify-between bg-white rounded-3xl p-1 border border-slate-200 shadow-sm group">
                        {/* The Highlighting Translucent Box */}
                        <motion.div 
                           className="absolute top-1 bottom-1 bg-orange-500/15 rounded-2xl border border-orange-500/30 z-0"
                           animate={{ 
                             left: `${((focusHour - 8) / 12) * 100}%`, 
                             width: `${(1/12) * 100}%` 
                           }}
                           transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                        />

                        {hourRange.slice(0, 12).map((h, i) => (
                           <button 
                             key={h} 
                             onClick={() => setFocusHour(h)}
                             className={`relative z-10 flex-1 h-full flex flex-col items-center justify-center transition-all ${focusHour === h ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
                           >
                             <span className="text-sm font-black">{h % 12 || 12}</span>
                             <span className="text-[8px] font-black uppercase opacity-60">{h >= 12 ? 'PM' : 'AM'}</span>
                           </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="relative flex flex-col items-center justify-center w-full max-w-4xl mx-auto py-10">
          <div className="relative flex items-center justify-center" style={{ width: 'min(80vw, 700px)', height: 'min(80vw, 700px)' }}>
            <svg viewBox="0 0 800 800" className="w-full h-full drop-shadow-3xl overflow-visible">
              <filter id="taskGlow"><feGaussianBlur stdDeviation="4" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              {getTicks().map((tick, i) => {
                const angleRad = tick.angle * (Math.PI / 180);
                const rLine = 360;
                return (
                  <g key={i}>
                    <line x1={400 + Math.cos(angleRad) * rLine} y1={400 + Math.sin(angleRad) * rLine} x2={400 + Math.cos(angleRad) * (rLine + 15)} y2={400 + Math.sin(angleRad) * (rLine + 15)} stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
                    <text x={400 + Math.cos(angleRad) * 395} y={400 + Math.sin(angleRad) * 395} textAnchor="middle" dominantBaseline="middle" className="text-[14px] font-black fill-slate-300 font-sans">{tick.label}{clockScale === 1 ? 'm' : ''}</text>
                  </g>
                );
              })}

              {chefPool.map((chef, chefIdx) => {
                const r = baseRadius + chefIdx * (ringWidth + gap);
                return (
                  <g key={`${chef}-${chefIdx}`}>
                    <circle cx="400" cy="400" r={r} fill="none" stroke={colors[chefIdx % colors.length]} strokeWidth={ringWidth} className="opacity-[0.08] cursor-pointer" onClick={() => setActiveChefIndex(chefIdx)} />
                    {stepGroups.filter(g => g.assignedChef === chef).map((group, gIdx) => {
                      const totalMinutes = clockScale * 60;
                      const sweepAngle = (group.durationMinutes || 30) / totalMinutes * 360;
                      const startAngle = -90 + (gIdx * 45); 
                      const endAngle = startAngle + sweepAngle;
                      const pathData = `M ${400 + r * Math.cos(startAngle * Math.PI / 180)} ${400 + r * Math.sin(startAngle * Math.PI / 180)} A ${r} ${r} 0 ${sweepAngle <= 180 ? "0" : "1"} 1 ${400 + r * Math.cos(endAngle * Math.PI / 180)} ${400 + r * Math.sin(endAngle * Math.PI / 180)}`;
                      return (
                        <g key={group.id} filter={hoveredTask?.id === group.id ? "url(#taskGlow)" : "none"} className="cursor-pointer" onMouseEnter={() => setHoveredTask(group)} onMouseLeave={() => setHoveredTask(null)}>
                          <path d={pathData} fill="none" stroke={colors[chefIdx % colors.length]} strokeWidth={ringWidth} strokeLinecap="butt" />
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              <circle cx="400" cy="400" r={120} fill="white" className="shadow-2xl" />
              <foreignObject x="300" y="300" width="200" height="200">
                <div className="w-full h-full flex flex-col items-center justify-center text-center">
                    <ChefHat className="text-orange-500 mb-2" size={32} />
                    <span className="text-[28px] font-black text-slate-800 leading-none">10:45</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Pulse</span>
                </div>
              </foreignObject>
            </svg>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {hoveredTask && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ position: 'fixed', left: mousePos.x + 20, top: mousePos.y + 20 }} className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-2xl border border-white/10 w-[240px] z-[400] backdrop-blur-2xl pointer-events-none">
             <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4">
               <div className="w-2.5 h-10 rounded-full" style={{ backgroundColor: hoveredTask.color }} />
               <div className="overflow-hidden">
                  <h4 className="text-[12px] font-black uppercase truncate">{hoveredTask.label}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{hoveredTask.assignedChef}</p>
               </div>
             </div>
             <div className="flex items-center justify-between text-[10px] font-black">
                <span className="text-slate-500 uppercase">Duration</span>
                <span>{hoveredTask.durationMinutes}m</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TimelineView: React.FC<{ stepGroups: StepGroup[], setStepGroups: React.Dispatch<React.SetStateAction<StepGroup[]>>, chefPool: string[] }> = ({ stepGroups, setStepGroups, chefPool }) => {
  const hours = Array.from({ length: 12 }, (_, i) => 8 + i);
  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden p-8 pt-20">
      <div className="bg-white border border-slate-200 rounded-[3rem] p-8 flex-1 overflow-auto shadow-sm">
        <div className="min-w-[1500px]">
          <div className="flex h-16 mb-10 items-center px-6 bg-slate-900 text-white rounded-[2rem] sticky top-0 z-10 shadow-xl"><div className="w-64 shrink-0 border-r border-slate-700 px-4"><span className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400">Staffing</span></div><div className="flex-1 flex">{hours.map(h => (<div key={h} className="flex-1 border-l border-slate-700 px-6 text-[10px] font-black flex items-center">{h > 12 ? h - 12 : h}:00 {h >= 12 ? 'PM' : 'AM'}</div>))}</div></div>
          <div className="space-y-8">{chefPool.map(chef => (<div key={chef} className="flex h-24 items-center group relative rounded-[2.5rem] border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all"><div className="w-64 shrink-0 flex items-center gap-5 px-8"><div className="w-14 h-14 rounded-[1.8rem] bg-white border border-slate-200 text-slate-400 flex items-center justify-center shadow-lg"><User size={28} /></div><span className="text-[11px] font-black text-slate-800 uppercase">{chef}</span></div><div className="flex-1 h-14 relative bg-slate-100/30 rounded-[1.8rem] mx-6 my-4 border border-slate-200/50" /></div>))}</div>
        </div>
      </div>
    </div>
  );
};

const SpacesView: React.FC<{ nodes: Node[], setNodes: React.Dispatch<React.SetStateAction<Node[]>>, edges: Edge[], setEdges: React.Dispatch<React.SetStateAction<Edge[]>> }> = ({ nodes, setNodes, edges, setEdges }) => {
  const CARD_W = 340;
  const GRID_SIZE = 400;

  const [sections] = useState([
    { id: 'sec-1', label: 'PREPARING MARINADE', color: 'rgba(249, 115, 22, 0.03)', x: 50, y: 100, width: 1000, height: 1000 },
    { id: 'sec-2', label: 'PRIMARY PRODUCTION', color: 'rgba(99, 102, 241, 0.03)', x: 1100, y: 100, width: 1000, height: 1000 }
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSpawning, setIsSpawning] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [isDragToolActive, setIsDragToolActive] = useState(false);
  const spCanvas = useCanvasTransform();

  const handleSpawn = async () => {
    if (!selectedId || !promptInput) return;
    const parent = nodes.find(n => n.id === selectedId);
    if (!parent) return;
    
    setIsSpawning(true);
    try {
      const res = await processChefPrompt(promptInput, { selectedItems: [parent] });
      let nextX = parent.x + GRID_SIZE;
      let nextY = parent.y;

      const currentSection = sections.find(s => parent.x >= s.x && parent.x < s.x + s.width);
      if (currentSection && nextX + CARD_W > currentSection.x + currentSection.width) {
        const nextSection = sections.find(s => s.x > currentSection.x);
        if (nextSection) { nextX = nextSection.x + 50; nextY = nextSection.y + 100; }
      }

      let collision = true;
      while (collision) {
        const overlapping = nodes.some(n => Math.abs(n.x - nextX) < CARD_W - 50 && Math.abs(n.y - nextY) < 300);
        if (overlapping) { nextY += 320; } else { collision = false; }
      }

      const nid = `node-${Date.now()}`;
      setNodes(prev => [...prev, { 
        id: nid, type: 'instructions', label: (res.resultName || promptInput).toUpperCase(), 
        image: getIngImage(res.imageKeyword || promptInput), quantity: (res.quantity || '1 PORTION').toUpperCase(), 
        x: nextX, y: nextY, content: res.subSteps?.[0]?.instruction || `Outcome: ${promptInput}`, 
        duration: res.duration 
      }]);
      setEdges(prev => [...prev, { 
        id: `edge-${Date.now()}`, sourceId: parent.id, targetId: nid, 
        action: (res.actionType || 'process').toUpperCase(), iconType: (res.actionType || 'default') as ActionIconType 
      }]);
      setSelectedId(nid);
      setPromptInput('');
    } catch (e) { console.error(e); } finally { setIsSpawning(false); }
  };

  return (
    <div className={`flex-1 bg-[#fcfaf8] overflow-hidden relative canvas-grid ${isDragToolActive ? 'cursor-grab active:cursor-grabbing' : ''}`}>
      <div className="w-full h-full relative overflow-hidden" onWheel={spCanvas.handleWheel} onMouseDown={(e) => {
          if (!isDragToolActive) return;
          const startX = e.clientX, startY = e.clientY, initOffX = spCanvas.offset.x, initOffY = spCanvas.offset.y;
          const onMove = (me: MouseEvent) => spCanvas.setOffset({ x: initOffX + (me.clientX - startX), y: initOffY + (me.clientY - startY) });
          const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
          window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
        }}>
        <motion.div className="relative origin-top-left p-[200px]" animate={{ x: spCanvas.offset.x, y: spCanvas.offset.y, scale: spCanvas.scale }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
          {sections.map(sec => (
            <div key={sec.id} className="absolute border-2 border-dashed border-slate-200/50 rounded-[5rem] pointer-events-none" style={{ left: sec.x, top: sec.y, width: sec.width, height: sec.height, backgroundColor: sec.color }}>
              <div className="absolute -top-5 left-12 bg-white border border-slate-200 px-8 py-2 rounded-full shadow-sm text-[10px] font-black uppercase text-slate-400 tracking-widest">SPACE: {sec.label}</div>
            </div>
          ))}

          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '10000px', minHeight: '10000px' }}>
            <defs><marker id="arrow-sp" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" /></marker></defs>
            {edges.map(edge => {
              const s = nodes.find(n => n.id === edge.sourceId); const t = nodes.find(n => n.id === edge.targetId);
              if (!s || !t) return null;
              const startX = s.x + CARD_W, startY = s.y + 120, endX = t.x, endY = t.y + 120, midX = (startX + endX) / 2;
              return (
                <g key={edge.id}>
                  <path d={`M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`} fill="none" stroke="#e2e8f0" strokeWidth="2.5" markerEnd="url(#arrow-sp)" />
                  <foreignObject x={midX - 50} y={(startY + endY) / 2 - 20} width="100" height="40">
                    <div className="flex justify-center items-center h-full">
                      <div className="bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-xl flex items-center gap-2 ring-2 ring-slate-50">
                        <ActionIcon type={edge.iconType} size={12} className="text-orange-500" />
                        <span className="text-[8px] font-black uppercase text-slate-800 tracking-tight">{edge.action}</span>
                      </div>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>

          <div className="relative" style={{ minWidth: '10000px', minHeight: '10000px' }}>
            {nodes.map(node => (
              <div 
                key={node.id} 
                className={`absolute w-[340px] bg-white border-2 rounded-[3.5rem] p-6 shadow-2xl cursor-pointer flex flex-col ${selectedId === node.id ? 'border-orange-500 ring-8 ring-orange-50 z-50' : 'border-white hover:border-orange-100 z-10'}`}
                style={{ 
                   left: node.x, 
                   top: node.y, 
                   transition: 'border 0.3s, ring 0.3s, box-shadow 0.3s' // Explicitly exclude transform from auto-transition to prevent input jiggle
                }}
                onClick={(e) => { e.stopPropagation(); if(!isDragToolActive) setSelectedId(node.id); }}
              >
                <div className="flex items-center gap-4 mb-6 pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-inner">{node.type === 'input' ? <PlusCircle size={20} /> : <Zap size={20} />}</div>
                  <div className="flex-1 overflow-hidden pr-2">
                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate leading-none">{node.label}</p>
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1.5">{node.type === 'input' ? 'Entry Point' : 'Step Outcome'}</p>
                  </div>
                </div>
                {node.image && (
                  <div className="w-full h-48 rounded-[2.5rem] overflow-hidden mb-6 bg-slate-50 relative border border-slate-100 shadow-inner pointer-events-none">
                    <img src={node.image} className="w-full h-full object-cover" />
                    {node.duration && <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/95 backdrop-blur rounded-full text-[9px] font-black text-slate-800 shadow-lg flex items-center gap-2"><Clock size={12} className="text-orange-500" /> {node.duration}M</div>}
                  </div>
                )}
                <div className="mb-8 px-2 pointer-events-none"><p className="text-[11px] text-slate-500 font-medium leading-relaxed italic line-clamp-3">{node.content}</p></div>
                <div className="flex items-center justify-between border-t border-slate-50 pt-6 pointer-events-none">
                  <div className="flex -space-x-3"><div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">CH</div></div>
                  <div className="bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100"><span className="text-[10px] font-black text-slate-800">{node.quantity}</span></div>
                </div>
                
                {/* Fixed positioning for the input panel to avoid "bouncing" when user interacts */}
                <AnimatePresence>
                  {selectedId === node.id && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: 10 }} 
                      className="absolute -bottom-28 left-0 w-full bg-white rounded-[3rem] p-3 flex items-center gap-3 shadow-[0_30px_60px_rgba(0,0,0,0.1)] border border-slate-100 z-[100]" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input 
                         type="text" 
                         placeholder="Type next sequence..." 
                         className="flex-1 bg-transparent px-6 py-3 text-[12px] font-bold text-slate-800 focus:outline-none" 
                         value={promptInput} 
                         onChange={(e) => setPromptInput(e.target.value)} 
                         onKeyDown={(e) => e.key === 'Enter' && handleSpawn()} 
                      />
                      <button onClick={handleSpawn} className="p-4 bg-slate-900 text-white rounded-full hover:bg-orange-500 transition-all shadow-xl active:scale-90">
                        {isSpawning ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-2xl rounded-full p-2 flex gap-4 border border-slate-200 shadow-3xl z-[100]">
        <button onClick={() => { setNodes([{ id: 'root', type: 'input', label: 'KITCHEN ORIGIN', image: getIngImage('chef origin'), quantity: 'START', x: 100, y: 300, content: 'Initialize workflow.' }]); setEdges([]); spCanvas.setOffset({ x: 0, y: 0 }); spCanvas.setScale(1); }} className="px-8 py-3.5 bg-slate-900 text-white text-[11px] font-black uppercase rounded-full hover:bg-black transition-all shadow-xl flex items-center gap-3"><RefreshCw size={16} /> Reset Flow</button>
        <div className="w-px h-8 bg-slate-200 self-center" />
        <button className={`p-4 rounded-full transition-all ${isDragToolActive ? 'bg-orange-500 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`} onClick={() => { setIsDragToolActive(!isDragToolActive); setSelectedId(null); }}><Hand size={20} /></button>
        <button className="p-4 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all" onClick={() => spCanvas.setScale(s => Math.max(s - 0.2, 0.2))}><Search size={20} /></button>
      </div>
    </div>
  );
};

const PairingView: React.FC = () => {
  return (
    <div className="flex-1 flex bg-[#fdfaf7] overflow-hidden items-center justify-center relative">
      <div className="absolute top-8 left-8 z-50"><div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100"><h2 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-2">Flavor Pairing Matrix</h2></div></div>
      <div className="relative w-[800px] h-[800px] flex items-center justify-center"><div className="w-64 h-64 bg-white rounded-[4rem] shadow-2xl border-4 border-slate-900 flex flex-col items-center justify-center p-8 text-center"><ChefHat className="text-orange-500 mb-4" size={48}/><p className="text-[14px] font-black uppercase text-slate-800 leading-tight">Flavor Analysis</p></div></div>
    </div>
  );
};

const DiscoveryView: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col bg-[#fcfaf8] overflow-y-auto p-12">
      <div className="flex items-center justify-between mb-16 px-6"><div><h2 className="text-6xl font-black text-slate-800 uppercase tracking-tighter">Kitchen Discovery</h2></div></div>
      <div className="flex-1 bg-white rounded-[5rem] border border-slate-100 p-20 shadow-sm flex items-center justify-center"><p className="text-slate-300 font-black uppercase tracking-[1em] text-sm">Initializing Neural Taste Map</p></div>
    </div>
  );
};

export default App;
