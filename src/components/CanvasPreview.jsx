import { useRef, useEffect, useState } from 'react';
import useEditorStore from '../store/useEditorStore';
import useShortcuts from '../hooks/useShortcuts';
import useCanvasEvents from '../hooks/useCanvasEvents';
import { jsPDF } from 'jspdf'; // 🌟 PDF 출력을 위해 파일 내부에 직접 임포트

export default function CanvasPreview() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  const { image, imageFilters, layers, stickers, shapes, guidelines, selectedLayerIds, selectedStickerIds, selectedShapeIds } = useEditorStore();
  
  const stickerCache = useRef({});
  const [, setRenderTrigger] = useState(0);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const { isSpacePressed } = useShortcuts(containerRef, setZoom);
  
  // resizingShape 상태를 훅에서 가져옴
  const { handleMouseDown, handleMouseMove, handleMouseUp, isDragging, isPanning, getCanvasDimensions, resizingShape } = useCanvasEvents(canvasRef, isSpacePressed, pan, setPan);

  // 상태에 따른 동적 마우스 커서 설정
  let canvasCursor = 'default';
  if (isSpacePressed) {
    canvasCursor = isPanning ? 'grabbing' : 'grab';
  } else if (resizingShape) {
    if (['nw', 'se'].includes(resizingShape.handle)) canvasCursor = 'nwse-resize';
    else if (['ne', 'sw'].includes(resizingShape.handle)) canvasCursor = 'nesw-resize';
    else canvasCursor = 'ew-resize';
  } else if (isDragging) {
    canvasCursor = 'grabbing';
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = getCanvasDimensions();
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, width, height);

    if (image) {
      const imgRatio = image.width / image.height;
      let drawWidth = width, drawHeight = height, offsetX = 0, offsetY = 0;
      if (imgRatio > width / height) { drawWidth = height * imgRatio; offsetX = (width - drawWidth) / 2; } 
      else { drawHeight = width / imgRatio; offsetY = (height - drawHeight) / 2; }
      
      ctx.filter = `brightness(${imageFilters.brightness}%) contrast(${imageFilters.contrast}%) grayscale(${imageFilters.grayscale}%) blur(${imageFilters.blur}px)`;
      ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
      ctx.filter = 'none';
    }

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
        ctx.moveTo(shape.x, shape.y);
        ctx.lineTo(shape.x + shape.width, shape.y);
      }

      if (shape.type !== 'line') {
        if (shape.hasFill ?? true) { ctx.fillStyle = shape.fill; ctx.fill(); }
        if (shape.hasStroke) { ctx.strokeStyle = shape.strokeColor || '#18181b'; ctx.lineWidth = shape.strokeWidth || 2; ctx.stroke(); }
      } else {
        ctx.strokeStyle = shape.strokeColor || shape.fill; ctx.lineWidth = shape.height; ctx.lineCap = 'round'; ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (selectedShapeIds.includes(shape.id)) {
        ctx.strokeStyle = '#18181b'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        ctx.strokeRect(shape.x - 2, shape.y - (shape.type === 'line' ? shape.height/2 + 2 : 2), shape.width + 4, (shape.type === 'line' ? shape.height : shape.height) + 4); 
        ctx.setLineDash([]);
        
        // 단독 선택된 경우에만 모서리에 파란색 리사이즈 조절점(핸들) 그리기
        if (selectedShapeIds.length === 1 && selectedLayerIds.length === 0 && selectedStickerIds.length === 0) {
          const drawHandle = (hx, hy) => {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#2563eb'; // Blue-600
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(hx - 4, hy - 4, 8, 8);
            ctx.fill();
            ctx.stroke();
          };

          if (shape.type === 'line') {
            drawHandle(shape.x, shape.y);
            drawHandle(shape.x + shape.width, shape.y);
          } else {
            drawHandle(shape.x, shape.y); // nw
            drawHandle(shape.x + shape.width, shape.y); // ne
            drawHandle(shape.x, shape.y + shape.height); // sw
            drawHandle(shape.x + shape.width, shape.y + shape.height); // se
          }
        }
      }
    });

    stickers.forEach(sticker => {
      let img = stickerCache.current[sticker.id];
      if (!img) { img = new Image(); img.src = sticker.src; img.onload = () => setRenderTrigger(prev => prev + 1); stickerCache.current[sticker.id] = img; } 
      else {
        ctx.drawImage(img, sticker.x, sticker.y, sticker.width, sticker.height);
        if (selectedStickerIds.includes(sticker.id)) { ctx.strokeStyle = '#18181b'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.strokeRect(sticker.x - 2, sticker.y - 2, sticker.width + 4, sticker.height + 4); ctx.setLineDash([]); }
      }
    });

    layers.forEach(layer => {
      ctx.font = `bold ${layer.size}px ${layer.fontFamily || 'sans-serif'}`; ctx.textBaseline = 'top';
      if (selectedLayerIds.includes(layer.id)) { ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 6; } 
      else { ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 2; }
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
          gradientColors.forEach((color, i) => grad.addColorStop(i / (gradientColors.length - 1), color));
          ctx.fillStyle = grad;
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

  }, [image, imageFilters, layers, stickers, shapes, selectedLayerIds, selectedStickerIds, selectedShapeIds, guidelines, isDragging, getCanvasDimensions]);

  return (
    <div className="preview-panel" style={{ position: 'relative' }}>
      
      {/* 🌟 분리하지 않고 인라인으로 유지한 줌(Zoom) 컨트롤 UI */}
      <div style={{ position: 'absolute', bottom: '110px', right: '20px', zIndex: 10, display: 'flex', gap: '4px', background: 'var(--bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-subtle)', border: '1px solid var(--border-base)' }}>
        <button className="action-sm-btn" onClick={() => setZoom(prev => Math.max(0.2, prev - 0.1))} title="축소">-</button>
        <span style={{ fontSize: '12px', padding: '0 8px', display: 'flex', alignItems: 'center', fontWeight: '500' }}>
          {Math.round(zoom * 100)}%
        </span>
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
      
      {/* 🌟 분리하지 않고 인라인으로 유지한 내보내기 버튼들 */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button className="secondary-btn" style={{ flex: 1, padding: '12px', fontWeight: 'bold' }} onClick={() => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const link = document.createElement('a');
          link.download = `result-${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }}>
          웹용 이미지(PNG) 다운로드
        </button>
        <button className="action-btn" style={{ flex: 1, margin: 0, padding: '12px', backgroundColor: '#dc2626', borderColor: '#dc2626', fontWeight: 'bold' }} onClick={() => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const isLandscape = canvas.width > canvas.height;
          const pdf = new jsPDF({ orientation: isLandscape ? 'landscape' : 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
          const imgData = canvas.toDataURL('image/png', 1.0);
          pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
          pdf.save(`design-export-${Date.now()}.pdf`);
        }}>
          인쇄용 PDF 다운로드
        </button>
      </div>

    </div>
  );
}