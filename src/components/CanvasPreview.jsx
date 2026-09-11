import { useRef, useEffect, useState } from 'react';
import useEditorStore from '../store/useEditorStore';
import { jsPDF } from 'jspdf';

export default function CanvasPreview() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  const { 
    image, imageFilters, layers, stickers, shapes, guidelines, 
    selectedLayerIds, selectedStickerIds, selectedShapeIds,
    undo, redo, saveHistory, selectItem, clearSelection, moveSelectedItems,
    updateShape, updateSticker, setGuidelines
  } = useEditorStore();
  
  const stickerCache = useRef({});
  const [, setRenderTrigger] = useState(0);

  // 뷰포트 및 패닝 상태
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // 드래그 및 리사이징 상태
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [resizingItem, setResizingItem] = useState(null); // { id, type, handle }
  const [hoverHandle, setHoverHandle] = useState(null);

  // 🌟 1. 단축키 및 방향키 정밀 이동 이벤트
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['TEXTAREA', 'INPUT'].includes(e.target.tagName)) return;
      
      if (e.code === 'Space' && !isSpacePressed) { e.preventDefault(); setIsSpacePressed(true); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); } 
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }

      // 방향키를 이용한 정밀 이동(Nudge)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        const totalSelected = selectedLayerIds.length + selectedStickerIds.length + selectedShapeIds.length;
        if (totalSelected > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1; 
          let dx = 0, dy = 0;
          if (e.code === 'ArrowUp') dy = -step;
          if (e.code === 'ArrowDown') dy = step;
          if (e.code === 'ArrowLeft') dx = -step;
          if (e.code === 'ArrowRight') dx = step;
          moveSelectedItems(dx, dy);
        }
      }
    };
    const handleKeyUp = (e) => { if (e.code === 'Space') setIsSpacePressed(false); };
    
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [undo, redo, isSpacePressed, selectedLayerIds, selectedStickerIds, selectedShapeIds, moveSelectedItems]);

  // 마우스 휠 확대/축소
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(prev => Math.min(Math.max(0.2, prev - e.deltaY * 0.002), 3)); }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const getCanvasDimensions = () => {
    const baseWidth = 600;
    if (ratio === '1:1') return { width: baseWidth, height: baseWidth };
    if (ratio === '4:5') return { width: baseWidth, height: baseWidth * 1.25 };
    return { width: baseWidth, height: baseWidth * (16 / 9) };
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  // 🌟 2. 모서리 조절점(핸들) 충돌 감지 로직
  const checkResizeHandleHit = (pos) => {
    const HANDLE_SIZE = 12; // 클릭하기 쉽게 영역 넉넉히 확보
    const isHit = (hx, hy) => Math.abs(hx - pos.x) <= HANDLE_SIZE && Math.abs(hy - pos.y) <= HANDLE_SIZE;

    // 도형이 단독 선택되었을 때
    if (selectedShapeIds.length === 1 && selectedLayerIds.length === 0 && selectedStickerIds.length === 0) {
      const shape = shapes.find(s => s.id === selectedShapeIds[0]);
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
    
    // 스티커가 단독 선택되었을 때
    if (selectedStickerIds.length === 1 && selectedLayerIds.length === 0 && selectedShapeIds.length === 0) {
      const sticker = stickers.find(s => s.id === selectedStickerIds[0]);
      if (sticker) {
        if (isHit(sticker.x, sticker.y)) return { id: sticker.id, type: 'sticker', handle: 'nw' };
        if (isHit(sticker.x + sticker.width, sticker.y)) return { id: sticker.id, type: 'sticker', handle: 'ne' };
        if (isHit(sticker.x, sticker.y + sticker.height)) return { id: sticker.id, type: 'sticker', handle: 'sw' };
        if (isHit(sticker.x + sticker.width, sticker.y + sticker.height)) return { id: sticker.id, type: 'sticker', handle: 'se' };
      }
    }
    return null;
  };

  // 🌟 3. 마우스 클릭 (요소 선택 및 리사이즈 시작)
  const handleMouseDown = (e) => {
    if (isSpacePressed) { setIsPanning(true); setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); return; }
    
    const pos = getMousePos(e);
    
    // 우선순위 1: 모서리 조절점 클릭 확인
    const handleHit = checkResizeHandleHit(pos);
    if (handleHit) {
      saveHistory();
      setResizingItem(handleHit);
      setLastPos(pos);
      return;
    }

    // 우선순위 2: 요소 본체 클릭 확인
    let hitId = null; let hitType = null;
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (pos.x >= layer.x - 10 && pos.x <= layer.x + Math.max(100, layer.size * 3) && pos.y >= layer.y - 10 && pos.y <= layer.y + (layer.text.split('\n').length * layer.size * 1.2)) {
        hitId = layer.id; hitType = 'layer'; break;
      }
    }
    if (!hitId) {
      for (let i = stickers.length - 1; i >= 0; i--) {
        const s = stickers[i];
        if (pos.x >= s.x && pos.x <= s.x + s.width && pos.y >= s.y && pos.y <= s.y + s.height) { hitId = s.id; hitType = 'sticker'; break; }
      }
    }
    if (!hitId) {
      for (let i = shapes.length - 1; i >= 0; i--) {
        const s = shapes[i];
        const hitHeight = s.type === 'line' ? Math.max(s.height, 20) : s.height;
        const hitY = s.type === 'line' ? s.y - hitHeight/2 : s.y;
        if (pos.x >= s.x && pos.x <= s.x + s.width && pos.y >= hitY && pos.y <= hitY + hitHeight) { hitId = s.id; hitType = 'shape'; break; }
      }
    }

    if (hitId) {
      saveHistory();
      const isAlreadySelected = (hitType === 'layer' && selectedLayerIds.includes(hitId)) || (hitType === 'sticker' && selectedStickerIds.includes(hitId)) || (hitType === 'shape' && selectedShapeIds.includes(hitId));
      if (!isAlreadySelected) selectItem(hitId, hitType, e.shiftKey);
      
      setIsDragging(true); setLastPos(pos); return;
    }
    clearSelection();
  };

  // 🌟 4. 마우스 이동 (드래그, 리사이징 및 마우스 커서 호버 처리)
  const handleMouseMove = (e) => {
    if (isPanning) { setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }); return; }
    
    const pos = getMousePos(e);
    const { width: canvasW, height: canvasH } = getCanvasDimensions();

    // 아무것도 드래그하지 않을 때 마우스 호버 커서 감지
    if (!isDragging && !resizingItem) {
      const hit = checkResizeHandleHit(pos);
      setHoverHandle(hit ? hit.handle : null);
      return;
    }

    // 모서리를 잡아당겨 리사이징 중일 때
    if (resizingItem) {
      const dx = pos.x - lastPos.x;
      const dy = pos.y - lastPos.y;
      
      if (resizingItem.type === 'shape') {
        const shape = shapes.find(s => s.id === resizingItem.id);
        if (shape) {
          let { x, y, width, height } = shape;
          if (resizingItem.handle === 'nw') { if (width - dx >= 10) { width -= dx; x += dx; } if (height - dy >= 10) { height -= dy; y += dy; } }
          else if (resizingItem.handle === 'ne') { if (width + dx >= 10) width += dx; if (height - dy >= 10) { height -= dy; y += dy; } }
          else if (resizingItem.handle === 'sw') { if (width - dx >= 10) { width -= dx; x += dx; } if (height + dy >= 10) height += dy; }
          else if (resizingItem.handle === 'se') { if (width + dx >= 10) width += dx; if (height + dy >= 10) height += dy; }
          else if (resizingItem.handle === 'start') { x += dx; width -= dx; }
          else if (resizingItem.handle === 'end') { width += dx; }
          updateShape(shape.id, { x, y, width, height });
        }
      } else if (resizingItem.type === 'sticker') {
        const sticker = stickers.find(s => s.id === resizingItem.id);
        if (sticker) {
          let { x, y, width, height } = sticker;
          if (resizingItem.handle === 'nw') { if (width - dx >= 20) { width -= dx; x += dx; } if (height - dy >= 20) { height -= dy; y += dy; } }
          else if (resizingItem.handle === 'ne') { if (width + dx >= 20) width += dx; if (height - dy >= 20) { height -= dy; y += dy; } }
          else if (resizingItem.handle === 'sw') { if (width - dx >= 20) { width -= dx; x += dx; } if (height + dy >= 20) height += dy; }
          else if (resizingItem.handle === 'se') { if (width + dx >= 20) width += dx; if (height + dy >= 20) height += dy; }
          updateSticker(sticker.id, { x, y, width, height });
        }
      }
      setLastPos(pos);
      return;
    }

    // 일반 드래그 이동 (스냅 가이드라인 포함)
    if (isDragging) {
      let dx = pos.x - lastPos.x; let dy = pos.y - lastPos.y;
      let guideX = null; let guideY = null;
      if (selectedLayerIds.length + selectedStickerIds.length + selectedShapeIds.length === 1) {
        if (Math.abs(pos.x - canvasW / 2) < 15) { dx = (canvasW / 2) - lastPos.x; guideX = canvasW / 2; }
        if (Math.abs(pos.y - canvasH / 2) < 15) { dy = (canvasH / 2) - lastPos.y; guideY = canvasH / 2; }
        setGuidelines({ x: guideX, y: guideY });
      }
      moveSelectedItems(dx, dy);
      if (!guideX && !guideY) setLastPos(pos); else setLastPos({ x: lastPos.x + dx, y: lastPos.y + dy });
    }
  };

  const handleMouseUp = () => { setIsPanning(false); setIsDragging(false); setResizingItem(null); setGuidelines({ x: null, y: null }); };

  // 🌟 동적 마우스 커서 적용 로직
  let canvasCursor = 'default';
  const activeHandle = resizingItem ? resizingItem.handle : hoverHandle;
  
  if (isSpacePressed) canvasCursor = isPanning ? 'grabbing' : 'grab';
  else if (activeHandle) {
    if (['nw', 'se'].includes(activeHandle)) canvasCursor = 'nwse-resize';
    else if (['ne', 'sw'].includes(activeHandle)) canvasCursor = 'nesw-resize';
    else canvasCursor = 'ew-resize';
  } else if (isDragging) canvasCursor = 'grabbing';

  // 🌟 캔버스 그리기 (Render)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = getCanvasDimensions();
    
    canvas.width = width; canvas.height = height;
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(0, 0, width, height);

    if (image) {
      const imgRatio = image.width / image.height;
      let drawWidth = width, drawHeight = height, offsetX = 0, offsetY = 0;
      if (imgRatio > width / height) { drawWidth = height * imgRatio; offsetX = (width - drawWidth) / 2; } 
      else { drawHeight = width / imgRatio; offsetY = (height - drawHeight) / 2; }
      ctx.filter = `brightness(${imageFilters.brightness}%) contrast(${imageFilters.contrast}%) grayscale(${imageFilters.grayscale}%) blur(${imageFilters.blur}px)`;
      ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
      ctx.filter = 'none';
    }

    // 공통 핸들 그리기 함수
    const drawHandle = (hx, hy) => {
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(hx - 5, hy - 5, 10, 10); ctx.fill(); ctx.stroke();
    };

    shapes.forEach(shape => {
      ctx.globalAlpha = shape.opacity !== undefined ? shape.opacity : 1;
      ctx.beginPath();
      
      if (shape.type === 'rect') {
        if (ctx.roundRect) ctx.roundRect(shape.x, shape.y, shape.width, shape.height, shape.borderRadius || 0); else ctx.rect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === 'circle') {
        const radius = Math.min(shape.width, shape.height) / 2;
        ctx.arc(shape.x + radius, shape.y + radius, radius, 0, 2 * Math.PI);
      } else if (shape.type === 'line') {
        ctx.moveTo(shape.x, shape.y); ctx.lineTo(shape.x + shape.width, shape.y);
      }

      if (shape.type !== 'line') {
        if (shape.hasFill ?? true) { ctx.fillStyle = shape.fill; ctx.fill(); }
        if (shape.hasStroke) { ctx.strokeStyle = shape.strokeColor || '#18181b'; ctx.lineWidth = shape.strokeWidth || 2; ctx.stroke(); }
      } else {
        ctx.strokeStyle = shape.strokeColor || shape.fill; ctx.lineWidth = shape.height; ctx.lineCap = 'round'; ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // 단독 선택 시 파란색 외곽선 및 리사이즈 핸들 표시
      if (selectedShapeIds.includes(shape.id)) {
        ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        ctx.strokeRect(shape.x - 2, shape.y - (shape.type === 'line' ? shape.height/2 + 2 : 2), shape.width + 4, (shape.type === 'line' ? shape.height : shape.height) + 4); 
        ctx.setLineDash([]);
        
        if (selectedShapeIds.length === 1 && selectedLayerIds.length === 0 && selectedStickerIds.length === 0) {
          if (shape.type === 'line') { drawHandle(shape.x, shape.y); drawHandle(shape.x + shape.width, shape.y); } 
          else { drawHandle(shape.x, shape.y); drawHandle(shape.x + shape.width, shape.y); drawHandle(shape.x, shape.y + shape.height); drawHandle(shape.x + shape.width, shape.y + shape.height); }
        }
      }
    });

    stickers.forEach(sticker => {
      let img = stickerCache.current[sticker.id];
      if (!img) { img = new Image(); img.src = sticker.src; img.onload = () => setRenderTrigger(prev => prev + 1); stickerCache.current[sticker.id] = img; } 
      else {
        ctx.drawImage(img, sticker.x, sticker.y, sticker.width, sticker.height);
        if (selectedStickerIds.includes(sticker.id)) { 
          ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.strokeRect(sticker.x - 2, sticker.y - 2, sticker.width + 4, sticker.height + 4); ctx.setLineDash([]); 
          if (selectedStickerIds.length === 1 && selectedLayerIds.length === 0 && selectedShapeIds.length === 0) {
            drawHandle(sticker.x, sticker.y); drawHandle(sticker.x + sticker.width, sticker.y); drawHandle(sticker.x, sticker.y + sticker.height); drawHandle(sticker.x + sticker.width, sticker.y + sticker.height);
          }
        }
      }
    });

    layers.forEach(layer => {
      ctx.font = `bold ${layer.size}px ${layer.fontFamily || 'sans-serif'}`; ctx.textBaseline = 'top';
      if (selectedLayerIds.includes(layer.id)) { ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 6; } else { ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 2; }
      ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1;
      
      const paragraphs = layer.text.split('\n'); const finalLines = [];
      paragraphs.forEach(paragraph => {
        let currentLine = ''; const chars = paragraph.split(''); 
        for (let i = 0; i < chars.length; i++) {
          const testLine = currentLine + chars[i];
          if (ctx.measureText(testLine).width > (width - layer.x - 20) && currentLine.length > 0) { finalLines.push(currentLine); currentLine = chars[i]; } 
          else { currentLine = testLine; }
        }
        finalLines.push(currentLine); 
      });

      finalLines.forEach((line, index) => {
        const currentY = layer.y + (index * (layer.size * 1.2));
        const gradientColors = layer.gradientColors || [layer.color, layer.color2 || '#a1a1aa'];
        if (layer.useGradient && gradientColors.length >= 2) {
          const grad = ctx.createLinearGradient(layer.x, currentY, layer.x + ctx.measureText(line).width, currentY);
          gradientColors.forEach((color, i) => grad.addColorStop(i / (gradientColors.length - 1), color)); ctx.fillStyle = grad;
        } else { ctx.fillStyle = layer.color; }
        ctx.fillText(line, layer.x, currentY);
      });
      ctx.shadowColor = 'transparent';
    });

    if (isDragging && guidelines) {
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      if (guidelines.x !== null) { ctx.beginPath(); ctx.moveTo(guidelines.x, 0); ctx.lineTo(guidelines.x, height); ctx.stroke(); }
      if (guidelines.y !== null) { ctx.beginPath(); ctx.moveTo(0, guidelines.y); ctx.lineTo(width, guidelines.y); ctx.stroke(); }
      ctx.setLineDash([]); 
    }
  }, [image, imageFilters, layers, stickers, shapes, selectedLayerIds, selectedStickerIds, selectedShapeIds, guidelines, isDragging, resizingItem, hoverHandle]);

  return (
    <div className="preview-panel" style={{ position: 'relative' }}>
      
      {/* 줌 컨트롤 UI */}
      <div style={{ position: 'absolute', bottom: '110px', right: '20px', zIndex: 10, display: 'flex', gap: '4px', background: 'var(--bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-subtle)', border: '1px solid var(--border-base)' }}>
        <button className="action-sm-btn" onClick={() => setZoom(prev => Math.max(0.2, prev - 0.1))} title="축소">-</button>
        <span style={{ fontSize: '12px', padding: '0 8px', display: 'flex', alignItems: 'center', fontWeight: '500' }}>{Math.round(zoom * 100)}%</span>
        <button className="action-sm-btn" onClick={() => setZoom(prev => Math.min(3, prev + 0.1))} title="확대">+</button>
        <button className="action-sm-btn" onClick={() => { setZoom(1); setPan({x:0, y:0}); }} title="초기화">Reset</button>
      </div>

      <div ref={containerRef} className="canvas-container" style={{ overflow: 'hidden' }}>
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center center', transition: isPanning ? 'none' : 'transform 0.1s ease-out' }}>
          <canvas 
            ref={canvasRef} 
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} 
            style={{ cursor: canvasCursor }} 
          />
        </div>
      </div>
      
      {/* 액션 버튼 */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button className="secondary-btn" style={{ flex: 1, padding: '12px', fontWeight: 'bold' }} onClick={() => {
          const link = document.createElement('a'); link.download = `result-${Date.now()}.png`; link.href = canvasRef.current.toDataURL('image/png'); link.click();
        }}>웹용 이미지 다운로드</button>
        
        <button className="action-btn" style={{ flex: 1, margin: 0, padding: '12px', backgroundColor: '#dc2626', borderColor: '#dc2626', fontWeight: 'bold' }} onClick={() => {
          const isLandscape = canvasRef.current.width > canvasRef.current.height;
          const pdf = new jsPDF({ orientation: isLandscape ? 'landscape' : 'portrait', unit: 'px', format: [canvasRef.current.width, canvasRef.current.height] });
          pdf.addImage(canvasRef.current.toDataURL('image/png', 1.0), 'PNG', 0, 0, canvasRef.current.width, canvasRef.current.height);
          pdf.save(`design-export-${Date.now()}.pdf`);
        }}>인쇄용 PDF 다운로드</button>
      </div>
    </div>
  );
}