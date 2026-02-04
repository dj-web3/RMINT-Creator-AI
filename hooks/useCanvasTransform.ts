
import { useState } from 'react';

export const useCanvasTransform = () => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleWheel = (e: any) => {
    if (e.ctrlKey || e.metaKey) {
      const delta = -e.deltaY * 0.002;
      setScale((prev) => Math.min(Math.max(prev + delta, 0.2), 3));
    } else {
      setOffset((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  return { scale, offset, handleWheel, setOffset, setScale };
};
