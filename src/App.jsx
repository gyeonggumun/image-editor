import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const canvasRef = useRef(null);
  
  const [image, setImage] = useState(null);
  const [text, setText] = useState('여기에 텍스트 입력\n줄바꿈도 가능합니다');
  const [ratio, setRatio] = useState('1:1');
  const [textPos, setTextPos] = useState({ x: 50, y: 50 });
  const [textSize, setTextSize] = useState(40);
  const [textColor, setTextColor] = useState('#ffffff');
  
  const [templates, setTemplates] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

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
    
    // ==========================================
    // ❌ [결함 상태의 코드] 
    // 캔버스 fillText는 기본적으로 줄바꿈(\n)을 무시합니다.
    // 긴 텍스트나 엔터를 입력하면 캔버스 오른쪽 밖으로 잘려나갑니다.
    // ==========================================
    ctx.fillText(text, textPos.x, textPos.y);

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
    e.target.value = ''; 
  };

  return (
    <div className="editor-layout">
      <div className="control-panel">
        <h2 className="panel-title">🎨 스튜디오 설정</h2>
        
        {errorMessage && <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>{errorMessage}</div>}

        <div className="control-group">
          <label>배경 이미지 (PNG, JPEG)</label>
          <label className="file-upload-label">
            파일 선택
            <input type="file" className="file-upload-input" accept="image/png, image/jpeg" onChange={handleImageUpload} />
          </label>
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
            <input type="color" className="control-input" style={{ padding: '0', height: '38px', width: '100%' }} value={textColor} onChange={(e) => setTextColor(e.target.value)} />
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

        <hr style={{ margin: '24px 0', borderColor: '#e5e7eb' }} />
        
        <h3 className="template-section-title">템플릿 관리</h3>
        <div className="btn-group">
          <button className="secondary-btn" onClick={saveTemplate}>설정 저장</button>
          <button className="secondary-btn" onClick={exportJSON}>내보내기</button>
          <label className="file-upload-label">
            가져오기
            <input type="file" accept=".json" className="file-upload-input" onChange={importJSON} />
          </label>
        </div>

        <ul className="template-list">
          {templates.map(tmpl => (
            <li key={tmpl.id} className="template-item">
              <span>{tmpl.name} ({tmpl.ratio})</span>
              <div className="template-actions">
                <button className="action-sm-btn" onClick={() => loadTemplate(tmpl)}>적용</button>
                <button className="action-sm-btn delete" onClick={() => deleteTemplate(tmpl.id)}>삭제</button>
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