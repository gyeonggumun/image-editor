import { useState } from 'react';
import useEditorStore from '../store/useEditorStore';

export default function useCanvasEvents(canvasRef, isSpacePressed, pan, setPan) {
  const store = useEditorStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const getCanvasDimensions = () => {
    const baseWidth = 600;
    if (store.ratio === '1:1') return { width: baseWidth, height: baseWidth };
    if (store.ratio === '4:5') return { width: baseWidth, height: baseWidth * 1.25 };
    return { width: baseWidth, height: baseWidth * (16 / 9) };
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handleMouseDown = (e) => {
    if (isSpacePressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const pos = getMousePos(e);
    let hitId = null; let hitType = null;

    // 1. 텍스트 레이어 클릭 확인
    for (let i = store.layers.length - 1; i >= 0; i--) {
      const layer = store.layers[i];
      const approxHeight = layer.text.split('\n').length * layer.size * 1.2;
      const hitBoxWidth = Math.max(100, layer.size * 3); 
      if (pos.x >= layer.x - 10 && pos.x <= layer.x + hitBoxWidth && pos.y >= layer.y - 10 && pos.y <= layer.y + approxHeight) {
        hitId = layer.id; hitType = 'layer'; break;
      }
    }
    // 2. 스티커 클릭 확인
    if (!hitId) {
      for (let i = store.stickers.length - 1; i >= 0; i--) {
        const s = store.stickers[i];
        if (pos.x >= s.x && pos.x <= s.x + s.width && pos.y >= s.y && pos.y <= s.y + s.height) { hitId = s.id; hitType = 'sticker'; break; }
      }
    }
    // 3. 도형 클릭 확인
    if (!hitId) {
      for (let i = store.shapes.length - 1; i >= 0; i--) {
        const s = store.shapes[i];
        const hitHeight = s.type === 'line' ? Math.max(s.height, 20) : s.height;
        const hitY = s.type === 'line' ? s.y - hitHeight/2 : s.y;
        if (pos.x >= s.x && pos.x <= s.x + s.width && pos.y >= hitY && pos.y <= hitY + hitHeight) { hitId = s.id; hitType = 'shape'; break; }
      }
    }

    if (hitId) {
      store.saveHistory();
      const isAlreadySelected = (hitType === 'layer' && store.selectedLayerIds.includes(hitId)) || 
                                (hitType === 'sticker' && store.selectedStickerIds.includes(hitId)) ||
                                (hitType === 'shape' && store.selectedShapeIds.includes(hitId));
      if (!isAlreadySelected) store.selectItem(hitId, hitType, e.shiftKey);
      setIsDragging(true); setLastPos(pos); return;
    }
    store.clearSelection();
  };

  const handleMouseMove = (e) => {
    if (isPanning) { setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }); return; }
    if (!isDragging) return;

    const pos = getMousePos(e);
    const { width, height } = getCanvasDimensions();
    const SNAP_THRESHOLD = 15;
    
    const totalSelected = store.selectedLayerIds.length + store.selectedStickerIds.length + store.selectedShapeIds.length;
    let guideX = null; let guideY = null;
    let dx = pos.x - lastPos.x; let dy = pos.y - lastPos.y;

    // 중앙 스냅 가이드라인 적용
    if (totalSelected === 1) {
      if (Math.abs(pos.x - width / 2) < SNAP_THRESHOLD) { dx = (width / 2) - lastPos.x; guideX = width / 2; }
      if (Math.abs(pos.y - height / 2) < SNAP_THRESHOLD) { dy = (height / 2) - lastPos.y; guideY = height / 2; }
      store.setGuidelines({ x: guideX, y: guideY });
    }

    store.moveSelectedItems(dx, dy);
    
    if (!guideX && !guideY) setLastPos(pos);
    else setLastPos({ x: lastPos.x + dx, y: lastPos.y + dy });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDragging(false);
    store.setGuidelines({ x: null, y: null });
  };

  return { handleMouseDown, handleMouseMove, handleMouseUp, isDragging, isPanning, getCanvasDimensions };
}