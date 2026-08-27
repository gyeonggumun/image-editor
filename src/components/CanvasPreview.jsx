import { useRef, useEffect, useState } from 'react';
import useEditorStore from '../store/useEditorStore';

function CanvasPreview() {
  const canvasRef = useRef(null);
  const { image, ratio, layers, activeLayerId, setActiveLayer, updateLayer } = useEditorStore();
  
  // 드래그 상태 관리
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const getCanvasDimensions = () => {
    const baseWidth = 600;
    if (ratio === '1:1') return { width: baseWidth, height: baseWidth };
    if (ratio === '4:5') return { width: baseWidth, height: baseWidth * 1.25 };
    if (ratio === '9:16') return { width: baseWidth, height: baseWidth * (16 / 9) };
    return { width: baseWidth, height: baseWidth };
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

    // 🌟 배열에 있는 모든 레이어 순회 및 렌더링
    layers.forEach(layer => {
      ctx.font = `bold ${layer.size}px sans-serif`;
      ctx.fillStyle = layer.color;
      ctx.textBaseline = 'top';
      
      // 선택된 레이어에 하이라이트 효과 부여
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
  }, [image, ratio, layers, activeLayerId]);

  // --- 마우스 드래그 이벤트 처리 ---
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    // 캔버스 CSS 크기와 실제 크기의 비율을 고려한 좌표 계산
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    // 가장 나중에 추가된(위에 렌더링된) 레이어부터 클릭 판정
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const lines = layer.text.split('\n').length;
      const approxHeight = lines * layer.size * 1.2;
      // 대략적인 클릭 히트박스 영역 (클릭 편의성을 위해 여유 공간 부여)
      const hitBoxWidth = Math.max(200, layer.size * 5); 

      if (
        pos.x >= layer.x - 10 && pos.x <= layer.x + hitBoxWidth &&
        pos.y >= layer.y - 10 && pos.y <= layer.y + approxHeight
      ) {
        setActiveLayer(layer.id);
        setIsDragging(true);
        setDragOffset({ x: pos.x - layer.x, y: pos.y - layer.y });
        return;
      }
    }
    setActiveLayer(null); // 허공 클릭 시 선택 해제
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !activeLayerId) return;
    const pos = getMousePos(e);
    updateLayer(activeLayerId, { 
      x: pos.x - dragOffset.x, 
      y: pos.y - dragOffset.y 
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="preview-panel">
      <div className="canvas-container">
        <canvas 
          ref={canvasRef} 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        />
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