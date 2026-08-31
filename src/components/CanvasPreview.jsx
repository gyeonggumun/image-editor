import { useRef, useEffect, useState } from 'react';
import useEditorStore from '../store/useEditorStore';

function CanvasPreview() {
  const canvasRef = useRef(null);
  const { 
    image, ratio, layers, activeLayerId, setActiveLayer, updateLayer,
    stickers, activeStickerId, setActiveSticker, updateSticker,
    guidelines, setGuidelines
  } = useEditorStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const stickerCache = useRef({});
  const [, setRenderTrigger] = useState(0);

  const getCanvasDimensions = () => {
    const baseWidth = 600;
    if (ratio === '1:1') return { width: baseWidth, height: baseWidth };
    if (ratio === '4:5') return { width: baseWidth, height: baseWidth * 1.25 };
    return { width: baseWidth, height: baseWidth * (16 / 9) };
  };

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
      const canvasRatio = width / height;
      let drawWidth = width, drawHeight = height, offsetX = 0, offsetY = 0;
      if (imgRatio > canvasRatio) {
        drawWidth = height * imgRatio;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawHeight = width / imgRatio;
        offsetY = (height - drawHeight) / 2;
      }
      ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    }

    stickers.forEach(sticker => {
      let img = stickerCache.current[sticker.id];
      if (!img) {
        img = new Image();
        img.src = sticker.src;
        img.onload = () => setRenderTrigger(prev => prev + 1);
        stickerCache.current[sticker.id] = img;
      } else {
        ctx.drawImage(img, sticker.x, sticker.y, sticker.width, sticker.height);
        if (sticker.id === activeStickerId) {
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(sticker.x - 2, sticker.y - 2, sticker.width + 4, sticker.height + 4);
          ctx.setLineDash([]);
        }
      }
    });

    layers.forEach(layer => {
      // 폰트 속성 적용
      ctx.font = `bold ${layer.size}px ${layer.fontFamily || 'sans-serif'}`;
      ctx.textBaseline = 'top';
      
      if (layer.id === activeLayerId) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 6;
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 2;
      }
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      const maxTextWidth = width - layer.x - 20; 
      const paragraphs = layer.text.split('\n');
      const finalLines = [];

      paragraphs.forEach(paragraph => {
        let currentLine = '';
        const chars = paragraph.split(''); 
        for (let i = 0; i < chars.length; i++) {
          const testLine = currentLine + chars[i];
          const metrics = ctx.measureText(testLine); 
          if (metrics.width > maxTextWidth && currentLine.length > 0) {
            finalLines.push(currentLine);
            currentLine = chars[i]; 
          } else {
            currentLine = testLine;
          }
        }
        finalLines.push(currentLine); 
      });

      // 그라데이션 및 렌더링 로직
      finalLines.forEach((line, index) => {
        const currentY = layer.y + (index * (layer.size * 1.2));
        
        if (layer.useGradient) {
          const metrics = ctx.measureText(line);
          const gradient = ctx.createLinearGradient(layer.x, currentY, layer.x + metrics.width, currentY);
          gradient.addColorStop(0, layer.color);
          gradient.addColorStop(1, layer.color2 || '#a1a1aa');
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = layer.color;
        }
        
        ctx.fillText(line, layer.x, currentY);
      });
      ctx.shadowColor = 'transparent';
    });

    if (isDragging) {
      ctx.strokeStyle = '#ef4444'; 
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      
      if (guidelines.x !== null) {
        ctx.beginPath();
        ctx.moveTo(guidelines.x, 0);
        ctx.lineTo(guidelines.x, height);
        ctx.stroke();
      }
      if (guidelines.y !== null) {
        ctx.beginPath();
        ctx.moveTo(0, guidelines.y);
        ctx.lineTo(width, guidelines.y);
        ctx.stroke();
      }
      ctx.setLineDash([]); 
    }

  }, [image, ratio, layers, activeLayerId, stickers, activeStickerId, guidelines, isDragging]);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handleMouseDown = (e) => {
    const pos = getMousePos(e);

    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const approxHeight = layer.text.split('\n').length * layer.size * 1.2;
      const hitBoxWidth = Math.max(100, layer.size * 3); 
      if (pos.x >= layer.x - 10 && pos.x <= layer.x + hitBoxWidth && pos.y >= layer.y - 10 && pos.y <= layer.y + approxHeight) {
        setActiveLayer(layer.id);
        setIsDragging(true);
        setDragOffset({ x: pos.x - layer.x, y: pos.y - layer.y });
        return;
      }
    }

    for (let i = stickers.length - 1; i >= 0; i--) {
      const s = stickers[i];
      if (pos.x >= s.x && pos.x <= s.x + s.width && pos.y >= s.y && pos.y <= s.y + s.height) {
        setActiveSticker(s.id);
        setIsDragging(true);
        setDragOffset({ x: pos.x - s.x, y: pos.y - s.y });
        return;
      }
    }

    setActiveLayer(null);
    setActiveSticker(null);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const pos = getMousePos(e);
    const { width, height } = getCanvasDimensions();
    
    let targetX = pos.x - dragOffset.x;
    let targetY = pos.y - dragOffset.y;
    let guideX = null;
    let guideY = null;
    
    const SNAP_THRESHOLD = 15;

    if (Math.abs(targetX - width / 2) < SNAP_THRESHOLD) {
      targetX = width / 2;
      guideX = width / 2;
    }
    if (Math.abs(targetY - height / 2) < SNAP_THRESHOLD) {
      targetY = height / 2;
      guideY = height / 2;
    }

    if (activeLayerId) {
      updateLayer(activeLayerId, { x: targetX, y: targetY });
    } else if (activeStickerId) {
      updateSticker(activeStickerId, { x: targetX, y: targetY });
    }
    
    setGuidelines({ x: guideX, y: guideY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setGuidelines({ x: null, y: null });
  };

  return (
    <div className="preview-panel">
      <div className="canvas-container">
        <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} style={{ cursor: isDragging ? 'grabbing' : 'grab' }} />
      </div>
      <button className="action-btn" onClick={() => {
        const link = document.createElement('a');
        link.download = `result-${Date.now()}.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
      }}>이미지 내려받기</button>
    </div>
  );
}

export default CanvasPreview;