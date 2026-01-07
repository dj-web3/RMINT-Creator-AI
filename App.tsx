
import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  ChevronDown,
  ChevronUp,
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
  DollarSign
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

const MOCK_INGREDIENTS: Ingredient[] = [
  { id: 'ing_mutton', name: 'Mutton Keema', quantity: '200g', image: getIngImage('minced meat') },
  { id: 'ing_garlic', name: 'Garlic', quantity: '7 cloves', image: getIngImage('garlic') },
  { id: 'ing_ginger', name: 'Ginger', quantity: '5g', image: getIngImage('ginger') },
  { id: 'ing_onion', name: 'Shallots', quantity: '20g', image: getIngImage('onion') },
  { id: 'ing_pottukadalai', name: 'Roasted Gram', quantity: '40g', image: getIngImage('roasted gram') },
];

const INITIAL_PAIRINGS: PairingItem[] = [
  { id: 'p1', name: 'Pineapple Raita', image: getIngImage('pineapple yogurt'), flavorProfile: ['sweet', 'sour'], alternatives: [
    { id: 'p1a', name: 'Mango Chutney', image: getIngImage('mango chutney'), flavorProfile: ['sweet', 'sour'] },
    { id: 'p1b', name: 'Apple Slaw', image: getIngImage('apple salad'), flavorProfile: ['sweet', 'sour'] },
  ]},
  { id: 'p2', name: 'Mint Chutney', image: getIngImage('mint dip'), flavorProfile: ['pungency', 'sour'], alternatives: [
    { id: 'p2a', name: 'Coriander Dip', image: getIngImage('green chutney'), flavorProfile: ['pungency', 'sour'] },
    { id: 'p2b', name: 'Raw Mango Dip', image: getIngImage('mango sauce'), flavorProfile: ['sour'] },
  ]},
  { id: 'p3', name: 'Gulab Jamun', image: getIngImage('gulab jamun'), flavorProfile: ['sweet'], alternatives: [
    { id: 'p3a', name: 'Rasmalai', image: getIngImage('rasmalai'), flavorProfile: ['sweet'] },
    { id: 'p3b', name: 'Kulfi', image: getIngImage('kulfi'), flavorProfile: ['sweet'] },
  ]},
  { id: 'p4', name: 'Garlic Naan', image: getIngImage('garlic bread'), flavorProfile: ['fat', 'salty'], alternatives: [
    { id: 'p4a', name: 'Butter Roti', image: getIngImage('roti'), flavorProfile: ['fat', 'salty'] },
    { id: 'p4b', name: 'Missi Roti', image: getIngImage('indian flatbread'), flavorProfile: ['umami'] },
  ]},
  { id: 'p5', name: 'Red Wine', image: getIngImage('wine'), flavorProfile: ['alcohol', 'bitter'], alternatives: [
    { id: 'p5a', name: 'Cold Beer', image: getIngImage('beer'), flavorProfile: ['alcohol', 'bitter'] },
    { id: 'p5b', name: 'Iced Tea', image: getIngImage('iced tea'), flavorProfile: ['sweet', 'bitter'] },
  ]},
];

const INITIAL_DISCOVERY_SETS: DiscoverySet[] = [
  {
    id: 'set-1',
    title: 'Butter Chicken Fusion Feast',
    dishes: [
      { id: 'd1', name: 'Butter Chicken', color: 'rgba(239, 68, 68, 0.6)', x: 0.35, y: 0.15, width: 0.4, height: 0.5, demand: 840, cookingTime: 45, cost: 8.50, alternatives: [{name: 'Spicy Butter Chicken', demand: 910}, {name: 'Butter Paneer', demand: 720}, {name: 'Makhani Prawns', demand: 1100}] },
      { id: 'd2', name: 'Naan', color: 'rgba(234, 179, 8, 0.5)', x: 0.15, y: 0.05, width: 0.35, height: 0.35, demand: 1200, cookingTime: 10, cost: 1.20, alternatives: [{name: 'Garlic Naan', demand: 1450}, {name: 'Butter Roti', demand: 890}, {name: 'Laccha Paratha', demand: 1020}] },
      { id: 'd3', name: 'Lassi', color: 'rgba(255, 192, 203, 0.5)', x: 0.55, y: 0.05, width: 0.25, height: 0.35, demand: 450, cookingTime: 5, cost: 2.10, alternatives: [{name: 'Mango Lassi', demand: 780}, {name: 'Salted Lassi', demand: 320}, {name: 'Chaas', demand: 490}] },
      { id: 'd4', name: 'Gulab Jamun', color: 'rgba(128, 0, 128, 0.6)', x: 0.5, y: 0.45, width: 0.25, height: 0.25, demand: 620, cookingTime: 20, cost: 3.40, alternatives: [{name: 'Rasmalai', demand: 590}, {name: 'Kulfi', demand: 410}, {name: 'Jalebi', demand: 880}] },
      { id: 'd5', name: 'Chicken Tikka', color: 'rgba(34, 197, 94, 0.5)', x: 0.65, y: 0.3, width: 0.3, height: 0.45, demand: 980, cookingTime: 30, cost: 6.20, alternatives: [{name: 'Hariyali Kebab', demand: 750}, {name: 'Paneer Tikka', demand: 680}, {name: 'Seekh Kebab', demand: 1050}] },
      { id: 'd6', name: 'Veg Kolhapuri', color: 'rgba(0, 0, 0, 0.7)', x: 0.82, y: 0.05, width: 0.15, height: 0.7, demand: 310, cookingTime: 35, cost: 4.80, alternatives: [{name: 'Veg Handi', demand: 420}, {name: 'Bhindi Masala', demand: 290}, {name: 'Mixed Veg', demand: 350}] },
    ]
  },
  {
    id: 'set-2',
    title: 'Northern Classic Combo',
    dishes: [
      { id: 'd7', name: 'Butter Chicken', color: 'rgba(239, 68, 68, 0.6)', x: 0.3, y: 0.2, width: 0.45, height: 0.5, demand: 890, cookingTime: 45, cost: 8.50, alternatives: [{name: 'Murgh Makhani', demand: 840}, {name: 'Chicken Korma', demand: 720}, {name: 'Tandoori Chicken', demand: 1300}] },
      { id: 'd8', name: 'Garlic Naan', color: 'rgba(234, 179, 8, 0.5)', x: 0.1, y: 0.1, width: 0.35, height: 0.4, demand: 1100, cookingTime: 12, cost: 1.50, alternatives: [{name: 'Butter Naan', demand: 1200}, {name: 'Cheese Naan', demand: 1550}, {name: 'Peshawari Naan', demand: 980}] },
      { id: 'd9', name: 'Chaas', color: 'rgba(147, 197, 253, 0.5)', x: 0.6, y: 0.05, width: 0.3, height: 0.4, demand: 540, cookingTime: 5, cost: 1.20, alternatives: [{name: 'Jaljeera', demand: 420}, {name: 'Kokum Sharbat', demand: 380}, {name: 'Nimbu Pani', depth: 710}] },
      { id: 'd10', name: 'Kadhai Paneer', color: 'rgba(74, 222, 128, 0.6)', x: 0.55, y: 0.4, width: 0.35, height: 0.35, demand: 720, cookingTime: 25, cost: 5.50, alternatives: [{name: 'Paneer Lababdar', demand: 680}, {name: 'Palak Paneer', demand: 920}, {name: 'Mutter Paneer', demand: 610}] },
      { id: 'd11', name: 'Rasmalai', color: 'rgba(252, 211, 77, 0.5)', x: 0.45, y: 0.6, width: 0.25, height: 0.2, demand: 410, cookingTime: 15, cost: 4.20, alternatives: [{name: 'Gajar Halwa', demand: 580}, {name: 'Rabri', demand: 320}, {name: 'Ice Cream', demand: 950}] },
    ]
  }
];

