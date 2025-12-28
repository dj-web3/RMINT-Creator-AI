
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
  Maximize2,
  Minimize2,
  Flame,
  Thermometer,
  Timer,
  Square,
  AlertCircle,
  Youtube,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ListOrdered,
  BoxSelect,
  Layers
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

const NODE_WIDTH = 200; 
const NODE_HEIGHT = 160; 

const ActionIcon: React.FC<{ type: ActionIconType; size?: number; className?: string }> = ({ type, size = 14, className }) => {
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
  const [steps, setSteps] = useState<MethodStep[]>([]);
  const [stepGroups, setStepGroups] = useState<StepGroup[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [actionPrompt, setActionPrompt] = useState('');
  const [ingredientPrompt, setIngredientPrompt] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [isTimelineView, setIsTimelineView] = useState(false);
  const [isSidebarRightExpanded, setIsSidebarRightExpanded] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'uploading' | 'analyzing' | 'mapping' | 'complete'>('complete');
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState<number | null>(null);

  // Selection Marquee State
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const selectionStart = useRef<{ x: number, y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('ingredient');
    if (data) {
      const ingredient = JSON.parse(data) as Ingredient;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left - NODE_WIDTH / 2;
      const y = e.clientY - rect.top - 80;
      setNodes(prev => [...prev, { id: `node-${Date.now()}`, type: 'ingredient', label: ingredient.name, quantity: ingredient.quantity, image: ingredient.image, x, y }]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return; // Only trigger if clicking canvas background
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    selectionStart.current = { x: startX, y: startY };
    setSelectionBox({ x: startX, y: startY, w: 0, h: 0 });
    if (!e.shiftKey) setSelectedNodeIds([]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
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

    // Select nodes inside box
    const inBox = nodes.filter(n => 
      n.x > x && n.x < x + w && n.y > y && n.y < y + h
    ).map(n => n.id);
    setSelectedNodeIds(inBox);
  };

  const handleMouseUp = () => {
    selectionStart.current = null;
    setSelectionBox(null);
  };

  const createStepGroup = () => {
    if (selectedNodeIds.length === 0) return;
    const label = prompt("Enter Step Name (e.g., Preparation, Marinade):") || "Untitled Step";
    const newGroup: StepGroup = {
      id: `group-${Date.now()}`,
      label,
      nodeIds: [...selectedNodeIds],
      color: ['#fef3c7', '#dcfce7', '#f1f5f9', '#ffedd5'][stepGroups.length % 4],
      isExpanded: true
    };
    setStepGroups(prev => [...prev, newGroup]);
    setSelectedNodeIds([]);
  };

  const executeActionInstant = async () => {
    if (selectedNodeIds.length === 0 || !actionPrompt) return;
    
    // Instant feedback for combining
    const selectedItems = nodes.filter(n => selectedNodeIds.includes(n.id));
    const maxX = Math.max(...selectedItems.map(n => n.x));
    const avgY = selectedItems.reduce((acc, n) => acc + n.y, 0) / selectedItems.length;
    const newNodeId = `node-${Date.now()}`;
    
    const newNode: Node = {
      id: newNodeId, type: 'action-result', label: actionPrompt, quantity: 'Derived',
      image: getIngImage(actionPrompt), x: maxX + 250, y: avgY, subSteps: []
    };

    const newEdges: Edge[] = selectedItems.map((n, i) => ({
      id: `edge-${Date.now()}-${i}`, sourceId: n.id, targetId: newNodeId, action: 'Combine', iconType: 'default'
    }));

    setNodes(prev => [...prev, newNode]);
    setEdges(prev => [...prev, ...newEdges]);
    setSelectedNodeIds([]);
    setActionPrompt('');

    // Silent AI update for metadata
    processChefPrompt(actionPrompt, { selectedItems }).then(result => {
      setNodes(prev => prev.map(n => n.id === newNodeId ? { 
        ...n, 
        label: result.resultName, 
        subSteps: result.subSteps, 
        quantity: result.quantity,
        duration: result.duration
      } : n));
    }).catch(console.error);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8fafc] text-slate-900 select-none font-sans overflow-hidden">
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-xl text-white shadow-sm ring-2 ring-orange-50">
            <Zap size={18} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-800 leading-none">Chef Creator</h1>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Workbench</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isTimelineView && (
            <>
              {selectedNodeIds.length > 1 && (
                <button onClick={createStepGroup} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                  <BoxSelect size={12} /> Group Selection as Step
                </button>
              )}
              <button onClick={() => setNodes(prev => prev.map((n, i) => ({ ...n, x: 100 + (n.type === 'ingredient' ? 0 : 300), y: 100 + i * 150 })))} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-widest">
                <RefreshCw size={10} className="inline mr-1" /> Organize
              </button>
            </>
          )}
          <button onClick={() => setIsTimelineView(!isTimelineView)} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all font-bold text-[10px] shadow-sm uppercase ${isTimelineView ? 'bg-orange-500 text-white shadow-orange-100' : 'bg-slate-900 text-white shadow-slate-200'}`}>
            {isTimelineView ? <Layout size={12} /> : <Clock size={12} />}
            {isTimelineView ? 'Playground' : 'Timeline'}
          </button>
        </div>
      </header>

      {isTimelineView ? (
        <TimelineView steps={steps} isSidebarRightExpanded={isSidebarRightExpanded} setIsSidebarRightExpanded={setIsSidebarRightExpanded} />
      ) : (
        <div className="flex flex-1 overflow-hidden relative">
          <SidebarLeft ingredients={ingredients} setIngredients={setIngredients} ingredientPrompt={ingredientPrompt} setIngredientPrompt={setIngredientPrompt} />
          
          <div 
            ref={canvasRef}
            className="flex-1 relative overflow-hidden canvas-grid" 
            onDragOver={onDragOver} 
            onDrop={onDrop}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Step Boxes rendering */}
            {stepGroups.map(group => {
              const groupNodes = nodes.filter(n => group.nodeIds.includes(n.id));
              if (groupNodes.length === 0) return null;
              const minX = Math.min(...groupNodes.map(n => n.x)) - 20;
              const minY = Math.min(...groupNodes.map(n => n.y)) - 50;
              const maxX = Math.max(...groupNodes.map(n => n.x + NODE_WIDTH)) + 20;
              const maxY = Math.max(...groupNodes.map(n => n.y + NODE_HEIGHT)) + 20;
              return (
                <div key={group.id} className="absolute border-2 border-dashed border-indigo-200 rounded-[2rem] pointer-events-none transition-all" style={{ left: minX, top: minY, width: maxX - minX, height: maxY - minY, backgroundColor: `${group.color}22` }}>
                  <div className="absolute -top-4 left-6 bg-indigo-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-2">
                    <Layers size={10} /> {group.label}
                  </div>
                </div>
              );
            })}

            <PlaygroundCanvas nodes={nodes} edges={edges} selectedNodeIds={selectedNodeIds} handleToggleSelection={(id) => setSelectedNodeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} updateNodeQuantity={(id, qty) => setNodes(prev => prev.map(n => n.id === id ? { ...n, quantity: qty } : n))} toggleNodeExpansion={(id, e) => { e.stopPropagation(); setNodes(prev => prev.map(n => n.id === id ? { ...n, isExpanded: !n.isExpanded } : n)) }} />
            
            {selectionBox && (
              <div className="absolute border border-indigo-500 bg-indigo-500/10 pointer-events-none z-50" style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.w, height: selectionBox.h }} />
            )}

            {selectedNodeIds.length > 0 && !selectionBox && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur shadow-xl rounded-2xl p-4 border border-slate-200 flex items-center gap-3 w-[500px] z-[60] animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-orange-500 text-white p-2.5 rounded-xl shadow shadow-orange-100"><Scissors size={18}/></div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5 px-1 tracking-widest">Instruction Prompt</p>
                  <input type="text" placeholder={`Combine ${selectedNodeIds.length} items...`} className="w-full bg-slate-100/50 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-300" value={actionPrompt} onChange={(e) => setActionPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && executeActionInstant()} />
                </div>
                <button onClick={executeActionInstant} className="bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-black transition-all font-black text-[10px] uppercase">Combine</button>
              </div>
            )}
          </div>
          
          <SidebarRight steps={steps} setSteps={setSteps} stepGroups={stepGroups} setStepGroups={setStepGroups} nodes={nodes} />
        </div>
      )}

      {isProcessing && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-xl z-[100] flex items-center justify-center p-10">
          <div className="bg-white max-w-sm w-full p-8 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col items-center text-center">
            <div className="relative mb-8">
              <svg className="w-24 h-24 transform -rotate-90"><circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" /><circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={276} strokeDashoffset={276 - (276 * progress) / 100} className="text-orange-500 transition-all duration-300 ease-out" /></svg>
              <div className="absolute inset-0 flex items-center justify-center font-black text-lg text-slate-800">{progress}%</div>
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-1 capitalize tracking-tight">{processingStatus}...</h2>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-4 shadow-inner"><div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${progress}%` }}></div></div>
          </div>
        </div>
      )}
    </div>
  );
};

