import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [text, setText] = useState('여기에 텍스트 입력');
  const [ratio, setRatio] = useState('1:1');
  const [textPos, setTextPos] = useState({ x: 50, y: 50 });
  const [textSize, setTextSize] = useState(40);
  const [textColor, setTextColor] = useState('#ffffff');

  const getCanvasDimensions = () => {
    const baseWidth = 600;
    if (ratio === '1:1') return { width: baseWidth, height: baseWidth };
    if (ratio === '4:5') return { width: baseWidth, height: baseWidth * 1.25 };
    if (ratio === '9:16') return { width: baseWidth, height: baseWidth * (16 / 9) };
    return { width: baseWidth, height: baseWidth };
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => setImage(img);
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 캔버스 데이터를 PNG 형식의 URL로 변환
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `sns-image-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = getCanvasDimensions();
    
    canvas.width = width;
    canvas.height = height;

    // 배경 채우기
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, width, height);

    // 이미지 렌더링 (Cover 방식)
    if (image) {
      const imgRatio = image.width / image.height;
      const canvasRatio = width / height;
      let drawWidth = width;
      let drawHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        drawWidth = height * imgRatio;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawHeight = width / imgRatio;
        offsetY = (height - drawHeight) / 2;
      }
      ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    }

    // 텍스트 렌더링
    ctx.font = `bold ${textSize}px sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'top';
    
    // 텍스트 가독성을 위한 그림자 효과
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillText(text, textPos.x, textPos.y);

    // 그림자 초기화
    ctx.shadowColor = 'transparent';

  }, [image, text, ratio, textPos, textSize, textColor]);

  return (
    <div className="editor-layout">
      {/* 좌측: 컨트롤 패널 */}
      <div className="control-panel">
        <h2 className="panel-title">🎨 SNS 이미지 스튜디오</h2>
        
        <div className="control-group">
          <label>배경 이미지 선택</label>
          <input type="file" className="control-input" accept="image/png, image/jpeg" onChange={handleImageUpload} />
        </div>

        <div className="control-group">
          <label>화면 비율</label>
          <select className="control-input" value={ratio} onChange={(e) => setRatio(e.target.value)}>
            <option value="1:1">1:1 (인스타그램 피드)</option>
            <option value="4:5">4:5 (인스타그램 세로)</option>
            <option value="9:16">9:16 (릴스 / 쇼츠 / 스토리)</option>
          </select>
        </div>

        <div className="control-group">
          <label>메인 텍스트</label>
          <input type="text" className="control-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="문구를 입력하세요" />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="control-group" style={{ flex: 1 }}>
            <label>글자 크기: {textSize}px</label>
            <input type="range" min="20" max="120" value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} />
          </div>
          <div className="control-group">
            <label>색상</label>
            <input type="color" className="control-input" style={{ padding: '0', height: '38px' }} value={textColor} onChange={(e) => setTextColor(e.target.value)} />
          </div>
        </div>

        <div className="control-group">
          <label>가로 위치 (X: {textPos.x})</label>
          <input type="range" min="0" max="600" value={textPos.x} onChange={(e) => setTextPos({...textPos, x: Number(e.target.value)})} />
        </div>
        
        <div className="control-group">
          <label>세로 위치 (Y: {textPos.y})</label>
          <input type="range" min="0" max="1000" value={textPos.y} onChange={(e) => setTextPos({...textPos, y: Number(e.target.value)})} />
        </div>
      </div>

      {/* 우측: 캔버스 및 다운로드 */}
      <div className="preview-panel">
        <div className="canvas-container">
          <canvas ref={canvasRef} />
        </div>
        <button className="action-btn" onClick={downloadImage}>
          이미지 다운로드
        </button>
      </div>
    </div>
  );
}

export default App;