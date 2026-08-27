import useEditorStore from '../store/useEditorStore';

function ControlPanel() {
  const { 
    text, setText, ratio, setRatio, textPos, setTextPos, 
    textSize, setTextSize, textColor, setTextColor, setImage, 
    errorMessage, setErrorMessage 
  } = useEditorStore();

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

  return (
    <>
      <h2 className="panel-title">🎨 스튜디오 설정</h2>
      
      {errorMessage && (
        <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>
          {errorMessage}
        </div>
      )}

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
        <input type="range" min="0" max="600" value={textPos.x} onChange={(e) => setTextPos({ x: Number(e.target.value) })} />
      </div>
      <div className="control-group">
        <label>Y 위치: {textPos.y}</label>
        <input type="range" min="0" max="1000" value={textPos.y} onChange={(e) => setTextPos({ y: Number(e.target.value) })} />
      </div>
    </>
  );
}

export default ControlPanel;