const NODE_WIDTH = 180;
// Fixed: Added NODE_HEIGHT constant definition
const NODE_HEIGHT = 160;

const TASTES: TasteKey[] = ['sweet', 'bitter', 'sour', 'umami', 'salty', 'pungency', 'alcohol', 'fat'];

const ActionIcon: React.FC<{ type: ActionIconType; size?: number; className?: string }> = ({ type, size = 16, className }) => {
  switch (type) {
    case 'cooking': return <Flame size={size} className={className} />;
    case 'resting': return <Thermometer size={size} className={className} />;
    case 'waiting': return <Timer size={size} className={className} />;
    case 'baking': return <Square size={size} className={className} />;
    default: return <Zap size={size} className={className} />;
  }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'playground' | 'spaces' | 'timeline' | 'pairing' | 'discovery'>('playground');
  const [ingredients, setIngredients] = useState<Ingredient[]>(MOCK_INGREDIENTS);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [stepGroups, setStepGroups] = useState<StepGroup[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [actionPrompt, setActionPrompt] = useState('');
  const [ingredientPrompt, setIngredientPrompt] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const canvasRef = useRef<HTMLDivElement>(null);
  const selectionStart = useRef<{ x: number, y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('ingredient');
    if (data) {
      const ingredient = JSON.parse(data) as Ingredient;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dropX = e.clientX - rect.left - NODE_WIDTH / 2;
      const dropY = e.clientY - rect.top - 70;
      setNodes(prev => [...prev, { id: `node-${Date.now()}`, type: 'ingredient', label: ingredient.name, quantity: ingredient.quantity, image: ingredient.image, x: dropX, y: dropY }]);
    }
  };

  const executeActionInstant = async () => {
    if (selectedNodeIds.length === 0 || !actionPrompt) return;
    const selectedItems = nodes.filter(n => selectedNodeIds.includes(n.id));
    const maxX = Math.max(...selectedItems.map(n => n.x));
    const avgY = selectedItems.reduce((acc, n) => acc + n.y, 0) / selectedItems.length;
    const newNodeId = `node-${Date.now()}`;
    const x = maxX + 220; const y = avgY;
    
    const newNode: Node = {
      id: newNodeId, type: 'action-result', label: actionPrompt, quantity: '1 batch',
      image: getIngImage(actionPrompt), x, y, subSteps: []
    };
    const newEdges: Edge[] = selectedItems.map((n, i) => ({
      id: `edge-${Date.now()}-${i}`, sourceId: n.id, targetId: newNodeId, action: 'Process', iconType: 'default'
    }));

    setNodes(prev => [...prev, newNode]);
    setEdges(prev => [...prev, ...newEdges]);
    setSelectedNodeIds([]);
    setActionPrompt('');

    processChefPrompt(actionPrompt, { selectedItems }).then(result => {
      setNodes(prev => prev.map(n => n.id === newNodeId ? { 
        ...n, label: result.resultName, subSteps: result.subSteps, quantity: result.quantity, duration: result.duration
      } : n));
    }).catch(console.error);
  };

  const createStepGroup = () => {
    if (selectedNodeIds.length === 0) return;
    const label = prompt("Enter Heading for this Step:") || "Step Sequence";
    const startTime = prompt("Start Time (e.g., 08:30 am):", "08:00 am") || "08:00 am";
    const newGroup: StepGroup = {
      id: `group-${Date.now()}`,
      label,
      nodeIds: [...selectedNodeIds],
      color: ['#fef3c7', '#dcfce7', '#f1f5f9', '#ffedd5', '#e0e7ff'][stepGroups.length % 5],
      isExpanded: true,
      assignedChef: ChefCategory.STATION,
      startTime,
      durationMinutes: 20
    };
    setStepGroups(prev => [...prev, newGroup]);
    setSelectedNodeIds([]);
  };

  const handleVideoImport = async (type: 'file' | 'url', source: File | string) => {
    setIsProcessing(true); setProgress(15);
    try {
      let base64 = ""; let mimeType = "video/mp4";
      if (type === 'file') {
        const reader = new FileReader();
        const readPromise = new Promise<string>((r) => { reader.onload = (e) => r((e.target?.result as string).split(',')[1]); reader.readAsDataURL(source as File); });
        base64 = await readPromise; mimeType = (source as File).type;
      } else { base64 = source as string; }
      const data = await analyzeCookingVideo(base64, mimeType);
      if (data.inventory_initialization) {
        setIngredients(data.inventory_initialization.map((i: any) => ({
          id: i.id, name: i.name, quantity: i.qty, image: getIngImage(i.name)
        })));
      }
      if (data.process_trace) {
        const newNodes: Node[] = data.process_trace.map((step: any, idx: number) => ({
          id: `step-${step.step_id}`, type: 'action-result', label: step.action.replace(/_/g, ' '),
          quantity: 'Derived', image: getIngImage(step.action), x: 100 + idx * 220, y: 150,
          subSteps: [{ instruction: step.visual_cue || step.note }]
        }));
        setNodes(newNodes);
        const newEdges: Edge[] = [];
        for (let i = 0; i < newNodes.length - 1; i++) {
          newEdges.push({ id: `e-${i}`, sourceId: newNodes[i].id, targetId: newNodes[i+1].id, action: 'Next', iconType: 'default' });
        }
        setEdges(newEdges);
      }
      setProgress(100);
      setTimeout(() => setIsProcessing(false), 500);
    } catch (err) { console.error(err); setIsProcessing(false); }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#fcfaf8] text-slate-900 select-none font-sans overflow-hidden">
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <div className="bg-orange-500 p-2 rounded-xl text-white shadow shadow-orange-100 ring-2 ring-orange-50">
            <ChefHat size={18} />
          </div>
          <h1 className="text-sm font-black tracking-tight text-slate-800">CHEF STUDIO</h1>
          <nav className="flex items-center gap-1 ml-6 bg-slate-50 p-1 rounded-lg scale-90">
            {[
              { id: 'playground', label: 'Playground', icon: Layout },
              { id: 'spaces', label: 'Spaces', icon: BoxSelect },
              { id: 'timeline', label: 'Timeline', icon: Clock },
              { id: 'pairing', label: 'Pairing', icon: Wine },
              { id: 'discovery', label: 'Discovery', icon: Grid }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <tab.icon size={12} /> {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-lg border border-slate-200">
            <Youtube size={16} className="text-red-500 ml-2" />
            <input type="text" placeholder="Import Recipe..." className="bg-transparent text-[10px] font-bold focus:outline-none w-32 placeholder:text-slate-400" value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} />
            <label className="cursor-pointer bg-white px-3 py-1 rounded-md text-[9px] font-black uppercase hover:bg-slate-50 border border-slate-200">
              File <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleVideoImport('file', e.target.files[0])} />
            </label>
          </div>
          {activeTab === 'playground' && (
            <button onClick={() => setNodes(prev => prev.map((n, i) => ({ ...n, x: 100 + i * 200, y: 150 })))} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg">
              Organize
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {activeTab === 'playground' && (
          <>
            <SidebarLeft ingredients={ingredients} setIngredients={setIngredients} ingredientPrompt={ingredientPrompt} setIngredientPrompt={setIngredientPrompt} />
            <div 
              ref={canvasRef}
              className="flex-1 relative overflow-hidden canvas-grid" 
              onDragOver={onDragOver} 
              onDrop={onDrop}
              onMouseDown={(e) => {
                if (e.target !== e.currentTarget) return;
                const rect = e.currentTarget.getBoundingClientRect();
                selectionStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                setSelectionBox({ ...selectionStart.current, w: 0, h: 0 });
                if (!e.shiftKey) setSelectedNodeIds([]);
              }}
              onMouseMove={(e) => {
                if (!selectionStart.current || !selectionBox) return;
                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                const curX = e.clientX - rect.left;
                const curY = e.clientY - rect.top;
                const w = Math.abs(curX - selectionStart.current.x);
                const h = Math.abs(curY - selectionStart.current.y);
                const x = Math.min(curX, selectionStart.current.x);
                const y = Math.min(curY, selectionStart.current.y);
                setSelectionBox({ x, y, w, h });
                setSelectedNodeIds(nodes.filter(n => n.x > x && n.x < x + w && n.y > y && n.y < y + h).map(n => n.id));
              }}
              onMouseUp={() => { selectionStart.current = null; setSelectionBox(null); }}
            >
              {stepGroups.map(group => {
                const gNodes = nodes.filter(n => group.nodeIds.includes(n.id));
                if (gNodes.length === 0) return null;
                const minX = Math.min(...gNodes.map(n => n.x)) - 20;
                const minY = Math.min(...gNodes.map(n => n.y)) - 50;
                const maxX = Math.max(...gNodes.map(n => n.x + NODE_WIDTH)) + 20;
                const maxY = Math.max(...gNodes.map(n => n.y + NODE_HEIGHT)) + 20;
                return (
                  <div key={group.id} className="absolute border-2 border-dashed border-indigo-300 rounded-[2.5rem] pointer-events-none transition-all" style={{ left: minX, top: minY, width: maxX - minX, height: maxY - minY, backgroundColor: `${group.color}08` }}>
                    <div className="absolute -top-3.5 left-6 bg-indigo-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-2">
                      <Layers size={11} /> {group.label}
                    </div>
                  </div>
                );
              })}

              <PlaygroundCanvas nodes={nodes} edges={edges} selectedNodeIds={selectedNodeIds} handleToggleSelection={(id) => setSelectedNodeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} updateNodeQuantity={(id, qty) => setNodes(prev => prev.map(n => n.id === id ? { ...n, quantity: qty } : n))} />
              
              {selectionBox && (
                <div className="absolute border border-indigo-400 bg-indigo-400/10 pointer-events-none z-50" style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h }} />
              )}

              {selectedNodeIds.length > 0 && !selectionBox && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-4 border border-slate-200 flex items-center gap-4 w-[500px] z-[60] animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-orange-500 text-white p-2.5 rounded-xl shadow shadow-orange-100"><Scissors size={18}/></div>
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5 px-1 tracking-widest">Recipe Prompt</p>
                    <input type="text" placeholder={`Instruction for ${selectedNodeIds.length} items...`} className="w-full bg-slate-100/50 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-300" value={actionPrompt} onChange={(e) => setActionPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && executeActionInstant()} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={executeActionInstant} className="bg-slate-900 text-white px-5 py-2 rounded-lg font-black text-[9px] uppercase hover:bg-black">Combine</button>
                    <button onClick={createStepGroup} className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-black text-[9px] uppercase hover:bg-indigo-700">Group Step</button>
                  </div>
                </div>
              )}
            </div>
            <SidebarRight stepGroups={stepGroups} setStepGroups={setStepGroups} nodes={nodes} />
          </>
        )}

        {activeTab === 'spaces' && (
          <SpacesView />
        )}

        {activeTab === 'timeline' && (
          <TimelineView stepGroups={stepGroups} setStepGroups={setStepGroups} />
        )}

        {activeTab === 'pairing' && (
          <PairingView />
        )}

        {activeTab === 'discovery' && (
          <DiscoveryView />
        )}
      </div>

      {isProcessing && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-xl z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100" />
                <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={276} strokeDashoffset={276 - (276 * progress) / 100} className="text-orange-500 transition-all duration-300" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-black text-xl">{progress}%</div>
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Synthesizing Kitchen Logic</h2>
          </div>
        </div>
      )}
    </div>
  );
};

