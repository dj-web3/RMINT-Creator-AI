
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
  Square
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

const getIngImage = (name: string) => `https://loremflickr.com/320/240/food,${encodeURIComponent(name.toLowerCase())}?lock=${Math.floor(Math.random() * 1000)}`;

const MOCK_INGREDIENTS: Ingredient[] = [
  { id: 'i1', name: 'Fresh Ginger', image: getIngImage('ginger'), quantity: '50g' },
  { id: 'i2', name: 'Red Onion', image: getIngImage('onion'), quantity: '2 medium' },
  { id: 'i3', name: 'Ripe Tomato', image: getIngImage('tomato'), quantity: '3 large' },
  { id: 'i4', name: 'Garlic Bulbs', image: getIngImage('garlic'), quantity: '10 cloves' },
  { id: 'i5', name: 'Green Chili', image: getIngImage('chili'), quantity: '2 small' },
];

const ActionIcon: React.FC<{ type: ActionIconType; size?: number; className?: string }> = ({ type, size = 16, className }) => {
  switch (type) {
    case 'cooking': return <Flame size={size} className={className} />;
    case 'resting': return <Thermometer size={size} className={className} />;
    case 'waiting': return <Timer size={size} className={className} />;
    case 'baking': return <Square size={size} className={className} />; // Placeholder for Oven/Baking
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
  const [isTimelineView, setIsTimelineView] = useState(false);
  const [isSidebarRightExpanded, setIsSidebarRightExpanded] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('ingredient');
    if (data) {
      const ingredient = JSON.parse(data) as Ingredient;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      
      // Smart placement to avoid direct overlap
      const padding = 20;
      const gridX = Math.round((e.clientX - rect.left - 40) / 20) * 20;
      const gridY = Math.round((e.clientY - rect.top - 40) / 20) * 20;

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'ingredient',
        label: ingredient.name,
        quantity: ingredient.quantity,
        image: ingredient.image,
        x: gridX,
        y: gridY,
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

  const executeAction = async () => {
    if (selectedNodeIds.length === 0 || !actionPrompt) return;
    setIsProcessing(true);
    
    try {
      const selectedItems = nodes.filter(n => selectedNodeIds.includes(n.id));
      const result = await processChefPrompt(actionPrompt, { selectedItems });
      
      const maxX = Math.max(...selectedItems.map(n => n.x));
      const avgY = selectedItems.reduce((acc, n) => acc + n.y, 0) / selectedItems.length;

      const newNodeId = `node-${Date.now()}`;
      const newNode: Node = {
        id: newNodeId,
        type: 'action-result',
        label: result.resultName,
        quantity: result.quantity,
        duration: result.duration,
        image: getIngImage(result.imageKeyword || result.resultName),
        x: maxX + 280,
        y: avgY,
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
    } catch (error) {
      console.error(error);
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      try {
        const data = await analyzeCookingVideo(base64, file.type);
        if (data.ingredients) setIngredients(data.ingredients);
        if (data.nodes) setNodes(data.nodes);
        if (data.edges) setEdges(data.edges);
        if (data.steps) setSteps(data.steps);
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8fafc] text-slate-900 select-none font-sans">
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-xl text-white shadow-lg shadow-orange-200">
            <Zap size={20} fill="currentColor" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Chef Creator <span className="text-orange-500 font-medium">Studio</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-5 py-2.5 rounded-full cursor-pointer hover:bg-indigo-100 transition-all font-bold text-sm border border-indigo-100">
            <Upload size={16} />
            AI Video Import
            <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
          </label>
          <button 
            onClick={() => setIsTimelineView(!isTimelineView)}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-full hover:bg-slate-800 transition-all font-bold text-sm shadow-xl shadow-slate-200"
          >
            {isTimelineView ? <Layout size={18} /> : <Clock size={18} />}
            {isTimelineView ? 'Playground' : 'Professional Timeline'}
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
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-4 border border-slate-200 flex items-center gap-3 w-[600px] z-50 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-orange-100 text-orange-600 p-2 rounded-lg"><Scissors size={18}/></div>
                <input 
                  type="text"
                  placeholder={`Apply action to ${selectedNodeIds.length} items... (e.g. 'Sauté until golden')`}
                  className="flex-1 bg-slate-100/50 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
                  value={actionPrompt}
                  onChange={(e) => setActionPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && executeAction()}
                />
                <button 
                  onClick={executeAction}
                  disabled={isProcessing}
                  className="bg-orange-500 text-white px-5 py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all font-bold shadow-lg shadow-orange-100"
                >
                  Combine
                </button>
              </div>
            )}
          </div>

          <SidebarRight steps={steps} setSteps={setSteps} />
        </div>
      )}

      {isProcessing && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-[6px] border-orange-100 rounded-full"></div>
              <div className="w-16 h-16 border-[6px] border-orange-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <div className="text-center">
              <p className="font-black text-xl text-slate-800">Master AI Chef Working</p>
              <p className="text-slate-400 text-sm mt-1">Extracting flavors and steps...</p>
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
    const newIng: Ingredient = {
      id: `i-${Date.now()}`,
      name: ingredientPrompt,
      image: getIngImage(ingredientPrompt),
      quantity: '1 unit'
    };
    setIngredients(prev => [newIng, ...prev]);
    setIngredientPrompt('');
  };

  return (
    <div className="w-80 border-r border-slate-200 bg-white flex flex-col z-10">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-extrabold text-slate-800">Ingredient Library</h2>
        <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-slate-900 rounded-lg text-white">{ingredients.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {ingredients.map(ing => (
          <div 
            key={ing.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('ingredient', JSON.stringify(ing))}
            className="group relative flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl cursor-grab hover:border-orange-200 hover:shadow-xl hover:shadow-orange-50 transition-all duration-300"
          >
            <div className="relative overflow-hidden w-14 h-14 rounded-xl shadow-inner bg-slate-100">
               <img src={ing.image} alt={ing.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-bold text-sm text-slate-900 truncate">{ing.name}</p>
              <p className="text-xs text-slate-400 font-medium">{ing.quantity}</p>
            </div>
            <button 
              onClick={() => setIngredients(prev => prev.filter(i => i.id !== ing.id))}
              className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all hover:bg-red-50 rounded-lg"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-100 bg-slate-50/80">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-orange-200 transition-all">
          <input 
            type="text" 
            placeholder="Search or add ingredient..." 
            className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none font-medium"
            value={ingredientPrompt}
            onChange={(e) => setIngredientPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()}
          />
          <button 
            onClick={handleAddIngredient}
            className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-orange-500 transition-colors shadow-md"
          >
            <Plus size={18} />
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
    <div className="w-full h-full relative p-20">
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <marker id="arrowhead" markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto">
            <polygon points="0 0, 12 4, 0 8" fill="#94a3b8" />
          </marker>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="1" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.1" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {edges.map(edge => {
          const source = nodes.find(n => n.id === edge.sourceId);
          const target = nodes.find(n => n.id === edge.targetId);
          if (!source || !target) return null;
          
          const startX = source.x + 200;
          const startY = source.y + 60;
          const endX = target.x;
          const endY = target.y + 60;
          
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;

          return (
            <g key={edge.id} className="transition-all duration-500">
              <path 
                d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                stroke="#cbd5e1"
                strokeWidth="3"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
              <g transform={`translate(${midX - 45}, ${midY - 15})`} filter="url(#shadow)">
                <rect width="90" height="30" rx="15" fill="white" stroke="#e2e8f0" strokeWidth="1" />
                <ActionIcon type={edge.iconType} size={14} className="text-orange-500" transform="translate(10, 8)" />
                <text x="50" y="20" textAnchor="middle" fontSize="11" className="fill-slate-600 font-bold capitalize">{edge.action}</text>
              </g>
            </g>
          );
        })}
      </svg>

      {nodes.map(node => (
        <div 
          key={node.id}
          className={`absolute w-52 p-4 rounded-[1.5rem] border-2 transition-all cursor-pointer shadow-xl group hover:-translate-y-1 ${
            selectedNodeIds.includes(node.id) 
              ? 'border-orange-500 bg-orange-50 ring-8 ring-orange-500/10 z-20 scale-105' 
              : 'border-white bg-white hover:border-orange-100 z-10'
          }`}
          style={{ left: node.x, top: node.y }}
          onClick={() => handleToggleSelection(node.id)}
        >
          {node.image && (
            <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-slate-50 mb-4">
              <img src={node.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              {node.duration && (
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9px] px-2 py-1 rounded-full flex items-center gap-1 font-black">
                  <Clock size={10} /> {node.duration}M
                </div>
              )}
            </div>
          )}
          <div>
            <p className="font-black text-sm text-slate-800 mb-1 truncate">{node.label}</p>
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1.5 border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Qty:</span>
              <input 
                type="text"
                value={node.quantity}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => updateNodeQuantity(node.id, e.target.value)}
                className="bg-transparent text-[11px] font-bold text-slate-600 w-full focus:outline-none"
              />
            </div>
          </div>
          {node.type === 'action-result' && (
             <div className="absolute -top-3 -right-3 bg-orange-500 text-white text-[9px] px-3 py-1 rounded-full uppercase font-black tracking-widest shadow-lg shadow-orange-200">Result</div>
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
      <div className="p-6 border-b border-slate-100">
        <h2 className="font-extrabold text-slate-800 flex items-center gap-2">
          <Scissors size={20} className="text-orange-500" />
          Execution Log
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {steps.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 px-10 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
              <Layout size={32} strokeWidth={1} />
            </div>
            <p className="text-sm font-medium">Connect nodes in the playground to see automatic method steps.</p>
          </div>
        )}
        {steps.map((step) => (
          <div key={step.id} className="relative bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute -left-3 top-5 w-8 h-8 bg-slate-900 text-white text-xs flex items-center justify-center rounded-2xl font-black shadow-lg">
              {step.stepNumber}
            </div>
            <div className="ml-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-md">{step.startTime}</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <Clock size={12} /> {step.durationMinutes}m
                </span>
              </div>
              <p className="text-sm font-bold text-slate-800 mb-2 leading-tight capitalize">
                {step.action} {step.ingredients.join(' & ')}
              </p>
              <div className="bg-slate-50 rounded-xl p-2.5 mb-4 border border-dashed border-slate-200">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Yields</p>
                <p className="text-xs font-bold text-slate-600 italic">{step.resultLabel}</p>
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Assign Specialist</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(ChefCategory).map(cat => (
                    <button 
                      key={cat}
                      onClick={() => updateChef(step.id, cat)}
                      className={`text-[9px] px-2 py-2 rounded-xl transition-all font-bold ${
                        step.chef === cat 
                          ? 'bg-slate-900 text-white shadow-lg' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
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
  const hours = Array.from({ length: 12 }, (_, i) => 8 + i); // 8am to 8pm

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-14 border-b border-slate-100 flex items-center px-8 justify-between bg-white shadow-sm z-10">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div> <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Plan: Live</span></div>
             <div className="text-xs text-slate-400 font-bold border-l border-slate-200 pl-6 uppercase tracking-wider">Total Duration: {steps.reduce((acc, s) => acc + s.durationMinutes, 0)}m</div>
          </div>
          <div className="flex items-center gap-3">
             <button className="px-4 py-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors text-xs font-bold">Export PDF</button>
             <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"><Minimize2 size={18} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto relative p-8 bg-[#fdfdfd]">
          <div className="min-w-[1500px]">
            <div className="flex h-12 mb-4 border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-20 rounded-xl">
              <div className="w-56 shrink-0 flex items-center px-6">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Specialist Tracks</span>
              </div>
              <div className="flex-1 flex">
                {hours.map(h => (
                  <div key={h} className="flex-1 border-l border-slate-50 px-4 text-[11px] text-slate-400 font-black pt-3">
                    {h > 12 ? h - 12 : h}:00 {h >= 12 ? 'PM' : 'AM'}
                  </div>
                ))}
              </div>
            </div>

            {chefs.map(chef => (
              <div key={chef} className="flex h-28 items-center group relative">
                <div className="w-56 shrink-0 flex items-center gap-4 px-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-xl group-hover:shadow-orange-100 transition-all duration-300">
                    <User size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-sm font-black text-slate-800 tracking-tight block">{chef}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{steps.filter(s => s.chef === chef).length} Tasks</span>
                  </div>
                </div>
                <div className="flex-1 h-20 border-b border-slate-50 relative bg-slate-50/20 rounded-2xl mx-2">
                  {steps.filter(s => s.chef === chef).map(step => {
                    const [time, period] = step.startTime.split(' ');
                    const [h, m] = time.split(':').map(Number);
                    const totalMins = ((h % 12) + (period === 'pm' ? 12 : 0) - 8) * 60 + m;
                    const leftOffset = (totalMins / (12 * 60)) * 100;
                    const widthPercent = (step.durationMinutes / (12 * 60)) * 100;

                    return (
                      <div 
                        key={step.id}
                        className="absolute h-16 top-2 bg-white border-2 border-orange-500 rounded-2xl p-4 flex flex-col justify-center overflow-hidden hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-100 transition-all cursor-help group/step z-10"
                        style={{ left: `${leftOffset}%`, width: `${widthPercent}%`, minWidth: '150px' }}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-black text-orange-500 truncate uppercase tracking-tighter">Step {step.stepNumber}</span>
                          <span className="text-[9px] font-bold text-slate-300">{step.startTime}</span>
                        </div>
                        <p className="text-xs font-black text-slate-800 truncate leading-tight capitalize">{step.action} {step.ingredients[0]}</p>
                        
                        <div className="absolute inset-0 bg-white p-4 opacity-0 group-hover/step:opacity-100 transition-opacity flex flex-col justify-center pointer-events-none border-2 border-orange-500 rounded-2xl">
                           <p className="text-[10px] font-black text-orange-500 uppercase mb-1">Task Detail</p>
                           <p className="text-xs font-black text-slate-800 leading-tight capitalize">{step.action} {step.ingredients.join(' & ')}</p>
                           <p className="text-[10px] text-slate-400 mt-1 font-bold">Result: {step.resultLabel} ({step.durationMinutes}m)</p>
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

      <div className={`transition-all duration-500 border-l border-slate-100 bg-white flex flex-col shadow-2xl ${isSidebarRightExpanded ? 'w-96' : 'w-16'}`}>
        <button 
          onClick={() => setIsSidebarRightExpanded(!isSidebarRightExpanded)}
          className="h-14 border-b border-slate-100 flex items-center justify-center hover:bg-slate-50 text-slate-400"
        >
          {isSidebarRightExpanded ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
        {isSidebarRightExpanded && (
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
             <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Master Method Checklist</h3>
             {steps.map(s => (
               <div key={s.id} className="group relative">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-7 h-7 rounded-xl bg-slate-900 text-white text-[10px] flex items-center justify-center font-black shadow-lg">{s.stepNumber}</div>
                    <span className="text-[11px] text-orange-500 font-black tracking-widest">{s.startTime}</span>
                  </div>
                  <div className="bg-slate-50 group-hover:bg-white group-hover:shadow-xl group-hover:shadow-orange-50 transition-all p-5 rounded-2xl border border-slate-100">
                    <p className="text-xs font-black text-slate-800 leading-relaxed capitalize">{s.action} {s.ingredients.join(', ')}</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest flex items-center gap-1"><User size={10} /> {s.chef}</p>
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
