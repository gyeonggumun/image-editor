import useEditorStore from '../store/useEditorStore';

function ControlPanel() {
  const { 
    ratio, setRatio, setImage, errorMessage, setErrorMessage,
    layers, addLayer, updateLayer, deleteLayer, reorderLayer,
    stickers, addSticker, updateSticker, deleteSticker, reorderSticker,
    shapes, addShape, updateShape, deleteShape, reorderShape,
    past, future, undo, redo,
    selectedLayerIds, selectedStickerIds, selectedShapeIds, selectItem 
  } = useEditorStore();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) return setErrorMessage('배경은 PNG 또는 JPEG만 가능합니다.');
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

  const isMultiSelected = selectedLayerIds.length + selectedStickerIds.length + selectedShapeIds.length > 1;
  const activeLayer = !isMultiSelected && selectedLayerIds.length === 1 ? layers.find(l => l.id === selectedLayerIds[0]) : null;
  const activeSticker = !isMultiSelected && selectedStickerIds.length === 1 ? stickers.find(s => s.id === selectedStickerIds[0]) : null;
  const activeShape = !isMultiSelected && selectedShapeIds.length === 1 ? shapes.find(s => s.id === selectedShapeIds[0]) : null;
  
  const currentGradientColors = activeLayer?.gradientColors || [activeLayer?.color, activeLayer?.color2 || '#a1a1aa'];

  // 🌟 누락되었던 그라데이션 핸들러 함수들
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-base)', paddingBottom: '12px', marginBottom: '20px' }}>
        <h2 className="panel-title" style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>스튜디오 설정</h2>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="action-sm-btn" onClick={undo} disabled={past.length === 0} title="실행 취소">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h10a5 5 0 0 1 5 5v2a5 5 0 0 1-5 5H9" strokeLinecap="round"/><path d="M3 10l6-6M3 10l6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="action-sm-btn" onClick={redo} disabled={future.length === 0} title="다시 실행">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10H11a5 5 0 0 0-5 5v2a5 5 0 0 0 5 5h4" strokeLinecap="round"/><path d="M21 10l-6-6M21 10l-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
      
      {errorMessage && <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '6px', marginBottom: '15px', textAlign: 'center', fontSize: '13px' }}>{errorMessage}</div>}

      <div className="control-group">
        <label>배경 이미지</label>
        <label className="file-upload-label">파일 선택<input type="file" className="file-upload-input" accept="image/png, image/jpeg" onChange={handleImageUpload} /></label>
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

      {/* 도형 추가 패널 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>기본 도형</h3>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="action-sm-btn" onClick={() => addShape('rect')}>+ 사각</button>
          <button className="action-sm-btn" onClick={() => addShape('circle')}>+ 원형</button>
          <button className="action-sm-btn" onClick={() => addShape('line')}>+ 선</button>
        </div>
      </div>
      <ul className="template-list" style={{ marginBottom: '20px' }}>
        {shapes.map((shape, index) => (
          <li key={shape.id} className="template-item" 
            style={{ borderColor: selectedShapeIds.includes(shape.id) ? 'var(--text-secondary)' : 'var(--border-base)', backgroundColor: selectedShapeIds.includes(shape.id) ? 'var(--bg-surface-hover)' : 'transparent', cursor: 'pointer' }}
            onClick={(e) => selectItem(shape.id, 'shape', e.shiftKey)}
          >
            <span>{shape.type === 'rect' ? '사각형' : shape.type === 'circle' ? '원형' : '선'} {index + 1}</span>
            <button className="action-sm-btn delete" onClick={(e) => { e.stopPropagation(); deleteShape(shape.id); }}>삭제</button>
          </li>
        ))}
      </ul>

      {/* 텍스트 패널 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>텍스트 레이어</h3>
        <button className="action-sm-btn" onClick={addLayer}>추가</button>
      </div>
      <ul className="template-list" style={{ marginBottom: '20px' }}>
        {layers.map((layer) => (
          <li key={layer.id} className="template-item" 
            style={{ borderColor: selectedLayerIds.includes(layer.id) ? 'var(--text-secondary)' : 'var(--border-base)', backgroundColor: selectedLayerIds.includes(layer.id) ? 'var(--bg-surface-hover)' : 'transparent', cursor: 'pointer' }}
            onClick={(e) => selectItem(layer.id, 'layer', e.shiftKey)}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>{layer.text.split('\n')[0] || '빈 텍스트'}</span>
            <button className="action-sm-btn delete" onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}>삭제</button>
          </li>
        ))}
      </ul>

      {/* 스티커 패널 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>에셋 (로고/아이콘)</h3>
        <label className="action-sm-btn" style={{ cursor: 'pointer', margin: 0 }}>
          추가<input type="file" accept="image/png, image/jpeg, image/svg+xml" style={{ display: 'none' }} onChange={handleStickerUpload} />
        </label>
      </div>
      <ul className="template-list" style={{ marginBottom: '24px' }}>
        {stickers.map((sticker, index) => (
          <li key={sticker.id} className="template-item" 
            style={{ borderColor: selectedStickerIds.includes(sticker.id) ? 'var(--text-secondary)' : 'var(--border-base)', backgroundColor: selectedStickerIds.includes(sticker.id) ? 'var(--bg-surface-hover)' : 'transparent', cursor: 'pointer' }}
            onClick={(e) => selectItem(sticker.id, 'sticker', e.shiftKey)}
          >
            <span>이미지 {index + 1}</span>
            <button className="action-sm-btn delete" onClick={(e) => { e.stopPropagation(); deleteSticker(sticker.id); }}>삭제</button>
          </li>
        ))}
      </ul>

      {/* 속성 편집 컨트롤 */}
      {(activeLayer || activeSticker || activeShape || isMultiSelected) ? (
        <div style={{ background: 'var(--bg-canvas)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-base)' }}>
          {isMultiSelected ? (
             <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', padding: '12px 0' }}>다중 선택 상태입니다. 캔버스에서 드래그하여 이동하세요.</div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>속성 편집</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="action-sm-btn" onClick={() => activeLayer ? reorderLayer(activeLayer.id, 'down') : activeShape ? reorderShape(activeShape.id, 'down') : reorderSticker(activeSticker.id, 'down')}>뒤로</button>
                  <button className="action-sm-btn" onClick={() => activeLayer ? reorderLayer(activeLayer.id, 'up') : activeShape ? reorderShape(activeShape.id, 'up') : reorderSticker(activeSticker.id, 'up')}>앞으로</button>
                </div>
              </div>

              {activeShape && (
                <>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="control-group" style={{ flex: 1 }}>
                      <label>너비: {activeShape.width}px</label>
                      <input type="range" min="10" max="600" value={activeShape.width} onChange={(e) => updateShape(activeShape.id, { width: Number(e.target.value) })} />
                    </div>
                    {activeShape.type !== 'line' && (
                      <div className="control-group" style={{ flex: 1 }}>
                        <label>높이: {activeShape.height}px</label>
                        <input type="range" min="10" max="600" value={activeShape.height} onChange={(e) => updateShape(activeShape.id, { height: Number(e.target.value) })} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div className="control-group" style={{ width: '60px' }}>
                      <label>색상</label>
                      <input type="color" className="control-input" style={{ padding: '0', height: '32px', width: '100%', border: 'none' }} value={activeShape.fill} onChange={(e) => updateShape(activeShape.id, { fill: e.target.value })} />
                    </div>
                    <div className="control-group" style={{ flex: 1 }}>
                      <label>불투명도: {Math.round(activeShape.opacity * 100)}%</label>
                      <input type="range" min="0" max="1" step="0.05" value={activeShape.opacity} onChange={(e) => updateShape(activeShape.id, { opacity: Number(e.target.value) })} />
                    </div>
                  </div>
                </>
              )}

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
                      </select>
                    </div>
                    <div className="control-group" style={{ flex: 1 }}>
                      <label>크기: {activeLayer.size}px</label>
                      <input type="range" min="20" max="120" value={activeLayer.size} onChange={(e) => updateLayer(activeLayer.id, { size: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="control-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <input type="checkbox" id="gradient-toggle" checked={activeLayer.useGradient || false} onChange={(e) => updateLayer(activeLayer.id, { useGradient: e.target.checked })} style={{ accentColor: 'var(--accent)', cursor: 'pointer' }} />
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
                          <button className="action-sm-btn" onClick={removeGradientColor} disabled={currentGradientColors.length <= 2}>-</button>
                          <button className="action-sm-btn" onClick={addGradientColor} disabled={currentGradientColors.length >= 5}>+</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {currentGradientColors.map((color, index) => (
                          <input key={index} type="color" className="control-input" style={{ padding: '0', height: '32px', width: '40px', border: 'none' }} value={color} onChange={(e) => handleGradientChange(index, e.target.value)} />
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
            </>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px', padding: '24px 0', border: '1px dashed var(--border-base)', borderRadius: 'var(--radius-md)' }}>편집할 대상을 선택해주세요</div>
      )}
    </>
  );
}

export default ControlPanel;