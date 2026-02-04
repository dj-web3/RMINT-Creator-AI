
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Scissors, Search, Clock, PlusCircle, Zap, UtensilsCrossed, ChefHat } from 'lucide-react';
import { Node, Edge, StepGroup, Ingredient, ChefCategory, ActionIconType } from '../../types';
import { useCanvasTransform } from '../../hooks/useCanvasTransform';
import { ActionIcon, getIngImage } from '../../utils/ui-helpers';
import { processChefPrompt } from '../../services/geminiService';

const NODE_WIDTH = 180;

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
  const pgCanvas = useCanvasTransform();

  const handleToggleSelection = (id: string) => {
    setSelectedNodeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const executeActionInstant = async () => {
    if (selectedNodeIds.length === 0 || !actionPrompt) return;
    const selectedItems = nodes.filter(n => selectedNodeIds.includes(n.id));
    const maxX = Math.max(...selectedItems.map(n => n.x));
    const avgY = selectedItems.reduce((acc, n) => acc + n.y, 0) / selectedItems.length;
    const newNodeId = `node-${Date.now()}`;
    const newNode: Node = { id: newNodeId, type: 'instructions', label: actionPrompt.toUpperCase(), quantity: 'RESULT', image: getIngImage(actionPrompt), x: maxX + 400, y: avgY, content: 'Synthesizing instructions...' };
    setNodes(prev => [...prev, newNode]);
    setEdges(prev => [...prev, ...selectedItems.map((n, i) => ({ id: `e-${Date.now()}-${i}`, sourceId: n.id, targetId: newNodeId, action: 'PROCESS', iconType: 'default' as ActionIconType }))]);
    const res = await processChefPrompt(actionPrompt, { selectedItems });
    setNodes(prev => prev.map(n => n.id === newNodeId ? { ...n, label: res.resultName.toUpperCase(), quantity: res.quantity, duration: res.duration, content: res.subSteps?.[0]?.instruction } : n));
    setSelectedNodeIds([]); setActionPrompt('');
  };

  return (
    <div className="flex flex-1 overflow-hidden relative">
      <SidebarLeft 
        ingredients={ingredients} setIngredients={setIngredients} 
        ingredientPrompt={ingredientPrompt} setIngredientPrompt={setIngredientPrompt} 
      />
      
      <div className="flex-1 relative overflow-hidden canvas-grid cursor-grab active:cursor-grabbing" onWheel={pgCanvas.handleWheel}>
        <motion.div className="w-full h-full relative origin-top-left pointer-events-none" animate={{ x: pgCanvas.offset.x, y: pgCanvas.offset.y, scale: pgCanvas.scale }}>
          <PlaygroundCanvas 
            nodes={nodes} edges={edges} selectedNodeIds={selectedNodeIds} 
            handleToggleSelection={handleToggleSelection} 
            updateNodeQuantity={(id, qty) => setNodes(prev => prev.map(n => n.id === id ? { ...n, quantity: qty } : n))} 
          />
        </motion.div>

        {selectedNodeIds.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-4 border border-slate-200 flex items-center gap-4 w-[500px] z-[60] animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-orange-500 text-white p-2.5 rounded-xl"><Scissors size={18}/></div>
            <div className="flex-1">
              <input 
                type="text" placeholder={`Combine ${selectedNodeIds.length} elements...`} 
                className="w-full bg-slate-100/50 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none" 
                value={actionPrompt} onChange={(e) => setActionPrompt(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && executeActionInstant()} 
              />
            </div>
            <button onClick={executeActionInstant} className="bg-slate-900 text-white px-5 py-2 rounded-lg font-black text-[9px] uppercase hover:bg-black">Process</button>
          </div>
        )}
      </div>

      <SidebarRight stepGroups={stepGroups} setStepGroups={setStepGroups} nodes={nodes} />
    </div>
  );
};

