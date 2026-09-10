import { useRef, useEffect, useState } from 'react';
import useEditorStore from '../store/useEditorStore';
import { jsPDF } from 'jspdf';

function CanvasPreview() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  // 스토어 상태 및 액션 가져오기
  const { 
    image, ratio, imageFilters,
    layers, stickers, shapes, guidelines, setGuidelines, saveHistory, undo, redo,
    selectedLayerIds, selectedStickerIds, selectedShapeIds, selectItem, clearSelection, moveSelectedItems,
  } = useEditorStore();
  
  // 드래그 및 이동 상태
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 }); 
  
  // 에셋 캐싱 및 렌더링 트리거
  const stickerCache = useRef({});
  const [, setRenderTrigger] = useState(0);

  // 화면 줌(Zoom) 및 패닝(Pan) 상태
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // 🌟 키보드 단축키 (Space 바 패닝, Undo/Redo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 입력창 안에서는 단축키 방지
      if (['TEXTAREA', 'INPUT'].includes(e.target.tagName)) return;
      
      if (e.code === 'Space' && !isSpacePressed) { 
        e.preventDefault(); 
        setIsSpacePressed(true); 
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { 
        e.preventDefault(); 
        if (e.shiftKey) redo(); 
        else undo(); 
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

  // 🌟 마우스 휠 확대/축소 이벤트
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

  // 캔버스 크기 계산
  const getCanvasDimensions = () => {
    const baseWidth = 600;
    if (ratio === '1:1') return { width: baseWidth, height: baseWidth };
    if (ratio === '4:5') return { width: baseWidth, height: baseWidth * 1.25 };
    return { width: baseWidth, height: baseWidth * (16 / 9) };
  };

  // 🌟 캔버스 메인 렌더링 로직
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = getCanvasDimensions();
    
    canvas.width = width;
    canvas.height = height;
    
    // 기본 배경색
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, width, height);

    // 배경 이미지 렌더링 (필터 적용)
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
      
      // 필터 적용
      ctx.filter = `brightness(${imageFilters.brightness}%) contrast(${imageFilters.contrast}%) grayscale(${imageFilters.grayscale}%) blur(${imageFilters.blur}px)`;
      ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
      ctx.filter = 'none'; // 다른 요소에 영향 가지 않도록 초기화
    }

    // 1. 도형 렌더링
    shapes.forEach(shape => {
      ctx.globalAlpha = shape.opacity !== undefined ? shape.opacity : 1;
      ctx.beginPath();
      
      if (shape.type === 'rect') {
        ctx.rect(shape.x, shape.y, shape.width, shape.height); 
        ctx.fillStyle = shape.fill; 
        ctx.fill();
      } else if (shape.type === 'circle') {
        const radius = Math.min(shape.width, shape.height) / 2;
        ctx.arc(shape.x + radius, shape.y + radius, radius, 0, 2 * Math.PI); 
        ctx.fillStyle = shape.fill; 
        ctx.fill();
      } else if (shape.type === 'line') {
        ctx.moveTo(shape.x, shape.y); 
        ctx.lineTo(shape.x + shape.width, shape.y); 
        ctx.strokeStyle = shape.fill; 
        ctx.lineWidth = shape.height; 
        ctx.lineCap = 'round'; 
        ctx.stroke();
      }
      
      ctx.globalAlpha = 1;

      // 도형 다중 선택 외곽선 표시
      if (selectedShapeIds.includes(shape.id)) {
        ctx.strokeStyle = '#18181b'; 
        ctx.lineWidth = 1; 
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
          shape.x - 2, 
          shape.y - (shape.type === 'line' ? shape.height/2 + 2 : 2), 
          shape.width + 4, 
          (shape.type === 'line' ? shape.height : shape.height) + 4
        ); 
        ctx.setLineDash([]);
      }
    });

    // 2. 스티커 렌더링
    stickers.forEach(sticker => {
      let img = stickerCache.current[sticker.id];
      if (!img) {
        img = new Image(); 
        img.src = sticker.src; 
        img.onload = () => setRenderTrigger(prev => prev + 1); 
        stickerCache.current[sticker.id] = img;
      } else {
        ctx.drawImage(img, sticker.x, sticker.y, sticker.width, sticker.height);
        
        // 스티커 다중 선택 외곽선 표시
        if (selectedStickerIds.includes(sticker.id)) {
          ctx.strokeStyle = '#18181b'; 
          ctx.lineWidth = 1; 
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(sticker.x - 2, sticker.y - 2, sticker.width + 4, sticker.height + 4); 
          ctx.setLineDash([]);
        }
      }
    });

    // 3. 텍스트 렌더링
    layers.forEach(layer => {
      ctx.font = `bold ${layer.size}px ${layer.fontFamily || 'sans-serif'}`;
      ctx.textBaseline = 'top';
      
      // 선택된 텍스트 그림자 강조
      if (selectedLayerIds.includes(layer.id)) { 
        ctx.shadowColor = 'rgba(0,0,0,0.4)'; 
        ctx.shadowBlur = 6; 
      } else { 
        ctx.shadowColor = 'rgba(0,0,0,0.2)'; 
        ctx.shadowBlur = 2; 
      }
      ctx.shadowOffsetX = 1; 
      ctx.shadowOffsetY = 1;
      
      const maxTextWidth = width - layer.x - 20; 
      const paragraphs = layer.text.split('\n');
      const finalLines = [];

      // 자동 줄바꿈 계산
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

      // 텍스트 라인별 그라데이션 및 그리기
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

    // 4. 스냅 가이드라인 렌더링
    if (isDragging && guidelines) {
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

  }, [image, ratio, imageFilters, layers, stickers, shapes, selectedLayerIds, selectedStickerIds, selectedShapeIds, guidelines, isDragging]);

  // 마우스 위치 계산
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  // 마우스 다운: 요소 선택 및 패닝 시작
  const handleMouseDown = (e) => {
    if (isSpacePressed) { 
      setIsPanning(true); 
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); 
      return; 
    }

    const pos = getMousePos(e);
    let hitId = null; 
    let hitType = null;

    // 1. 텍스트 레이어 클릭 확인
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

    // 2. 스티커 클릭 확인
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

    // 3. 도형 클릭 확인
    if (!hitId) {
      for (let i = shapes.length - 1; i >= 0; i--) {
        const s = shapes[i];
        const hitHeight = s.type === 'line' ? Math.max(s.height, 20) : s.height;
        const hitY = s.type === 'line' ? s.y - hitHeight/2 : s.y;
        if (pos.x >= s.x && pos.x <= s.x + s.width && pos.y >= hitY && pos.y <= hitY + hitHeight) { 
          hitId = s.id; 
          hitType = 'shape'; 
          break; 
        }
      }
    }

    // 요소 적중 시 선택 처리
    if (hitId) {
      saveHistory(); // 요소 이동 전 히스토리 저장
      const isAlreadySelected = (hitType === 'layer' && selectedLayerIds.includes(hitId)) || 
                                (hitType === 'sticker' && selectedStickerIds.includes(hitId)) || 
                                (hitType === 'shape' && selectedShapeIds.includes(hitId));
      
      // Shift 키 다중 선택 로직
      if (!isAlreadySelected) {
        selectItem(hitId, hitType, e.shiftKey);
      }
      
      setIsDragging(true); 
      setLastPos(pos); 
      return;
    }
    
    // 빈 곳 클릭 시 선택 해제
    clearSelection();
  };

  // 마우스 이동: 드래그 및 패닝
  const handleMouseMove = (e) => {
    if (isPanning) { 
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }); 
      return; 
    }
    if (!isDragging) return;
    
    const pos = getMousePos(e);
    const { width, height } = getCanvasDimensions();
    const SNAP_THRESHOLD = 15;
    
    const totalSelected = selectedLayerIds.length + selectedStickerIds.length + selectedShapeIds.length;
    let guideX = null; 
    let guideY = null;
    let dx = pos.x - lastPos.x; 
    let dy = pos.y - lastPos.y;

    // 단일 선택일 경우 중앙 스냅 적용
    if (totalSelected === 1) {
      let targetX = pos.x; 
      let targetY = pos.y;
      
      if (Math.abs(targetX - width / 2) < SNAP_THRESHOLD) { 
        dx = (width / 2) - lastPos.x; 
        guideX = width / 2; 
      }
      if (Math.abs(targetY - height / 2) < SNAP_THRESHOLD) { 
        dy = (height / 2) - lastPos.y; 
        guideY = height / 2; 
      }
      setGuidelines({ x: guideX, y: guideY });
    }

    // 다중 선택(또는 단일 선택)된 모든 요소 한 번에 이동
    moveSelectedItems(dx, dy);
    
    if (!guideX && !guideY) {
      setLastPos(pos);
    } else {
      setLastPos({ x: lastPos.x + dx, y: lastPos.y + dy });
    }
  };

  // 마우스 업: 드래그 및 패닝 종료
  const handleMouseUp = () => { 
    setIsPanning(false); 
    setIsDragging(false); 
    setGuidelines({ x: null, y: null }); 
  };

  // 🌟 고해상도 PDF 내보내기
  const handleExportPDF = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const isLandscape = canvas.width > canvas.height;
    
    const pdf = new jsPDF({ 
      orientation: isLandscape ? 'landscape' : 'portrait', 
      unit: 'px', 
      format: [canvas.width, canvas.height] 
    });
    
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`design-export-${Date.now()}.pdf`);
  };

  return (
    <div className="preview-panel" style={{ position: 'relative' }}>
      
      {/* 화면 줌(Zoom) 컨트롤 UI */}
      <div style={{ position: 'absolute', bottom: '110px', right: '20px', zIndex: 10, display: 'flex', gap: '4px', background: 'var(--bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-subtle)', border: '1px solid var(--border-base)' }}>
        <button className="action-sm-btn" onClick={() => setZoom(prev => Math.max(0.2, prev - 0.1))} title="축소">-</button>
        <span style={{ fontSize: '12px', padding: '0 8px', display: 'flex', alignItems: 'center', fontWeight: '500' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button className="action-sm-btn" onClick={() => setZoom(prev => Math.min(3, prev + 0.1))} title="확대">+</button>
        <button className="action-sm-btn" onClick={() => { setZoom(1); setPan({x:0, y:0}); }} title="초기화">Reset</button>
      </div>

      {/* 캔버스 컨테이너 (패닝/줌 적용) */}
      <div 
        ref={containerRef} 
        className="canvas-container" 
        style={{ 
          overflow: 'hidden', 
          cursor: isSpacePressed ? (isPanning ? 'grabbing' : 'grab') : 'default' 
        }}
      >
        <div style={{ 
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
          transformOrigin: 'center center', 
          transition: isPanning ? 'none' : 'transform 0.1s ease-out' 
        }}>
          <canvas 
            ref={canvasRef} 
            onMouseDown={handleMouseDown} 
            onMouseMove={handleMouseMove} 
            onMouseUp={handleMouseUp} 
            onMouseLeave={handleMouseUp} 
            style={{ cursor: isDragging ? 'grabbing' : (isSpacePressed ? 'inherit' : 'default') }} 
          />
        </div>
      </div>
      
      {/* 🌟 결과물 다운로드 버튼 모음 */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button className="secondary-btn" style={{ flex: 1, padding: '12px', fontWeight: 'bold' }} onClick={() => {
          const link = document.createElement('a'); 
          link.download = `result-${Date.now()}.png`; 
          link.href = canvasRef.current.toDataURL('image/png'); 
          link.click();
        }}>
          웹용 이미지(PNG) 다운로드
        </button>
        
        <button className="action-btn" style={{ flex: 1, margin: 0, padding: '12px', backgroundColor: '#dc2626', borderColor: '#dc2626', fontWeight: 'bold' }} onClick={handleExportPDF}>
          인쇄용 PDF 다운로드
        </button>
      </div>
      
    </div>
  );
}

export default CanvasPreview;