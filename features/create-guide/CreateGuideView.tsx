
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Hand, Search, PlusCircle, Zap, Clock, ChefHat } from 'lucide-react';
import { Node, Edge, StepGroup } from '../../types';
import { useCanvasTransform } from '../../hooks/useCanvasTransform';
import { ActionIcon } from '../../utils/ui-helpers';

const SPACES_CARD_W = 340;

interface GuideProps {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  stepGroups: StepGroup[];
}

export const CreateGuideView: React.FC<GuideProps> = ({ nodes, edges, stepGroups }) => {
  const [sections] = useState([
    { id: 's1', label: 'MIS-EN-PLACE', color: 'rgba(249, 115, 22, 0.02)', x: 50, y: 100, width: 800, height: 1000 },
    { id: 's2', label: 'THERMAL PROCESSING', color: 'rgba(99, 102, 241, 0.02)', x: 900, y: 100, width: 800, height: 1000 }
  ]);
  const [isDragToolActive, setIsDragToolActive] = useState(false);
  const spCanvas = useCanvasTransform();

  // Find the stepGroup that contains a given node
  const getChefForNode = (nodeId: string): string | null => {
    const group = stepGroups.find(g => g.nodeIds.includes(nodeId));
    return group?.assignedChef || null;
  };

  const getGroupForNode = (nodeId: string): StepGroup | null => {
    return stepGroups.find(g => g.nodeIds.includes(nodeId)) || null;
  };

  return (
    <div className={`flex-1 bg-[#fcfaf8] overflow-hidden relative canvas-grid ${isDragToolActive ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}>
      <div className="w-full h-full relative overflow-hidden" onWheel={spCanvas.handleWheel} onMouseDown={e => {
          if (!isDragToolActive) return;
          const sX = e.clientX, sY = e.clientY, iOX = spCanvas.offset.x, iOY = spCanvas.offset.y;
          const move = (me: MouseEvent) => spCanvas.setOffset({ x: iOX + (me.clientX - sX), y: iOY + (me.clientY - sY) });
          const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
          window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
      }}>
        <motion.div className="relative origin-top-left p-[200px]" animate={{ x: spCanvas.offset.x, y: spCanvas.offset.y, scale: spCanvas.scale }}>
          {sections.map(sec => (
            <div key={sec.id} className="absolute border-2 border-dashed border-slate-200/50 rounded-[4rem] pointer-events-none" style={{ left: sec.x, top: sec.y, width: sec.width, height: sec.height, backgroundColor: sec.color }}>
              <div className="absolute -top-5 left-10 bg-white border border-slate-200 px-6 py-2 rounded-full text-[9px] font-black uppercase text-slate-400">ZONE: {sec.label}</div>
            </div>
          ))}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '10000px', minHeight: '10000px' }}>
            <marker id="asp" markerWidth="6" markerHeight="3" refX="5" refY="1.5" orient="auto"><polygon points="0 0, 6 1.5, 0 3" fill="#cbd5e1" /></marker>
            {edges.map(e => {
              const s = nodes.find(n => n.id === e.sourceId); const t = nodes.find(n => n.id === e.targetId);
              if (!s || !t) return null;
              const sX = s.x + SPACES_CARD_W, sY = s.y + 120, tX = t.x, tY = t.y + 120;
              return (
                <g key={e.id}>
                  <path d={`M ${sX} ${sY} C ${(sX+tX)/2} ${sY}, ${(sX+tX)/2} ${tY}, ${tX} ${tY}`} stroke="#cbd5e1" strokeWidth="2" fill="none" markerEnd="url(#asp)" />
                  <g transform={`translate(${(sX+tX)/2 - 50}, ${(sY+tY)/2 - 15})`}>
                    <rect width="100" height="30" rx="15" fill="white" stroke="#e2e8f0" strokeWidth="1" />
                    <foreignObject width="100" height="30">
                      <div className="w-full h-full flex items-center justify-center gap-1.5 px-3">
                        <ActionIcon type={e.iconType} size={11} className="text-orange-500" />
                        <span className="text-[9px] font-black text-slate-800 uppercase tracking-tight">{e.action}</span>
                      </div>
                    </foreignObject>
                  </g>
                </g>
              );
            })}
          </svg>
          <div className="relative" style={{ minWidth: '10000px', minHeight: '10000px' }}>
            {nodes.map(n => {
              const chef = getChefForNode(n.id);
              const group = getGroupForNode(n.id);
              return (
                <div
                  key={n.id}
                  className="absolute w-[340px] bg-white border-2 border-white rounded-[3.5rem] p-8 shadow-2xl flex flex-col select-none"
                  style={{ left: n.x, top: n.y, transition: '0.3s', zIndex: 10 }}
                >
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-inner shrink-0">
                      {n.type === 'input' ? <PlusCircle size={24} /> : <Zap size={24} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1 truncate">{n.label}</p>
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{n.type === 'input' ? 'Pre-Operational' : 'Step Outcome'}</p>
                    </div>
                  </div>
                  {n.image && (
                    <div className="w-full h-48 rounded-[2.5rem] overflow-hidden mb-8 bg-slate-50 relative border border-slate-100">
                      <img src={n.image} className="w-full h-full object-cover" />
                      {n.duration && (
                        <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/95 backdrop-blur rounded-full text-[10px] font-black text-slate-800 shadow flex items-center gap-2">
                          <Clock size={12} className="text-orange-500" /> {n.duration}M
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-[12px] text-slate-500 font-medium italic leading-relaxed mb-6 line-clamp-3">{n.content}</p>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-6 gap-3 flex-wrap">
                    {chef ? (
                      <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full">
                        <ChefHat size={12} className="text-orange-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{chef}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
                        <ChefHat size={12} className="text-slate-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Unassigned</span>
                      </div>
                    )}
                    {group && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{group.label}</span>
                      </div>
                    )}
                    <div className="bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{n.quantity}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex gap-4 z-[100]">
        <div className="bg-white/95 backdrop-blur-2xl rounded-full p-2 flex gap-4 border border-slate-200 shadow-3xl">
          <button className={`p-4 rounded-full transition-all ${isDragToolActive ? 'bg-orange-500 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`} onClick={() => setIsDragToolActive(!isDragToolActive)}>
            <Hand size={20} />
          </button>
          <button className="p-4 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all" onClick={() => spCanvas.setScale(s => Math.max(s - 0.2, 0.2))}>
            <Search size={20} />
          </button>
          <button className="p-4 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all" onClick={() => spCanvas.setScale(s => Math.min(s + 0.2, 3))}>
            <Search size={20} className="rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