const SidebarLeft: React.FC<{ 
  ingredients: Ingredient[], setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>, ingredientPrompt: string, setIngredientPrompt: React.Dispatch<React.SetStateAction<string>>
}> = ({ ingredients, setIngredients, ingredientPrompt, setIngredientPrompt }) => {
  const handleAdd = () => { if (!ingredientPrompt) return; setIngredients(prev => [{ id: `i-${Date.now()}`, name: ingredientPrompt, image: getIngImage(ingredientPrompt), quantity: '1 unit' }, ...prev]); setIngredientPrompt(''); };
  return (
    <div className="w-60 border-r border-slate-200 bg-white flex flex-col z-10 shadow-lg">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/20"><h2 className="font-black text-slate-800 uppercase tracking-tighter text-xs">Pantry</h2><span className="text-[9px] font-black px-3 py-1 bg-slate-900 rounded-full text-white">{ingredients.length}</span></div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {ingredients.map(ing => (
          <div key={ing.id} draggable onDragStart={(e) => e.dataTransfer.setData('ingredient', JSON.stringify(ing))} className="group relative flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl cursor-grab hover:border-orange-500 hover:shadow-xl hover:shadow-orange-50 transition-all duration-300">
            <div className="relative overflow-hidden w-10 h-10 rounded-xl shadow-inner bg-slate-100"><img src={ing.image} alt={ing.name} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000" /></div>
            <div className="flex-1 overflow-hidden"><p className="font-black text-xs text-slate-900 truncate">{ing.name}</p><p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{ing.quantity}</p></div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-100 bg-slate-50/20">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5">
          <input type="text" placeholder="Item..." className="flex-1 px-2 py-1.5 text-xs bg-transparent focus:outline-none font-bold" value={ingredientPrompt} onChange={(e) => setIngredientPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
          <button onClick={handleAdd} className="bg-slate-900 text-white p-2 rounded-lg hover:bg-orange-500 transition-colors"><Plus size={14} /></button>
        </div>
      </div>
    </div>
  );
};

const PlaygroundCanvas: React.FC<{
  nodes: Node[], edges: Edge[], selectedNodeIds: string[], handleToggleSelection: (id: string) => void, updateNodeQuantity: (id: string, qty: string) => void, toggleNodeExpansion: (id: string, e: React.MouseEvent) => void
}> = ({ nodes, edges, selectedNodeIds, handleToggleSelection, updateNodeQuantity, toggleNodeExpansion }) => {
  return (
    <div className="w-full h-full relative pointer-events-none">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '4000px', minHeight: '4000px' }}>
        <defs><marker id="arrowhead" markerWidth="8" markerHeight="4" refX="7" refY="2" orient="auto"><polygon points="0 0, 8 2, 0 4" fill="#cbd5e1" /></marker></defs>
        {edges.map(edge => {
          const source = nodes.find(n => n.id === edge.sourceId); const target = nodes.find(n => n.id === edge.targetId);
          if (!source || !target) return null;
          const startX = source.x + NODE_WIDTH; const startY = source.y + 70; const endX = target.x; const endY = target.y + 70;
          const midX = (startX + endX) / 2; const midY = (startY + endY) / 2;
          return (
            <g key={edge.id}>
              <path d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`} stroke="#cbd5e1" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
              <g transform={`translate(${midX - 45}, ${midY - 15})`}><rect width="90" height="30" rx="15" fill="white" stroke="#e2e8f0" strokeWidth="1" className="shadow-lg" /><foreignObject width="90" height="30"><div className="w-full h-full flex items-center justify-center gap-1.5 px-2"><ActionIcon type={edge.iconType} size={12} className="text-orange-500" /><span className="text-[8px] font-black text-slate-800 uppercase truncate">{edge.action}</span></div></foreignObject></g>
            </g>
          );
        })}
      </svg>
      {nodes.map(node => (
        <div key={node.id} className={`absolute w-52 bg-white rounded-[1.5rem] border-2 transition-all cursor-pointer shadow-sm group hover:-translate-y-1 p-4 pointer-events-auto ${selectedNodeIds.includes(node.id) ? 'border-orange-500 ring-4 ring-orange-100 z-20 shadow-orange-100 scale-105' : 'border-white hover:border-orange-100 z-10'}`} style={{ left: node.x, top: node.y }} onClick={(e) => { e.stopPropagation(); handleToggleSelection(node.id); }}>
          {node.image && (<div className="relative h-24 w-full overflow-hidden rounded-[1rem] bg-slate-50 mb-3 shadow-inner"><img src={node.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />{node.duration && (<div className="absolute top-2 right-2 bg-black/50 text-white text-[7px] px-2 py-0.5 rounded-full flex items-center gap-1 font-black"><Clock size={8} /> {node.duration}M</div>)}</div>)}
          <div className="flex justify-between items-start mb-2">
            <p className="font-black text-[10px] text-slate-800 truncate pr-2 uppercase tracking-tight">{node.label}</p>
            {node.subSteps && node.subSteps.length > 0 && (
              <button onClick={(e) => toggleNodeExpansion(node.id, e)} className="p-1 bg-slate-100 hover:bg-orange-500 hover:text-white rounded-lg transition-colors">
                {node.isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
            )}
          </div>
          {node.isExpanded && node.subSteps && (
            <div className="mb-3 bg-slate-50 rounded-xl p-2 border border-slate-100 space-y-1 animate-in slide-in-from-top-1">
              {node.subSteps.map((ss, idx) => (
                <div key={idx} className="flex gap-1.5 items-start border-l-2 border-orange-200 pl-1.5">
                  <span className="text-[8px] font-bold text-slate-700 leading-tight">{idx + 1}. {ss.instruction}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-1.5 border border-slate-100">
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Qty</span>
            <input type="text" value={node.quantity} onClick={(e) => e.stopPropagation()} onChange={(e) => updateNodeQuantity(node.id, e.target.value)} className="bg-transparent text-[9px] font-black text-slate-900 w-full focus:outline-none" />
          </div>
        </div>
      ))}
    </div>
  );
};

const SidebarRight: React.FC<{ 
  steps: MethodStep[], setSteps: React.Dispatch<React.SetStateAction<MethodStep[]>>, stepGroups: StepGroup[], setStepGroups: React.Dispatch<React.SetStateAction<StepGroup[]>>, nodes: Node[]
}> = ({ steps, setSteps, stepGroups, setStepGroups, nodes }) => {
  const toggleGroup = (id: string) => {
    setStepGroups(prev => prev.map(g => g.id === id ? { ...g, isExpanded: !g.isExpanded } : g));
  };

  return (
    <div className="w-72 border-l border-slate-200 bg-white flex flex-col z-10 shadow-2xl">
      <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/20"><Scissors size={18} className="text-orange-500" /><h2 className="font-black text-slate-800 uppercase tracking-tighter text-sm">Flow Steps</h2></div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {stepGroups.length === 0 && (
          <div className="text-center py-10 px-6 text-slate-400">
            <Layers size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No manual steps defined.</p>
            <p className="text-[9px] mt-2 leading-relaxed">Select nodes on the canvas and click "Group" to create a named step.</p>
          </div>
        )}
        {stepGroups.map((group, idx) => (
          <div key={group.id} className="relative bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <button 
              onClick={() => toggleGroup(group.id)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">{group.label}</h3>
              </div>
              {group.isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
            </button>
            {group.isExpanded && (
              <div className="p-4 pt-0 border-t border-slate-50 bg-slate-50/30">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-3 tracking-widest mt-3">Sequence View</p>
                <div className="space-y-3">
                  {group.nodeIds.map((nodeId, nodeIdx) => {
                    const node = nodes.find(n => n.id === nodeId);
                    if (!node) return null;
                    return (
                      <div key={node.id} className="flex items-start gap-3 bg-white p-2.5 rounded-xl border border-slate-100 shadow-xs">
                        {node.image && <img src={node.image} className="w-8 h-8 rounded-lg object-cover" />}
                        <div>
                          <p className="text-[9px] font-black text-slate-800 leading-none mb-1">{nodeIdx + 1}. {node.label}</p>
                          <p className="text-[8px] text-slate-400 font-bold">{node.quantity}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button className="w-full py-2 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-orange-500 transition-colors">Assign Staff</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const TimelineView: React.FC<{ 
  steps: MethodStep[], isSidebarRightExpanded: boolean, setIsSidebarRightExpanded: (v: boolean) => void
}> = ({ steps, isSidebarRightExpanded, setIsSidebarRightExpanded }) => {
  const chefs = Object.values(ChefCategory);
  const hours = Array.from({ length: 12 }, (_, i) => 8 + i);
  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-12 border-b border-slate-100 flex items-center px-6 justify-between bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm animate-pulse"></div> 
               <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Operational Schedule</span>
             </div>
             <div className="text-[9px] text-slate-300 font-bold border-l border-slate-200 pl-6 uppercase tracking-[0.2em]">{steps.length} Tasks Scheduled</div>
          </div>
        </div>
        <div className="flex-1 overflow-x-auto overflow-y-auto relative p-6 bg-[#fcfcfc]">
          <div className="min-w-[1500px] bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <div className="flex h-8 mb-4 border-b border-slate-50 sticky top-0 bg-white z-20 items-center px-2">
              <div className="w-48 shrink-0 px-4 border-r border-slate-50"><span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Staff Distribution</span></div>
              <div className="flex-1 flex">{hours.map(h => (<div key={h} className="flex-1 border-l border-slate-50 px-4 text-[9px] text-slate-400 font-black">{h > 12 ? h - 12 : h}:00 {h >= 12 ? 'PM' : 'AM'}</div>))}</div>
            </div>
            {chefs.map(chef => (
              <div key={chef} className="flex h-16 items-center group relative border-b border-slate-50 last:border-0">
                <div className="w-48 shrink-0 flex items-center gap-3 px-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500"><User size={12} strokeWidth={2.5} /></div>
                  <div><span className="text-[10px] font-black text-slate-800 tracking-tighter block leading-none">{chef.split(' ')[0]}</span><span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">{steps.filter(s => s.chef === chef).length} Jobs</span></div>
                </div>
                <div className="flex-1 h-10 relative bg-slate-50/40 rounded-xl mx-2 my-3">
                  {steps.filter(s => s.chef === chef).map(step => {
                    const [time, period] = step.startTime.split(' '); const [h, m] = time.split(':').map(Number);
                    const totalMins = ((h % 12) + (period === 'pm' ? 12 : 0) - 8) * 60 + m;
                    const leftOffset = (totalMins / (12 * 60)) * 100; const widthPercent = (step.durationMinutes / (12 * 60)) * 100;
                    return (
                      <div key={step.id} className="absolute h-6 top-2 bg-white border border-slate-900 rounded-lg px-2 flex flex-col justify-center overflow-hidden hover:scale-[1.02] hover:shadow-xl transition-all cursor-help group/step z-10" style={{ left: `${leftOffset}%`, width: `${widthPercent}%`, minWidth: '120px' }}>
                        <p className="text-[8px] font-black text-slate-800 truncate leading-none uppercase tracking-tighter">{step.action} {step.ingredients[0]}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={`transition-all duration-500 border-l border-slate-100 bg-white flex flex-col shadow-xl ${isSidebarRightExpanded ? 'w-64' : 'w-12'}`}>
        <button onClick={() => setIsSidebarRightExpanded(!isSidebarRightExpanded)} className="h-12 border-b border-slate-100 flex items-center justify-center hover:bg-slate-50 text-slate-400">{isSidebarRightExpanded ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}</button>
        {isSidebarRightExpanded && (<div className="flex-1 overflow-y-auto p-4 space-y-6"><h3 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 border-b border-slate-50 pb-3">Manifest</h3>{steps.map(s => (<div key={s.id} className="group relative"><div className="flex items-center gap-3 mb-2"><div className="w-7 h-7 rounded-lg bg-slate-900 text-white text-[8px] flex items-center justify-center font-black shadow-md ring-4 ring-slate-50">{s.stepNumber}</div><span className="text-[9px] text-orange-500 font-black tracking-widest">{s.startTime}</span></div><div className="bg-slate-50 group-hover:bg-white group-hover:shadow-lg transition-all p-3 rounded-xl border border-slate-100"><p className="text-[10px] font-black text-slate-800 leading-relaxed uppercase tracking-tighter">{s.action} {s.ingredients.join(', ')}</p></div></div>))}</div>)}
      </div>
    </div>
  );
};

export default App;
