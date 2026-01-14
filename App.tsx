
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
  DollarSign,
  Send,
  PlusCircle,
  MousePointer2,
  Maximize,
  Hand,
  Edit2
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
      { id: 'd9', name: 'Chaas', color: 'rgba(147, 197, 253, 0.5)', x: 0.6, y: 0.05, width: 0.3, height: 0.4, demand: 540, cookingTime: 5, cost: 1.20, alternatives: [{name: 'Jaljeera', demand: 420}, {name: 'Kokum Sharbat', demand: 380}, {name: 'Nimbu Pani', demand: 710}] },
      { id: 'd10', name: 'Kadhai Paneer', color: 'rgba(74, 222, 128, 0.6)', x: 0.55, y: 0.4, width: 0.35, height: 0.35, demand: 720, cookingTime: 25, cost: 5.50, alternatives: [{name: 'Paneer Lababdar', demand: 680}, {name: 'Palak Paneer', demand: 920}, {name: 'Mutter Paneer', demand: 610}] },
      { id: 'd11', name: 'Rasmalai', color: 'rgba(252, 211, 77, 0.5)', x: 0.45, y: 0.6, width: 0.25, height: 0.2, demand: 410, cookingTime: 15, cost: 4.20, alternatives: [{name: 'Gajar Halwa', demand: 580}, {name: 'Rabri', demand: 320}, {name: 'Ice Cream', demand: 950}] },
    ]
  }
];

const SAMPLE_TASKS: Node[] = [
  { id: 'st1', label: 'MARINATE CHICKEN', type: 'instructions', quantity: '500G', x: 0, y: 0, content: 'Toss with yogurt and spices.', duration: 45 },
  { id: 'st2', label: 'GRIND THE MASALA', type: 'instructions', quantity: '1 BOWL', x: 0, y: 0, content: 'Dry roast spices then blitz.', duration: 15 },
  { id: 'st3', label: 'PREPARE CURRY', type: 'instructions', quantity: '2L', x: 0, y: 0, content: 'Slow cook base gravy.', duration: 60 },
  { id: 'st4', label: 'GRILL CHICKEN', type: 'instructions', quantity: '500G', x: 0, y: 0, content: 'Char on open flame.', duration: 25 },
  { id: 'st5', label: 'CHOP ONIONS AND TOMATO', type: 'instructions', quantity: '4 UNITS', x: 0, y: 0, content: 'Fine dice for gravy.', duration: 20 },
  { id: 'st6', label: 'MIX AND REST CURRY', type: 'instructions', quantity: '1 POT', x: 0, y: 0, content: 'Combine and allow flavor mesh.', duration: 30 },
];

