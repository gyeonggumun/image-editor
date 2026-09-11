import { useRef, useEffect, useState } from 'react';
import useEditorStore from '../store/useEditorStore';
import useShortcuts from '../hooks/useShortcuts';
import useCanvasEvents from '../hooks/useCanvasEvents';
import ZoomControls from './canvas/ZoomControls';
import ExportButtons from './canvas/ExportButtons';

export default function CanvasPreview() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  const { image, imageFilters, layers, stickers, shapes, guidelines, selectedLayerIds, selectedStickerIds, selectedShapeIds } = useEditorStore();
  
  const stickerCache = useRef({});
  const [, setRenderTrigger] = useState(0);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const { isSpacePressed } = useShortcuts(containerRef, setZoom);
  const { handleMouseDown, handleMouseMove, handleMouseUp, isDragging, isPanning, getCanvasDimensions } = useCanvasEvents(canvasRef, isSpacePressed, pan, setPan);

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
        if (ctx.roundRect) {
          ctx.roundRect(shape.x, shape.y, shape.width, shape.height, shape.borderRadius || 0);
        } else {
          ctx.rect(shape.x, shape.y, shape.width, shape.height);
        }
      } else if (shape.type === 'circle') {
        const radius = Math.min(shape.width, shape.height) / 2;
        ctx.arc(shape.x + radius, shape.y + radius, radius, 0, 2 * Math.PI);
      } else if (shape.type === 'line') {
        ctx.moveTo(shape.x, shape.y);
        ctx.lineTo(shape.x + shape.width, shape.y);
      }

      if (shape.type !== 'line') {
        if (shape.hasFill ?? true) {
          ctx.fillStyle = shape.fill;
          ctx.fill();
        }
        if (shape.hasStroke) {
          ctx.strokeStyle = shape.strokeColor || '#18181b';
          ctx.lineWidth = shape.strokeWidth || 2;
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = shape.strokeColor || shape.fill;
        ctx.lineWidth = shape.height;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      
      ctx.globalAlpha = 1;

      if (selectedShapeIds.includes(shape.id)) {
        ctx.strokeStyle = '#18181b'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        ctx.strokeRect(shape.x - 2, shape.y - (shape.type === 'line' ? shape.height/2 + 2 : 2), shape.width + 4, (shape.type === 'line' ? shape.height : shape.height) + 4); ctx.setLineDash([]);
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
      <ZoomControls zoom={zoom} setZoom={setZoom} setPan={setPan} />

      <div ref={containerRef} className="canvas-container" style={{ overflow: 'hidden', cursor: isSpacePressed ? (isPanning ? 'grabbing' : 'grab') : 'default' }}>
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center center', transition: isPanning ? 'none' : 'transform 0.1s ease-out' }}>
          <canvas 
            ref={canvasRef} 
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} 
            style={{ cursor: isDragging ? 'grabbing' : (isSpacePressed ? 'inherit' : 'default') }} 
          />
        </div>
      </div>
      
      <ExportButtons canvasRef={canvasRef} />
    </div>
  );
}