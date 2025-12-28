
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Play, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
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
  GripHorizontal
} from 'lucide-react';
import { 
  Ingredient, 
  Node, 
  Edge, 
  MethodStep, 
  ChefCategory,
  ActionIconType,
  SubStep,
  StepGroup
} from './types';
import { processChefPrompt, analyzeCookingVideo } from './services/geminiService';

const getIngImage = (name: string) => `https://loremflickr.com/320/240/food,${encodeURIComponent(name.toLowerCase().split(' ').pop() || name)}?lock=${Math.floor(Math.random() * 1000)}`;

const MOCK_INGREDIENTS: Ingredient[] = [
  { id: 'i1', name: 'Fresh Ginger', image: getIngImage('ginger'), quantity: '50g' },
  { id: 'i2', name: 'Red Onion', image: getIngImage('onion'), quantity: '2 medium' },
  { id: 'i3', name: 'Ripe Tomato', image: getIngImage('tomato'), quantity: '3 large' },
  { id: 'i4', name: 'Garlic Bulbs', image: getIngImage('garlic'), quantity: '10 cloves' },
  { id: 'i5', name: 'Green Chili', image: getIngImage('chili'), quantity: '2 small' },
];

const NODE_WIDTH = 180; 
const NODE_HEIGHT = 140; 
const GRID_SIZE = 40;

const ActionIcon: React.FC<{ type: ActionIconType; size?: number; className?: string }> = ({ type, size = 12, className }) => {
  switch (type) {
    case 'cooking': return <Flame size={size} className={className} />;
    case 'resting': return <Thermometer size={size} className={className} />;
    case 'waiting': return <Timer size={size} className={className} />;
    case 'baking': return <Square size={size} className={className} />;
    default: return <Scissors size={size} className={className} />;
  }
};

