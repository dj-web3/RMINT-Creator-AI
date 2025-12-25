
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
  RefreshCw
} from 'lucide-react';
import { 
  Ingredient, 
  Node, 
  Edge, 
  MethodStep, 
  ChefCategory,
  ActionIconType
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

const NODE_WIDTH = 224; 
const NODE_HEIGHT = 280; 
const GRID_SPACING_X = 260;
const GRID_SPACING_Y = 320;

const ActionIcon: React.FC<{ type: ActionIconType; size?: number; className?: string }> = ({ type, size = 16, className }) => {
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
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [actionPrompt, setActionPrompt] = useState('');
  const [ingredientPrompt, setIngredientPrompt] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [isTimelineView, setIsTimelineView] = useState(false);
  const [isSidebarRightExpanded, setIsSidebarRightExpanded] = useState(true);
  
  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'uploading' | 'analyzing' | 'mapping' | 'complete'>('complete');
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const findNonOverlappingPosition = (x: number, y: number, currentNodes: Node[]) => {
    // Round to a grid for cleaner placement
    let finalX = Math.round(x / 50) * 50;
    let finalY = Math.round(y / 50) * 50;
    
    let attempts = 0;
    const padding = 40;

    const isOverlapping = (cx: number, cy: number) => {
      return currentNodes.some(n => {
        const dx = Math.abs(n.x - cx);
        const dy = Math.abs(n.y - cy);
        // Card is NODE_WIDTH x NODE_HEIGHT
        return dx < NODE_WIDTH + padding && dy < NODE_HEIGHT + padding;
      });
    };

    // If initial position is taken, try moving in a grid pattern
    while (isOverlapping(finalX, finalY) && attempts < 100) {
      if (attempts < 10) {
        // Try horizontal slots first
        finalX += GRID_SPACING_X;
      } else {
        // Then vertical and horizontal
        finalY += GRID_SPACING_Y / 2;
        finalX = Math.round(x / 50) * 50; // Reset X and try again with new Y
      }
      attempts++;
    }
    return { x: finalX, y: finalY };
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('ingredient');
    if (data) {
      const ingredient = JSON.parse(data) as Ingredient;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const dropX = e.clientX - rect.left - (NODE_WIDTH / 2);
      const dropY = e.clientY - rect.top - (NODE_HEIGHT / 2);

      const { x, y } = findNonOverlappingPosition(dropX, dropY, nodes);

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'ingredient',
        label: ingredient.name,
        quantity: ingredient.quantity,
        image: ingredient.image,
        x,
        y,
      };
      setNodes((prev) => [...prev, newNode]);
    }
  };

  const handleToggleSelection = (id: string) => {
    setSelectedNodeIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const updateNodeQuantity = (id: string, qty: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, quantity: qty } : n));
  };

  const autoLayoutNodes = (currentNodes: Node[]) => {
    if (currentNodes.length === 0) return [];

    // Simple tiered layout logic
    // Tier 0: Raw Ingredients
    // Tier 1+: Results based on connection depth
    const levels: Record<string, number> = {};
    
    // Find depth for each node
    const getDepth = (nodeId: string, visited = new Set<string>()): number => {
      if (visited.has(nodeId)) return 0;
      visited.add(nodeId);
      
      const sourceEdges = edges.filter(e => e.targetId === nodeId);
      if (sourceEdges.length === 0) return 0;
      
      const depths = sourceEdges.map(e => getDepth(e.sourceId, visited));
      return 1 + Math.max(...depths);
    };

    currentNodes.forEach(n => {
      levels[n.id] = getDepth(n.id);
    });

    const tierCounts: Record<number, number> = {};
    return currentNodes.map(node => {
      const tier = levels[node.id] || 0;
      const row = tierCounts[tier] || 0;
      tierCounts[tier] = row + 1;

      return {
        ...node,
        x: 100 + tier * (NODE_WIDTH + 150),
        y: 100 + row * (NODE_HEIGHT + 60)
      };
    });
  };

  const organizePlayground = () => {
    setNodes(prev => autoLayoutNodes(prev));
  };

  const simulateProgress = (start: number, end: number, duration: number, onComplete?: () => void) => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const current = Math.min(start + (elapsed / duration) * (end - start), end);
      setProgress(Math.round(current));
      setEta(Math.round((duration - elapsed) / 1000));
      if (elapsed >= duration) {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, 50);
  };

  const executeAction = async () => {
    if (selectedNodeIds.length === 0 || !actionPrompt) return;
    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
      const selectedItems = nodes.filter(n => selectedNodeIds.includes(n.id));
      const result = await processChefPrompt(actionPrompt, { selectedItems });
      
      const maxX = Math.max(...selectedItems.map(n => n.x));
      const avgY = selectedItems.reduce((acc, n) => acc + n.y, 0) / selectedItems.length;

      const newNodeId = `node-${Date.now()}`;
      
      // Place result to the right of the selection, avoiding overlap
      const baseResultX = maxX + GRID_SPACING_X + 50;
      const baseResultY = avgY;
      const { x, y } = findNonOverlappingPosition(baseResultX, baseResultY, nodes);

      const newNode: Node = {
        id: newNodeId,
        type: 'action-result',
        label: result.resultName,
        quantity: result.quantity,
        duration: result.duration,
        image: getIngImage(result.imageKeyword || result.resultName),
        x,
        y,
      };

      const newEdges: Edge[] = selectedItems.map((n, i) => ({
        id: `edge-${Date.now()}-${i}`,
        sourceId: n.id,
        targetId: newNodeId,
        action: result.actionVerb,
        iconType: result.actionType as ActionIconType
      }));

      const newStep: MethodStep = {
        id: `step-${Date.now()}`,
        stepNumber: steps.length + 1,
        action: result.actionVerb,
        ingredients: selectedItems.map(n => n.label),
        durationMinutes: result.duration,
        startTime: calculateStartTime(steps),
        chef: result.chefCategory as ChefCategory || ChefCategory.STATION,
        resultLabel: result.resultName
      };

      setNodes(prev => [...prev, newNode]);
      setEdges(prev => [...prev, ...newEdges]);
      setSteps(prev => [...prev, newStep]);
      setSelectedNodeIds([]);
      setActionPrompt('');
    } catch (error: any) {
      setErrorMessage(error.message || 'Action generation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateStartTime = (currentSteps: MethodStep[]) => {
    if (currentSteps.length === 0) return "08:00 am";
    const lastStep = currentSteps[currentSteps.length - 1];
    const [time, period] = lastStep.startTime.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = (hours % 12) * 60 + (period === 'pm' ? 720 : 0) + minutes + lastStep.durationMinutes;
    
    let newHoursTotal = Math.floor(totalMinutes / 60);
    let newPeriod = newHoursTotal >= 12 && newHoursTotal < 24 ? 'pm' : 'am';
    let newHours = newHoursTotal % 12 || 12;
    let newMinutes = totalMinutes % 60;
    
    return `${newHours}:${newMinutes.toString().padStart(2, '0')} ${newPeriod}`;
  };

  const handleVideoImport = async (type: 'file' | 'url', source: File | string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStatus('uploading');
    setProgress(0);
    setEta(45);

    try {
      await new Promise<void>((resolve) => simulateProgress(0, 40, 1500, () => { setProcessingStatus('analyzing'); resolve(); }));
      await new Promise<void>((resolve) => simulateProgress(40, 80, 2000, () => { setProcessingStatus('mapping'); resolve(); }));

      let base64 = "";
      let mimeType = "video/mp4";

      if (type === 'file') {
        const reader = new FileReader();
        const readPromise = new Promise<string>((res) => {
          reader.onload = (e) => res((e.target?.result as string).split(',')[1]);
          reader.readAsDataURL(source as File);
        });
        base64 = await readPromise;
        mimeType = (source as File).type;
      } else {
        base64 = source as string;
      }

      const data = await analyzeCookingVideo(base64, mimeType);
      
      simulateProgress(80, 100, 800, () => {
        if (data.ingredients) setIngredients(data.ingredients);
        if (data.nodes) setNodes(autoLayoutNodes(data.nodes));
        if (data.edges) setEdges(data.edges);
        if (data.steps) setSteps(data.steps);
        setProcessingStatus('complete');
        setTimeout(() => setIsProcessing(false), 600);
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Video analysis failed.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8fafc] text-slate-900 select-none font-sans overflow-hidden">
      <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <div className="bg-orange-500 p-2.5 rounded-2xl text-white shadow-lg shadow-orange-100 ring-4 ring-orange-50">
            <Zap size={24} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800 leading-none">Chef Creator</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Studio Workbench</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-3xl border border-slate-100">
          <div className="flex items-center gap-2 px-4 border-r border-slate-200 group">
            <Youtube size={20} className="text-red-500" />
            <input 
              type="text" 
              placeholder="YouTube Link..." 
              className="bg-transparent text-sm font-bold focus:outline-none w-48 placeholder:text-slate-300"
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVideoImport('url', ytUrl)}
            />
            <button 
              onClick={() => handleVideoImport('url', ytUrl)}
              className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <label className="flex items-center gap-2 text-indigo-700 px-4 py-2 rounded-2xl cursor-pointer hover:bg-indigo-50 transition-all font-bold text-sm">
            <Upload size={18} />
            File
            <input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleVideoImport('file', e.target.files[0])} />
          </label>
        </div>

        <div className="flex items-center gap-3">
          {!isTimelineView && (
            <button 
              onClick={organizePlayground}
              className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 font-bold text-xs uppercase tracking-widest"
            >
              <RefreshCw size={16} className="text-orange-500" /> Organize Flow
            </button>
          )}
          <button 
            onClick={() => setIsTimelineView(!isTimelineView)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all font-bold text-sm shadow-xl ${isTimelineView ? 'bg-orange-500 text-white shadow-orange-100' : 'bg-slate-900 text-white shadow-slate-200'}`}
          >
            {isTimelineView ? <Layout size={18} /> : <Clock size={18} />}
            {isTimelineView ? 'Playground' : 'Timeline'}
          </button>
        </div>
      </header>

      {isTimelineView ? (
        <TimelineView 
          steps={steps} 
          isSidebarRightExpanded={isSidebarRightExpanded} 
          setIsSidebarRightExpanded={setIsSidebarRightExpanded}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden relative">
          <SidebarLeft 
            ingredients={ingredients} 
            setIngredients={setIngredients} 
            ingredientPrompt={ingredientPrompt}
            setIngredientPrompt={setIngredientPrompt}
          />

          <div 
            className="flex-1 relative overflow-hidden canvas-grid"
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <PlaygroundCanvas 
              nodes={nodes} 
              edges={edges} 
              selectedNodeIds={selectedNodeIds}
              handleToggleSelection={handleToggleSelection}
              updateNodeQuantity={updateNodeQuantity}
            />

            {selectedNodeIds.length > 0 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur shadow-2xl rounded-3xl p-5 border border-slate-200 flex items-center gap-4 w-[650px] z-50 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-orange-500 text-white p-3 rounded-2xl shadow-lg shadow-orange-100"><Scissors size={20}/></div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1 px-1">AI Prompt</p>
                  <input 
                    type="text"
                    placeholder={`Processing ${selectedNodeIds.length} items... e.g. 'Fry until golden'`}
                    className="w-full bg-slate-100/50 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={actionPrompt}
                    onChange={(e) => setActionPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && executeAction()}
                  />
                </div>
                <button 
                  onClick={executeAction}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl hover:bg-black transition-all font-bold shadow-xl shadow-slate-200"
                >
                  Confirm
                </button>
              </div>
            )}
          </div>

          <SidebarRight steps={steps} setSteps={setSteps} />
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-xl z-[100] flex items-center justify-center p-10">
          <div className="bg-white max-w-lg w-full p-12 rounded-[4rem] shadow-2xl border border-slate-100 flex flex-col items-center text-center">
            <div className="relative mb-10">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                <circle 
                  cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="10" fill="transparent" 
                  strokeDasharray={452}
                  strokeDashoffset={452 - (452 * progress) / 100}
                  className="text-orange-500 transition-all duration-300 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-black text-slate-800">{progress}%</span>
              </div>
            </div>

            <h2 className="text-2xl font-black text-slate-800 mb-2 capitalize tracking-tight">{processingStatus}...</h2>
            <div className="flex flex-col gap-5 w-full px-12">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Phase Progress</span>
                <span className="text-slate-600 font-black">{progress}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-500 bg-orange-500 shadow-lg shadow-orange-100" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-[11px] mt-2">
                <Loader2 size={16} className="animate-spin text-orange-500" />
                Estimated time remaining: <span className="text-slate-800 font-black">{eta}s</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SidebarLeft: React.FC<{ 
  ingredients: Ingredient[], 
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>,
  ingredientPrompt: string,
  setIngredientPrompt: React.Dispatch<React.SetStateAction<string>>
}> = ({ ingredients, setIngredients, ingredientPrompt, setIngredientPrompt }) => {
  const handleAddIngredient = () => {
    if (!ingredientPrompt) return;
    const newIng: Ingredient = { id: `i-${Date.now()}`, name: ingredientPrompt, image: getIngImage(ingredientPrompt), quantity: '1 unit' };
    setIngredients(prev => [newIng, ...prev]);
    setIngredientPrompt('');
  };

  return (
    <div className="w-80 border-r border-slate-200 bg-white flex flex-col z-10 shadow-lg">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
        <h2 className="font-black text-slate-800 uppercase tracking-tighter text-lg">Inventory</h2>
        <span className="text-[10px] font-black px-4 py-1.5 bg-slate-900 rounded-full text-white">{ingredients.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {ingredients.map(ing => (
          <div 
            key={ing.id} draggable
            onDragStart={(e) => e.dataTransfer.setData('ingredient', JSON.stringify(ing))}
            className="group relative flex items-center gap-5 p-5 bg-white border border-slate-100 rounded-[2rem] cursor-grab hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-50 transition-all duration-500"
          >
            <div className="relative overflow-hidden w-16 h-16 rounded-2xl shadow-inner bg-slate-100">
               <img src={ing.image} alt={ing.name} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-black text-sm text-slate-900 truncate">{ing.name}</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{ing.quantity}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-8 border-t border-slate-100 bg-slate-50/20">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2.5 shadow-sm focus-within:ring-4 focus-within:ring-orange-50 transition-all">
          <input 
            type="text" placeholder="Add custom item..." 
            className="flex-1 px-4 py-3 text-sm bg-transparent focus:outline-none font-bold"
            value={ingredientPrompt}
            onChange={(e) => setIngredientPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()}
          />
          <button onClick={handleAddIngredient} className="bg-slate-900 text-white p-3.5 rounded-xl hover:bg-orange-500 transition-colors shadow-lg">
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const PlaygroundCanvas: React.FC<{
  nodes: Node[],
  edges: Edge[],
  selectedNodeIds: string[],
  handleToggleSelection: (id: string) => void,
  updateNodeQuantity: (id: string, qty: string) => void
}> = ({ nodes, edges, selectedNodeIds, handleToggleSelection, updateNodeQuantity }) => {
  return (
    <div className="w-full h-full relative p-20 overflow-auto">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '6000px', minHeight: '6000px' }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="6" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#cbd5e1" />
          </marker>
        </defs>
        {edges.map(edge => {
          const source = nodes.find(n => n.id === edge.sourceId);
          const target = nodes.find(n => n.id === edge.targetId);
          if (!source || !target) return null;
          
          const startX = source.x + NODE_WIDTH;
          const startY = source.y + 110;
          const endX = target.x;
          const endY = target.y + 110;
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;

          return (
            <g key={edge.id}>
              <path d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`} stroke="#cbd5e1" strokeWidth="2.5" fill="none" markerEnd="url(#arrowhead)" />
              <g transform={`translate(${midX - 60}, ${midY - 22})`}>
                <rect width="120" height="44" rx="22" fill="white" stroke="#e2e8f0" strokeWidth="1" className="shadow-2xl" />
                <foreignObject width="120" height="44">
                  <div className="w-full h-full flex items-center justify-center gap-2.5 px-3">
                    <ActionIcon type={edge.iconType} size={16} className="text-orange-500" />
                    <span className="text-[11px] font-black text-slate-800 uppercase truncate">{edge.action}</span>
                  </div>
                </foreignObject>
              </g>
            </g>
          );
        })}
      </svg>

      {nodes.map(node => (
        <div 
          key={node.id}
          className={`absolute w-56 p-7 rounded-[3.5rem] border-2 transition-all cursor-pointer shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] group hover:-translate-y-3 ${
            selectedNodeIds.includes(node.id) 
              ? 'border-orange-500 bg-orange-50/50 ring-8 ring-orange-500/10 z-20 scale-105 backdrop-blur-md' 
              : 'border-white bg-white hover:border-orange-200 z-10'
          }`}
          style={{ left: node.x, top: node.y }}
          onClick={() => handleToggleSelection(node.id)}
        >
          {node.image && (
            <div className="relative h-40 w-full overflow-hidden rounded-[2.8rem] bg-slate-50 mb-6 shadow-inner ring-1 ring-slate-100">
              <img src={node.image} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-[1500ms]" />
              {node.duration && (
                <div className="absolute top-5 right-5 bg-slate-900/80 backdrop-blur-lg text-white text-[11px] px-4 py-2 rounded-full flex items-center gap-1.5 font-black shadow-lg">
                  <Clock size={14} className="text-orange-500" /> {node.duration}M
                </div>
              )}
            </div>
          )}
          <p className="font-black text-base text-slate-800 mb-5 truncate px-2 tracking-tight">{node.label}</p>
          <div className="flex items-center gap-3 bg-slate-50/80 rounded-3xl p-4 border border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</span>
            <input 
              type="text" value={node.quantity}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateNodeQuantity(node.id, e.target.value)}
              className="bg-transparent text-[12px] font-black text-slate-900 w-full focus:outline-none"
            />
          </div>
          {node.type === 'action-result' && (
             <div className="absolute -top-4 -right-4 bg-orange-500 text-white text-[10px] px-6 py-2.5 rounded-full uppercase font-black tracking-widest shadow-2xl shadow-orange-200 ring-4 ring-white">AI Result</div>
          )}
        </div>
      ))}
    </div>
  );
};

