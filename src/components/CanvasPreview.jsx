import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import useEditorStore from '../store/useEditorStore';
import useShortcuts from '../hooks/useShortcuts';
import useCanvasEvents from '../hooks/useCanvasEvents';
import StudioExport from './canvas/StudioExport';
import { prepareImage, loadImage, textLayout, validateDimensions } from '../lib/imageTools';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const pointsToPath = (points) => points
  .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
  .join(' ');

export default function CanvasPreview({ mode }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  const {
    canvasWidth, canvasHeight, imageFit,
    image,
    imageFilters,
    layers,
    stickers,
    shapes,
    guidelines,
    selectedLayerIds,
    selectedStickerIds,
    selectedShapeIds,
    maskMode,
    maskBrushSize,
    maskStrokes,
    addMaskStroke
  } = useEditorStore();
  
  const stickerCache = useRef({});
  const [renderTrigger, setRenderTrigger] = useState(0);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const { isSpacePressed } = useShortcuts(containerRef, setZoom);
  
  // 훅에서 가져오는 상태 확장
  const { handleMouseDown, handleMouseMove, handleMouseUp, isDragging, isPanning, getCanvasDimensions, resizingItem, hoverHandle } = useCanvasEvents(canvasRef, isSpacePressed, pan, setPan);
  const canvasSize = getCanvasDimensions();
  const background = useMemo(() => prepareImage(image, canvasWidth, canvasHeight, imageFilters, imageFit), [image, canvasWidth, canvasHeight, imageFilters, imageFit]);
  const [compare, setCompare] = useState(false);
  const original = useMemo(() => mode === 'enhance' && image ? prepareImage(image, canvasWidth, canvasHeight, { brightness: 100, contrast: 100, grayscale: 0, blur: 0 }, imageFit) : null, [image, canvasWidth, canvasHeight, imageFit, mode]);
  const maskOverlayRef = useRef(null);
  const [currentMaskStroke, setCurrentMaskStroke] = useState(null);

  const getMaskPoint = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * canvasSize.width, 0, canvasSize.width),
      y: clamp(((event.clientY - rect.top) / rect.height) * canvasSize.height, 0, canvasSize.height)
    };
  };

  const handleMaskPointerDown = (event) => {
    if (!maskMode) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setCurrentMaskStroke([getMaskPoint(event)]);
  };

  const handleMaskPointerMove = (event) => {
    if (!maskMode || !currentMaskStroke) return;
    setCurrentMaskStroke((stroke) => [...stroke, getMaskPoint(event)]);
  };

  const handleMaskPointerUp = (event) => {
    if (!currentMaskStroke) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    addMaskStroke(currentMaskStroke);
    setCurrentMaskStroke(null);
  };

  // 동적 마우스 커서 설정
  let canvasCursor = 'default';
  const activeHandle = resizingItem ? resizingItem.handle : hoverHandle;
  if (isSpacePressed) {
    canvasCursor = isPanning ? 'grabbing' : 'grab';
  } else if (activeHandle) {
    if (['nw', 'se'].includes(activeHandle)) canvasCursor = 'nwse-resize';
    else if (['ne', 'sw'].includes(activeHandle)) canvasCursor = 'nesw-resize';
    else canvasCursor = 'ew-resize';
  } else if (isDragging) {
    canvasCursor = 'grabbing';
  }

  const drawCanvas = useCallback((canvas, clean = false, scale = 1) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = getCanvasDimensions();
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);
    ctx.drawImage(!clean && compare && original ? original : background, 0, 0, width, height);

    const drawHandle = (hx, hy) => {
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(hx - 4, hy - 4, 8, 8); ctx.fill(); ctx.stroke();
    };

    shapes.forEach(shape => {
      ctx.globalAlpha = shape.opacity !== undefined ? shape.opacity : 1;
      ctx.beginPath();
      
      if (shape.type === 'rect') {
        if (ctx.roundRect) ctx.roundRect(shape.x, shape.y, shape.width, shape.height, shape.borderRadius || 0);
        else ctx.rect(shape.x, shape.y, shape.width, shape.height);
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

      if (!clean && selectedShapeIds.includes(shape.id)) {
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
      if (!img || img.src !== sticker.src) { img = new Image(); img.onload = () => setRenderTrigger(prev => prev + 1); img.src = sticker.src; stickerCache.current[sticker.id] = img; }
      if (img.complete && img.naturalWidth) {
        ctx.drawImage(img, sticker.x, sticker.y, sticker.width, sticker.height);
        if (!clean && selectedStickerIds.includes(sticker.id)) {
          ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); 
          ctx.strokeRect(sticker.x - 2, sticker.y - 2, sticker.width + 4, sticker.height + 4); 
          ctx.setLineDash([]); 
          
          if (selectedStickerIds.length === 1 && selectedLayerIds.length === 0 && selectedShapeIds.length === 0) {
            drawHandle(sticker.x, sticker.y); drawHandle(sticker.x + sticker.width, sticker.y); drawHandle(sticker.x, sticker.y + sticker.height); drawHandle(sticker.x + sticker.width, sticker.y + sticker.height);
          }
        }
      }
    });

    layers.forEach(layer => {
      const layout = textLayout(ctx, layer, width);
      const finalLines = layout.lines;
      ctx.textBaseline = 'top';
      ctx.shadowColor = 'transparent';
      if (!clean && selectedLayerIds.includes(layer.id)) {
        ctx.strokeStyle = '#486653'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
        ctx.strokeRect(layer.x - 3, layer.y - 3, layout.width + 6, layout.height + 6);
        ctx.setLineDash([]);
      }
      finalLines.forEach((line, index) => {
        const currentY = layer.y + (index * (layer.size * (layer.lineHeight || 1.4)));
        const gradientColors = layer.gradientColors || [layer.color, layer.color2 || '#a1a1aa'];
        if (layer.useGradient && gradientColors.length >= 2) {
          const grad = ctx.createLinearGradient(layer.x, currentY, layer.x + ctx.measureText(line).width, currentY);
          gradientColors.forEach((color, i) => grad.addColorStop(i / (gradientColors.length - 1), color));
          ctx.fillStyle = grad;
        } else { ctx.fillStyle = layer.color; }
        ctx.fillText(line, layer.x, currentY);
      });
      ctx.shadowColor = 'transparent';
    });

    if (!clean && isDragging && guidelines) {
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      if (guidelines.x !== null) { ctx.beginPath(); ctx.moveTo(guidelines.x, 0); ctx.lineTo(guidelines.x, height); ctx.stroke(); }
      if (guidelines.y !== null) { ctx.beginPath(); ctx.moveTo(0, guidelines.y); ctx.lineTo(width, guidelines.y); ctx.stroke(); }
      ctx.setLineDash([]); 
    }

  }, [getCanvasDimensions, background, original, compare, layers, stickers, shapes, selectedLayerIds, selectedStickerIds, selectedShapeIds, guidelines, isDragging]);

  useEffect(() => { drawCanvas(canvasRef.current); }, [drawCanvas, renderTrigger]);

  const renderExport = async scale => {
    if (!validateDimensions(canvasWidth * scale, canvasHeight * scale)) throw new Error('출력 크기 제한을 초과했습니다.');
    await document.fonts.ready;
    await Promise.all(stickers.map(async sticker => { stickerCache.current[sticker.id] = await loadImage(sticker.src); }));
    const canvas = document.createElement('canvas');
    drawCanvas(canvas, true, scale);
    return canvas;
  };

  return (
    <div className="preview-panel" style={{ position: 'relative' }}>
      
      <div style={{ position: 'absolute', bottom: '145px', right: '20px', zIndex: 10, display: 'flex', gap: '4px', background: 'var(--bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-subtle)', border: '1px solid var(--border-base)' }}>
        <button className="action-sm-btn" onClick={() => setZoom(prev => Math.max(0.2, prev - 0.25))} title="축소">-</button>
        <span style={{ fontSize: '12px', padding: '0 8px', display: 'flex', alignItems: 'center', fontWeight: '500' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button className="action-sm-btn" onClick={() => setZoom(prev => Math.min(8, prev + 0.25))} title="확대">+</button>
        <button className="action-sm-btn" onClick={() => { setZoom(1); setPan({x:0, y:0}); }} title="초기화">화면 맞춤</button>
      </div>

      {mode === 'enhance' && image && <button className="compare-button" aria-pressed={compare} onClick={() => setCompare(!compare)}>{compare ? '보정 결과 보기' : '원본 비교하기'}</button>}
      <div ref={containerRef} className="canvas-container" style={{ overflow: 'hidden' }}>
        <div className="canvas-stage" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, '--canvas-ratio': `${canvasWidth} / ${canvasHeight}`, width: `min(100%, ${Math.min(600, 560 * canvasWidth / canvasHeight)}px)`, transformOrigin: 'center center', transition: isPanning ? 'none' : 'transform 0.1s ease-out' }}>
          <canvas 
            aria-label="작업 캔버스"
            ref={canvasRef} 
            width={canvasSize.width}
            height={canvasSize.height}
            onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); handleMouseDown(e); }} onPointerMove={handleMouseMove} onPointerUp={handleMouseUp} onPointerCancel={handleMouseUp}
            style={{ cursor: canvasCursor }} 
          />
          <svg
            ref={maskOverlayRef}
            className={`mask-overlay${maskMode ? ' is-active' : ''}`}
            viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
            aria-label="지우기 영역 마스크"
            onPointerDown={handleMaskPointerDown}
            onPointerMove={handleMaskPointerMove}
            onPointerUp={handleMaskPointerUp}
            onPointerCancel={handleMaskPointerUp}
          >
            {[...maskStrokes, ...(currentMaskStroke ? [currentMaskStroke] : [])].map((stroke, index) => {
              const path = pointsToPath(stroke);
              return (
                <g key={`${index}-${stroke.length}`}>
                  <path d={path} fill="none" stroke="#f97316" strokeWidth={maskBrushSize} strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
                  <path d={path} fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      
      <StudioExport renderCanvas={renderExport} />

    </div>
  );
}
