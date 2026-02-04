
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, X, RefreshCw, Hand, Search, PlusCircle, Zap, Clock } from 'lucide-react';
import { Node, Edge, ActionIconType, Ingredient } from '../../types';
import { useCanvasTransform } from '../../hooks/useCanvasTransform';
import { ActionIcon, getIngImage } from '../../utils/ui-helpers';
import { processChefPrompt } from '../../services/geminiService';

const SPACES_CARD_W = 340;

interface SpacesProps {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

export const SpacesView: React.FC<SpacesProps> = ({ nodes, setNodes, edges, setEdges }) => {
  const [sections] = useState([
    { id: 's1', label: 'MIS-EN-PLACE', color: 'rgba(249, 115, 22, 0.02)', x: 50, y: 100, width: 800, height: 1000 },
    { id: 's2', label: 'THERMAL PROCESSING', color: 'rgba(99, 102, 241, 0.02)', x: 900, y: 100, width: 800, height: 1000 }
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [promptInput, setPromptInput] = useState('');
  const [isDragToolActive, setIsDragToolActive] = useState(false);
  const spCanvas = useCanvasTransform();

  const handleSpawn = async () => {
    if (!selectedId || !promptInput) return;
    const parent = nodes.find(n => n.id === selectedId);
    if (!parent) return;
    const nid = `n-${Date.now()}`;
    setNodes(prev => [...prev, { id: nid, type: 'instructions', label: promptInput.toUpperCase(), image: getIngImage(promptInput), quantity: '1 UNIT', x: parent.x + 400, y: parent.y + 50, content: 'Synthesizing...' }]);
    setEdges(prev => [...prev, { id: `e-${Date.now()}`, sourceId: parent.id, targetId: nid, action: 'PROCESS', iconType: 'default' as ActionIconType }]);
    setSelectedId(nid); setPromptInput('');
    const res = await processChefPrompt(promptInput, { selectedItems: [parent] });
    setNodes(prev => prev.map(n => n.id === nid ? { ...n, label: res.resultName.toUpperCase(), quantity: res.quantity, duration: res.duration, content: res.subSteps?.[0]?.instruction } : n));
  };

  return (
    <div className={`flex-1 bg-[#fcfaf8] overflow-hidden relative canvas-grid ${isDragToolActive ? 'cursor-grab active:cursor-grabbing' : ''}`} onDragOver={e => e.preventDefault()} onDrop={e => {
        e.preventDefault(); const data = e.dataTransfer.getData('ingredient'); if (!data) return;
        const ing = JSON.parse(data);
        const r = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - r.left - spCanvas.offset.x - 200) / spCanvas.scale; const y = (e.clientY - r.top - spCanvas.offset.y - 200) / spCanvas.scale;
        setNodes(prev => [...prev, { id: `ing-${Date.now()}`, type: 'input', label: ing.name.toUpperCase(), image: ing.image, quantity: ing.quantity.toUpperCase(), x, y, content: `Base: ${ing.name}` }]);
    }}>
      <div className="w-full h-full relative overflow-hidden" onWheel={spCanvas.handleWheel} onMouseDown={e => {
          if (!isDragToolActive) return;
          const sX = e.clientX, sY = e.clientY, iOX = spCanvas.offset.x, iOY = spCanvas.offset.y;
          const move = (me: MouseEvent) => spCanvas.setOffset({ x: iOX + (me.clientX - sX), y: iOY + (me.clientY - sY) });
          const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
          window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
      }}>
        <motion.div className="relative origin-top-left p-[200px]" animate={{ x: spCanvas.offset.x, y: spCanvas.offset.y, scale: spCanvas.scale }}>
          {sections.map(sec => (<div key={sec.id} className="absolute border-2 border-dashed border-slate-200/50 rounded-[4rem] pointer-events-none" style={{ left: sec.x, top: sec.y, width: sec.width, height: sec.height, backgroundColor: sec.color }}><div className="absolute -top-5 left-10 bg-white border border-slate-200 px-6 py-2 rounded-full text-[9px] font-black uppercase text-slate-400">ZONE: {sec.label}</div></div>))}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '10000px', minHeight: '10000px' }}>
            <marker id="asp" markerWidth="6" markerHeight="3" refX="5" refY="1.5" orient="auto"><polygon points="0 0, 6 1.5, 0 3" fill="#cbd5e1" /></marker>
            {edges.map(e => {
              const s = nodes.find(n => n.id === e.sourceId); const t = nodes.find(n => n.id === e.targetId);
              if (!s || !t) return null;
              const sX = s.x + SPACES_CARD_W, sY = s.y + 120, tX = t.x, tY = t.y + 120;
              return (<g key={e.id}><path d={`M ${sX} ${sY} C ${(sX+tX)/2} ${sY}, ${(sX+tX)/2} ${tY}, ${tX} ${tY}`} stroke="#cbd5e1" strokeWidth="2" fill="none" markerEnd="url(#asp)" /><g transform={`translate(${(sX+tX)/2 - 50}, ${(sY+tY)/2 - 15})`}><rect width="100" height="30" rx="15" fill="white" stroke="#e2e8f0" strokeWidth="1" className="shadow-lg"/><foreignObject width="100" height="30"><div className="w-full h-full flex items-center justify-center gap-1.5 px-3"><ActionIcon type={e.iconType} size={11} className="text-orange-500" /><span className="text-[9px] font-black text-slate-800 uppercase tracking-tight">{e.action}</span></div></foreignObject></g></g>);
            })}
          </svg>
          <div className="relative" style={{ minWidth: '10000px', minHeight: '10000px' }}>
            {nodes.map(n => (<div key={n.id} className={`absolute w-[340px] bg-white border-2 rounded-[3.5rem] p-8 shadow-2xl cursor-pointer flex flex-col ${selectedId === n.id ? 'border-orange-500 ring-8 ring-orange-50 z-50' : 'border-white hover:border-orange-100 z-10'}`} style={{ left: n.x, top: n.y, transition: '0.3s' }} onClick={e => { e.stopPropagation(); if(!isDragToolActive) setSelectedId(n.id); }}><div className="flex items-center gap-5 mb-8"><div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-inner">{n.type === 'input' ? <PlusCircle size={24} /> : <Zap size={24} />}</div><div><p className="text-[12px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{n.label}</p><p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{n.type === 'input' ? 'Pre-Operational' : 'Step Outcome'}</p></div></div>{n.image && (<div className="w-full h-48 rounded-[2.5rem] overflow-hidden mb-8 bg-slate-50 relative border border-slate-100"><img src={n.image} className="w-full h-full object-cover" />{n.duration && <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/95 backdrop-blur rounded-full text-[10px] font-black text-slate-800 shadow flex items-center gap-2"><Clock size={12} className="text-orange-500" /> {n.duration}M</div>}</div>)}<p className="text-[12px] text-slate-500 font-medium italic leading-relaxed mb-10 line-clamp-3">{n.content}</p><div className="flex items-center justify-between border-t border-slate-50 pt-8"><div className="flex -space-x-3"><div className="w-9 h-9 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-400">CH</div></div><div className="bg-slate-50 px-5 py-2 rounded-full border border-slate-100"><span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{n.quantity}</span></div></div></div>))}
          </div>
        </motion.div>
      </div>
      {selectedId && (<div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-2xl rounded-full p-2 flex items-center gap-4 border border-slate-200 shadow-3xl z-[100] w-[500px] animate-in slide-in-from-bottom-5"><div className="flex-1 px-6"><input type="text" placeholder="Prompt next step sequence..." className="bg-transparent text-[12px] font-bold text-slate-800 focus:outline-none w-full" value={promptInput} onChange={e => setPromptInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSpawn()} /></div><button onClick={handleSpawn} className="p-4 bg-slate-900 text-white rounded-full hover:bg-orange-500 transition-all shadow-xl active:scale-90"><Send size={18} /></button><button onClick={() => setSelectedId(null)} className="p-4 text-slate-400 hover:text-red-500 rounded-full"><X size={18} /></button></div>)}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex gap-4 z-[100]">
        <div className="bg-white/95 backdrop-blur-2xl rounded-full p-2 flex gap-4 border border-slate-200 shadow-3xl">
          <button onClick={() => { setNodes([{ id: 'root', type: 'input', label: 'CHICKEN PREP', image: getIngImage('raw chicken'), quantity: '1.5KG', x: 100, y: 300, content: 'Butter Chicken workflow starting point.' }]); setEdges([]); spCanvas.setOffset({ x: 0, y: 0 }); spCanvas.setScale(1); }} className="px-8 py-3.5 bg-slate-900 text-white text-[11px] font-black uppercase rounded-full hover:bg-black transition-all shadow-xl flex items-center gap-3"><RefreshCw size={16} /> Reset Spaces</button>
          <div className="w-px h-8 bg-slate-200 self-center" />
          <button className={`p-4 rounded-full transition-all ${isDragToolActive ? 'bg-orange-500 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`} onClick={() => { setIsDragToolActive(!isDragToolActive); setSelectedId(null); }}><Hand size={20} /></button>
          <button className="p-4 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all" onClick={() => spCanvas.setScale(s => Math.max(s - 0.2, 0.2))}><Search size={20} /></button>
        </div>
      </div>
    </div>
  );
};