const SidebarRight: React.FC<{ 
  steps: MethodStep[],
  setSteps: React.Dispatch<React.SetStateAction<MethodStep[]>>
}> = ({ steps, setSteps }) => {
  const updateChef = (stepId: string, chef: ChefCategory) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, chef } : s));
  };

  return (
    <div className="w-80 border-l border-slate-200 bg-white flex flex-col z-10 shadow-2xl">
      <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50/20">
        <Scissors size={24} className="text-orange-500" />
        <h2 className="font-black text-slate-800 uppercase tracking-tighter text-lg">Process</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-10">
        {steps.map((step) => (
          <div key={step.id} className="relative bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl transition-all">
            <div className="absolute -left-5 top-8 w-14 h-14 bg-slate-900 text-white text-lg flex items-center justify-center rounded-3xl font-black shadow-2xl ring-[6px] ring-white">
              {step.stepNumber}
            </div>
            <div className="ml-12">
              <div className="flex justify-between items-center mb-5">
                <span className="text-[11px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-5 py-2 rounded-full">{step.startTime}</span>
                <span className="flex items-center gap-1.5 text-[11px] font-black text-slate-300">
                  <Clock size={14} /> {step.durationMinutes}m
                </span>
              </div>
              <p className="text-sm font-black text-slate-800 mb-5 leading-snug capitalize tracking-tight">{step.action} {step.ingredients.join(' & ')}</p>
              <div className="pt-8 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-5 tracking-widest">Staff Assigned</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {Object.values(ChefCategory).map(cat => (
                    <button 
                      key={cat} onClick={() => updateChef(step.id, cat)}
                      className={`text-[10px] px-3 py-3.5 rounded-2xl transition-all font-black uppercase tracking-widest ${step.chef === cat ? 'bg-slate-900 text-white shadow-2xl' : 'bg-slate-50 text-slate-400 hover:bg-slate-200'}`}
                    >
                      {cat.split(' ')[0]}
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

const TimelineView: React.FC<{ 
  steps: MethodStep[],
  isSidebarRightExpanded: boolean,
  setIsSidebarRightExpanded: (v: boolean) => void
}> = ({ steps, isSidebarRightExpanded, setIsSidebarRightExpanded }) => {
  const chefs = Object.values(ChefCategory);
  const hours = Array.from({ length: 12 }, (_, i) => 8 + i);

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-20 border-b border-slate-100 flex items-center px-12 justify-between bg-white shadow-sm z-10">
          <div className="flex items-center gap-10">
             <div className="flex items-center gap-4">
               <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-pulse"></div> 
               <span className="text-base font-black text-slate-800 uppercase tracking-[0.2em]">Operational Schedule</span>
             </div>
             <div className="text-[11px] text-slate-300 font-black border-l border-slate-200 pl-10 uppercase tracking-[0.3em]">
               {steps.length} Tasks Scheduled
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto relative p-16 bg-[#fafbfc]">
          <div className="min-w-[2000px] bg-white rounded-[5rem] shadow-2xl shadow-slate-200/50 p-12 border border-slate-100">
            <div className="flex h-20 mb-10 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md z-20 rounded-[3rem] px-8 items-center">
              <div className="w-80 shrink-0 px-10 border-r border-slate-50">
                <span className="text-[12px] font-black text-slate-300 uppercase tracking-[0.4em]">Lane Allocation</span>
              </div>
              <div className="flex-1 flex">
                {hours.map(h => (
                  <div key={h} className="flex-1 border-l border-slate-50 px-10 text-[13px] text-slate-400 font-black">
                    {h > 12 ? h - 12 : h}:00 {h >= 12 ? 'PM' : 'AM'}
                  </div>
                ))}
              </div>
            </div>

            {chefs.map(chef => (
              <div key={chef} className="flex h-52 items-center group relative border-b border-slate-50 last:border-0">
                <div className="w-80 shrink-0 flex items-center gap-8 px-10">
                  <div className="w-24 h-24 rounded-[3.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-[800ms] shadow-xl">
                    <User size={44} strokeWidth={3} />
                  </div>
                  <div>
                    <span className="text-xl font-black text-slate-800 tracking-tighter block">{chef}</span>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">{steps.filter(s => s.chef === chef).length} Active</span>
                  </div>
                </div>
                <div className="flex-1 h-36 relative bg-slate-50/50 rounded-[4rem] mx-8 my-8 border border-slate-100/40 shadow-inner">
                  {steps.filter(s => s.chef === chef).map(step => {
                    const [time, period] = step.startTime.split(' ');
                    const [h, m] = time.split(':').map(Number);
                    const totalMins = ((h % 12) + (period === 'pm' ? 12 : 0) - 8) * 60 + m;
                    const leftOffset = (totalMins / (12 * 60)) * 100;
                    const widthPercent = (step.durationMinutes / (12 * 60)) * 100;

                    return (
                      <div 
                        key={step.id}
                        className="absolute h-28 top-4 bg-white border-2 border-slate-900 rounded-[2.8rem] p-8 flex flex-col justify-center overflow-hidden hover:scale-[1.05] hover:shadow-[0_45px_80px_-20px_rgba(0,0,0,0.12)] transition-all cursor-help group/step z-10"
                        style={{ left: `${leftOffset}%`, width: `${widthPercent}%`, minWidth: '260px' }}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[11px] font-black text-orange-500 uppercase tracking-widest">Phase {step.stepNumber}</span>
                          <span className="text-[11px] font-black text-slate-300">{step.startTime}</span>
                        </div>
                        <p className="text-base font-black text-slate-800 truncate leading-tight uppercase tracking-tighter">{step.action} {step.ingredients[0]}</p>
                        <div className="absolute inset-0 bg-white p-10 opacity-0 group-hover/step:opacity-100 transition-all duration-700 flex flex-col justify-center pointer-events-none border-2 border-slate-900 rounded-[2.8rem]">
                           <p className="text-[11px] font-black text-orange-500 uppercase mb-4 tracking-[0.2em]">Detailed Instruction</p>
                           <p className="text-lg font-black text-slate-800 leading-tight uppercase tracking-tighter">{step.action} {step.ingredients.join(' + ')}</p>
                           <p className="text-[12px] text-slate-400 mt-5 font-black uppercase tracking-widest flex items-center gap-2.5"><CheckCircle2 size={16}/> Yield: {step.resultLabel}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`transition-all duration-[1000ms] border-l border-slate-100 bg-white flex flex-col shadow-2xl ${isSidebarRightExpanded ? 'w-[450px]' : 'w-28'}`}>
        <button 
          onClick={() => setIsSidebarRightExpanded(!isSidebarRightExpanded)}
          className="h-20 border-b border-slate-100 flex items-center justify-center hover:bg-slate-50 text-slate-400 transition-colors"
        >
          {isSidebarRightExpanded ? <ChevronRight size={40} /> : <ChevronLeft size={40} />}
        </button>
        {isSidebarRightExpanded && (
          <div className="flex-1 overflow-y-auto p-16 space-y-16">
             <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.5em] mb-16 border-b border-slate-100 pb-10">Production Manifest</h3>
             {steps.map(s => (
               <div key={s.id} className="group relative">
                  <div className="flex items-center gap-8 mb-8">
                    <div className="w-16 h-16 rounded-[2.2rem] bg-slate-900 text-white text-sm flex items-center justify-center font-black shadow-2xl ring-[10px] ring-slate-50">{s.stepNumber}</div>
                    <span className="text-base text-orange-500 font-black tracking-widest">{s.startTime}</span>
                  </div>
                  <div className="bg-slate-50 group-hover:bg-white group-hover:shadow-[0_50px_90px_-25px_rgba(0,0,0,0.1)] transition-all p-10 rounded-[3.5rem] border border-slate-100">
                    <p className="text-base font-black text-slate-800 leading-relaxed uppercase tracking-tighter">{s.action} {s.ingredients.join(', ')}</p>
                    <div className="mt-8 flex items-center gap-4">
                       <div className="w-10 h-10 rounded-2xl bg-white shadow-lg flex items-center justify-center text-slate-400"><User size={18} /></div>
                       <p className="text-[12px] text-slate-400 font-black uppercase tracking-[0.3em]">{s.chef}</p>
                    </div>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
