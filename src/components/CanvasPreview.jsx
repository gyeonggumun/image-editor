import { useRef, useEffect, useState } from 'react';
import useEditorStore from '../store/useEditorStore';

function CanvasPreview() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const { 
    image, ratio, layers, stickers, guidelines, setGuidelines, saveHistory, undo, redo,
    selectedLayerIds, selectedStickerIds, selectItem, clearSelection, moveSelectedItems 
  } = useEditorStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 }); // 🌟 다중 선택 이동을 위한 이전 좌표
  
  const stickerCache = useRef({});
  const [, setRenderTrigger] = useState(0);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['TEXTAREA', 'INPUT'].includes(e.target.tagName)) return;
      if (e.code === 'Space' && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [undo, redo, isSpacePressed]);

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
  }, []);

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
        // 🌟 다중 선택된 스티커 외곽선 강조
        if (selectedStickerIds.includes(sticker.id)) {
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(sticker.x - 2, sticker.y - 2, sticker.width + 4, sticker.height + 4);
          ctx.setLineDash([]);
        }
      }
    });

    layers.forEach(layer => {
      ctx.font = `bold ${layer.size}px ${layer.fontFamily || 'sans-serif'}`;
      ctx.textBaseline = 'top';
      
      // 🌟 다중 선택된 텍스트 강조
      if (selectedLayerIds.includes(layer.id)) {
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

      finalLines.forEach((line, index) => {
        const currentY = layer.y + (index * (layer.size * 1.2));
        const gradientColors = layer.gradientColors || [layer.color, layer.color2 || '#a1a1aa'];
        
        if (layer.useGradient && gradientColors.length >= 2) {
          const metrics = ctx.measureText(line);
          const gradient = ctx.createLinearGradient(layer.x, currentY, layer.x + metrics.width, currentY);
          const step = 1 / (gradientColors.length - 1);
          gradientColors.forEach((color, i) => gradient.addColorStop(i * step, color));
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = layer.color;
        }
        ctx.fillText(line, layer.x, currentY);
      });
      ctx.shadowColor = 'transparent';
    });

  }, [image, ratio, layers, stickers, selectedLayerIds, selectedStickerIds]);

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
    let hitId = null;
    let hitType = null;

    // 클릭된 텍스트 확인
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const approxHeight = layer.text.split('\n').length * layer.size * 1.2;
      const hitBoxWidth = Math.max(100, layer.size * 3); 
      if (pos.x >= layer.x - 10 && pos.x <= layer.x + hitBoxWidth && pos.y >= layer.y - 10 && pos.y <= layer.y + approxHeight) {
        hitId = layer.id;
        hitType = 'layer';
        break;
      }
    }

    // 클릭된 스티커 확인
    if (!hitId) {
      for (let i = stickers.length - 1; i >= 0; i--) {
        const s = stickers[i];
        if (pos.x >= s.x && pos.x <= s.x + s.width && pos.y >= s.y && pos.y <= s.y + s.height) {
          hitId = s.id;
          hitType = 'sticker';
          break;
        }
      }
    }

    if (hitId) {
      saveHistory();
      // 이미 선택된 그룹 안에 있는 요소를 클릭한 경우 선택 상태 유지
      const isAlreadySelected = (hitType === 'layer' && selectedLayerIds.includes(hitId)) || 
                                (hitType === 'sticker' && selectedStickerIds.includes(hitId));
      
      if (!isAlreadySelected) {
        selectItem(hitId, hitType, e.shiftKey);
      }
      
      setIsDragging(true);
      setLastPos(pos); // 🌟 다중 선택 이동을 위해 시작 좌표 저장
      return;
    }

    clearSelection();
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (!isDragging) return;
    const pos = getMousePos(e);
    
    // 🌟 델타 값(이동 거리)만큼 모든 선택된 요소 이동
    const dx = pos.x - lastPos.x;
    const dy = pos.y - lastPos.y;
    
    moveSelectedItems(dx, dy);
    setLastPos(pos);
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDragging(false);
  };

  return (
    <div className="preview-panel" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', bottom: '80px', right: '20px', zIndex: 10, display: 'flex', gap: '4px', background: 'var(--bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-subtle)', border: '1px solid var(--border-base)' }}>
        <button className="action-sm-btn" onClick={() => setZoom(prev => Math.max(0.2, prev - 0.1))} title="축소">-</button>
        <span style={{ fontSize: '12px', padding: '0 8px', display: 'flex', alignItems: 'center', fontWeight: '500' }}>{Math.round(zoom * 100)}%</span>
        <button className="action-sm-btn" onClick={() => setZoom(prev => Math.min(3, prev + 0.1))} title="확대">+</button>
        <button className="action-sm-btn" onClick={() => { setZoom(1); setPan({x:0, y:0}); }} title="초기화">Reset</button>
      </div>

      <div ref={containerRef} className="canvas-container" style={{ overflow: 'hidden', cursor: isSpacePressed ? (isPanning ? 'grabbing' : 'grab') : 'default' }}>
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center center', transition: isPanning ? 'none' : 'transform 0.1s ease-out' }}>
          <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} style={{ cursor: isDragging ? 'grabbing' : (isSpacePressed ? 'inherit' : 'default') }} />
        </div>
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