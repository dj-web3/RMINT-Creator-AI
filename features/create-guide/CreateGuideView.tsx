
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hand, Search, PlusCircle, Zap, Clock, ChefHat, Timer } from 'lucide-react';
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

  // Auto-center canvas on first load so nodes are visible
  useEffect(() => {
    spCanvas.setOffset({ x: 60, y: 60 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getGroupForNode = (nodeId: string): StepGroup | null =>
    stepGroups.find(g => g.nodeIds.includes(nodeId)) || null;

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
              const group = getGroupForNode(n.id);
              const chef = group?.assignedChef || null;
              const duration = group?.durationMinutes || n.duration || null;
              const startTime = group?.startTime || null;
              return (
                <div
                  key={n.id}
                  className="absolute w-[340px] bg-white border-2 border-slate-100 rounded-[3.5rem] shadow-2xl flex flex-col select-none"
                  style={{ left: n.x, top: n.y, zIndex: 10 }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-4 p-6 pb-0">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-inner shrink-0">
                      {n.type === 'input' ? <PlusCircle size={20} /> : <Zap size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-black text-slate-800 uppercase tracking-tight leading-none truncate">{n.label}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{n.type === 'input' ? 'Ingredient' : 'Step'}</p>
                    </div>
                  </div>

                  {/* Image */}
                  {n.image && (
                    <div className="mx-6 mt-5 h-36 rounded-[2rem] overflow-hidden bg-slate-50 relative border border-slate-100">
                      <img src={n.image} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Content */}
                  {n.content && (
                    <p className="mx-6 mt-4 text-[11px] text-slate-500 font-medium italic leading-relaxed line-clamp-2">{n.content}</p>
                  )}

                  {/* Synced data from Create Menu */}
                  <div className="mx-6 mt-4 mb-6 space-y-2">
                    {/* Chef pill — updates live from Create Menu */}
                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl ${chef ? 'bg-slate-900' : 'bg-slate-100'}`}>
                      <ChefHat size={12} className={chef ? 'text-orange-400' : 'text-slate-400'} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${chef ? 'text-white' : 'text-slate-400'}`}>
                        {chef || 'Unassigned'}
                      </span>
                      {group && (
                        <span className="ml-auto text-[8px] font-black uppercase tracking-widest text-slate-500 truncate max-w-[100px]">{group.label}</span>
                      )}
                    </div>

                    {/* Time info row */}
                    <div className="flex gap-2">
                      {startTime && (
                        <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-3 py-2">
                          <Clock size={11} className="text-orange-400 shrink-0" />
                          <span className="text-[9px] font-black text-slate-700 uppercase tracking-wide truncate">{startTime}</span>
                        </div>
                      )}
                      {duration && (
                        <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-3 py-2">
                          <Timer size={11} className="text-blue-400 shrink-0" />
                          <span className="text-[9px] font-black text-slate-700 uppercase tracking-wide">{duration}m</span>
                        </div>
                      )}
                      <div className="flex-1 flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-3 py-2">
                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-wide truncate">{n.quantity}</span>
                      </div>
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
