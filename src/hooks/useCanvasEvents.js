import { useState } from 'react';
import useEditorStore from '../store/useEditorStore';

export default function useCanvasEvents(canvasRef, isSpacePressed, pan, setPan) {
  const store = useEditorStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const [resizingItem, setResizingItem] = useState(null);
  const [hoverHandle, setHoverHandle] = useState(null);

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

  const checkResizeHandleHit = (pos) => {
    const HANDLE_SIZE = 12;
    const isHit = (hx, hy) => Math.abs(hx - pos.x) <= HANDLE_SIZE && Math.abs(hy - pos.y) <= HANDLE_SIZE;

    if (store.selectedShapeIds.length === 1 && store.selectedLayerIds.length === 0 && store.selectedStickerIds.length === 0) {
      const shape = store.shapes.find(s => s.id === store.selectedShapeIds[0]);
      if (shape) {
        if (shape.type === 'line') {
          if (isHit(shape.x, shape.y)) return { id: shape.id, type: 'shape', handle: 'start' };
          if (isHit(shape.x + shape.width, shape.y)) return { id: shape.id, type: 'shape', handle: 'end' };
        } else {
          if (isHit(shape.x, shape.y)) return { id: shape.id, type: 'shape', handle: 'nw' };
          if (isHit(shape.x + shape.width, shape.y)) return { id: shape.id, type: 'shape', handle: 'ne' };
          if (isHit(shape.x, shape.y + shape.height)) return { id: shape.id, type: 'shape', handle: 'sw' };
          if (isHit(shape.x + shape.width, shape.y + shape.height)) return { id: shape.id, type: 'shape', handle: 'se' };
        }
      }
    }
    
    if (store.selectedStickerIds.length === 1 && store.selectedLayerIds.length === 0 && store.selectedShapeIds.length === 0) {
      const sticker = store.stickers.find(s => s.id === store.selectedStickerIds[0]);
      if (sticker) {
        if (isHit(sticker.x, sticker.y)) return { id: sticker.id, type: 'sticker', handle: 'nw' };
        if (isHit(sticker.x + sticker.width, sticker.y)) return { id: sticker.id, type: 'sticker', handle: 'ne' };
        if (isHit(sticker.x, sticker.y + sticker.height)) return { id: sticker.id, type: 'sticker', handle: 'sw' };
        if (isHit(sticker.x + sticker.width, sticker.y + sticker.height)) return { id: sticker.id, type: 'sticker', handle: 'se' };
      }
    }
    return null;
  };

  const handleMouseDown = (e) => {
    if (isSpacePressed) { setIsPanning(true); setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); return; }

    const pos = getMousePos(e);
    
    const handleHit = checkResizeHandleHit(pos);
    if (handleHit) {
      store.saveHistory();
      setResizingItem(handleHit);
      setLastPos(pos);
      return;
    }

    let hitId = null; let hitType = null;
    for (let i = store.layers.length - 1; i >= 0; i--) {
      const layer = store.layers[i];
      const approxHeight = layer.text.split('\n').length * layer.size * 1.2;
      const hitBoxWidth = Math.max(100, layer.size * 3);
      if (pos.x >= layer.x - 10 && pos.x <= layer.x + hitBoxWidth && pos.y >= layer.y - 10 && pos.y <= layer.y + approxHeight) {
        hitId = layer.id; hitType = 'layer'; break;
      }
    }
    if (!hitId) {
      for (let i = store.stickers.length - 1; i >= 0; i--) {
        const s = store.stickers[i];
        if (pos.x >= s.x && pos.x <= s.x + s.width && pos.y >= s.y && pos.y <= s.y + s.height) { hitId = s.id; hitType = 'sticker'; break; }
      }
    }
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
    
    const pos = getMousePos(e);

    if (!isDragging && !resizingItem) {
      const hit = checkResizeHandleHit(pos);
      setHoverHandle(hit ? hit.handle : null);
      return;
    }

    if (resizingItem) {
      const dx = pos.x - lastPos.x; const dy = pos.y - lastPos.y;
      if (resizingItem.type === 'shape') {
        const shape = store.shapes.find(s => s.id === resizingItem.id);
        if (shape) {
          let { x, y, width, height } = shape;
          if (resizingItem.handle === 'nw') { if (width - dx >= 10) { width -= dx; x += dx; } if (height - dy >= 10) { height -= dy; y += dy; } }
          else if (resizingItem.handle === 'ne') { if (width + dx >= 10) width += dx; if (height - dy >= 10) { height -= dy; y += dy; } }
          else if (resizingItem.handle === 'sw') { if (width - dx >= 10) { width -= dx; x += dx; } if (height + dy >= 10) height += dy; }
          else if (resizingItem.handle === 'se') { if (width + dx >= 10) width += dx; if (height + dy >= 10) height += dy; }
          else if (resizingItem.handle === 'start') { x += dx; width -= dx; }
          else if (resizingItem.handle === 'end') { width += dx; }
          store.updateShape(shape.id, { x, y, width, height });
        }
      } else if (resizingItem.type === 'sticker') {
        const sticker = store.stickers.find(s => s.id === resizingItem.id);
        if (sticker) {
          let { x, y, width, height } = sticker;
          if (resizingItem.handle === 'nw') { if (width - dx >= 20) { width -= dx; x += dx; } if (height - dy >= 20) { height -= dy; y += dy; } }
          else if (resizingItem.handle === 'ne') { if (width + dx >= 20) width += dx; if (height - dy >= 20) { height -= dy; y += dy; } }
          else if (resizingItem.handle === 'sw') { if (width - dx >= 20) { width -= dx; x += dx; } if (height + dy >= 20) height += dy; }
          else if (resizingItem.handle === 'se') { if (width + dx >= 20) width += dx; if (height + dy >= 20) height += dy; }
          store.updateSticker(sticker.id, { x, y, width, height });
        }
      }
      setLastPos(pos); return;
    }

    if (isDragging) {
      const { width, height } = getCanvasDimensions();
      let dx = pos.x - lastPos.x; let dy = pos.y - lastPos.y;
      let guideX = null; let guideY = null;
      if (store.selectedLayerIds.length + store.selectedStickerIds.length + store.selectedShapeIds.length === 1) {
        if (Math.abs(pos.x - width / 2) < 15) { dx = (width / 2) - lastPos.x; guideX = width / 2; }
        if (Math.abs(pos.y - height / 2) < 15) { dy = (height / 2) - lastPos.y; guideY = height / 2; }
        store.setGuidelines({ x: guideX, y: guideY });
      }
      store.moveSelectedItems(dx, dy);
      if (!guideX && !guideY) setLastPos(pos); else setLastPos({ x: lastPos.x + dx, y: lastPos.y + dy });
    }
  };

  const handleMouseUp = () => { setIsPanning(false); setIsDragging(false); setResizingItem(null); store.setGuidelines({ x: null, y: null }); };

  return { handleMouseDown, handleMouseMove, handleMouseUp, isDragging, isPanning, getCanvasDimensions, resizingItem, hoverHandle };
}