const SidebarLeft: React.FC<any> = ({ ingredients, setIngredients, ingredientPrompt, setIngredientPrompt }) => {
  const handleAdd = () => { if (!ingredientPrompt) return; setIngredients((prev: any) => [{ id: `i-${Date.now()}`, name: ingredientPrompt, image: getIngImage(ingredientPrompt), quantity: '1 unit' }, ...prev]); setIngredientPrompt(''); };
  return (
    <div className="w-56 border-r border-slate-200 bg-white flex flex-col z-10 shadow-xl">
      <div className="p-4 border-b border-slate-100"><h2 className="font-black text-slate-800 uppercase tracking-tighter text-[10px]">Pantry</h2></div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {ingredients.map((ing: any) => (
          <div key={ing.id} draggable onDragStart={(e) => e.dataTransfer.setData('ingredient', JSON.stringify(ing))} className="group relative flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-xl cursor-grab hover:border-orange-500 hover:shadow-lg transition-all">
            <img src={ing.image} className="w-9 h-9 rounded-lg object-cover" />
            <div className="flex-1 overflow-hidden"><p className="font-black text-[9px] text-slate-900 truncate uppercase">{ing.name}</p><p className="text-[7px] text-slate-400 font-bold uppercase">{ing.quantity}</p></div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-slate-100 bg-slate-50/30"><div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1"><input type="text" placeholder="Add..." className="flex-1 px-2 py-1 text-[10px] bg-transparent focus:outline-none font-black" value={ingredientPrompt} onChange={(e) => setIngredientPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} /><button onClick={handleAdd} className="bg-slate-900 text-white p-1.5 rounded-md"><Plus size={10} /></button></div></div>
    </div>
  );
};

const SidebarRight: React.FC<any> = ({ stepGroups, setStepGroups, nodes }) => {
  const chefs = Object.values(ChefCategory);
  const updateChef = (groupId: string, chef: ChefCategory) => { setStepGroups((prev: any) => prev.map((g: any) => g.id === groupId ? { ...g, assignedChef: chef } : g)); };
  return (
    <div className="w-72 border-l border-slate-200 bg-white flex flex-col z-10 shadow-2xl">
      <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/20"><UtensilsCrossed size={16} className="text-orange-500" /><h2 className="font-black text-slate-800 uppercase text-[10px]">Methodology</h2></div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {stepGroups.map((group: any, idx: number) => (
          <div key={group.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-6 h-6 bg-orange-500 text-white rounded-lg flex items-center justify-center text-[9px] font-black">{idx + 1}</div><h3 className="text-[9px] font-black uppercase truncate w-32 tracking-tight">{group.label}</h3></div></div>
            <div className="p-4">
              <div className="space-y-2 mb-5 pl-2 border-l-2 border-slate-100 ml-2">
                {nodes.filter((n: any) => group.nodeIds.includes(n.id)).map((node: any) => (<div key={node.id} className="relative"><p className="text-[9px] font-black text-slate-800 leading-tight uppercase">{node.label}</p></div>))}
              </div>
              <div className="pt-4 border-t border-slate-50">
                <div className="flex flex-wrap gap-1">
                  {chefs.map(chef => (<button key={chef} onClick={() => updateChef(group.id, chef)} className={`px-2 py-1 rounded-full text-[7px] font-black uppercase transition-all ${group.assignedChef === chef ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{chef.split(' ')[0]}</button>))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PlaygroundCanvas: React.FC<any> = ({ nodes, edges, selectedNodeIds, handleToggleSelection, updateNodeQuantity }) => {
  return (
    <div className="w-full h-full relative pointer-events-none">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '4000px', minHeight: '4000px' }}>
        <defs><marker id="arrowhead" markerWidth="6" markerHeight="3" refX="5" refY="1.5" orient="auto"><polygon points="0 0, 6 1.5, 0 3" fill="#cbd5e1" /></marker></defs>
        {edges.map((edge: any) => {
          const source = nodes.find((n: any) => n.id === edge.sourceId); const target = nodes.find((n: any) => n.id === edge.targetId);
          if (!source || !target) return null;
          const startX = source.x + NODE_WIDTH; const startY = source.y + 60; const endX = target.x; const endY = target.y + 60;
          return (<g key={edge.id}><path d={`M ${startX} ${startY} C ${(startX+endX)/2} ${startY}, ${(startX+endX)/2} ${endY}, ${endX} ${endY}`} stroke="#cbd5e1" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" /><g transform={`translate(${(startX+endX)/2 - 35}, ${(startY+endY)/2 - 12})`}><rect width="70" height="24" rx="12" fill="white" stroke="#e2e8f0" strokeWidth="1" className="shadow-sm"/><foreignObject width="70" height="24"><div className="w-full h-full flex items-center justify-center gap-1 px-2"><ActionIcon type={edge.iconType} size={10} className="text-orange-500" /><span className="text-[8px] font-black text-slate-800 uppercase truncate">{edge.action}</span></div></foreignObject></g></g>);
        })}
      </svg>
      {nodes.map((node: any) => (
        <div key={node.id} className={`absolute w-[180px] bg-white rounded-2xl border-2 transition-all cursor-pointer shadow-sm p-4 pointer-events-auto ${selectedNodeIds.includes(node.id) ? 'border-orange-500 ring-4 ring-orange-100 z-20 scale-105' : 'border-white hover:border-orange-100 z-10'}`} style={{ left: node.x, top: node.y }} onClick={(e) => { e.stopPropagation(); handleToggleSelection(node.id); }}>
          {node.image && (<div className="relative h-20 w-full overflow-hidden rounded-xl bg-slate-50 mb-3 shadow-inner"><img src={node.image} className="w-full h-full object-cover" />{node.duration && (<div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-[8px] px-2 py-1 rounded-full font-black"><Clock size={9} className="inline mr-1" />{node.duration}m</div>)}</div>)}
          <p className="font-black text-[9px] text-slate-800 truncate uppercase tracking-tighter mb-2">{node.label}</p>
          <div className="flex items-center gap-1.5 bg-slate-50 rounded p-1.5 border border-slate-100"><span className="text-[7px] font-black text-slate-400 uppercase">Qty</span><input type="text" value={node.quantity} onClick={(e) => e.stopPropagation()} onChange={(e) => updateNodeQuantity(node.id, e.target.value)} className="bg-transparent text-[8px] font-black text-slate-900 w-full focus:outline-none" /></div>
        </div>
      ))}
    </div>
  );
};
