import useEditorStore from '../store/useEditorStore';

function ControlPanel() {
  const { 
    ratio, setRatio, setImage, errorMessage, setErrorMessage,
    layers, activeLayerId, addLayer, updateLayer, deleteLayer, setActiveLayer, reorderLayer,
    stickers, activeStickerId, addSticker, updateSticker, deleteSticker, setActiveSticker, reorderSticker
  } = useEditorStore();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setErrorMessage('배경은 PNG 또는 JPEG만 가능합니다.');
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

  const handleStickerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => addSticker(event.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const activeLayer = layers.find(l => l.id === activeLayerId);
  const activeSticker = stickers.find(s => s.id === activeStickerId);
  
  // 구버전 템플릿 호환성을 위한 배열 보정
  const currentGradientColors = activeLayer?.gradientColors || [activeLayer?.color, activeLayer?.color2 || '#a1a1aa'];

  const addGradientColor = () => {
    if (currentGradientColors.length < 5) {
      updateLayer(activeLayer.id, { gradientColors: [...currentGradientColors, '#ffffff'] });
    }
  };

  const removeGradientColor = () => {
    if (currentGradientColors.length > 2) {
      updateLayer(activeLayer.id, { gradientColors: currentGradientColors.slice(0, -1) });
    }
  };

  const handleGradientChange = (index, newColor) => {
    const updated = [...currentGradientColors];
    updated[index] = newColor;
    updateLayer(activeLayer.id, { gradientColors: updated });
  };

  return (
    <>
      <h2 className="panel-title">스튜디오 설정</h2>
      
      {errorMessage && (
        <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '6px', marginBottom: '15px', textAlign: 'center', fontSize: '13px' }}>
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
          <option value="1:1">1:1 (정방형)</option>
          <option value="4:5">4:5 (인스타그램)</option>
          <option value="9:16">9:16 (스토리/쇼츠)</option>
        </select>
      </div>

      <hr style={{ margin: '20px 0', borderColor: 'var(--border-base)', borderStyle: 'solid', borderWidth: '1px 0 0 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>텍스트 레이어</h3>
        <button className="action-sm-btn" onClick={addLayer} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          추가
        </button>
      </div>
      <ul className="template-list" style={{ marginBottom: '20px' }}>
        {layers.map((layer) => (
          <li key={layer.id} className="template-item" 
            style={{ 
              borderColor: activeLayerId === layer.id ? 'var(--text-secondary)' : 'var(--border-base)', 
              backgroundColor: activeLayerId === layer.id ? 'var(--bg-surface-hover)' : 'transparent',
              cursor: 'pointer' 
            }}
            onClick={() => setActiveLayer(layer.id)}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
              {layer.text.split('\n')[0] || '빈 텍스트'}
            </span>
            <button className="action-sm-btn delete" onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}>삭제</button>
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>에셋 (로고/아이콘)</h3>
        <label className="action-sm-btn" style={{ cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          추가
          <input type="file" accept="image/png, image/jpeg, image/svg+xml" style={{ display: 'none' }} onChange={handleStickerUpload} />
        </label>
      </div>
      <ul className="template-list" style={{ marginBottom: '24px' }}>
        {stickers.map((sticker, index) => (
          <li key={sticker.id} className="template-item" 
            style={{ 
              borderColor: activeStickerId === sticker.id ? 'var(--text-secondary)' : 'var(--border-base)', 
              backgroundColor: activeStickerId === sticker.id ? 'var(--bg-surface-hover)' : 'transparent',
              cursor: 'pointer' 
            }}
            onClick={() => setActiveSticker(sticker.id)}
          >
            <span>이미지 {index + 1}</span>
            <button className="action-sm-btn delete" onClick={(e) => { e.stopPropagation(); deleteSticker(sticker.id); }}>삭제</button>
          </li>
        ))}
      </ul>

      {(activeLayer || activeSticker) ? (
        <div style={{ background: 'var(--bg-canvas)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-base)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>속성 편집</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                className="action-sm-btn" 
                onClick={() => activeLayer ? reorderLayer(activeLayer.id, 'down') : reorderSticker(activeSticker.id, 'down')}
                title="뒤로 보내기"
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                뒤로
              </button>
              <button 
                className="action-sm-btn" 
                onClick={() => activeLayer ? reorderLayer(activeLayer.id, 'up') : reorderSticker(activeSticker.id, 'up')}
                title="앞으로 가져오기"
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                앞으로
              </button>
            </div>
          </div>

          {activeLayer && (
            <>
              <div className="control-group">
                <label>문구</label>
                <textarea className="control-input" rows="3" value={activeLayer.text} onChange={(e) => updateLayer(activeLayer.id, { text: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="control-group" style={{ flex: 1 }}>
                  <label>글꼴</label>
                  <select className="control-input" value={activeLayer.fontFamily || 'sans-serif'} onChange={(e) => updateLayer(activeLayer.id, { fontFamily: e.target.value })}>
                    <option value="sans-serif">기본 (고딕)</option>
                    <option value="serif">명조</option>
                    <option value="monospace">고정폭</option>
                    <option value="'Courier New', Courier, monospace">타자기</option>
                    <option value="'Impact', sans-serif">임팩트</option>
                  </select>
                </div>
                <div className="control-group" style={{ flex: 1 }}>
                  <label>크기: {activeLayer.size}px</label>
                  <input type="range" min="20" max="120" value={activeLayer.size} onChange={(e) => updateLayer(activeLayer.id, { size: Number(e.target.value) })} />
                </div>
              </div>

              <div className="control-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <input 
                  type="checkbox" 
                  id="gradient-toggle"
                  checked={activeLayer.useGradient || false} 
                  onChange={(e) => updateLayer(activeLayer.id, { useGradient: e.target.checked })} 
                  style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                <label htmlFor="gradient-toggle" style={{ cursor: 'pointer' }}>그라데이션 사용</label>
              </div>

              {!activeLayer.useGradient ? (
                <div className="control-group" style={{ width: '60px', marginTop: '8px' }}>
                  <label>단일 색상</label>
                  <input type="color" className="control-input" style={{ padding: '0', height: '32px', width: '100%', border: 'none' }} value={activeLayer.color} onChange={(e) => updateLayer(activeLayer.id, { color: e.target.value })} />
                </div>
              ) : (
                <div className="control-group" style={{ marginTop: '8px', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-base)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ margin: 0 }}>색상 분할 ({currentGradientColors.length}/5)</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="action-sm-btn" onClick={removeGradientColor} disabled={currentGradientColors.length <= 2}>- 축소</button>
                      <button className="action-sm-btn" onClick={addGradientColor} disabled={currentGradientColors.length >= 5}>+ 추가</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {currentGradientColors.map((color, index) => (
                      <input 
                        key={index} 
                        type="color" 
                        className="control-input" 
                        style={{ padding: '0', height: '32px', width: '40px', border: 'none' }} 
                        value={color} 
                        onChange={(e) => handleGradientChange(index, e.target.value)} 
                        title={`색상 ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeSticker && (
            <div className="control-group">
              <label>크기 조절: {activeSticker.width}px</label>
              <input type="range" min="20" max="400" value={activeSticker.width} onChange={(e) => updateSticker(activeSticker.id, { width: Number(e.target.value), height: Number(e.target.value) })} />
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px', padding: '24px 0', border: '1px dashed var(--border-base)', borderRadius: 'var(--radius-md)' }}>
          편집할 대상을 선택해주세요
        </div>
      )}
    </>
  );
}

export default ControlPanel;