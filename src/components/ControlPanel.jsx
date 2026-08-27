import useEditorStore from '../store/useEditorStore';

function ControlPanel() {
  const { 
    ratio, setRatio, setImage, errorMessage, setErrorMessage,
    layers, activeLayerId, addLayer, updateLayer, deleteLayer, setActiveLayer
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

  // 현재 선택된 레이어 찾기
  const activeLayer = layers.find(l => l.id === activeLayerId);

  return (
    <>
      <h2 className="panel-title">🎨 스튜디오 설정</h2>
      
      {errorMessage && (
        <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>
          {errorMessage}
        </div>
      )}

      <div className="control-group">
        <label>배경 이미지</label>
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

      <hr style={{ margin: '24px 0', borderColor: '#e5e7eb' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>텍스트 레이어</h3>
        <button className="action-sm-btn" onClick={addLayer}>+ 추가</button>
      </div>

      {/* 레이어 목록 */}
      <ul className="template-list" style={{ marginBottom: '20px' }}>
        {layers.map((layer, index) => (
          <li 
            key={layer.id} 
            className="template-item" 
            style={{ 
              borderColor: activeLayerId === layer.id ? '#4f46e5' : '#e5e7eb',
              backgroundColor: activeLayerId === layer.id ? '#eef2ff' : '#f9fafb',
              cursor: 'pointer'
            }}
            onClick={() => setActiveLayer(layer.id)}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
              {index + 1}. {layer.text.split('\n')[0] || '빈 텍스트'}
            </span>
            <button className="action-sm-btn delete" onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}>삭제</button>
          </li>
        ))}
      </ul>

      {/* 선택된 레이어 편집 컨트롤 */}
      {activeLayer ? (
        <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px' }}>
          <div className="control-group">
            <label>문구 편집</label>
            <textarea 
              className="control-input" rows="3" 
              value={activeLayer.text} 
              onChange={(e) => updateLayer(activeLayer.id, { text: e.target.value })} 
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="control-group" style={{ flex: 1 }}>
              <label>크기: {activeLayer.size}px</label>
              <input type="range" min="20" max="120" value={activeLayer.size} onChange={(e) => updateLayer(activeLayer.id, { size: Number(e.target.value) })} />
            </div>
            <div className="control-group">
              <label>색상</label>
              <input type="color" className="control-input" style={{ padding: '0', height: '38px', width: '100%' }} value={activeLayer.color} onChange={(e) => updateLayer(activeLayer.id, { color: e.target.value })} />
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem', padding: '20px 0' }}>
          편집할 레이어를 선택해주세요.
        </div>
      )}
    </>
  );
}

export default ControlPanel;