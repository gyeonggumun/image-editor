import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [text, setText] = useState('테스트 문구');
  const [ratio, setRatio] = useState('1:1');
  const [textPos, setTextPos] = useState({ x: 50, y: 50 });
  const [textSize, setTextSize] = useState(30);
  const [textColor, setTextColor] = useState('#000000');

  // 화면비에 따른 캔버스 크기 계산
  const getCanvasDimensions = () => {
    const baseWidth = 500;
    if (ratio === '1:1') return { width: baseWidth, height: baseWidth };
    if (ratio === '4:5') return { width: baseWidth, height: baseWidth * 1.25 };
    if (ratio === '9:16') return { width: baseWidth, height: baseWidth * (16 / 9) };
    return { width: baseWidth, height: baseWidth };
  };

  // 이미지 업로드 핸들러
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

  // 캔버스 그리기 (상태가 변할 때마다 즉시 반영)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = getCanvasDimensions();
    
    canvas.width = width;
    canvas.height = height;

    // 1. 배경 초기화
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);

    // 2. 이미지 그리기 (비율에 맞춰 가운데 정렬 및 자르기)
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

    // 3. 텍스트 그리기
    ctx.font = `${textSize}px Arial`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'top';
    ctx.fillText(text, textPos.x, textPos.y);

  }, [image, text, ratio, textPos, textSize, textColor]);

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '20px' }}>
      {/* 왼쪽: 컨트롤 패널 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '300px' }}>
        <h2>이미지 에디터 설정</h2>
        
        <label>
          이미지 불러오기:
          <input type="file" accept="image/png, image/jpeg" onChange={handleImageUpload} />
        </label>

        <label>
          화면비 선택:
          <select value={ratio} onChange={(e) => setRatio(e.target.value)}>
            <option value="1:1">1:1</option>
            <option value="4:5">4:5</option>
            <option value="9:16">9:16</option>
          </select>
        </label>

        <label>
          문구 입력:
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
        </label>

        <label>
          글자 크기 ({textSize}px):
          <input type="range" min="10" max="100" value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} />
        </label>

        <label>
          글자 색상:
          <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
        </label>

        <label>
          가로 위치 (X: {textPos.x}):
          <input type="range" min="0" max="500" value={textPos.x} onChange={(e) => setTextPos({...textPos, x: Number(e.target.value)})} />
        </label>
        
        <label>
          세로 위치 (Y: {textPos.y}):
          <input type="range" min="0" max="800" value={textPos.y} onChange={(e) => setTextPos({...textPos, y: Number(e.target.value)})} />
        </label>
      </div>

      {/* 오른쪽: 캔버스 미리보기 */}
      <div>
        <h3>미리보기 ({ratio})</h3>
        <canvas 
          ref={canvasRef} 
          style={{ border: '1px solid #ccc', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
        />
      </div>
    </div>
  );
}

export default App;