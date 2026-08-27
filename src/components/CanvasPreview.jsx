import { useRef, useEffect, useState } from 'react';
import useEditorStore from '../store/useEditorStore';

function CanvasPreview() {
  const canvasRef = useRef(null);
  const { 
    image, ratio, layers, activeLayerId, setActiveLayer, updateLayer,
    stickers, activeStickerId, setActiveSticker, updateSticker 
  } = useEditorStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const stickerCache = useRef({});
  const [, setRenderTrigger] = useState(0); // 이미지 로드 후 강제 리렌더링 트리거

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

    // 🌟 1. 스티커 렌더링
    stickers.forEach(sticker => {
      let img = stickerCache.current[sticker.id];
      if (!img) {
        img = new Image();
        img.src = sticker.src;
        img.onload = () => setRenderTrigger(prev => prev + 1);
        stickerCache.current[sticker.id] = img;
      } else {
        ctx.drawImage(img, sticker.x, sticker.y, sticker.width, sticker.height);
        // 선택된 스티커 외곽선 강조
        if (sticker.id === activeStickerId) {
          ctx.strokeStyle = '#4f46e5';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(sticker.x - 2, sticker.y - 2, sticker.width + 4, sticker.height + 4);
          ctx.setLineDash([]);
        }
      }
    });

    // 🌟 2. 텍스트 레이어 렌더링
    layers.forEach(layer => {
      ctx.font = `bold ${layer.size}px sans-serif`;
      ctx.fillStyle = layer.color;
      ctx.textBaseline = 'top';
      
      if (layer.id === activeLayerId) {
        ctx.shadowColor = 'rgba(79, 70, 229, 0.8)';
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 4;
      }
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
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

      finalLines.forEach((line, index) => {
        ctx.fillText(line, layer.x, layer.y + (index * (layer.size * 1.2)));
      });
      ctx.shadowColor = 'transparent';
    });
  }, [image, ratio, layers, activeLayerId, stickers, activeStickerId]);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handleMouseDown = (e) => {
    const pos = getMousePos(e);

    // 1. 텍스트 클릭 확인
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const approxHeight = layer.text.split('\n').length * layer.size * 1.2;
      const hitBoxWidth = Math.max(200, layer.size * 5); 
      if (pos.x >= layer.x - 10 && pos.x <= layer.x + hitBoxWidth && pos.y >= layer.y - 10 && pos.y <= layer.y + approxHeight) {
        setActiveLayer(layer.id);
        setIsDragging(true);
        setDragOffset({ x: pos.x - layer.x, y: pos.y - layer.y });
        return;
      }
    }

    // 2. 스티커 클릭 확인
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
    if (activeLayerId) {
      updateLayer(activeLayerId, { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y });
    } else if (activeStickerId) {
      updateSticker(activeStickerId, { x: pos.x - dragOffset.x, y: pos.y - dragOffset.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

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