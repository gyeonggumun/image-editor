import useEditorStore from '../../store/useEditorStore';

export default function PropertyEditor() {
  const { 
    layers, updateLayer, reorderLayer, 
    stickers, updateSticker, reorderSticker, 
    shapes, updateShape, reorderShape,
    selectedLayerIds, selectedStickerIds, selectedShapeIds
  } = useEditorStore();

  const isMultiSelected = selectedLayerIds.length + selectedStickerIds.length + selectedShapeIds.length > 1;
  const isNoneSelected = selectedLayerIds.length + selectedStickerIds.length + selectedShapeIds.length === 0;

  const activeLayer = !isMultiSelected && selectedLayerIds.length === 1 ? layers.find(l => l.id === selectedLayerIds[0]) : null;
  const activeSticker = !isMultiSelected && selectedStickerIds.length === 1 ? stickers.find(s => s.id === selectedStickerIds[0]) : null;
  const activeShape = !isMultiSelected && selectedShapeIds.length === 1 ? shapes.find(s => s.id === selectedShapeIds[0]) : null;

  const currentGradientColors = activeLayer?.gradientColors || [activeLayer?.color, activeLayer?.color2 || '#a1a1aa'];

  const handleGradientChange = (index, newColor) => {
    const updated = [...currentGradientColors];
    updated[index] = newColor;
    updateLayer(activeLayer.id, { gradientColors: updated });
  };

  if (isNoneSelected) {
    return <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px', padding: '24px 0', border: '1px dashed var(--border-base)', borderRadius: 'var(--radius-md)' }}>편집할 대상을 선택해주세요</div>;
  }

  return (
    <div style={{ background: 'var(--bg-canvas)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-base)' }}>
      {isMultiSelected ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', padding: '12px 0' }}>다중 선택 상태입니다.<br/>캔버스에서 드래그하여 이동하세요.</div>
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
                      <button className="action-sm-btn" onClick={() => updateLayer(activeLayer.id, { gradientColors: currentGradientColors.slice(0, -1) })} disabled={currentGradientColors.length <= 2}>-</button>
                      <button className="action-sm-btn" onClick={() => updateLayer(activeLayer.id, { gradientColors: [...currentGradientColors, '#ffffff'] })} disabled={currentGradientColors.length >= 5}>+</button>
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
  );
}