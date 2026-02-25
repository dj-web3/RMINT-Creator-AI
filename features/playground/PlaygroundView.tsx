
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Clock, 
  Sparkles, 
  ChefHat, 
  ChevronRight, 
  Layers,
  Info,
  MousePointer2,
  Hand,
  Youtube,
  Loader2,
  ArrowRight,
  FileText,
  Maximize2
} from 'lucide-react';
import { Node, Edge, StepGroup, Ingredient, ChefCategory, ActionIconType } from '../../types';
import { useCanvasTransform } from '../../hooks/useCanvasTransform';
import { ActionIcon, getIngImage } from '../../utils/ui-helpers';
import { processChefPrompt } from '../../services/geminiService';
import { GoogleGenAI, Type } from "@google/genai";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 180; 
const HORIZONTAL_SPACING = 350;
const VERTICAL_SPACING = 120;

interface PlaygroundProps {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  stepGroups: StepGroup[];
  setStepGroups: React.Dispatch<React.SetStateAction<StepGroup[]>>;
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
}

export const PlaygroundView: React.FC<PlaygroundProps> = ({ 
  nodes, setNodes, edges, setEdges, stepGroups, setStepGroups, ingredients, setIngredients 
}) => {
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [actionPrompt, setActionPrompt] = useState('');
  const [ingredientPrompt, setIngredientPrompt] = useState('');
  const [isPanningMode, setIsPanningMode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [importMode, setImportMode] = useState<'url' | 'transcript'>('url');
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const pgCanvas = useCanvasTransform();

  const handleToggleSelection = (id: string) => {
    if (isPanningMode) return;
    setSelectedNodeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isPanning) {
      setSelectedNodeIds([]);
    }
  };

  const isOverlapping = (x: number, y: number, currentNodes: Node[]) => {
    return currentNodes.some(node => {
      return (
        x < node.x + NODE_WIDTH + 60 &&
        x + NODE_WIDTH + 60 > node.x &&
        y < node.y + NODE_HEIGHT + 60 &&
        y + NODE_HEIGHT + 60 > node.y
      );
    });
  };

  const findBestPosition = (targetX: number, targetY: number, currentNodes: Node[]) => {
    let x = targetX;
    let y = targetY;
    let attempts = 0;
    const maxAttempts = 150;

    while (isOverlapping(x, y, currentNodes) && attempts < maxAttempts) {
      y += 120;
      if (attempts > 8 && attempts % 8 === 0) {
        y = targetY;
        x += 350;
      }
      attempts++;
    }
    return { x, y };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('ingredient');
    if (!data || !canvasRef.current) return;

    const ing = JSON.parse(data);
    const rect = canvasRef.current.getBoundingClientRect();
    
    const xRaw = (e.clientX - rect.left - pgCanvas.offset.x) / pgCanvas.scale;
    const yRaw = (e.clientY - rect.top - pgCanvas.offset.y) / pgCanvas.scale;

    const { x, y } = findBestPosition(xRaw - (NODE_WIDTH / 2), yRaw - (NODE_HEIGHT / 4), nodes);

    const newNodeId = `node-ing-${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type: 'input',
      label: ing.name.toUpperCase(),
      image: ing.image,
      quantity: ing.quantity.toUpperCase(),
      x,
      y,
      content: `Base ingredient: ${ing.name}`
    };

    setNodes(prev => [...prev, newNode]);
  };

  const executeActionInstant = async () => {
    if (selectedNodeIds.length === 0 || !actionPrompt) return;
    
    const selectedItems = nodes.filter(n => selectedNodeIds.includes(n.id));
    const maxX = Math.max(...selectedItems.map(n => n.x + NODE_WIDTH));
    const avgY = selectedItems.reduce((acc, n) => acc + n.y, 0) / selectedItems.length;
    
    const initialTargetX = maxX + HORIZONTAL_SPACING;
    const initialTargetY = avgY;

    const { x, y } = findBestPosition(initialTargetX, initialTargetY, nodes);

    const newNodeId = `node-act-${Date.now()}`;
    const newNode: Node = { 
      id: newNodeId, 
      type: 'instructions', 
      label: actionPrompt.toUpperCase(), 
      quantity: 'CALCULATING...', 
      image: getIngImage(actionPrompt), 
      x, 
      y, 
      content: 'Synthesizing culinary path...' 
    };

    setNodes(prev => [...prev, newNode]);
    setEdges(prev => [
      ...prev, 
      ...selectedItems.map((n, i) => ({ 
        id: `e-${Date.now()}-${i}`, 
        sourceId: n.id, 
        targetId: newNodeId, 
        action: actionPrompt.toUpperCase(), 
        iconType: 'default' as ActionIconType 
      }))
    ]);

    const res = await processChefPrompt(actionPrompt, { selectedItems });
    
    setNodes(prev => prev.map(n => n.id === newNodeId ? { 
      ...n, 
      label: res.resultName.toUpperCase(), 
      quantity: res.quantity, 
      duration: res.duration, 
      content: res.subSteps?.[0]?.instruction,
      subSteps: res.subSteps
    } : n));

    const newGroupId = `g-${Date.now()}`;
    const newGroup: StepGroup = {
      id: newGroupId,
      label: res.resultName.toUpperCase(),
      nodeIds: [...selectedNodeIds, newNodeId],
      color: '#f97316',
      assignedChef: ChefCategory.SOUS,
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: res.duration || 15
    };
    setStepGroups(prev => [...prev, newGroup]);

    setSelectedNodeIds([]); 
    setActionPrompt('');
  };

  const handleNeuralImport = async () => {
    const input = importMode === 'url' ? youtubeUrl : transcript;
    if (!input) return;
    setIsImporting(true);
    
    try {
      // Clear existing state for a clean recipe breakdown as requested
      setNodes([]);
      setEdges([]);
      setStepGroups([]);
      setIngredients([]);
      setSelectedNodeIds([]);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const promptText = importMode === 'url' 
        ? `Break down this YouTube recipe: ${youtubeUrl}. Extract all ingredients and create a sequence of transformation steps.` 
        : `Break down this recipe transcript: ${transcript}. Extract all ingredients and create a sequence of transformation steps.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recipeName: { type: Type.STRING },
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.STRING }
                  },
                  required: ["name", "quantity"]
                }
              },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    instruction: { type: Type.STRING },
                    duration: { type: Type.NUMBER },
                    inputIndices: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: "Indices of ingredients or previous steps used in this step" },
                    chef: { type: Type.STRING }
                  },
                  required: ["label", "instruction", "duration", "inputIndices"]
                }
              }
            },
            required: ["recipeName", "ingredients", "steps"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      const ingredientNodes: Node[] = (result.ingredients || []).map((ing: any, i: number) => ({
        id: `node-ing-${i}`,
        type: 'input',
        label: ing.name.toUpperCase(),
        image: getIngImage(ing.name),
        quantity: ing.quantity.toUpperCase(),
        x: 100,
        y: 100 + (i * (NODE_HEIGHT + 40)),
        content: `Base ingredient for ${result.recipeName}`
      }));

      const newIngredients: Ingredient[] = (result.ingredients || []).map((ing: any, i: number) => ({
        id: `ing-${i}`,
        name: ing.name.toUpperCase(),
        image: getIngImage(ing.name),
        quantity: ing.quantity.toUpperCase()
      }));

      const stepNodes: Node[] = (result.steps || []).map((step: any, i: number) => ({
        id: `node-step-${i}`,
        type: 'instructions',
        label: step.label.toUpperCase(),
        image: getIngImage(step.label),
        quantity: 'PREPARED',
        duration: step.duration,
        x: 100 + HORIZONTAL_SPACING,
        y: 100 + (i * (NODE_HEIGHT + 40)),
        content: step.instruction,
        subSteps: [{ instruction: step.instruction, duration: step.duration }]
      }));

      // Adjust X positions for steps based on dependency chain to avoid overlapping
      // For this simplified logic, we'll just push all steps to the second column
      // but distribute them vertically to avoid overlapping
      const totalSteps = stepNodes.length;
      const centerY = (ingredientNodes.length * (NODE_HEIGHT + 40)) / 2;
      stepNodes.forEach((node, i) => {
        node.y = centerY - ((totalSteps * (NODE_HEIGHT + 40)) / 2) + (i * (NODE_HEIGHT + 40));
      });

      const newEdges: Edge[] = [];
      result.steps?.forEach((step: any, stepIdx: number) => {
        step.inputIndices?.forEach((inputIdx: number) => {
          // Assume indices 0 to result.ingredients.length - 1 are ingredients
          if (inputIdx < result.ingredients.length) {
            newEdges.push({
              id: `edge-${stepIdx}-${inputIdx}`,
              sourceId: `node-ing-${inputIdx}`,
              targetId: `node-step-${stepIdx}`,
              action: 'PREP',
              iconType: 'default'
            });
          }
        });
        
        // Connect steps sequentially if they aren't already linked to ingredients
        if (stepIdx > 0) {
          newEdges.push({
            id: `edge-seq-${stepIdx}`,
            sourceId: `node-step-${stepIdx - 1}`,
            targetId: `node-step-${stepIdx}`,
            action: 'PROCESS',
            iconType: 'default'
          });
        }
      });

      const newGroups: StepGroup[] = (result.steps || []).map((step: any, i: number) => ({
        id: `group-step-${i}`,
        label: step.label.toUpperCase(),
        nodeIds: [`node-step-${i}`],
        color: i % 2 === 0 ? '#fef3c7' : '#fee2e2',
        assignedChef: (step.chef || ChefCategory.STATION) as ChefCategory,
        startTime: `${9 + i}:00 AM`,
        durationMinutes: step.duration
      }));

      setIngredients(newIngredients);
      setNodes([...ingredientNodes, ...stepNodes]);
      setEdges(newEdges);
      setStepGroups(newGroups);
      
      if (importMode === 'url') setYoutubeUrl('');
      else setTranscript('');
    } catch (e) {
      console.error("Neural Import Error:", e);
    } finally {
      setIsImporting(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPanningMode || e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      const startX = e.clientX - pgCanvas.offset.x;
      const startY = e.clientY - pgCanvas.offset.y;

      const handleMouseMove = (me: MouseEvent) => {
        pgCanvas.setOffset({ x: me.clientX - startX, y: me.clientY - startY });
      };

      const handleMouseUp = () => {
        setIsPanning(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden relative bg-[#fcfaf8]">
      <SidebarLeft 
        ingredients={ingredients} 
        setIngredients={setIngredients} 
        ingredientPrompt={ingredientPrompt} 
        setIngredientPrompt={setIngredientPrompt}
        youtubeUrl={youtubeUrl}
        setYoutubeUrl={setYoutubeUrl}
        transcript={transcript}
        setTranscript={setTranscript}
        onNeuralImport={handleNeuralImport}
        isImporting={isImporting}
        importMode={importMode}
        setImportMode={setImportMode}
      />
      
      <div 
        ref={canvasRef}
        className={`flex-1 relative overflow-hidden canvas-grid ${isPanningMode ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : (isPanning ? 'cursor-grabbing' : 'cursor-default')}`} 
        onWheel={pgCanvas.handleWheel}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onMouseDown={handleMouseDown}
        onClick={handleCanvasClick}
      >
        <motion.div 
          className="w-full h-full relative origin-top-left pointer-events-none" 
          animate={{ x: pgCanvas.offset.x, y: pgCanvas.offset.y, scale: pgCanvas.scale }}
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        >
          <PlaygroundCanvas 
            nodes={nodes} 
            edges={edges} 
            selectedNodeIds={selectedNodeIds} 
            handleToggleSelection={handleToggleSelection} 
            updateNodeQuantity={(id, qty) => setNodes(prev => prev.map(n => n.id === id ? { ...n, quantity: qty } : n))} 
          />
        </motion.div>

        {/* Legend / Tooltip */}
        <div className="absolute top-6 left-6 flex items-center gap-3 bg-white/80 backdrop-blur border border-slate-200 px-4 py-2 rounded-2xl shadow-sm pointer-events-none">
          <Info size={14} className="text-orange-500" />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            {isPanningMode ? 'Panning Active' : 'Drag from pantry • Click to select • Space/Alt for Hand'}
          </span>
        </div>

        {/* Action Prompt Bar */}
        <AnimatePresence>
          {selectedNodeIds.length > 0 && !isPanningMode && (
            <motion.div 
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 50, x: '-50%' }}
              className="absolute bottom-10 left-1/2 bg-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2.5rem] p-3 border border-white/10 flex items-center gap-3 w-[560px] z-[100] backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-orange-500 text-white p-3.5 rounded-[1.8rem] shadow-lg shadow-orange-500/20">
                <Sparkles size={20}/>
              </div>
              <div className="flex-1 px-2">
                <input 
                  type="text" 
                  autoFocus
                  placeholder={`Transform ${selectedNodeIds.length} items...`} 
                  className="w-full bg-transparent border-none text-white text-[13px] font-bold focus:outline-none placeholder:text-slate-500" 
                  value={actionPrompt} 
                  onChange={(e) => setActionPrompt(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && executeActionInstant()} 
                />
              </div>
              <button 
                onClick={executeActionInstant} 
                className="bg-white text-slate-900 px-8 py-3 rounded-[1.8rem] font-black text-[10px] uppercase hover:bg-orange-500 hover:text-white transition-all active:scale-95"
              >
                Execute
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Controls */}
        <div className="absolute bottom-10 right-10 flex flex-col gap-3">
          <div className="flex flex-col gap-1 bg-white border border-slate-200 rounded-2xl shadow-xl p-1 overflow-hidden">
             <button 
               onClick={() => setIsPanningMode(!isPanningMode)} 
               className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isPanningMode ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
               title="Hand Tool (Pan)"
             >
                <Hand size={20} />
             </button>
             <button 
               onClick={() => setIsPanningMode(false)} 
               className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${!isPanningMode ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
               title="Select Tool"
             >
                <MousePointer2 size={20} />
             </button>
          </div>
          <div className="flex flex-col gap-1 bg-white border border-slate-200 rounded-2xl shadow-xl p-1 overflow-hidden">
            <button onClick={() => pgCanvas.setScale(s => Math.min(s + 0.2, 3))} className="w-12 h-12 flex items-center justify-center text-[18px] font-black text-slate-500 hover:bg-slate-50 active:scale-95">+</button>
            <div className="h-px bg-slate-100 mx-2" />
            <button onClick={() => pgCanvas.setScale(s => Math.max(s - 0.2, 0.2))} className="w-12 h-12 flex items-center justify-center text-[18px] font-black text-slate-500 hover:bg-slate-50 active:scale-95">-</button>
          </div>
        </div>
      </div>

      <SidebarRight stepGroups={stepGroups} setStepGroups={setStepGroups} nodes={nodes} />
    </div>
  );
};

const SidebarLeft: React.FC<any> = ({ 
  ingredients, 
  setIngredients, 
  ingredientPrompt, 
  setIngredientPrompt,
  youtubeUrl,
  setYoutubeUrl,
  transcript,
  setTranscript,
  onNeuralImport,
  isImporting,
  importMode,
  setImportMode
}) => {
  const handleAdd = () => { 
    if (!ingredientPrompt) return; 
    setIngredients((prev: any) => [{ 
      id: `i-${Date.now()}`, 
      name: ingredientPrompt.toUpperCase(), 
      image: getIngImage(ingredientPrompt), 
      quantity: '1 UNIT' 
    }, ...prev]); 
    setIngredientPrompt(''); 
  };

  return (
    <div className="w-72 border-r border-slate-200 bg-white flex flex-col z-10 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-slate-900 uppercase tracking-widest text-[11px]">Neural Engine</h2>
          <div className="flex bg-slate-200/50 p-1 rounded-lg">
            <button 
              onClick={() => setImportMode('url')} 
              className={`p-1.5 rounded-md transition-all ${importMode === 'url' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-400'}`}
            >
              <Youtube size={14} />
            </button>
            <button 
              onClick={() => setImportMode('transcript')} 
              className={`p-1.5 rounded-md transition-all ${importMode === 'transcript' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400'}`}
            >
              <FileText size={14} />
            </button>
          </div>
        </div>
        
        {importMode === 'url' ? (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-sm focus-within:border-red-500 transition-colors">
            <input 
              type="text" 
              placeholder="YouTube URL..." 
              className="flex-1 px-3 py-2 text-[10px] bg-transparent focus:outline-none font-bold" 
              value={youtubeUrl} 
              onChange={(e) => setYoutubeUrl(e.target.value)} 
            />
            <button 
              onClick={onNeuralImport} 
              disabled={isImporting || !youtubeUrl}
              className="bg-red-500 text-white p-2.5 rounded-xl hover:bg-red-600 transition-all active:scale-90 disabled:opacity-50"
            >
              {isImporting ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea 
              placeholder="Paste recipe transcript..." 
              className="w-full h-24 bg-white border border-slate-200 rounded-2xl p-4 text-[10px] font-bold focus:outline-none focus:border-orange-500 resize-none transition-colors"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />
            <button 
              onClick={onNeuralImport} 
              disabled={isImporting || !transcript}
              className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-500 transition-all disabled:opacity-50"
            >
              {isImporting ? <Loader2 size={14} className="animate-spin" /> : <><Sparkles size={14} /> Extract Process</>}
            </button>
          </div>
        )}
      </div>

      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-black text-slate-900 uppercase tracking-widest text-[11px]">Ingredient Library</h2>
        <Layers size={14} className="text-slate-300" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {ingredients.map((ing: any) => (
          <motion.div 
            key={ing.id} 
            whileHover={{ scale: 1.02 }}
            draggable 
            onDragStart={(e: any) => e.dataTransfer.setData('ingredient', JSON.stringify(ing))} 
            className="group relative flex items-center gap-4 p-3 bg-[#fafafa] border border-slate-100 rounded-2xl cursor-grab hover:border-orange-200 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all"
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-inner bg-slate-200">
              <img src={ing.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-black text-[10px] text-slate-800 truncate uppercase tracking-tight">{ing.name}</p>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{ing.quantity}</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight size={14} className="text-slate-300" />
            </div>
          </motion.div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-sm focus-within:border-orange-500 transition-colors">
          <input 
            type="text" 
            placeholder="Manual entry..." 
            className="flex-1 px-3 py-2 text-[11px] bg-transparent focus:outline-none font-bold" 
            value={ingredientPrompt} 
            onChange={(e) => setIngredientPrompt(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()} 
          />
          <button onClick={handleAdd} className="bg-slate-900 text-white p-2 rounded-xl hover:bg-orange-500 transition-all active:scale-90">
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const SidebarRight: React.FC<any> = ({ stepGroups, setStepGroups, nodes }) => {
  const chefs = Object.values(ChefCategory);
  const updateChef = (groupId: string, chef: ChefCategory) => { 
    setStepGroups((prev: any) => prev.map((g: any) => g.id === groupId ? { ...g, assignedChef: chef } : g)); 
  };

  return (
    <div className="w-80 border-l border-slate-200 bg-white flex flex-col z-10 shadow-sm">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/20">
        <ChefHat size={18} className="text-orange-500" />
        <h2 className="font-black text-slate-900 uppercase text-[11px] tracking-widest">Live Methodology</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {stepGroups.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-6">
            <Sparkles size={40} className="mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">No methods generated yet. Combine nodes to start documentation.</p>
          </div>
        ) : (
          stepGroups.map((group: any, idx: number) => (
            <div key={group.id} className="bg-white rounded-3xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] overflow-hidden transition-all hover:shadow-lg">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-orange-500 text-white rounded-xl flex items-center justify-center text-[10px] font-black shadow-lg shadow-orange-500/20">{idx + 1}</div>
                  <h3 className="text-[10px] font-black uppercase tracking-tight truncate w-40">{group.label}</h3>
                </div>
                <div className="flex items-center gap-1.5 opacity-60">
                  <Clock size={12} />
                  <span className="text-[9px] font-black">{group.durationMinutes}m</span>
                </div>
              </div>
              <div className="p-5">
                <div className="space-y-3 mb-6">
                  {nodes.filter((n: any) => group.nodeIds.includes(n.id)).map((node: any) => (
                    <div key={node.id} className="flex items-center gap-3">
                      <div className="w-1 h-4 bg-slate-100 rounded-full" />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] font-black text-slate-800 uppercase leading-tight truncate">{node.label}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{node.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-50 flex flex-wrap gap-2">
                  {chefs.map(chef => (
                    <button 
                      key={chef} 
                      onClick={() => updateChef(group.id, chef)} 
                      className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-tight transition-all border ${group.assignedChef === chef ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                    >
                      {chef.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const PlaygroundCanvas: React.FC<any> = ({ nodes, edges, selectedNodeIds, handleToggleSelection, updateNodeQuantity }) => {
  return (
    <div className="w-full h-full relative pointer-events-none" style={{ minWidth: '5000px', minHeight: '5000px' }}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '5000px', minHeight: '5000px' }}>
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="4" refX="7" refY="2" orient="auto">
            <polygon points="0 0, 8 2, 0 4" fill="#cbd5e1" />
          </marker>
        </defs>
        {edges.map((edge: any) => {
          const source = nodes.find((n: any) => n.id === edge.sourceId); 
          const target = nodes.find((n: any) => n.id === edge.targetId);
          if (!source || !target) return null;
          
          const incomingEdges = edges.filter((e: any) => e.targetId === target.id);
          const edgeIndex = incomingEdges.findIndex((e: any) => e.id === edge.id);
          const totalIncoming = incomingEdges.length;
          
          const startX = source.x + NODE_WIDTH; 
          const startY = source.y + (NODE_HEIGHT / 3); 
          
          const yOffset = totalIncoming > 1 
            ? (NODE_HEIGHT / 4) + (edgeIndex * (NODE_HEIGHT / 2) / (totalIncoming - 1))
            : (NODE_HEIGHT / 2);
            
          const endX = target.x; 
          const endY = target.y + yOffset;
          
          const cp1x = startX + (endX - startX) * 0.4;
          const cp2x = startX + (endX - startX) * 0.6;
          
          return (
            <g key={edge.id}>
              <path 
                d={`M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`} 
                stroke="#cbd5e1" 
                strokeWidth="2.5" 
                fill="none" 
                markerEnd="url(#arrowhead)" 
                className="transition-all duration-1000"
              />
              <g transform={`translate(${(startX + endX) / 2 - 45}, ${(startY + endY) / 2 - 14})`}>
                <rect width="90" height="28" rx="14" fill="white" stroke="#e2e8f0" strokeWidth="1" className="shadow-lg"/>
                <foreignObject width="90" height="28">
                  <div className="w-full h-full flex items-center justify-center gap-1.5 px-3">
                    <ActionIcon type={edge.iconType} size={11} className="text-orange-500" />
                    <span className="text-[9px] font-black text-slate-800 uppercase truncate tracking-tight">{edge.action}</span>
                  </div>
                </foreignObject>
              </g>
            </g>
          );
        })}
      </svg>
      {nodes.map((node: any) => (
        <motion.div 
          key={node.id} 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`absolute w-[200px] bg-white rounded-[2rem] border-2 transition-all cursor-pointer shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-visible pointer-events-auto ${selectedNodeIds.includes(node.id) ? 'border-orange-500 ring-[12px] ring-orange-50 z-50' : 'border-white hover:border-orange-200 z-10'}`} 
          style={{ left: node.x, top: node.y }} 
          onClick={(e) => { e.stopPropagation(); handleToggleSelection(node.id); }}
        >
          {node.image && (
            <div className="relative h-24 w-full overflow-hidden rounded-[1.8rem] bg-slate-50 mb-4 shadow-inner">
              <img src={node.image} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              {node.duration && (
                <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-md text-slate-900 text-[9px] px-3 py-1.5 rounded-full font-black flex items-center gap-1.5 shadow-sm">
                  <Clock size={11} className="text-orange-500" />
                  {node.duration}m
                </div>
              )}
            </div>
          )}
          <div className="px-5 pb-5">
            <p className="font-black text-[10px] text-slate-900 truncate uppercase tracking-tight mb-3 leading-tight">{node.label}</p>
            <div className="flex items-center gap-2 bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Qty</span>
              <input 
                type="text" 
                value={node.quantity} 
                onClick={(e) => e.stopPropagation()} 
                onChange={(e) => updateNodeQuantity(node.id, e.target.value)} 
                className="bg-transparent text-[9px] font-black text-slate-800 w-full focus:outline-none" 
              />
            </div>
          </div>
          
          {selectedNodeIds.includes(node.id) && (
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg">
              <Sparkles size={12} />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};