const App: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>(MOCK_INGREDIENTS);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [stepGroups, setStepGroups] = useState<StepGroup[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [actionPrompt, setActionPrompt] = useState('');
  const [ingredientPrompt, setIngredientPrompt] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [isTimelineView, setIsTimelineView] = useState(false);
  const [isSidebarRightExpanded, setIsSidebarRightExpanded] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const selectionStart = useRef<{ x: number, y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const isOccupied = (x: number, y: number, currentNodes: Node[]) => {
    return currentNodes.some(n => {
      return Math.abs(n.x - x) < NODE_WIDTH && Math.abs(n.y - y) < NODE_HEIGHT;
    });
  };

  const findFreeSpot = (startX: number, startY: number, currentNodes: Node[]) => {
    let x = Math.round(startX / GRID_SIZE) * GRID_SIZE;
    let y = Math.round(startY / GRID_SIZE) * GRID_SIZE;
    let offset = 0;
    while (isOccupied(x, y, currentNodes) && offset < 500) {
      x += GRID_SIZE;
      offset += GRID_SIZE;
    }
    return { x, y };
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('ingredient');
    if (data) {
      const ingredient = JSON.parse(data) as Ingredient;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const initialX = e.clientX - rect.left - NODE_WIDTH / 2;
      const initialY = e.clientY - rect.top - 70;
      const { x, y } = findFreeSpot(initialX, initialY, nodes);
      setNodes(prev => [...prev, { id: `node-${Date.now()}`, type: 'ingredient', label: ingredient.name, quantity: ingredient.quantity, image: ingredient.image, x, y }]);
    }
  };

  const createStepGroup = () => {
    if (selectedNodeIds.length === 0) return;
    const label = prompt("Step Name (e.g., Prepare Marinade):") || "Step Heading";
    const startTime = prompt("Scheduled Start (e.g., 08:30 am):", "08:00 am") || "08:00 am";
    
    const newGroup: StepGroup = {
      id: `group-${Date.now()}`,
      label,
      nodeIds: [...selectedNodeIds],
      color: ['#fef3c7', '#dcfce7', '#f1f5f9', '#ffedd5'][stepGroups.length % 4],
      isExpanded: true,
      assignedChef: ChefCategory.STATION,
      startTime,
      durationMinutes: 15
    };
    setStepGroups(prev => [...prev, newGroup]);
    setSelectedNodeIds([]);
  };

  const executeActionInstant = async () => {
    if (selectedNodeIds.length === 0 || !actionPrompt) return;
    
    const selectedItems = nodes.filter(n => selectedNodeIds.includes(n.id));
    const maxX = Math.max(...selectedItems.map(n => n.x));
    const avgY = selectedItems.reduce((acc, n) => acc + n.y, 0) / selectedItems.length;
    const newNodeId = `node-${Date.now()}`;
    
    const newNode: Node = {
      id: newNodeId, type: 'action-result', label: actionPrompt, quantity: '1 unit',
      image: getIngImage(actionPrompt), x: maxX + 220, y: avgY, subSteps: []
    };

    const newEdges: Edge[] = selectedItems.map((n, i) => ({
      id: `edge-${Date.now()}-${i}`, sourceId: n.id, targetId: newNodeId, action: 'Mix', iconType: 'default'
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

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8fafc] text-slate-900 select-none font-sans overflow-hidden">
      <header className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-1.5 rounded-lg text-white shadow-sm">
            <Zap size={16} fill="currentColor" />
          </div>
          <h1 className="text-sm font-black tracking-tighter text-slate-800">Chef Studio</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {!isTimelineView && (
            <>
              {selectedNodeIds.length > 1 && (
                <button onClick={createStepGroup} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <BoxSelect size={12} /> Group as Step
                </button>
              )}
              <button onClick={() => setNodes(prev => prev.map((n, i) => ({ ...n, x: 100 + (n.type === 'ingredient' ? 0 : 250), y: 100 + i * 120 })))} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-all text-[9px] font-black uppercase tracking-widest">
                <RefreshCw size={10} className="inline mr-1" /> Organize
              </button>
            </>
          )}
          <button onClick={() => setIsTimelineView(!isTimelineView)} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all font-black text-[9px] uppercase shadow-sm ${isTimelineView ? 'bg-orange-500 text-white' : 'bg-slate-900 text-white'}`}>
            {isTimelineView ? 'Playground' : 'Timeline View'}
          </button>
        </div>
      </header>

      {isTimelineView ? (
        <TimelineView stepGroups={stepGroups} isSidebarRightExpanded={isSidebarRightExpanded} setIsSidebarRightExpanded={setIsSidebarRightExpanded} />
      ) : (
        <div className="flex flex-1 overflow-hidden relative">
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
              const minX = Math.min(...gNodes.map(n => n.x)) - 15;
              const minY = Math.min(...gNodes.map(n => n.y)) - 40;
              const maxX = Math.max(...gNodes.map(n => n.x + NODE_WIDTH)) + 15;
              const maxY = Math.max(...gNodes.map(n => n.y + NODE_HEIGHT)) + 15;
              return (
                <div key={group.id} className="absolute border-2 border-dashed border-indigo-200 rounded-3xl pointer-events-none transition-all" style={{ left: minX, top: minY, width: maxX - minX, height: maxY - minY, backgroundColor: `${group.color}11` }}>
                  <div className="absolute -top-3 left-4 bg-indigo-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-md flex items-center gap-1.5">
                    <Layers size={9} /> {group.label}
                  </div>
                </div>
              );
            })}

            <PlaygroundCanvas nodes={nodes} edges={edges} selectedNodeIds={selectedNodeIds} handleToggleSelection={(id) => setSelectedNodeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} updateNodeQuantity={(id, qty) => setNodes(prev => prev.map(n => n.id === id ? { ...n, quantity: qty } : n))} toggleNodeExpansion={(id, e) => { e.stopPropagation(); setNodes(prev => prev.map(n => n.id === id ? { ...n, isExpanded: !n.isExpanded } : n)) }} />
            
            {selectionBox && (
              <div className="absolute border border-indigo-400 bg-indigo-400/10 pointer-events-none z-50" style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h }} />
            )}

            {selectedNodeIds.length > 0 && !selectionBox && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-xl p-3 border border-slate-200 flex items-center gap-3 w-[450px] z-[60] animate-in slide-in-from-bottom-2">
                <div className="bg-orange-500 text-white p-2 rounded-lg"><Scissors size={16}/></div>
                <input type="text" placeholder={`Combine ${selectedNodeIds.length} items...`} className="flex-1 bg-slate-50 rounded-lg px-3 py-2 text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-orange-300" value={actionPrompt} onChange={(e) => setActionPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && executeActionInstant()} />
                <button onClick={executeActionInstant} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-black text-[9px] uppercase">Combine</button>
              </div>
            )}
          </div>
          
          <SidebarRight stepGroups={stepGroups} setStepGroups={setStepGroups} nodes={nodes} />
        </div>
      )}
    </div>
  );
};

const SidebarLeft: React.FC<{ ingredients: Ingredient[], setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>, ingredientPrompt: string, setIngredientPrompt: React.Dispatch<React.SetStateAction<string>> }> = ({ ingredients, setIngredients, ingredientPrompt, setIngredientPrompt }) => {
  const handleAdd = () => { if (!ingredientPrompt) return; setIngredients(prev => [{ id: `i-${Date.now()}`, name: ingredientPrompt, image: getIngImage(ingredientPrompt), quantity: '1 unit' }, ...prev]); setIngredientPrompt(''); };
  return (
    <div className="w-52 border-r border-slate-200 bg-white flex flex-col z-10">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between"><h2 className="font-black text-slate-800 uppercase tracking-tighter text-[10px]">Pantry</h2></div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {ingredients.map(ing => (
          <div key={ing.id} draggable onDragStart={(e) => e.dataTransfer.setData('ingredient', JSON.stringify(ing))} className="group relative flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-xl cursor-grab hover:border-orange-500 transition-all">
            <img src={ing.image} className="w-8 h-8 rounded-lg object-cover" />
            <div className="flex-1 overflow-hidden"><p className="font-black text-[10px] text-slate-900 truncate">{ing.name}</p><p className="text-[8px] text-slate-400 font-bold">{ing.quantity}</p></div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
          <input type="text" placeholder="Item..." className="flex-1 px-1 py-1 text-[10px] bg-transparent focus:outline-none font-bold" value={ingredientPrompt} onChange={(e) => setIngredientPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
          <button onClick={handleAdd} className="bg-slate-900 text-white p-1 rounded hover:bg-orange-500 transition-colors"><Plus size={12} /></button>
        </div>
      </div>
    </div>
  );
};

const PlaygroundCanvas: React.FC<{ nodes: Node[], edges: Edge[], selectedNodeIds: string[], handleToggleSelection: (id: string) => void, updateNodeQuantity: (id: string, qty: string) => void, toggleNodeExpansion: (id: string, e: React.MouseEvent) => void }> = ({ nodes, edges, selectedNodeIds, handleToggleSelection, updateNodeQuantity, toggleNodeExpansion }) => {
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
              <g transform={`translate(${(startX+endX)/2 - 35}, ${(startY+endY)/2 - 12})`}><rect width="70" height="24" rx="12" fill="white" stroke="#e2e8f0" strokeWidth="1" /><foreignObject width="70" height="24"><div className="w-full h-full flex items-center justify-center gap-1 px-2"><ActionIcon type={edge.iconType} size={10} className="text-orange-500" /><span className="text-[7px] font-black text-slate-800 uppercase truncate">{edge.action}</span></div></foreignObject></g>
            </g>
          );
        })}
      </svg>
      {nodes.map(node => (
        <div key={node.id} className={`absolute w-[180px] bg-white rounded-2xl border-2 transition-all cursor-pointer shadow-sm p-3 pointer-events-auto ${selectedNodeIds.includes(node.id) ? 'border-orange-500 ring-4 ring-orange-50 z-20 scale-105' : 'border-white hover:border-orange-100 z-10'}`} style={{ left: node.x, top: node.y }} onClick={(e) => { e.stopPropagation(); handleToggleSelection(node.id); }}>
          {node.image && (<div className="relative h-20 w-full overflow-hidden rounded-xl bg-slate-50 mb-2 shadow-inner"><img src={node.image} className="w-full h-full object-cover group-hover:scale-110" />{node.duration && (<div className="absolute top-1.5 right-1.5 bg-black/50 text-white text-[7px] px-1.5 py-0.5 rounded-full font-black"><Clock size={8} className="inline mr-1" />{node.duration}m</div>)}</div>)}
          <div className="flex justify-between items-start mb-1.5 pr-1">
            <p className="font-black text-[9px] text-slate-800 truncate uppercase tracking-tighter">{node.label}</p>
            {node.subSteps && node.subSteps.length > 0 && (
              <button onClick={(e) => toggleNodeExpansion(node.id, e)} className="p-0.5 bg-slate-50 rounded"><ChevronDown size={8} /></button>
            )}
          </div>
          {node.isExpanded && node.subSteps && (
            <div className="mb-2 bg-slate-50 rounded-lg p-1.5 space-y-1">
              {node.subSteps.map((ss, idx) => (<div key={idx} className="text-[7px] font-bold text-slate-600 leading-tight"> {idx + 1}. {ss.instruction}</div>))}
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-slate-50 rounded p-1 border border-slate-100">
            <span className="text-[7px] font-black text-slate-400 uppercase">Qty</span>
            <input type="text" value={node.quantity} onClick={(e) => e.stopPropagation()} onChange={(e) => updateNodeQuantity(node.id, e.target.value)} className="bg-transparent text-[8px] font-black text-slate-900 w-full focus:outline-none" />
          </div>
        </div>
      ))}
    </div>
  );
};

const SidebarRight: React.FC<{ stepGroups: StepGroup[], setStepGroups: React.Dispatch<React.SetStateAction<StepGroup[]>>, nodes: Node[] }> = ({ stepGroups, setStepGroups, nodes }) => {
  const chefs = Object.values(ChefCategory);
  
  const updateChef = (groupId: string, chef: ChefCategory) => {
    setStepGroups(prev => prev.map(g => g.id === groupId ? { ...g, assignedChef: chef } : g));
  };

  const getGroupSequence = (nodeIds: string[]) => {
    return nodes.filter(n => nodeIds.includes(n.id)).sort((a, b) => a.x - b.x);
  };

  return (
    <div className="w-72 border-l border-slate-200 bg-white flex flex-col z-10">
      <div className="p-4 border-b border-slate-100 flex items-center gap-2"><Scissors size={14} className="text-orange-500" /><h2 className="font-black text-slate-800 uppercase text-[10px]">Method Steps</h2></div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {stepGroups.length === 0 && (
          <div className="text-center py-10 text-slate-300 font-bold uppercase text-[8px] tracking-widest">No steps grouped yet.</div>
        )}
        {stepGroups.map((group, idx) => (
          <div key={group.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50/50 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-900 text-white rounded-lg flex items-center justify-center text-[9px] font-black">{idx + 1}</div>
                <h3 className="text-[10px] font-black text-slate-800 uppercase">{group.label}</h3>
              </div>
              <span className="text-[8px] font-black text-orange-500">{group.startTime}</span>
            </div>
            <div className="p-3">
              <p className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest">Action Sequence</p>
              <div className="space-y-2 mb-4">
                {getGroupSequence(group.nodeIds).map((node, nIdx) => (
                  <div key={node.id} className="flex gap-2 items-center">
                    <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[7px] font-black">{nIdx + 1}</div>
                    <p className="text-[9px] font-bold text-slate-700 truncate">{node.label}</p>
                  </div>
                ))}
              </div>
              
              <div className="pt-3 border-t border-slate-50">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest">Assigned Specialist</p>
                <div className="flex flex-wrap gap-1">
                  {chefs.map(chef => (
                    <button 
                      key={chef} onClick={() => updateChef(group.id, chef)}
                      className={`px-2 py-1 rounded-full text-[7px] font-black uppercase transition-all ${group.assignedChef === chef ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
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

const TimelineView: React.FC<{ stepGroups: StepGroup[], isSidebarRightExpanded: boolean, setIsSidebarRightExpanded: (v: boolean) => void }> = ({ stepGroups }) => {
  const chefs = Object.values(ChefCategory);
  const hours = Array.from({ length: 12 }, (_, i) => 8 + i);
  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="h-10 border-b border-slate-100 flex items-center px-6 bg-slate-50/30">
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div><span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Operational View</span></div>
      </div>
      <div className="flex-1 overflow-auto p-6 bg-[#fafafa]">
        <div className="min-w-[1200px] bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex h-8 mb-4 border-b border-slate-50 sticky top-0 bg-white z-20 items-center px-2">
            <div className="w-40 shrink-0 border-r border-slate-50 px-2"><span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Assignment Lanes</span></div>
            <div className="flex-1 flex">{hours.map(h => (<div key={h} className="flex-1 border-l border-slate-50 px-4 text-[9px] text-slate-400 font-black">{h > 12 ? h - 12 : h}:00</div>))}</div>
          </div>
          {chefs.map(chef => (
            <div key={chef} className="flex h-14 items-center group relative border-b border-slate-50 last:border-0">
              <div className="w-40 shrink-0 flex items-center gap-3 px-2">
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-400"><User size={12} /></div>
                <span className="text-[9px] font-black text-slate-800 uppercase">{chef.split(' ')[0]}</span>
              </div>
              <div className="flex-1 h-10 relative bg-slate-50/40 rounded-lg mx-2 my-2">
                {stepGroups.filter(g => g.assignedChef === chef).map(group => {
                  const [time, period] = group.startTime?.split(' ') || ["08:00", "am"]; const [h, m] = time.split(':').map(Number);
                  const totalMins = ((h % 12) + (period === 'pm' ? 12 : 0) - 8) * 60 + m;
                  const leftOffset = (totalMins / (12 * 60)) * 100; const widthPercent = ((group.durationMinutes || 15) / (12 * 60)) * 100;
                  return (
                    <div key={group.id} className="absolute h-6 top-2 bg-white border border-slate-900 rounded px-2 flex items-center shadow-sm overflow-hidden" style={{ left: `${leftOffset}%`, width: `${widthPercent}%`, minWidth: '100px' }}>
                      <p className="text-[8px] font-black text-slate-800 truncate uppercase tracking-tighter">{group.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