const NODE_WIDTH = 180;
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
  const [activeTab, setActiveTab] = useState<'playground' | 'spaces' | 'time' | 'timeline' | 'pairing' | 'discovery'>('playground');
  const [ingredients, setIngredients] = useState<Ingredient[]>(MOCK_INGREDIENTS);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [stepGroups, setStepGroups] = useState<StepGroup[]>([
    { id: 'tg1', label: 'MARINATE CHICKEN', nodeIds: [], color: '#8b5cf6', assignedChef: ChefCategory.SOUS, startTime: "08:00 am", durationMinutes: 60 },
    { id: 'tg2', label: 'CHOP ONIONS AND TOMATO', nodeIds: [], color: '#f472b6', assignedChef: ChefCategory.JUNIOR, startTime: "08:30 am", durationMinutes: 45 },
    { id: 'tg3', label: 'GRIND THE MASALA', nodeIds: [], color: '#22d3ee', assignedChef: ChefCategory.STATION, startTime: "09:30 am", durationMinutes: 40 },
    { id: 'tg4', label: 'MIX AND REST CURRY', nodeIds: [], color: '#a78bfa', assignedChef: ChefCategory.TRAINEE, startTime: "10:30 am", durationMinutes: 30 },
  ]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [actionPrompt, setActionPrompt] = useState('');
  const [ingredientPrompt, setIngredientPrompt] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const canvasRef = useRef<HTMLDivElement>(null);
  const selectionStart = useRef<{ x: number, y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  const pgCanvas = useCanvasTransform();

  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('ingredient');
    if (data && canvasRef.current) {
      const ingredient = JSON.parse(data) as Ingredient;
      const rect = canvasRef.current.getBoundingClientRect();
      const dropX = (e.clientX - rect.left - pgCanvas.offset.x) / pgCanvas.scale - NODE_WIDTH / 2;
      const dropY = (e.clientY - rect.top - pgCanvas.offset.y) / pgCanvas.scale - 70;
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
    const newNode: Node = { id: newNodeId, type: 'action-result', label: actionPrompt, quantity: '1 batch', image: getIngImage(actionPrompt), x, y, subSteps: [] };
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
    const startTime = prompt("Start Time (e.g., 08:30 am):", "08:00 am") || "08:00 am";
    const newGroup: StepGroup = { id: `group-${Date.now()}`, label, nodeIds: [...selectedNodeIds], color: ['#fef3c7', '#dcfce7', '#f1f5f9', '#ffedd5', '#e0e7ff'][stepGroups.length % 5], isExpanded: true, assignedChef: ChefCategory.STATION, startTime, durationMinutes: 20 };
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
        setIngredients(data.inventory_initialization.map((i: any) => ({ id: i.id, name: i.name, quantity: i.qty, image: getIngImage(i.name) })));
      }
      if (data.process_trace) {
        const newNodes: Node[] = data.process_trace.map((step: any, idx: number) => ({ id: `step-${step.step_id}`, type: 'action-result', label: step.action.replace(/_/g, ' '), quantity: 'Derived', image: getIngImage(step.action), x: 100 + idx * 220, y: 150, subSteps: [{ instruction: step.visual_cue || step.note }] }));
        setNodes(newNodes);
        const newEdges: Edge[] = [];
        for (let i = 0; i < newNodes.length - 1; i++) { newEdges.push({ id: `e-${i}`, sourceId: newNodes[i].id, targetId: newNodes[i+1].id, action: 'Next', iconType: 'default' }); }
        setEdges(newEdges);
      }
      setProgress(100); setTimeout(() => setIsProcessing(false), 500);
    } catch (err) { console.error(err); setIsProcessing(false); }
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
              { id: 'time', label: 'Time', icon: Clock },
              { id: 'timeline', label: 'Timeline', icon: Grid }, 
              { id: 'pairing', label: 'Pairing', icon: Wine }, 
              { id: 'discovery', label: 'Discovery', icon: UtensilsCrossed }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><tab.icon size={12} /> {tab.label}</button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-lg border border-slate-200">
            <Youtube size={16} className="text-red-500 ml-2" />
            <input type="text" placeholder="Import Recipe..." className="bg-transparent text-[10px] font-bold focus:outline-none w-32 placeholder:text-slate-400" value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} />
            <label className="cursor-pointer bg-white px-3 py-1 rounded-md text-[9px] font-black uppercase hover:bg-slate-50 border border-slate-200">File <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleVideoImport('file', e.target.files[0])} /></label>
          </div>
          {activeTab === 'playground' && <button onClick={() => { setNodes(prev => prev.map((n, i) => ({ ...n, x: 100 + i * 200, y: 150 }))); pgCanvas.setOffset({ x: 0, y: 0 }); pgCanvas.setScale(1); }} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg">Reset View</button>}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {activeTab === 'playground' && (
          <>
            <SidebarLeft ingredients={ingredients} setIngredients={setIngredients} ingredientPrompt={ingredientPrompt} setIngredientPrompt={setIngredientPrompt} />
            <div ref={canvasRef} className="flex-1 relative overflow-hidden canvas-grid cursor-grab active:cursor-grabbing" onDragOver={onDragOver} onDrop={onDrop} onWheel={pgCanvas.handleWheel} onMouseDown={(e) => { if (e.button !== 0 || e.target !== e.currentTarget) return; const rect = e.currentTarget.getBoundingClientRect(); selectionStart.current = { x: (e.clientX - rect.left - pgCanvas.offset.x) / pgCanvas.scale, y: (e.clientY - rect.top - pgCanvas.offset.y) / pgCanvas.scale }; setSelectionBox({ ...selectionStart.current, w: 0, h: 0 }); if (!e.shiftKey) setSelectedNodeIds([]); }} onMouseMove={(e) => { if (!selectionStart.current || !selectionBox) return; const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return; const curX = (e.clientX - rect.left - pgCanvas.offset.x) / pgCanvas.scale; const curY = (e.clientY - rect.top - pgCanvas.offset.y) / pgCanvas.scale; const w = Math.abs(curX - selectionStart.current.x); const h = Math.abs(curY - selectionStart.current.y); const x = Math.min(curX, selectionStart.current.x); const y = Math.min(curY, selectionStart.current.y); setSelectionBox({ x, y, w, h }); setSelectedNodeIds(nodes.filter(n => n.x > x && n.x < x + w && n.y > y && n.y < y + h).map(n => n.id)); }} onMouseUp={() => { selectionStart.current = null; setSelectionBox(null); }}>
              <motion.div className="w-full h-full relative origin-top-left pointer-events-none" animate={{ x: pgCanvas.offset.x, y: pgCanvas.offset.y, scale: pgCanvas.scale }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                {stepGroups.map(group => { const gNodes = nodes.filter(n => group.nodeIds.includes(n.id)); if (gNodes.length === 0) return null; const minX = Math.min(...gNodes.map(n => n.x)) - 20; const minY = Math.min(...gNodes.map(n => n.y)) - 50; const maxX = Math.max(...gNodes.map(n => n.x + NODE_WIDTH)) + 20; const maxY = Math.max(...gNodes.map(n => n.y + NODE_HEIGHT)) + 20; return (<div key={group.id} className="absolute border-2 border-dashed border-indigo-300 rounded-[2.5rem] pointer-events-none transition-all" style={{ left: minX, top: minY, width: maxX - minX, height: maxY - minY, backgroundColor: `${group.color}08` }}><div className="absolute -top-3.5 left-6 bg-indigo-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-2"><Layers size={11} /> {group.label}</div></div>); })}
                <PlaygroundCanvas nodes={nodes} edges={edges} selectedNodeIds={selectedNodeIds} handleToggleSelection={(id) => setSelectedNodeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} updateNodeQuantity={(id, qty) => setNodes(prev => prev.map(n => n.id === id ? { ...n, quantity: qty } : n))} />
                {selectionBox && <div className="absolute border border-indigo-400 bg-indigo-400/10 pointer-events-none z-50" style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h }} />}
              </motion.div>
              <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-full text-[10px] font-black text-slate-400 pointer-events-none uppercase tracking-widest flex items-center gap-3"><span>Scale: {(pgCanvas.scale * 100).toFixed(0)}%</span><div className="w-px h-3 bg-slate-200" /><span>Cmd + Scroll to Zoom</span></div>
              {selectedNodeIds.length > 0 && !selectionBox && <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-4 border border-slate-200 flex items-center gap-4 w-[500px] z-[60] animate-in fade-in slide-in-from-bottom-2"><div className="bg-orange-500 text-white p-2.5 rounded-xl shadow shadow-orange-100"><Scissors size={18}/></div><div className="flex-1"><p className="text-[9px] font-black text-slate-400 uppercase mb-0.5 px-1 tracking-widest">Recipe Prompt</p><input type="text" placeholder={`Instruction for ${selectedNodeIds.length} items...`} className="w-full bg-slate-100/50 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-300" value={actionPrompt} onChange={(e) => setActionPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && executeActionInstant()} /></div><div className="flex flex-col gap-1"><button onClick={executeActionInstant} className="bg-slate-900 text-white px-5 py-2 rounded-lg font-black text-[9px] uppercase hover:bg-black">Combine</button><button onClick={createStepGroup} className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-black text-[9px] uppercase hover:bg-indigo-700">Group Step</button></div></div>}
            </div>
            <SidebarRight stepGroups={stepGroups} setStepGroups={setStepGroups} nodes={nodes} />
          </>
        )}
        {activeTab === 'spaces' && <SpacesView nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} />}
        {activeTab === 'time' && <TimeView stepGroups={stepGroups} setStepGroups={setStepGroups} nodes={nodes} />}
        {activeTab === 'timeline' && <TimelineView stepGroups={stepGroups} setStepGroups={setStepGroups} />}
        {activeTab === 'pairing' && <PairingView />}
        {activeTab === 'discovery' && <DiscoveryView />}
      </div>

      {isProcessing && <div className="absolute inset-0 bg-white/95 backdrop-blur-xl z-[100] flex items-center justify-center"><div className="flex flex-col items-center gap-4 text-center"><div className="relative w-24 h-24"><svg className="w-full h-full transform -rotate-90"><circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100" /><circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={276} strokeDashoffset={276 - (276 * progress) / 100} className="text-orange-500 transition-all duration-300" /></svg><div className="absolute inset-0 flex items-center justify-center font-black text-xl">{progress}%</div></div><h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Synthesizing Kitchen Logic</h2></div></div>}
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
        {stepGroups.length === 0 && <div className="text-center py-20 text-slate-300 uppercase font-black text-[9px] tracking-widest px-8">Select nodes and 'Group Step' to see methods here.</div>}
        {stepGroups.map((group, idx) => (<div key={group.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group/card hover:shadow-lg transition-all"><div className="p-4 bg-slate-900 text-white flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-6 h-6 bg-orange-500 text-white rounded-lg flex items-center justify-center text-[9px] font-black">{idx + 1}</div><h3 className="text-[10px] font-black uppercase tracking-tight truncate w-32">{group.label}</h3></div><span className="text-[8px] font-black opacity-60">{group.startTime}</span></div><div className="p-4"><p className="text-[8px] font-black text-slate-400 uppercase mb-3 tracking-widest flex items-center gap-1">Sequence Trace</p><div className="space-y-3 mb-5 pl-2 border-l-2 border-slate-100 ml-2">{nodes.filter(n => group.nodeIds.includes(n.id)).sort((a,b) => a.x - b.x).map((node, nIdx) => (<div key={node.id} className="relative"><p className="text-[10px] font-black text-slate-800 leading-tight"><span className="text-orange-500 mr-1.5">{nIdx + 1}.</span> {node.label}</p>{node.subSteps && node.subSteps.length > 0 && <p className="text-[8px] text-slate-400 font-bold italic mt-0.5 ml-4">{node.subSteps[0].instruction}</p>}</div>))}</div><div className="pt-4 border-t border-slate-50"><p className="text-[8px] font-black text-slate-400 uppercase mb-3 tracking-widest">Chef Assignment</p><div className="flex flex-wrap gap-1">{chefs.map(chef => (<button key={chef} onClick={() => updateChef(group.id, chef)} className={`px-2 py-1.5 rounded-full text-[7px] font-black uppercase transition-all ${group.assignedChef === chef ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{chef.split(' ')[0]}</button>))}</div></div></div></div>))}
      </div>
    </div>
  );
};

const TimelineView: React.FC<{ stepGroups: StepGroup[], setStepGroups: React.Dispatch<React.SetStateAction<StepGroup[]>> }> = ({ stepGroups, setStepGroups }) => {
  const chefs = Object.values(ChefCategory);
  const hours = Array.from({ length: 12 }, (_, i) => 8 + i);
  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden p-8">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 flex-1 overflow-auto shadow-sm">
        <div className="min-w-[1500px]">
          <div className="flex h-12 mb-8 items-center px-4 bg-slate-900 text-white rounded-2xl sticky top-0 z-10"><div className="w-56 shrink-0 border-r border-slate-700 px-4"><span className="text-[10px] font-black uppercase tracking-widest">Production Lanes</span></div><div className="flex-1 flex">{hours.map(h => (<div key={h} className="flex-1 border-l border-slate-700 px-4 text-[10px] font-black">{h > 12 ? h - 12 : h}:00 {h >= 12 ? 'pm' : 'am'}</div>))}</div></div>
          <div className="space-y-6">{chefs.map(chef => (<div key={chef} className="flex h-20 items-center group relative rounded-3xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all"><div className="w-56 shrink-0 flex items-center gap-4 px-6"><div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center shadow-sm"><User size={20} /></div><span className="text-[10px] font-black text-slate-800 uppercase">{chef}</span></div><div className="flex-1 h-12 relative bg-slate-100/30 rounded-2xl mx-4 my-4 shadow-inner">{stepGroups.filter(g => g.assignedChef === chef).map(group => { const [time, period] = group.startTime?.split(' ') || ["08:00", "am"]; const [h, m] = time.split(':').map(Number); const totalMins = ((h % 12) + (period === 'pm' ? 12 : 0) - 8) * 60 + m; const leftOffset = (totalMins / (12 * 60)) * 100; const widthPercent = ((group.durationMinutes || 20) / (12 * 60)) * 100; return (<div key={group.id} className="absolute h-8 top-2 bg-white border border-slate-900 rounded-xl px-4 flex items-center shadow-lg group/task hover:scale-105 transition-all cursor-pointer" style={{ left: `${leftOffset}%`, width: `${widthPercent}%`, minWidth: '160px' }}><div className="w-1 h-4 bg-orange-500 rounded-full mr-3" /><p className="text-[9px] font-black text-slate-800 truncate uppercase tracking-tighter">{group.label}</p></div>); })}</div></div>))}</div>
        </div>
      </div>
    </div>
  );
};

const SpacesView: React.FC<{ nodes: Node[], setNodes: React.Dispatch<React.SetStateAction<Node[]>>, edges: Edge[], setEdges: React.Dispatch<React.SetStateAction<Edge[]>> }> = ({ nodes, setNodes, edges, setEdges }) => {
  const CARD_W = 340;
  const CARD_H = 460;
  const SECT_W = 850;
  const SECT_H = 800;

  const [sections, setSections] = useState([
    { id: 'sec-1', label: 'PREPARING MARINADE', color: 'rgba(249, 115, 22, 0.05)', x: 50, y: 100, width: SECT_W, height: SECT_H },
    { id: 'sec-2', label: 'PREPARING CHICKEN', color: 'rgba(99, 102, 241, 0.05)', x: 950, y: 100, width: SECT_W, height: SECT_H }
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSpawning, setIsSpawning] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [isDragToolActive, setIsDragToolActive] = useState(false);
  const spCanvas = useCanvasTransform();

  const updateNodeLabel = (id: string, newLabel: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, label: newLabel.toUpperCase() } : n));
  };

  const updateSectionLabel = (id: string, newLabel: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, label: newLabel.toUpperCase() } : s));
  };

  const handleSpawn = async (type: 'instructions' | 'image-result' | 'video-result') => {
    if (!selectedId || !promptInput) return;
    const parent = nodes.find(n => n.id === selectedId);
    if (!parent) return;
    setIsSpawning(true);
    
    let newX = parent.x + 400; 
    let newY = parent.y;
    
    const box = sections.find(s => parent.x >= s.x && parent.x <= s.x + s.width);
    if (box) {
      newX = Math.min(newX, box.x + box.width - CARD_W - 40);
    }

    let collision = true;
    let verticalOffset = 0;
    while (collision && verticalOffset < 600) {
      const checkY = newY + verticalOffset;
      const colliding = nodes.find(node => 
        Math.abs(node.x - newX) < CARD_W - 20 && 
        Math.abs(node.y - checkY) < 260
      );
      if (colliding) { 
        verticalOffset += 280; 
      } else { 
        newY = checkY;
        collision = false; 
      }
    }
    
    if (box) {
      newY = Math.max(box.y + 60, Math.min(newY, box.y + box.height - CARD_H - 60));
    }

    try {
      const res = await processChefPrompt(promptInput, { selectedItems: [parent] });
      const nid = `node-${Date.now()}`;
      setNodes(prev => [...prev, { 
        id: nid, 
        type, 
        label: (res.resultName || promptInput).toUpperCase(), 
        image: getIngImage(res.imageKeyword || promptInput), 
        quantity: (res.quantity || 'RESULT').toUpperCase(), 
        x: newX, 
        y: newY, 
        content: res.subSteps?.[0]?.instruction || `Outcome: ${promptInput}`, 
        duration: res.duration 
      }]);
      setEdges(prev => [...prev, { id: `edge-${Date.now()}`, sourceId: parent.id, targetId: nid, action: res.actionVerb || 'Process', iconType: 'default' }]);
      setSelectedId(nid); setPromptInput('');
    } catch (e) { console.error(e); } finally { setIsSpawning(false); }
  };

  return (
    <div className={`flex-1 bg-[#fcfaf8] overflow-hidden relative canvas-grid ${isDragToolActive ? 'cursor-grab active:cursor-grabbing' : ''}`}>
      <div 
        className="w-full h-full relative overflow-hidden" 
        onWheel={spCanvas.handleWheel}
        onMouseDown={(e) => {
          if (!isDragToolActive) return;
          const startX = e.clientX;
          const startY = e.clientY;
          const initOffX = spCanvas.offset.x;
          const initOffY = spCanvas.offset.y;
          
          const onMove = (me: MouseEvent) => {
            spCanvas.setOffset({
              x: initOffX + (me.clientX - startX),
              y: initOffY + (me.clientY - startY)
            });
          };
          const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }}
      >
        <motion.div className="relative origin-top-left p-64" animate={{ x: spCanvas.offset.x, y: spCanvas.offset.y, scale: spCanvas.scale }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
          {sections.map(sec => (
            <div key={sec.id} className="absolute border-2 border-dashed border-slate-200 rounded-[5rem] pointer-events-none" style={{ left: sec.x, top: sec.y, width: sec.width, height: sec.height, backgroundColor: sec.color }}>
              <div className="absolute -top-5 left-12 bg-white border border-slate-200 px-8 py-2.5 rounded-full shadow-sm text-[10px] font-black uppercase text-slate-800 tracking-widest flex items-center gap-3 pointer-events-auto">
                <span className="opacity-40">STEP:</span>
                <input 
                   className="bg-transparent focus:outline-none border-none p-0 w-auto" 
                   value={sec.label} 
                   onChange={(e) => updateSectionLabel(sec.id, e.target.value)} 
                />
              </div>
            </div>
          ))}

          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '8000px', minHeight: '8000px' }}>
            <defs>
              <marker id="arrow-sp" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" /></marker>
            </defs>
            {edges.map(edge => {
              const s = nodes.find(n => n.id === edge.sourceId); 
              const t = nodes.find(n => n.id === edge.targetId);
              if (!s || !t) return null;
              const startX = s.x + CARD_W; 
              const startY = s.y + CARD_H/2;
              const endX = t.x; 
              const endY = t.y + CARD_H/2;
              const midX = (startX + endX) / 2;
              return (
                <g key={edge.id}>
                  <path d={`M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`} fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#arrow-sp)" />
                  <foreignObject x={midX - 60} y={(startY + endY) / 2 - 15} width="120" height="30">
                    <div className="flex justify-center items-center h-full">
                      <span className="bg-white px-3.5 py-1.5 rounded-full border border-slate-100 text-[8px] font-black uppercase tracking-tighter text-orange-500 shadow-md ring-2 ring-orange-50">
                        {edge.action}
                      </span>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>

          <div className="relative" style={{ minWidth: '8000px', minHeight: '8000px' }}>
            {nodes.map(node => (
              <motion.div 
                key={node.id} 
                layout 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1, left: node.x, top: node.y }} 
                onClick={(e) => { e.stopPropagation(); if(!isDragToolActive) setSelectedId(node.id); }} 
                className={`absolute w-[340px] bg-white border rounded-[3rem] p-6 shadow-2xl transition-all cursor-pointer pointer-events-auto flex flex-col ${selectedId === node.id ? 'border-orange-500 ring-4 ring-orange-100 z-50' : 'border-slate-100 hover:border-orange-200 z-10'}`}
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className={`p-3 rounded-2xl bg-opacity-10 shadow-sm shrink-0 ${node.type === 'input' ? 'bg-indigo-500 text-indigo-500' : node.type === 'instructions' ? 'bg-orange-500 text-orange-500' : node.type === 'image-result' ? 'bg-emerald-500 text-emerald-500' : 'bg-rose-500 text-rose-500'}`}>
                    {node.type === 'input' && <PlusCircle size={18} />}
                    {node.type === 'instructions' && <Zap size={18} />}
                    {node.type === 'image-result' && <ImageIcon size={18} />}
                    {node.type === 'video-result' && <Video size={18} />}
                  </div>
                  <div className="flex-1 overflow-hidden pr-2">
                    <input className="text-[11px] font-black text-slate-800 uppercase tracking-tight w-full bg-transparent focus:outline-none focus:bg-slate-50 rounded px-1" value={node.label} onChange={(e) => updateNodeLabel(node.id, e.target.value)} />
                    <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">{node.type}</div>
                  </div>
                </div>
                {node.image && (
                  <div className="w-full h-44 rounded-[2rem] overflow-hidden mb-5 bg-slate-50 relative group shadow-inner">
                    <img src={node.image} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                    {node.duration && <div className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur rounded-full text-[9px] font-black text-slate-800 border border-slate-100 shadow-sm flex items-center gap-1.5"><Clock size={10} className="text-orange-500" /> {node.duration}M</div>}
                    {node.type === 'video-result' && <div className="absolute inset-0 flex items-center justify-center"><div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg"><Play size={20} className="text-rose-500 fill-current ml-1" /></div></div>}
                  </div>
                )}
                <div className="mb-6 flex-1"><textarea className="w-full bg-transparent text-[11px] text-slate-500 font-medium leading-relaxed italic border-none focus:outline-none focus:bg-slate-50 rounded p-1 resize-none" value={node.content} onChange={(e) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, content: e.target.value } : n))} rows={2} /></div>
                <div className="flex items-center justify-between border-t border-slate-50 pt-5">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400 shadow-sm">CH</div>
                      <div className="w-7 h-7 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-orange-500 shadow-sm">AI</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100"><span className="text-[10px] font-black text-slate-800 tracking-tight">{node.quantity}</span></div>
                </div>
                <AnimatePresence>{selectedId === node.id && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute -bottom-24 left-0 w-full bg-white rounded-[2.5rem] p-2 flex items-center gap-2 shadow-2xl border border-slate-100 z-[100]"><input type="text" placeholder="Add next sequence..." className="flex-1 bg-transparent px-5 py-2.5 text-[11px] font-bold text-slate-800 focus:outline-none placeholder:text-slate-300" value={promptInput} onChange={(e) => setPromptInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSpawn('instructions')} /><button onClick={() => handleSpawn('instructions')} className="p-3 bg-slate-900 text-white rounded-full hover:bg-orange-500 transition-all shadow-lg active:scale-90">{isSpawning ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}</button></motion.div>)}</AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      <div className="absolute top-6 left-6 flex flex-col gap-3 pointer-events-none"><div className="bg-white/80 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-4 shadow-sm"><div className="flex items-center gap-2 text-slate-800"><Maximize size={12}/> <span>{(spCanvas.scale * 100).toFixed(0)}%</span></div><div className="w-px h-3 bg-slate-200" /><span>Drag Tool: Space + Drag</span></div></div>
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-2.5 flex gap-3 border border-slate-200 shadow-[0_40px_100px_rgba(0,0,0,0.1)] z-[100]"><button onClick={() => { setNodes([{ id: 'root', type: 'input', label: 'KITCHEN ORIGIN', image: getIngImage('chef origin'), quantity: 'START', x: 100, y: 300, content: 'Initialize your culinary workflow here.' }]); spCanvas.setOffset({ x: 0, y: 0 }); spCanvas.setScale(1); }} className="px-8 py-3 bg-slate-900 text-white text-[10px] font-black uppercase rounded-[2rem] hover:bg-black transition-all shadow-lg flex items-center gap-3 active:scale-95"><RefreshCw size={14} /> Reset Flow</button><div className="w-px h-6 bg-slate-200 self-center mx-1" /><button className={`p-3 rounded-full transition-all ${isDragToolActive ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`} title="Drag Tool" onClick={() => { setIsDragToolActive(!isDragToolActive); setSelectedId(null); }}><Hand size={18}/></button><button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all" title="Zoom Out" onClick={() => spCanvas.setScale(s => Math.max(s - 0.2, 0.2))}><Search size={18}/></button><button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all" title="Grid Layout" onClick={() => setNodes(prev => prev.map((n, i) => ({ ...n, x: 100 + i * 400, y: 300 })))}><Grid size={18}/></button></div>
    </div>
  );
};

const TimeView: React.FC<{ stepGroups: StepGroup[], setStepGroups: React.Dispatch<React.SetStateAction<StepGroup[]>>, nodes: Node[] }> = ({ stepGroups, setStepGroups, nodes }) => {
  const chefs = [ChefCategory.JUNIOR, ChefCategory.TRAINEE, ChefCategory.STATION, ChefCategory.SOUS];
  const colors = ['#f472b6', '#a78bfa', '#22d3ee', '#8b5cf6'];
  const baseRadius = 140;
  const ringWidth = 50;
  const gap = 12;

  const [activeChefIndex, setActiveChefIndex] = useState<number | null>(null);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const allAvailableTasks = useMemo(() => {
    const uniqueLabels = new Set([...nodes, ...SAMPLE_TASKS].map(t => t.label));
    return Array.from(uniqueLabels).map(label => {
      const existing = [...nodes, ...SAMPLE_TASKS].find(t => t.label === label);
      return existing!;
    });
  }, [nodes]);

  const filteredTasks = useMemo(() => {
    return allAvailableTasks.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allAvailableTasks, searchQuery]);

  const handleRingClick = (chefIndex: number) => {
    setActiveChefIndex(chefIndex);
    setShowTaskSelector(true);
  };

  const assignTask = (task: Node) => {
    if (activeChefIndex === null) return;
    const chef = chefs[activeChefIndex];
    const newGroup: StepGroup = {
      id: `task-${Date.now()}`,
      label: task.label.toUpperCase(),
      nodeIds: [task.id],
      color: colors[activeChefIndex],
      assignedChef: chef,
      startTime: "11:30 am", 
      durationMinutes: 45
    };
    setStepGroups(prev => [...prev, newGroup]);
    setShowTaskSelector(false);
  };

  const timeMarkers = Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i);

  return (
    <div className="flex-1 bg-[#fcfaf8] flex flex-col items-center overflow-hidden p-10 pt-16">
      <div className="text-center mb-16 relative z-10">
        <h2 className="text-5xl font-black tracking-tighter text-slate-800 uppercase leading-none">Kitchen Pulse</h2>
        <p className="text-[11px] font-black text-slate-400 tracking-[0.6em] mt-4">CIRCULAR LOAD MANAGEMENT SYSTEM</p>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center w-full">
        <div className="relative flex items-center justify-center" style={{ width: 'min(80vh, 800px)', height: 'min(80vh, 800px)' }}>
          <svg viewBox="0 0 800 800" className="w-full h-full drop-shadow-3xl">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {timeMarkers.map((time, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const x1 = 400 + Math.cos(angle) * 360;
              const y1 = 400 + Math.sin(angle) * 360;
              const tx = 400 + Math.cos(angle) * 395;
              const ty = 400 + Math.sin(angle) * 395;
              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={400 + Math.cos(angle) * 375} y2={400 + Math.sin(angle) * 375} stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
                  <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" className="text-[14px] font-black fill-slate-300 font-sans">{time}</text>
                </g>
              );
            })}

            {chefs.map((chef, chefIdx) => {
              const r = baseRadius + chefIdx * (ringWidth + gap);
              return (
                <g key={chef}>
                  <circle cx="400" cy="400" r={r} fill="none" stroke={colors[chefIdx]} strokeWidth={ringWidth} className="opacity-[0.1] cursor-pointer hover:opacity-[0.15] transition-opacity" onClick={() => handleRingClick(chefIdx)} />
                  
                  {stepGroups.filter(g => g.assignedChef === chef).map((group, gIdx) => {
                    const ringStepCount = stepGroups.filter(g => g.assignedChef === chef).length;
                    const sweepAngle = Math.min(300 / ringStepCount, 90);
                    const startAngle = (chefIdx * 60) + (gIdx * (sweepAngle + 10));
                    const endAngle = startAngle + sweepAngle;
                    
                    const x1 = 400 + r * Math.cos(startAngle * Math.PI / 180);
                    const y1 = 400 + r * Math.sin(startAngle * Math.PI / 180);
                    const x2 = 400 + r * Math.cos(endAngle * Math.PI / 180);
                    const y2 = 400 + r * Math.sin(endAngle * Math.PI / 180);
                    const largeArcFlag = sweepAngle <= 180 ? "0" : "1";
                    
                    const pathData = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
                    const labelPathId = `path-${chefIdx}-${gIdx}`;

                    return (
                      <g key={group.id} filter="url(#glow)" className="cursor-pointer group/seg" onClick={() => handleRingClick(chefIdx)}>
                        <path d={pathData} fill="none" stroke={colors[chefIdx]} strokeWidth={ringWidth} strokeLinecap="butt" className="transition-all hover:stroke-white/10" />
                        <defs><path id={labelPathId} d={pathData} /></defs>
                        <text className="text-[10px] font-black uppercase tracking-[0.15em] fill-white pointer-events-none shadow-sm">
                          <textPath href={`#${labelPathId}`} startOffset="50%" textAnchor="middle">
                            {group.label}
                          </textPath>
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}

            <circle cx="400" cy="400" r={120} fill="white" className="shadow-2xl" />
            <foreignObject x="300" y="300" width="200" height="200">
               <div className="w-full h-full flex flex-col items-center justify-center text-center">
                  <ChefHat className="text-orange-500 mb-3" size={36} />
                  <span className="text-[28px] font-black text-slate-800 leading-none">10:45</span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-6 leading-tight">PRODUCTION HEARTBEAT</span>
               </div>
            </foreignObject>
          </svg>
        </div>

        <div className="mt-auto mb-10 flex flex-wrap justify-center gap-8 bg-white/60 backdrop-blur-md p-8 rounded-[3.5rem] border border-slate-100 shadow-xl">
          {chefs.map((chef, i) => (
            <div key={chef} className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: colors[i] }} />
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-800">{chef}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lane {i + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showTaskSelector && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="absolute z-[200] w-[450px] bg-white rounded-[4rem] shadow-[0_60px_180px_rgba(0,0,0,0.25)] border border-slate-100 flex flex-col overflow-hidden"
          >
            <div className="p-10 pb-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Assign Task</h3>
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mt-1">{chefs[activeChefIndex!]?.toUpperCase()} STATION</p>
                </div>
                <button onClick={() => setShowTaskSelector(false)} className="p-3 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-800"><X size={24}/></button>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 rounded-[2rem] px-6 py-4 border border-slate-100 focus-within:ring-4 focus-within:ring-orange-100 transition-all">
                <Search size={20} className="text-slate-400" />
                <input 
                  autoFocus
                  placeholder="Search recipe tasks or ingredients..." 
                  className="bg-transparent focus:outline-none text-sm font-bold w-full placeholder:text-slate-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-3 max-h-[450px] custom-scrollbar">
              {filteredTasks.length === 0 ? (
                <div className="py-16 text-center">
                   <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                      <Search size={24} />
                   </div>
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">No culinary matches found</p>
                </div>
              ) : (
                filteredTasks.map(task => (
                  <button 
                    key={task.id}
                    onClick={() => assignTask(task)}
                    className="w-full group flex items-center gap-5 p-5 rounded-[2.5rem] hover:bg-slate-900 transition-all border border-transparent hover:border-slate-800 text-left"
                  >
                    <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden shadow-md ring-4 ring-white group-hover:ring-slate-800 transition-all shrink-0">
                      <img src={task.image || getIngImage(task.label)} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-800 group-hover:text-white uppercase tracking-tight leading-tight mb-1">{task.label}</p>
                      <div className="flex items-center gap-3">
                         <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-500 uppercase tracking-widest">{task.quantity}</span>
                         <div className="w-1 h-1 bg-slate-300 rounded-full" />
                         <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{task.duration || 15}M</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-full bg-slate-50 group-hover:bg-orange-500 transition-all">
                      <Plus size={16} className="text-slate-400 group-hover:text-white" />
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Workflow Assignment Protocol</span>
              <ChefHat className="text-slate-200" size={20} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
      return { ...s, dishes: s.dishes.map(d => {
        if (d.id === dishId) {
          const randomShiftX = (Math.random() - 0.5) * 0.3; const randomShiftY = (Math.random() - 0.5) * 0.3;
          const randomSizeW = (Math.random() - 0.5) * 0.2; const randomSizeH = (Math.random() - 0.5) * 0.2;
          const colors = ['rgba(239, 68, 68, 0.6)', 'rgba(34, 197, 94, 0.6)', 'rgba(59, 130, 246, 0.6)', 'rgba(249, 115, 22, 0.6)', 'rgba(168, 85, 247, 0.6)', 'rgba(236, 72, 153, 0.6)'];
          return { ...d, name: newAlt.name, demand: newAlt.demand, color: colors[Math.floor(Math.random() * colors.length)], cookingTime: Math.max(5, d.cookingTime + (Math.floor(Math.random() * 15) - 7)), cost: parseFloat((d.cost + (Math.random() * 4 - 2)).toFixed(2)), x: Math.min(0.7, Math.max(0.1, d.x + randomShiftX)), y: Math.min(0.7, Math.max(0.1, d.y + randomShiftY)), width: Math.min(0.5, Math.max(0.15, d.width + randomSizeW)), height: Math.min(0.5, Math.max(0.15, d.height + randomSizeH)) };
        }
        return d;
      })};
    }));
    setSelectedDishId(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#fcfaf8] overflow-y-auto p-12 scroll-smooth">
      <div className="flex items-center justify-between mb-10 px-6 shrink-0 overflow-visible">
        <motion.div key={`header-${currentSetIndex}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}> 
          <h2 className="text-5xl font-black text-slate-800 uppercase tracking-tighter">{currentSet.title}</h2> 
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Advanced Discovery Pairing Analysis</p>
        </motion.div>
        <div className="flex gap-4">
          <button onClick={() => setCurrentSetIndex((p) => (p - 1 + sets.length) % sets.length)} className="w-16 h-16 bg-white border border-slate-200 rounded-3xl flex items-center justify-center hover:bg-slate-50 transition-all hover:shadow-lg active:scale-95 text-slate-400 hover:text-slate-900"><ChevronLeft size={24}/></button>
          <button onClick={() => setCurrentSetIndex((p) => (p + 1) % sets.length)} className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center hover:bg-black transition-all hover:shadow-xl active:scale-95 shadow-lg shadow-slate-200"><ChevronRight size={24}/></button>
        </div>
      </div>
      <div className="flex gap-12 min-h-[700px] items-start overflow-visible">
        <div className="flex-1 bg-white rounded-[4rem] border border-slate-200 p-16 relative shadow-[0_30px_100px_rgba(0,0,0,0.03)] group min-h-[600px]" style={{ overflow: 'visible' }}>
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-[4rem] overflow-hidden">
            <svg width="100%" height="100%"><defs><pattern id="discovery-grid" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M 120 0 L 0 0 0 120" fill="none" stroke="black" strokeWidth="2"/></pattern></defs><rect width="100%" height="100%" fill="url(#discovery-grid)" /></svg>
          </div>
          <div className="w-full h-full relative bg-slate-50/50 rounded-3xl border border-slate-100" style={{ overflow: 'visible' }}>
            <AnimatePresence mode="wait">
              <motion.div key={`viz-${currentSetIndex}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="absolute inset-0" style={{ overflow: 'visible' }}>
                {currentSet.dishes.map((dish) => (
                  <motion.div 
                    key={dish.id} 
                    layout 
                    initial={false} 
                    animate={{ left: `${dish.x * 100}%`, top: `${dish.y * 100}%`, width: `${dish.width * 100}%`, height: `${dish.height * 100}%`, backgroundColor: dish.color, zIndex: selectedDishId === dish.id ? 100 : 10 }} 
                    transition={{ 
                      layout: { type: "spring", stiffness: 100, damping: 20, mass: 1 }, 
                      backgroundColor: { duration: 1.1 } 
                    }} 
                    onClick={() => setSelectedDishId(dish.id === selectedDishId ? null : dish.id)} 
                    className={`absolute border border-black/5 flex flex-col items-center justify-center text-center p-4 cursor-pointer group/node ${selectedDishId === dish.id ? 'ring-4 ring-orange-500 ring-offset-2 shadow-2xl scale-[1.02]' : 'hover:ring-2 hover:ring-orange-200'}`} style={{ borderRadius: '2.5rem' }}
                  >
                    <motion.div layout="position" className="flex flex-col items-center relative pointer-events-none">
                      <span className="text-[11px] font-black text-white uppercase tracking-wider bg-black/40 px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg mb-2">{dish.name}</span>
                      <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-white/10">
                        <TrendingUp size={10} className="text-white/80" /><span className="text-[12px] font-black text-white drop-shadow-md">{dish.demand}</span>
                      </div>
                    </motion.div>
                    <AnimatePresence>
                      {selectedDishId === dish.id && dish.alternatives && (
                        <motion.div initial={{ opacity: 0, y: 15, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: 0.85 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className={`absolute left-1/2 -translate-x-1/2 bg-white rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] p-2 border border-slate-100 min-w-[280px] z-[999] cursor-default ${dish.y > 0.4 ? 'bottom-full mb-8' : 'top-full mt-8'}`} onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-50 mb-1"><div className="flex items-center gap-3"><div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" /><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Swap Selection</p></div><button onClick={() => setSelectedDishId(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-slate-900 transition-colors pointer-events-auto"><X size={14} /></button></div>
                          <div className="flex flex-col gap-2 p-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                            {dish.alternatives.map((alt, altIdx) => (<motion.button key={alt.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: altIdx * 0.05 }} onClick={() => handleSwapItem(dish.id, alt)} className="group/btn px-4 py-4 hover:bg-orange-50 rounded-[1.8rem] flex items-center justify-between gap-4 transition-all hover:translate-x-1 pointer-events-auto text-left border border-transparent hover:border-orange-100"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-500 group-hover/btn:bg-orange-500 group-hover/btn:text-white transition-all shadow-sm"><ArrowRightLeft size={16} /></div><div><span className="text-[12px] font-black uppercase text-slate-700 block leading-none mb-1">{alt.name}</span><span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Regional Pick</span></div></div><div className="flex flex-col items-end shrink-0"><div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-2xl border border-slate-100 group-hover/btn:border-orange-200 transition-colors shadow-sm"><TrendingUp size={12} className="text-orange-500" /><span className="text-[12px] font-black text-slate-600">{alt.demand}</span></div></div></motion.button>))}
                          </div>
                          <div className="absolute left-1/2 -translate-x-1/2 w-5 h-5 bg-white rotate-45 border-r border-b border-slate-100 rounded-sm" style={{ display: dish.y > 0.4 ? 'block' : 'none', bottom: '-10px' }} />
                          <div className="absolute left-1/2 -translate-x-1/2 w-5 h-5 bg-white rotate-45 border-l border-t border-slate-100 rounded-sm" style={{ display: dish.y <= 0.4 ? 'block' : 'none', top: '-10px' }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))} 
              </motion.div> 
            </AnimatePresence> 
          </div> 
        </div> 
        <motion.div key={`sidebar-${currentSetIndex}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="w-96 flex flex-col gap-8 sticky top-0"> 
          <div className="bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[450px]"> 
            <div className="flex items-center gap-3 mb-8 px-2"> 
              <div className="p-2 bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-100"> <Grid size={18} /> </div> 
              <p className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Live Menu Audit</p> 
            </div> 
            <div className="flex-1 overflow-x-hidden overflow-y-auto pr-2 custom-scrollbar"> 
              <table className="w-full text-left border-collapse"> 
                <thead> 
                  <tr className="border-b border-slate-100"> 
                    <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Item</th> 
                    <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Time</th> 
                    <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Cost</th> 
                    <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Demand</th> 
                  </tr> 
                </thead> 
                <tbody className="divide-y divide-slate-50"> 
                  <AnimatePresence initial={false}> 
                    {currentSet.dishes.map((dish) => ( 
                      <motion.tr key={`row-${dish.id}-${dish.name}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className={`group ${selectedDishId === dish.id ? 'bg-orange-50/50' : 'hover:bg-slate-50'} transition-all cursor-pointer`} onClick={() => setSelectedDishId(dish.id)} > 
                        <td className="py-4"> 
                          <div className="flex items-center gap-2"> 
                            <motion.div layoutId={`dot-${dish.id}`} className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: dish.color }} /> 
                            <span className="text-[10px] font-black text-slate-700 uppercase truncate max-w-[80px]">{dish.name}</span> 
                          </div> 
                        </td> 
                        <td className="py-4 text-center"> <span className="text-[10px] font-bold text-slate-500">{dish.cookingTime}m</span> </td> 
                        <td className="py-4 text-center"> <span className="text-[10px] font-bold text-slate-500">${dish.cost.toFixed(2)}</span> </td> 
                        <td className="py-4 text-right"> <span className="text-[10px] font-black text-slate-800">{dish.demand}</span> </td> 
                      </motion.tr> 
                    ))} 
                  </AnimatePresence> 
                </tbody> 
              </table> 
            </div> 
          </div> 
          <motion.div layout className="bg-slate-900 p-10 rounded-[3.5rem] text-white flex flex-col shadow-2xl relative overflow-hidden group"> 
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700"><UtensilsCrossed size={48} /></div> 
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-400 mb-8">Performance Summary</h4> 
            <div className="space-y-8 relative z-10"> 
              <div className="flex gap-4 items-center"> 
                <div className="w-1.5 h-12 bg-orange-500 rounded-full shrink-0" /> 
                <div> 
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Avg Demand Index</p> 
                  <motion.p key={`avg-${currentSetIndex}`} initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black tracking-tight" > {(currentSet.dishes.reduce((acc, d) => acc + d.demand, 0) / currentSet.dishes.length).toFixed(0)} </motion.p> 
                </div> 
              </div> 
              <div className="flex gap-4 items-center"> 
                <div className="w-1.5 h-12 bg-indigo-500 rounded-full shrink-0" /> 
                <div> 
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Total Prep Time</p> 
                  <motion.p key={`time-${currentSetIndex}`} initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black tracking-tight" > {currentSet.dishes.reduce((acc, d) => acc + d.cookingTime, 0)}m </motion.p> 
                </div> 
              </div> 
            </div> 
          </motion.div> 
        </motion.div> 
      </div>
    </div>
  );
};

const PairingView: React.FC = () => {
  const [mainTaste, setMainTaste] = useState<TasteKey>('pungency');
  const [currentPairings, setCurrentPairings] = useState<PairingItem[]>(INITIAL_PAIRINGS);
  const [activePopupId, setActivePopupId] = useState<string | null>(null);
  const getPosition = (index: number, radius: number) => { const angle = (index * (360 / TASTES.length)) * (Math.PI / 180); return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }; };
  const getPairingPosition = (itemIndex: number) => { const angle = (itemIndex * (360 / currentPairings.length)) * (Math.PI / 180); return { x: Math.cos(angle) * 200, y: Math.sin(angle) * 200 }; };
  const mainPos = getPosition(TASTES.indexOf(mainTaste), 70);
  const handleSwap = (parentId: string, newAlternative: PairingItem) => { setCurrentPairings(prev => prev.map(p => { if (p.id === parentId) { const alts = p.alternatives || []; return { ...newAlternative, alternatives: [...alts.filter(a => a.id !== newAlternative.id), { ...p, alternatives: undefined }] }; } return p; })); setActivePopupId(null); };

  return (
    <div className="flex-1 flex bg-[#fdfaf7] overflow-hidden p-0 relative items-center justify-center">
      <div className="absolute top-8 left-8 z-50"><div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100"><h2 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-2">Flavor Pairing Matrix</h2><p className="text-[10px] font-bold text-slate-400 max-w-xs leading-relaxed"> Tap cards to swap for alternatives. Distribution is based on complementary flavor profiles. </p></div></div>
      <div className="relative w-[800px] h-[800px] flex items-center justify-center">
        {TASTES.map((taste, i) => { const pos = getPosition(i, 340); const isMain = taste === mainTaste; return (<div key={taste} onClick={() => setMainTaste(taste)} className={`absolute w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-500 border-2 z-10 cursor-pointer ${isMain ? 'bg-slate-900 text-white border-slate-900 scale-110 shadow-xl' : 'bg-white text-slate-400 border-slate-100 shadow-sm'}`} style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}> {taste === 'sweet' && <Sparkles size={14} />}{taste === 'pungency' && <Flame size={14} />}{taste === 'sour' && <div className="w-3 h-3 rounded-sm border-2 border-current rotate-45" />}{taste === 'fat' && <div className="w-5 h-2 bg-current rounded-full opacity-50" />}{taste === 'umami' && <UtensilsCrossed size={14} />}{taste === 'salty' && <div className="grid grid-cols-2 gap-0.5"><div className="w-1 h-1 bg-current rounded-full" /><div className="w-1 h-1 bg-current rounded-full" /><div className="w-1 h-1 bg-current rounded-full" /><div className="w-1 h-1 bg-current rounded-full" /></div>}{taste === 'bitter' && <div className="w-4 h-4 rounded-full border-2 border-current" />}{taste === 'alcohol' && <Wine size={14} />}<span className="text-[9px] font-black uppercase tracking-widest mt-1">{taste}</span></div>); })}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10"><g transform="translate(400, 400)">{TASTES.map((_, i) => { const p1 = getPosition(i, 340); const p2 = getPosition((i + 1) % TASTES.length, 340); return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#000" strokeWidth="1" />; })}</g></svg>
        <div className="absolute z-30 transition-all duration-700" style={{ transform: `translate(${mainPos.x}px, ${mainPos.y}px)` }}><div className="w-44 h-44 bg-white rounded-[3rem] shadow-2xl border-4 border-slate-900 flex flex-col items-center justify-center p-4 text-center ring-8 ring-slate-50"><img src={getIngImage('kola urundai')} className="w-20 h-20 rounded-3xl object-cover mb-2 ring-4 ring-slate-50 shadow-inner" /><p className="text-[11px] font-black uppercase text-slate-800 leading-tight">Mutton Kola Urundai</p><div className="mt-2 text-[7px] font-black bg-orange-500 text-white px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">Master</div></div></div>
        {currentPairings.map((item, idx) => { const pos = getPairingPosition(idx); const isPopupOpen = activePopupId === item.id; return (<div key={item.id} className="absolute transition-all duration-700 z-40" style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}><div className="w-32 h-32 bg-white rounded-full p-2 border border-slate-100 shadow-xl cursor-pointer flex flex-col items-center justify-center relative hover:scale-105 transition-transform" onClick={(e) => { e.stopPropagation(); setActivePopupId(isPopupOpen ? null : item.id); }}><div className="w-16 h-16 rounded-full overflow-hidden mb-2 border-2 border-slate-50"><img src={item.image} className="w-full h-full object-cover" /></div><p className="text-[9px] font-black uppercase text-slate-800 text-center px-3 leading-tight truncate w-full">{item.name}</p><div className="absolute top-0 right-0 bg-green-500 text-white p-1 rounded-full shadow-lg"><CheckCircle2 size={12} /></div>{isPopupOpen && item.alternatives && (<div className="absolute top-1/2 left-full ml-4 -translate-y-1/2 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 w-48 z-[100] animate-in slide-in-from-left-2 fade-in"><div className="flex items-center justify-between mb-3 px-1"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Alternatives</span><X size={12} className="text-slate-300 cursor-pointer hover:text-slate-900" onClick={() => setActivePopupId(null)} /></div><div className="space-y-3">{item.alternatives.map(alt => (<div key={alt.id} onClick={() => handleSwap(item.id, alt)} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"><img src={alt.image} className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100" /><div className="flex-1 overflow-hidden"><p className="text-[9px] font-black text-slate-800 truncate">{alt.name}</p><p className="text-[7px] text-slate-400 font-bold uppercase">{alt.flavorProfile.join(', ')}</p></div><ChevronRight size={10} className="text-slate-300 group-hover:text-orange-500" /></div>))}</div></div>)}</div></div>); })}
      </div>
    </div>
  );
};

export default App;
