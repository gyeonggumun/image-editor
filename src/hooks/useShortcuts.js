import { useEffect, useState } from 'react';
import useEditorStore from '../store/useEditorStore';

export default function useShortcuts(containerRef, setZoom) {
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const store = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['TEXTAREA', 'INPUT'].includes(e.target.tagName)) return;
      
      if (e.code === 'Space' && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) store.redo(); else store.undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        store.redo();
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        const totalSelected = store.selectedLayerIds.length + store.selectedStickerIds.length + store.selectedShapeIds.length;
        if (totalSelected > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1; 
          let dx = 0, dy = 0;
          if (e.code === 'ArrowUp') dy = -step;
          if (e.code === 'ArrowDown') dy = step;
          if (e.code === 'ArrowLeft') dx = -step;
          if (e.code === 'ArrowRight') dx = step;
          store.moveSelectedItems(dx, dy);
        }
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.code === 'Space') setIsSpacePressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [store, isSpacePressed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(prev => Math.min(Math.max(0.2, prev - e.deltaY * 0.002), 3));
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [containerRef, setZoom]);

  return { isSpacePressed, setIsSpacePressed };
}