const SidebarLeft: React.FC<{ ingredients: Ingredient[], setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>, ingredientPrompt: string, setIngredientPrompt: React.Dispatch<React.SetStateAction<string>> }> = ({ ingredients, setIngredients, ingredientPrompt, setIngredientPrompt }) => {
  const handleAdd = () => { if (!ingredientPrompt) return; setIngredients(prev => [{ id: `i-${Date.now()}`, name: ingredientPrompt, image: getIngImage(ingredientPrompt), quantity: '1 unit' }, ...prev]); setIngredientPrompt(''); };
  return (
    <div className="w-56 border-r border-slate-200 bg-white flex flex-col z-10 shadow-xl shadow-slate-200/50">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between"><h2 className="font-black text-slate-800 uppercase tracking-tighter text-[10px]">Ingredients</h2></div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {ingredients.map(ing => (
          <div key={ing.id} draggable onDragStart={(e) => e.dataTransfer.setData('ingredient', JSON.stringify(ing))} className="group relative flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-xl cursor-grab hover:border-orange-500 hover:shadow-lg transition-all">
            <img src={ing.image} className="w-9 h-9 rounded-lg object-cover" />
            <div className="flex-1 overflow-hidden"><p className="font-black text-[10px] text-slate-900 truncate">{ing.name}</p><p className="text-[8px] text-slate-400 font-bold uppercase">{ing.quantity}</p></div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-slate-100 bg-slate-50/30">
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1">
          <input type="text" placeholder="Add..." className="flex-1 px-2 py-1 text-[10px] bg-transparent focus:outline-none font-black" value={ingredientPrompt} onChange={(e) => setIngredientPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
          <button onClick={handleAdd} className="bg-slate-900 text-white p-1.5 rounded-md hover:bg-orange-600 transition-colors"><Plus size={12} /></button>
        </div>
      </div>
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
          return (
            <g key={edge.id}>
              <path d={`M ${startX} ${startY} C ${(startX+endX)/2} ${startY}, ${(startX+endX)/2} ${endY}, ${endX} ${endY}`} stroke="#cbd5e1" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" />
              <g transform={`translate(${(startX+endX)/2 - 35}, ${(startY+endY)/2 - 12})`}><rect width="70" height="24" rx="12" fill="white" stroke="#e2e8f0" strokeWidth="1" className="shadow-sm"/><foreignObject width="70" height="24"><div className="w-full h-full flex items-center justify-center gap-1 px-2"><ActionIcon type={edge.iconType} size={10} className="text-orange-500" /><span className="text-[8px] font-black text-slate-800 uppercase truncate">{edge.action}</span></div></foreignObject></g>
            </g>
          );
        })}
      </svg>
      {nodes.map(node => (
        <div key={node.id} className={`absolute w-[180px] bg-white rounded-2xl border-2 transition-all cursor-pointer shadow-sm p-4 pointer-events-auto ${selectedNodeIds.includes(node.id) ? 'border-orange-500 ring-4 ring-orange-100 z-20 scale-105 shadow-orange-100' : 'border-white hover:border-orange-100 z-10'}`} style={{ left: node.x, top: node.y }} onClick={(e) => { e.stopPropagation(); handleToggleSelection(node.id); }}>
          {node.image && (<div className="relative h-20 w-full overflow-hidden rounded-xl bg-slate-50 mb-3 shadow-inner"><img src={node.image} className="w-full h-full object-cover group-hover:scale-110" />{node.duration && (<div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-[8px] px-2 py-1 rounded-full font-black"><Clock size={9} className="inline mr-1" />{node.duration}m</div>)}</div>)}
          <p className="font-black text-[10px] text-slate-800 truncate uppercase tracking-tighter mb-2">{node.label}</p>
          <div className="flex items-center gap-1.5 bg-slate-50 rounded p-1.5 border border-slate-100">
            <span className="text-[7px] font-black text-slate-400 uppercase">Qty</span>
            <input type="text" value={node.quantity} onClick={(e) => e.stopPropagation()} onChange={(e) => updateNodeQuantity(node.id, e.target.value)} className="bg-transparent text-[9px] font-black text-slate-900 w-full focus:outline-none" />
          </div>
        </div>
      ))}
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
        {stepGroups.length === 0 && <div className="text-center py-20 text-slate-300 uppercase font-black text-[9px] tracking-widest px-8">Select nodes and 'Group Step' to see methods here.</div>}
        {stepGroups.map((group, idx) => (
          <div key={group.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group/card hover:shadow-lg transition-all">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-500 text-white rounded-lg flex items-center justify-center text-[9px] font-black">{idx + 1}</div>
                <h3 className="text-[10px] font-black uppercase tracking-tight truncate w-32">{group.label}</h3>
              </div>
              <span className="text-[8px] font-black opacity-60">{group.startTime}</span>
            </div>
            <div className="p-4">
              <p className="text-[8px] font-black text-slate-400 uppercase mb-3 tracking-widest flex items-center gap-1">Sequence Trace</p>
              <div className="space-y-3 mb-5 pl-2 border-l-2 border-slate-100 ml-2">
                {nodes.filter(n => group.nodeIds.includes(n.id)).sort((a,b) => a.x - b.x).map((node, nIdx) => (
                  <div key={node.id} className="relative">
                    <p className="text-[10px] font-black text-slate-800 leading-tight"><span className="text-orange-500 mr-1.5">{nIdx + 1}.</span> {node.label}</p>
                    {node.subSteps && node.subSteps.length > 0 && <p className="text-[8px] text-slate-400 font-bold italic mt-0.5 ml-4">{node.subSteps[0].instruction}</p>}
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-50">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-3 tracking-widest">Chef Assignment</p>
                <div className="flex flex-wrap gap-1">
                  {chefs.map(chef => (
                    <button 
                      key={chef} onClick={() => updateChef(group.id, chef)}
                      className={`px-2 py-1.5 rounded-full text-[7px] font-black uppercase transition-all ${group.assignedChef === chef ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      {chef.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TimelineView: React.FC<{ stepGroups: StepGroup[], setStepGroups: React.Dispatch<React.SetStateAction<StepGroup[]>> }> = ({ stepGroups, setStepGroups }) => {
  const chefs = Object.values(ChefCategory);
  const hours = Array.from({ length: 12 }, (_, i) => 8 + i);
  const updateChef = (groupId: string, chef: ChefCategory) => { setStepGroups(prev => prev.map(g => g.id === groupId ? { ...g, assignedChef: chef } : g)); };
  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden p-8">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 flex-1 overflow-auto shadow-sm">
        <div className="min-w-[1500px]">
          <div className="flex h-12 mb-8 items-center px-4 bg-slate-900 text-white rounded-2xl sticky top-0 z-10">
            <div className="w-56 shrink-0 border-r border-slate-700 px-4"><span className="text-[10px] font-black uppercase tracking-widest">Production Lanes</span></div>
            <div className="flex-1 flex">{hours.map(h => (<div key={h} className="flex-1 border-l border-slate-700 px-4 text-[10px] font-black">{h > 12 ? h - 12 : h}:00 {h >= 12 ? 'pm' : 'am'}</div>))}</div>
          </div>
          <div className="space-y-6">
            {chefs.map(chef => (
              <div key={chef} className="flex h-20 items-center group relative rounded-3xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all">
                <div className="w-56 shrink-0 flex items-center gap-4 px-6">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center shadow-sm"><User size={20} /></div>
                  <span className="text-[10px] font-black text-slate-800 uppercase">{chef}</span>
                </div>
                <div className="flex-1 h-12 relative bg-slate-100/30 rounded-2xl mx-4 my-4 shadow-inner">
                  {stepGroups.filter(g => g.assignedChef === chef).map(group => {
                    const [time, period] = group.startTime?.split(' ') || ["08:00", "am"]; const [h, m] = time.split(':').map(Number);
                    const totalMins = ((h % 12) + (period === 'pm' ? 12 : 0) - 8) * 60 + m;
                    const leftOffset = (totalMins / (12 * 60)) * 100; const widthPercent = ((group.durationMinutes || 20) / (12 * 60)) * 100;
                    return (
                      <div key={group.id} className="absolute h-8 top-2 bg-white border border-slate-900 rounded-xl px-4 flex items-center shadow-lg group/task hover:scale-105 transition-all cursor-pointer" style={{ left: `${leftOffset}%`, width: `${widthPercent}%`, minWidth: '160px' }}>
                         <div className="w-1 h-4 bg-orange-500 rounded-full mr-3" />
                         <p className="text-[9px] font-black text-slate-800 truncate uppercase tracking-tighter">{group.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SpacesView: React.FC = () => {
  const dummyNodes: Node[] = [
    { id: 's1', type: 'input', label: 'Input', image: getIngImage('raw chicken'), quantity: '500g', x: 100, y: 100 },
    { id: 's2', type: 'note', label: 'Note', content: 'Ensure the chicken is clean and patted dry before marination to avoid excess moisture.', quantity: '', x: 100, y: 400 },
    { id: 's3', type: 'instructions', label: 'Instructions', content: 'Marinate with yogurt, ginger-garlic paste, and spices for at least 4 hours.', quantity: '', x: 500, y: 450 },
    { id: 's4', type: 'image-result', label: 'Image Result', image: getIngImage('cooked butter chicken'), quantity: '', x: 900, y: 100 },
    { id: 's5', type: 'video-result', label: 'Video Result', image: getIngImage('simmering chicken'), quantity: '', x: 950, y: 500 },
  ];

  const dummyEdges: Edge[] = [
    { id: 'e1', sourceId: 's1', targetId: 's3', action: 'Process', iconType: 'default', color: '#818cf8' },
    { id: 'e2', sourceId: 's2', targetId: 's3', action: 'Note Link', iconType: 'default', color: '#f87171' },
    { id: 'e3', sourceId: 's3', targetId: 's4', action: 'Cook', iconType: 'cooking', color: '#fbbf24' },
    { id: 'e4', sourceId: 's3', targetId: 's5', action: 'Video', iconType: 'waiting', color: '#10b981' },
  ];

  return (
    <div className="flex-1 bg-[#0a0a0b] overflow-hidden relative canvas-grid opacity-90">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-0">
        <h2 className="text-9xl font-black text-white/[0.03] uppercase tracking-tighter">Spaces</h2>
        <div className="mt-8">
           <h3 className="text-4xl font-black text-white uppercase tracking-tight">Your Infinite Canvas</h3>
           <p className="text-white/40 text-sm font-black uppercase tracking-[0.4em] mt-4">Real-time Collaborative Creation</p>
        </div>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
        <svg className="w-full h-full">
          {dummyEdges.map(edge => {
            const s = dummyNodes.find(n => n.id === edge.sourceId);
            const t = dummyNodes.find(n => n.id === edge.targetId);
            if (!s || !t) return null;
            const x1 = s.x + 140; const y1 = s.y + 100;
            const x2 = t.x; const y2 = t.y + 100;
            return (
              <path key={edge.id} d={`M ${x1} ${y1} C ${x1 + 150} ${y1}, ${x2 - 150} ${y2}, ${x2} ${y2}`} fill="none" stroke={edge.color || '#fff'} strokeWidth="2.5" strokeOpacity="0.3" strokeDasharray="5,5" />
            );
          })}
        </svg>
      </div>

      <div className="relative z-20 w-full h-full overflow-auto p-32">
        {dummyNodes.map(node => (
          <div key={node.id} className="absolute w-[320px] bg-slate-900/40 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl group hover:border-white/20 transition-all cursor-move" style={{ left: node.x, top: node.y }}>
            <div className="flex items-center gap-3 mb-6">
               <div className={`p-2 rounded-xl bg-opacity-10 ${
                 node.type === 'input' ? 'bg-indigo-500 text-indigo-400' : 
                 node.type === 'note' ? 'bg-red-500 text-red-400' : 
                 node.type === 'instructions' ? 'bg-orange-500 text-orange-400' :
                 node.type === 'image-result' ? 'bg-yellow-500 text-yellow-400' :
                 'bg-green-500 text-green-400'
               }`}>
                  {node.type === 'input' && <Upload size={14} />}
                  {node.type === 'note' && <FileText size={14} />}
                  {node.type === 'instructions' && <Zap size={14} />}
                  {node.type === 'image-result' && <ImageIcon size={14} />}
                  {node.type === 'video-result' && <Video size={14} />}
               </div>
               <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{node.label}</span>
            </div>
            
            {node.image && (
              <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 bg-black/40 ring-1 ring-white/5">
                <img src={node.image} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
              </div>
            )}
            
            {node.content && (
              <p className="text-xs text-white/60 font-medium leading-relaxed mb-4">{node.content}</p>
            )}
            
            <div className="flex items-center justify-between border-t border-white/5 pt-4">
               <div className="flex gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-blue-500 border border-black shadow-sm ring-2 ring-blue-500/20" title="Jeremy" />
                  <div className="w-6 h-6 rounded-full bg-red-500 border border-black shadow-sm ring-2 ring-red-500/20 -ml-2" title="Megan" />
               </div>
               {node.quantity && <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{node.quantity}</span>}
            </div>

            {node.type === 'video-result' && (
               <div className="absolute -bottom-5 -right-5 bg-white text-black p-3.5 rounded-2xl shadow-2xl hover:bg-orange-500 hover:text-white transition-colors">
                  <Play size={20} fill="currentColor" />
               </div>
            )}
          </div>
        ))}
        
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white/5 backdrop-blur-2xl rounded-[2rem] p-3 flex gap-4 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
           <button className="px-8 py-3 bg-white text-black text-[11px] font-black uppercase rounded-[1.5rem] hover:bg-orange-500 hover:text-white transition-all scale-100 hover:scale-105 active:scale-95">Start Creating</button>
           <button className="p-3 text-white/40 hover:text-white transition-colors"><Search size={18}/></button>
           <button className="p-3 text-white/40 hover:text-white transition-colors"><Layers size={18}/></button>
        </div>
      </div>
    </div>
  );
};

const DiscoveryView: React.FC = () => {
  const [sets, setSets] = useState<DiscoverySet[]>(INITIAL_DISCOVERY_SETS);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  
  const currentSet = sets[currentSetIndex];

  const handleSwapItem = (dishId: string, newAlt: {name: string, demand: number}) => {
    setSets(prev => prev.map((s, idx) => {
      if (idx !== currentSetIndex) return s;
      return {
        ...s,
        dishes: s.dishes.map(d => d.id === dishId ? { 
          ...d, 
          name: newAlt.name, 
          demand: newAlt.demand,
          // Generate pseudo-random updates for table details on swap
          cookingTime: Math.max(5, d.cookingTime + (Math.floor(Math.random() * 10) - 5)),
          cost: parseFloat((d.cost + (Math.random() * 2 - 1)).toFixed(2))
        } : d)
      };
    }));
    setSelectedDishId(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#fcfaf8] overflow-y-auto p-12 scroll-smooth">
      <div className="flex items-center justify-between mb-10 px-6 shrink-0">
        <div>
           <h2 className="text-5xl font-black text-slate-800 uppercase tracking-tighter">{currentSet.title}</h2>
           <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Advanced Discovery Pairing Analysis</p>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setCurrentSetIndex((p) => (p - 1 + sets.length) % sets.length)} className="w-16 h-16 bg-white border border-slate-200 rounded-3xl flex items-center justify-center hover:bg-slate-50 transition-all hover:shadow-lg active:scale-95 text-slate-400 hover:text-slate-900"><ChevronLeft size={24}/></button>
           <button onClick={() => setCurrentSetIndex((p) => (p + 1) % sets.length)} className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center hover:bg-black transition-all hover:shadow-xl active:scale-95 shadow-lg shadow-slate-200"><ChevronRight size={24}/></button>
        </div>
      </div>

      <div className="flex gap-12 min-h-[700px]">
         {/* Main Visualization Area */}
         <div className="flex-1 bg-white rounded-[4rem] border border-slate-200 p-16 relative overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.03)] group">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
               <svg width="100%" height="100%"><defs><pattern id="discovery-grid" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M 120 0 L 0 0 0 120" fill="none" stroke="black" strokeWidth="2"/></pattern></defs><rect width="100%" height="100%" fill="url(#discovery-grid)" /></svg>
            </div>
            
            <div className="w-full h-full relative bg-slate-50/50 rounded-3xl border border-slate-100 overflow-hidden">
               {currentSet.dishes.map((dish) => (
                 <div 
                  key={dish.id} 
                  onClick={() => setSelectedDishId(dish.id === selectedDishId ? null : dish.id)}
                  className={`absolute border border-black/5 transition-all duration-700 flex flex-col items-center justify-center text-center p-4 cursor-pointer group/node ${selectedDishId === dish.id ? 'ring-4 ring-orange-500 ring-offset-2 z-20 shadow-2xl' : 'z-1'}`}
                  style={{
                    left: `${dish.x * 100}%`,
                    top: `${dish.y * 100}%`,
                    width: `${dish.width * 100}%`,
                    height: `${dish.height * 100}%`,
                    backgroundColor: dish.color,
                  }}
                 >
                    <div className="flex flex-col items-center relative">
                       <span className="text-[11px] font-black text-white uppercase tracking-wider bg-black/40 px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg mb-2">{dish.name}</span>
                       <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-white/10">
                          <TrendingUp size={10} className="text-white/80" />
                          <span className="text-[12px] font-black text-white drop-shadow-md">{dish.demand}</span>
                       </div>
                    </div>

                    {/* Enhanced Swap Popup - Vertical options with demand */}
                    {selectedDishId === dish.id && dish.alternatives && (
                       <div 
                        className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] p-2 border border-slate-100 min-w-[200px] z-[100] animate-in slide-in-from-bottom-2"
                        onClick={(e) => e.stopPropagation()}
                       >
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4 pt-3 pb-2 text-center">Swap Item</p>
                          <div className="flex flex-col">
                            {dish.alternatives.map(alt => (
                              <button 
                                key={alt.name}
                                onClick={() => handleSwapItem(dish.id, alt)}
                                className="group/btn px-4 py-3 hover:bg-slate-50 rounded-2xl flex items-center justify-between gap-6 transition-all"
                              >
                                 <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500 group-hover/btn:bg-orange-500 group-hover/btn:text-white transition-colors">
                                       <ArrowRightLeft size={10} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-slate-700 whitespace-nowrap">{alt.name}</span>
                                 </div>
                                 <div className="flex items-center gap-1">
                                    <TrendingUp size={10} className="text-orange-300" />
                                    <span className="text-[10px] font-black text-slate-400">{alt.demand}</span>
                                 </div>
                              </button>
                            ))}
                          </div>
                       </div>
                    )}
                 </div>
               ))}
            </div>
         </div>

         {/* Sidebar with Info and Insights */}
         <div className="w-96 flex flex-col gap-8">
            {/* Dynamic Details Table - Moved from bottom for better integration */}
            <div className="bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
               <div className="flex items-center gap-3 mb-8 px-2">
                  <Grid size={18} className="text-orange-500" />
                  <p className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Live Menu Audit</p>
               </div>
               
               <div className="flex-1 overflow-x-hidden overflow-y-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-slate-100">
                          <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                          <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Time</th>
                          <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Cost</th>
                          <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Demand</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {currentSet.dishes.map((dish) => (
                          <tr key={dish.id} className={`group ${selectedDishId === dish.id ? 'bg-orange-50/50' : ''} transition-colors`}>
                             <td className="py-4">
                                <div className="flex items-center gap-2">
                                   <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dish.color }} />
                                   <span className="text-[10px] font-black text-slate-700 uppercase truncate max-w-[80px]">{dish.name}</span>
                                </div>
                             </td>
                             <td className="py-4 text-center">
                                <span className="text-[10px] font-bold text-slate-500">{dish.cookingTime}m</span>
                             </td>
                             <td className="py-4 text-center">
                                <span className="text-[10px] font-bold text-slate-500">${dish.cost.toFixed(2)}</span>
                             </td>
                             <td className="py-4 text-right">
                                <span className="text-[10px] font-black text-slate-800">{dish.demand}</span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white flex flex-col shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-10"><UtensilsCrossed size={48} /></div>
               <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-400 mb-8">Performance Summary</h4>
               <div className="space-y-8">
                  <div className="flex gap-4">
                     <div className="w-1 h-12 bg-orange-500 rounded-full shrink-0" />
                     <div>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Avg Demand Index</p>
                        <p className="text-2xl font-black">{(currentSet.dishes.reduce((acc, d) => acc + d.demand, 0) / currentSet.dishes.length).toFixed(0)}</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="w-1 h-12 bg-indigo-500 rounded-full shrink-0" />
                     <div>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Total Prep Time</p>
                        <p className="text-2xl font-black">{currentSet.dishes.reduce((acc, d) => acc + d.cookingTime, 0)}m</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Discovery Schema Card - Moved Below Lattice/Visualization Section */}
      <div className="mt-12 px-6">
         <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-8 max-w-2xl">
               <div className="w-20 h-20 rounded-[2rem] bg-orange-500 flex items-center justify-center text-white shrink-0 shadow-xl shadow-orange-100">
                  <Info size={36} />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase mb-4 leading-none">Market Demand Geometry</h3>
                  <p className="text-sm text-slate-400 font-bold leading-relaxed">
                    The visualization above maps regional demand volumes. Overlapping rectangles indicate menu items that share a common customer persona. Click items to optimize your menu yield using real-time market alternatives.
                  </p>
               </div>
            </div>
            <div className="flex gap-6 pr-4">
               <div className="text-center">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Efficiency Rating</p>
                  <div className="text-3xl font-black text-slate-800 tracking-tighter">A+</div>
               </div>
               <div className="w-px h-12 bg-slate-100 self-center" />
               <div className="text-center">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Menu Balance</p>
                  <div className="text-3xl font-black text-orange-500 tracking-tighter">94%</div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const PairingView: React.FC = () => {
  const [mainTaste, setMainTaste] = useState<TasteKey>('pungency');
  const [currentPairings, setCurrentPairings] = useState<PairingItem[]>(INITIAL_PAIRINGS);
  const [activePopupId, setActivePopupId] = useState<string | null>(null);

  const getPosition = (index: number, radius: number) => {
    const angle = (index * (360 / TASTES.length)) * (Math.PI / 180);
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  };

  const getPairingPosition = (itemIndex: number) => {
    const angle = (itemIndex * (360 / currentPairings.length)) * (Math.PI / 180);
    return { x: Math.cos(angle) * 200, y: Math.sin(angle) * 200 };
  };

  const mainPos = getPosition(TASTES.indexOf(mainTaste), 70);

  const handleSwap = (parentId: string, newAlternative: PairingItem) => {
    setCurrentPairings(prev => prev.map(p => {
      if (p.id === parentId) {
        const alts = p.alternatives || [];
        const newAlts = [...alts.filter(a => a.id !== newAlternative.id), { ...p, alternatives: undefined }];
        return { ...newAlternative, alternatives: newAlts };
      }
      return p;
    }));
    setActivePopupId(null);
  };

  return (
    <div className="flex-1 flex bg-[#fdfaf7] overflow-hidden p-0 relative items-center justify-center">
      <div className="absolute top-8 left-8 z-50">
         <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-2">Flavor Pairing Matrix</h2>
            <p className="text-[10px] font-bold text-slate-400 max-w-xs leading-relaxed"> Tap cards to swap for alternatives. Distribution is based on complementary flavor profiles. </p>
         </div>
      </div>

      <div className="relative w-[800px] h-[800px] flex items-center justify-center">
        {TASTES.map((taste, i) => {
          const pos = getPosition(i, 340);
          const isMain = taste === mainTaste;
          return (
            <div 
              key={taste}
              onClick={() => setMainTaste(taste)}
              className={`absolute w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-500 border-2 z-10 cursor-pointer ${isMain ? 'bg-slate-900 text-white border-slate-900 scale-110 shadow-xl' : 'bg-white text-slate-400 border-slate-100 shadow-sm'}`}
              style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
            >
              {taste === 'sweet' && <Sparkles size={14} />}
              {taste === 'pungency' && <Flame size={14} />}
              {taste === 'sour' && <div className="w-3 h-3 rounded-sm border-2 border-current rotate-45" />}
              {taste === 'fat' && <div className="w-5 h-2 bg-current rounded-full opacity-50" />}
              {taste === 'umami' && <UtensilsCrossed size={14} />}
              {taste === 'salty' && <div className="grid grid-cols-2 gap-0.5"><div className="w-1 h-1 bg-current rounded-full" /><div className="w-1 h-1 bg-current rounded-full" /><div className="w-1 h-1 bg-current rounded-full" /><div className="w-1 h-1 bg-current rounded-full" /></div>}
              {taste === 'bitter' && <div className="w-4 h-4 rounded-full border-2 border-current" />}
              {taste === 'alcohol' && <Wine size={14} />}
              <span className="text-[9px] font-black uppercase tracking-widest mt-1">{taste}</span>
            </div>
          );
        })}

        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
           <g transform="translate(400, 400)">
              {TASTES.map((_, i) => {
                 const p1 = getPosition(i, 340);
                 const p2 = getPosition((i + 1) % TASTES.length, 340);
                 return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#000" strokeWidth="1" />;
              })}
           </g>
        </svg>

        <div className="absolute z-30 transition-all duration-700" style={{ transform: `translate(${mainPos.x}px, ${mainPos.y}px)` }}>
          <div className="w-44 h-44 bg-white rounded-[3rem] shadow-2xl border-4 border-slate-900 flex flex-col items-center justify-center p-4 text-center ring-8 ring-slate-50">
             <img src={getIngImage('kola urundai')} className="w-20 h-20 rounded-3xl object-cover mb-2 ring-4 ring-slate-50 shadow-inner" />
             <p className="text-[11px] font-black uppercase text-slate-800 leading-tight">Mutton Kola Urundai</p>
             <div className="mt-2 text-[7px] font-black bg-orange-500 text-white px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">Master</div>
          </div>
        </div>

        {currentPairings.map((item, idx) => {
          const pos = getPairingPosition(idx);
          const isPopupOpen = activePopupId === item.id;
          return (
            <div key={item.id} className="absolute transition-all duration-700 z-40" style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
              <div 
                className="w-32 h-32 bg-white rounded-full p-2 border border-slate-100 shadow-xl cursor-pointer flex flex-col items-center justify-center relative hover:scale-105 transition-transform"
                onClick={(e) => { e.stopPropagation(); setActivePopupId(isPopupOpen ? null : item.id); }}
              >
                 <div className="w-16 h-16 rounded-full overflow-hidden mb-2 border-2 border-slate-50">
                    <img src={item.image} className="w-full h-full object-cover" />
                 </div>
                 <p className="text-[9px] font-black uppercase text-slate-800 text-center px-3 leading-tight truncate w-full">{item.name}</p>
                 <div className="absolute top-0 right-0 bg-green-500 text-white p-1 rounded-full shadow-lg"><CheckCircle2 size={12} /></div>
                 {isPopupOpen && item.alternatives && (
                   <div className="absolute top-1/2 left-full ml-4 -translate-y-1/2 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 w-48 z-[100] animate-in slide-in-from-left-2 fade-in">
                     <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Alternatives</span>
                        <X size={12} className="text-slate-300 cursor-pointer hover:text-slate-900" onClick={() => setActivePopupId(null)} />
                     </div>
                     <div className="space-y-3">
                        {item.alternatives.map(alt => (
                          <div key={alt.id} onClick={() => handleSwap(item.id, alt)} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                             <img src={alt.image} className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100" />
                             <div className="flex-1 overflow-hidden">
                                <p className="text-[9px] font-black text-slate-800 truncate">{alt.name}</p>
                                <p className="text-[7px] text-slate-400 font-bold uppercase">{alt.flavorProfile.join(', ')}</p>
                             </div>
                             <ChevronRight size={10} className="text-slate-300 group-hover:text-orange-500" />
                          </div>
                        ))}
                     </div>
                   </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default App;
