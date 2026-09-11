import { useState } from 'react';
import useEditorStore from '../store/useEditorStore';

export default function useCanvasEvents(canvasRef, isSpacePressed, pan, setPan) {
  const store = useEditorStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // 🌟 리사이징 상태 추가 ({ id: 도형ID, handle: 조작중인 모서리 위치 })
  const [resizingShape, setResizingShape] = useState(null); 

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

  // 🌟 도형 모서리 리사이즈 핸들 충돌 감지
  const checkResizeHandleHit = (pos) => {
    // 도형 1개만 단독 선택되었을 때만 핸들 활성화
    if (store.selectedShapeIds.length !== 1 || store.selectedLayerIds.length > 0 || store.selectedStickerIds.length > 0) return null;
    
    const shape = store.shapes.find(s => s.id === store.selectedShapeIds[0]);
    if (!shape) return null;

    const HANDLE_SIZE = 10; // 핸들 클릭 판정 크기
    const isHit = (hx, hy) => Math.abs(hx - pos.x) <= HANDLE_SIZE && Math.abs(hy - pos.y) <= HANDLE_SIZE;

    if (shape.type === 'line') {
      if (isHit(shape.x, shape.y)) return { id: shape.id, handle: 'start' };
      if (isHit(shape.x + shape.width, shape.y)) return { id: shape.id, handle: 'end' };
    } else {
      if (isHit(shape.x, shape.y)) return { id: shape.id, handle: 'nw' }; // 좌상단
      if (isHit(shape.x + shape.width, shape.y)) return { id: shape.id, handle: 'ne' }; // 우상단
      if (isHit(shape.x, shape.y + shape.height)) return { id: shape.id, handle: 'sw' }; // 좌하단
      if (isHit(shape.x + shape.width, shape.y + shape.height)) return { id: shape.id, handle: 'se' }; // 우하단
    }
    return null;
  };

  const handleMouseDown = (e) => {
    if (isSpacePressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const pos = getMousePos(e);

    // 🌟 1. 리사이즈 핸들 클릭 최우선 확인
    const handleHit = checkResizeHandleHit(pos);
    if (handleHit) {
      store.saveHistory();
      setResizingShape(handleHit);
      setLastPos(pos);
      return;
    }

    // 2. 텍스트 레이어 클릭 확인
    let hitId = null; let hitType = null;
    for (let i = store.layers.length - 1; i >= 0; i--) {
      const layer = store.layers[i];
      const approxHeight = layer.text.split('\n').length * layer.size * 1.2;
      const hitBoxWidth = Math.max(100, layer.size * 3); 
      if (pos.x >= layer.x - 10 && pos.x <= layer.x + hitBoxWidth && pos.y >= layer.y - 10 && pos.y <= layer.y + approxHeight) {
        hitId = layer.id; hitType = 'layer'; break;
      }
    }
    // 3. 스티커 클릭 확인
    if (!hitId) {
      for (let i = store.stickers.length - 1; i >= 0; i--) {
        const s = store.stickers[i];
        if (pos.x >= s.x && pos.x <= s.x + s.width && pos.y >= s.y && pos.y <= s.y + s.height) { hitId = s.id; hitType = 'sticker'; break; }
      }
    }
    // 4. 도형 중심부 클릭 확인
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
    
    // 🌟 리사이징 진행 처리
    if (resizingShape) {
      const dx = pos.x - lastPos.x;
      const dy = pos.y - lastPos.y;
      const shape = store.shapes.find(s => s.id === resizingShape.id);
      
      if (shape) {
        let { x, y, width, height } = shape;

        if (resizingShape.handle === 'se') { width += dx; height += dy; } // 우하단
        else if (resizingShape.handle === 'nw') { x += dx; y += dy; width -= dx; height -= dy; } // 좌상단
        else if (resizingShape.handle === 'ne') { y += dy; width += dx; height -= dy; } // 우상단
        else if (resizingShape.handle === 'sw') { x += dx; width -= dx; height += dy; } // 좌하단
        else if (resizingShape.handle === 'end') { width += dx; } // 선 끝
        else if (resizingShape.handle === 'start') { x += dx; width -= dx; } // 선 시작

        // 사각/원형 최소 크기 10px 유지 (선은 음수 너비 허용하여 방향 전환 가능케 함)
        if (shape.type !== 'line') {
          if (width < 10) { x = shape.x; width = shape.width; }
          if (height < 10) { y = shape.y; height = shape.height; }
        }

        store.updateShape(shape.id, { x, y, width, height });
      }
      setLastPos(pos);
      return;
    }

    if (!isDragging) return;

    // 중앙 스냅 가이드라인 적용 및 다중 이동
    const { width, height } = getCanvasDimensions();
    const SNAP_THRESHOLD = 15;
    const totalSelected = store.selectedLayerIds.length + store.selectedStickerIds.length + store.selectedShapeIds.length;
    let guideX = null; let guideY = null;
    let dx = pos.x - lastPos.x; let dy = pos.y - lastPos.y;

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
    setResizingShape(null); // 🌟 리사이즈 종료
    store.setGuidelines({ x: null, y: null });
  };

  return { handleMouseDown, handleMouseMove, handleMouseUp, isDragging, isPanning, getCanvasDimensions, resizingShape };
}