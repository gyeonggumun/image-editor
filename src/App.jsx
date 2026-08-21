import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const canvasRef = useRef(null);
  
  // 기본 에디터 상태
  const [image, setImage] = useState(null);
  const [text, setText] = useState('여기에 텍스트 입력\n줄바꿈도 가능합니다');
  const [ratio, setRatio] = useState('1:1');
  const [textPos, setTextPos] = useState({ x: 50, y: 50 });
  const [textSize, setTextSize] = useState(40);
  const [textColor, setTextColor] = useState('#ffffff');
  
  // 템플릿 및 에러 상태
  const [templates, setTemplates] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. 초기 렌더링 시 로컬 스토리지에서 템플릿 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('editorTemplates');
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch (e) {
        console.error('템플릿 복원 실패', e);
      }
    }
  }, []);

  const getCanvasDimensions = () => {
    const baseWidth = 600;
    if (ratio === '1:1') return { width: baseWidth, height: baseWidth };
    if (ratio === '4:5') return { width: baseWidth, height: baseWidth * 1.25 };
    if (ratio === '9:16') return { width: baseWidth, height: baseWidth * (16 / 9) };
    return { width: baseWidth, height: baseWidth };
  };

  // 2. 파일 형식 검증 및 이미지 업로드
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setErrorMessage('지원하지 않는 파일 형식입니다. PNG 또는 JPEG만 가능합니다.');
      return;
    }
    
    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => setImage(img);
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // 3. 캔버스 렌더링 (줄바꿈 처리 포함)
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

    ctx.font = `bold ${textSize}px sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // 줄바꿈 대응 로직
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      ctx.fillText(line, textPos.x, textPos.y + (index * (textSize * 1.2)));
    });

    ctx.shadowColor = 'transparent';
  }, [image, text, ratio, textPos, textSize, textColor]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `result-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // 4. 템플릿 관리 (생성, 삭제, 로드)
  const saveTemplate = () => {
    const newTemplate = {
      id: Date.now(),
      name: `템플릿 ${templates.length + 1}`,
      text, ratio, textPos, textSize, textColor
    };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    localStorage.setItem('editorTemplates', JSON.stringify(updated));
  };

  const loadTemplate = (tmpl) => {
    setText(tmpl.text);
    setRatio(tmpl.ratio);
    setTextPos(tmpl.textPos);
    setTextSize(tmpl.textSize);
    setTextColor(tmpl.textColor);
    setErrorMessage('');
  };

  const deleteTemplate = (id) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('editorTemplates', JSON.stringify(updated));
  };

  // 5. JSON 내보내기 / 가져오기 (예외 처리 포함)
  const exportJSON = () => {
    const dataStr = JSON.stringify(templates, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'templates.json';
    link.href = url;
    link.click();
  };

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!Array.isArray(parsed)) throw new Error("배열 형태가 아닙니다.");
        
        setTemplates(parsed);
        localStorage.setItem('editorTemplates', JSON.stringify(parsed));
        setErrorMessage('');
      } catch (err) {
        setErrorMessage('잘못된 JSON 파일입니다. 기존 템플릿이 유지됩니다.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="editor-layout">
      <div className="control-panel">
        <h2 className="panel-title">🎨 스튜디오 설정</h2>
        
        {errorMessage && <div style={{ color: 'red', marginBottom: '10px', fontWeight: 'bold' }}>{errorMessage}</div>}

        <div className="control-group">
          <label>배경 이미지 (PNG, JPEG)</label>
          <input type="file" className="control-input" accept="image/png, image/jpeg" onChange={handleImageUpload} />
        </div>

        <div className="control-group">
          <label>화면 비율</label>
          <select className="control-input" value={ratio} onChange={(e) => setRatio(e.target.value)}>
            <option value="1:1">1:1</option>
            <option value="4:5">4:5</option>
            <option value="9:16">9:16</option>
          </select>
        </div>

        <div className="control-group">
          <label>문구 입력 (엔터로 줄바꿈)</label>
          <textarea className="control-input" rows="3" value={text} onChange={(e) => setText(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="control-group" style={{ flex: 1 }}>
            <label>크기: {textSize}px</label>
            <input type="range" min="20" max="120" value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} />
          </div>
          <div className="control-group">
            <label>색상</label>
            <input type="color" className="control-input" style={{ padding: '0', height: '38px' }} value={textColor} onChange={(e) => setTextColor(e.target.value)} />
          </div>
        </div>

        <div className="control-group">
          <label>X 위치: {textPos.x}</label>
          <input type="range" min="0" max="600" value={textPos.x} onChange={(e) => setTextPos({...textPos, x: Number(e.target.value)})} />
        </div>
        <div className="control-group">
          <label>Y 위치: {textPos.y}</label>
          <input type="range" min="0" max="1000" value={textPos.y} onChange={(e) => setTextPos({...textPos, y: Number(e.target.value)})} />
        </div>

        <hr style={{ margin: '20px 0', borderColor: '#e5e7eb' }} />
        
        <h3>템플릿 관리</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button onClick={saveTemplate} style={{ padding: '8px', cursor: 'pointer' }}>현재 설정 저장</button>
          <button onClick={exportJSON} style={{ padding: '8px', cursor: 'pointer' }}>JSON 내보내기</button>
          <input type="file" accept=".json" onChange={importJSON} style={{ width: '180px' }} />
        </div>

        <ul>
          {templates.map(tmpl => (
            <li key={tmpl.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>{tmpl.name} ({tmpl.ratio})</span>
              <div>
                <button onClick={() => loadTemplate(tmpl)} style={{ marginRight: '5px' }}>불러오기</button>
                <button onClick={() => deleteTemplate(tmpl.id)}>삭제</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="preview-panel">
        <div className="canvas-container">
          <canvas ref={canvasRef} />
        </div>
        <button className="action-btn" onClick={downloadImage}>이미지 내려받기</button>
      </div>
    </div>
  );
}

export default App;